"""Normalize FantasyPros projections and preserve provider responses."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping

from fantasypros_client import FantasyProsClient
from internal_projection import DEFAULT_SCORING
from projection_contract import ProjectionRecord, ProjectionStats, ScoringFormat

PROJECT_ROOT = Path(__file__).parent
DEFAULT_OUTPUT_ROOT = PROJECT_ROOT / "data" / "fantasypros"

STAT_ALIASES: dict[str, str] = {
    "pass_att": "passing_attempts",
    "pass_attempts": "passing_attempts",
    "passing_attempts": "passing_attempts",
    "pass_yds": "passing_yards",
    "pass_yards": "passing_yards",
    "passing_yards": "passing_yards",
    "pass_td": "passing_touchdowns",
    "pass_tds": "passing_touchdowns",
    "passing_touchdowns": "passing_touchdowns",
    "pass_int": "interceptions",
    "pass_ints": "interceptions",
    "interceptions": "interceptions",
    "rush_att": "rushing_attempts",
    "rush_attempts": "rushing_attempts",
    "rushing_attempts": "rushing_attempts",
    "rush_yds": "rushing_yards",
    "rush_yards": "rushing_yards",
    "rushing_yards": "rushing_yards",
    "rush_td": "rushing_touchdowns",
    "rush_tds": "rushing_touchdowns",
    "rushing_touchdowns": "rushing_touchdowns",
    "rec": "receptions",
    "receptions": "receptions",
    "rec_yds": "receiving_yards",
    "rec_yards": "receiving_yards",
    "receiving_yards": "receiving_yards",
    "rec_td": "receiving_touchdowns",
    "rec_tds": "receiving_touchdowns",
    "receiving_touchdowns": "receiving_touchdowns",
    "fantasy_points": "fantasy_points",
    "fantasy_pts": "fantasy_points",
    "fpts": "fantasy_points",
}


@dataclass(frozen=True)
class AdapterResult:
    """Normalized records and identity rows that need review."""

    records: list[ProjectionRecord]
    unmatched_external_ids: list[int]


def load_identity_map(path: Path) -> dict[int, str]:
    """Load FantasyPros-to-canonical IDs from an nflverse parquet file."""
    try:
        import polars as pl
    except ImportError as error:
        raise RuntimeError("Install the nflreadpy dependencies to read identity data") from error

    required_columns = {"fantasypros_id", "sleeper_id", "gsis_id", "nfl_id"}
    frame = pl.read_parquet(path)
    missing_columns = required_columns - set(frame.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Identity file is missing required columns: {missing}")

    identity_map: dict[int, str] = {}
    for row in frame.select(sorted(required_columns)).iter_rows(named=True):
        external_id = _as_int(row["fantasypros_id"])
        canonical_id = (
            _as_text(row["sleeper_id"])
            or _as_text(row["gsis_id"])
            or _as_text(row["nfl_id"])
        )
        if external_id is not None and canonical_id:
            identity_map[external_id] = canonical_id
    return identity_map


def _as_int(value: Any) -> int | None:
    try:
        return None if value is None else int(value)
    except (TypeError, ValueError):
        return None


def _as_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _stat_name(stat: Mapping[str, Any]) -> str | None:
    for key in ("stat_id", "name", "key", "stat", "label"):
        value = _as_text(stat.get(key))
        if value:
            return value.lower().replace(" ", "_").replace("-", "_")
    return None


def _stat_value(stat: Mapping[str, Any]) -> float | None:
    for key in ("value", "projection", "amount", "stat_value"):
        value = stat.get(key)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return float(value)
        try:
            if value is not None:
                return float(str(value).replace(",", ""))
        except (TypeError, ValueError):
            continue
    return None


def _normalize_stats(raw_stats: Any) -> ProjectionStats:
    values: dict[str, float] = {}
    if isinstance(raw_stats, Mapping):
        raw_stats = [
            {"name": name, "value": value}
            for name, value in raw_stats.items()
        ]
    if not isinstance(raw_stats, Iterable) or isinstance(raw_stats, (str, bytes)):
        return ProjectionStats()

    for raw_stat in raw_stats:
        if not isinstance(raw_stat, Mapping):
            continue
        name = _stat_name(raw_stat)
        field_name = STAT_ALIASES.get(name or "")
        value = _stat_value(raw_stat)
        if field_name and value is not None:
            values[field_name] = value
    return ProjectionStats(**values)


def _calculate_points(stats: ProjectionStats, scoring_format: ScoringFormat) -> float:
    """Calculate points locally so provider scoring cannot leak into records."""
    scoring = {**DEFAULT_SCORING, "rec": {"STD": 0.0, "HALF": 0.5, "PPR": 1.0}[scoring_format]}
    return (
        (stats.passing_yards or 0) * scoring["pass_yd"]
        + (stats.passing_touchdowns or 0) * scoring["pass_td"]
        + (stats.interceptions or 0) * scoring["pass_int"]
        + (stats.rushing_yards or 0) * scoring["rush_yd"]
        + (stats.rushing_touchdowns or 0) * scoring["rush_td"]
        + (stats.receptions or 0) * scoring["rec"]
        + (stats.receiving_yards or 0) * scoring["rec_yd"]
        + (stats.receiving_touchdowns or 0) * scoring["rec_td"]
    )


def normalize_response(
    response: Mapping[str, Any],
    identity_map: Mapping[int, str],
    season: int,
    week: int,
    scoring_format: ScoringFormat,
    retrieved_at: datetime,
) -> AdapterResult:
    """Convert a raw FantasyPros response into validated projection records."""
    raw_players = response.get("players")
    if raw_players is None:
        return AdapterResult([], [])
    if not isinstance(raw_players, list):
        raise ValueError("FantasyPros response field 'players' must be a list or null")

    records: list[ProjectionRecord] = []
    unmatched: list[int] = []
    for player in raw_players:
        if not isinstance(player, Mapping):
            continue
        external_id = _as_int(player.get("fpid", player.get("player_id")))
        position = _as_text(player.get("position_id"))
        if external_id is None or not position:
            continue
        canonical_id = identity_map.get(external_id)
        if canonical_id is None:
            unmatched.append(external_id)
            continue
        stats = _normalize_stats(player.get("stats"))
        stats = ProjectionStats(
            **{**stats.__dict__, "fantasy_points": _calculate_points(stats, scoring_format)}
        )
        records.append(
            ProjectionRecord(
                player_id=canonical_id,
                external_player_id=external_id,
                season=season,
                week=week,
                position=position,
                projection=stats,
                scoring_format=scoring_format,
                source="fantasypros",
                model_version="provider-response",
                retrieved_at=retrieved_at,
            )
        )
    return AdapterResult(records, sorted(set(unmatched)))


def write_result(
    response: Mapping[str, Any],
    result: AdapterResult,
    output_root: Path,
    season: int,
    week: int,
    retrieved_at: datetime,
) -> tuple[Path, Path]:
    """Write raw provider data and normalized records separately."""
    output_dir = output_root / str(season) / f"week_{week:02d}"
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = retrieved_at.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    raw_path = output_dir / f"fantasypros_raw_{timestamp}.json"
    normalized_path = output_dir / f"fantasypros_normalized_{timestamp}.json"
    raw_path.write_text(json.dumps(response, indent=2, sort_keys=True), encoding="utf-8")
    normalized_path.write_text(
        json.dumps(
            {
                "source": "fantasypros",
                "season": season,
                "week": week,
                "retrieved_at": retrieved_at.isoformat(),
                "unmatched_external_ids": result.unmatched_external_ids,
                "projections": [record.to_dict() for record in result.records],
            },
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    return raw_path, normalized_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--position", default="ALL")
    parser.add_argument("--scoring", choices=("STD", "PPR", "HALF"), default="PPR")
    parser.add_argument("--identity", type=Path)
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    args = parser.parse_args()

    retrieved_at = datetime.now(timezone.utc)
    response = FantasyProsClient().weekly_projections(
        args.season, args.week, args.position, args.scoring
    )
    identity_path = args.identity or PROJECT_ROOT / "data" / "nflverse" / str(args.season) / "ff_playerids.parquet"
    identity_map = load_identity_map(identity_path)
    result = normalize_response(
        response, identity_map, args.season, args.week, args.scoring, retrieved_at
    )
    raw_path, normalized_path = write_result(
        response, result, args.output_root, args.season, args.week, retrieved_at
    )
    print(f"FantasyPros records: {len(result.records)}")
    print(f"Unmatched FantasyPros IDs: {len(result.unmatched_external_ids)}")
    print(f"Saved raw response: {raw_path}")
    print(f"Saved normalized response: {normalized_path}")


if __name__ == "__main__":
    main()
