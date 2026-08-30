"""Build interpretable weekly projections from nflverse opportunity data."""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import polars as pl

from projection_contract import ProjectionRecord, ProjectionStats, ScoringFormat

PROJECT_ROOT = Path(__file__).parent
DEFAULT_SCORING_PATH = PROJECT_ROOT / "data" / "sleeper_latest.json"

STAT_COLUMNS = {
    "passing_attempts": "pass_attempt",
    "passing_yards": "pass_yards_gained_exp",
    "passing_touchdowns": "pass_touchdown_exp",
    "interceptions": "pass_interception_exp",
    "rushing_attempts": "rush_attempt",
    "rushing_yards": "rush_yards_gained_exp",
    "rushing_touchdowns": "rush_touchdown_exp",
    "receptions": "receptions_exp",
    "receiving_yards": "rec_yards_gained_exp",
    "receiving_touchdowns": "rec_touchdown_exp",
}

DEFAULT_SCORING = {
    "pass_yd": 0.04,
    "pass_td": 4.0,
    "pass_int": -2.0,
    "rush_yd": 0.1,
    "rush_td": 6.0,
    "rec": 1.0,
    "rec_yd": 0.1,
    "rec_td": 6.0,
}


def load_identity_map(path: Path) -> dict[str, str]:
    """Map nflverse IDs to canonical Sleeper IDs when available."""
    frame = pl.read_parquet(path)
    required = {"gsis_id", "sleeper_id", "nfl_id"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Identity file is missing required columns: {', '.join(sorted(missing))}")

    identity_map: dict[str, str] = {}
    for row in frame.select(sorted(required)).iter_rows(named=True):
        nfl_id = _text(row["gsis_id"])
        sleeper_id = _text(row["sleeper_id"])
        fallback_id = _text(row["nfl_id"])
        if nfl_id:
            identity_map[nfl_id] = sleeper_id or nfl_id or fallback_id
    return identity_map


def _text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _points(stats: ProjectionStats, scoring: dict[str, float]) -> float:
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


def project_rows(
    rows: pl.DataFrame,
    identity_map: dict[str, str],
    season: int,
    target_week: int,
    scoring_format: ScoringFormat,
    scoring_settings: dict[str, Any] | None = None,
    retrieved_at: datetime | None = None,
) -> list[ProjectionRecord]:
    """Project players from the four completed weeks before target_week."""
    if "season" not in rows.columns:
        raise ValueError("ff_opportunity data is missing required 'season' column")
    required = {"player_id", "position", "week", *STAT_COLUMNS.values()}
    missing = required - set(rows.columns)
    if missing:
        raise ValueError(f"Opportunity data is missing required columns: {', '.join(sorted(missing))}")

    window = rows.filter(
        (pl.col("season").cast(pl.Int64, strict=False) == season)
        & (pl.col("week").cast(pl.Int64, strict=False) < target_week)
        & (pl.col("week").cast(pl.Int64, strict=False) >= max(1, target_week - 4))
    )
    if window.is_empty():
        raise ValueError(f"No completed opportunity data found before week {target_week}")

    grouped: dict[tuple[str, str], list[dict[str, float | None]]] = defaultdict(list)
    for row in window.iter_rows(named=True):
        nfl_id = _text(row["player_id"])
        position = _text(row["position"])
        if not nfl_id or not position or nfl_id not in identity_map:
            continue
        grouped[(nfl_id, position)].append(
            {field: _number(row[column]) for field, column in STAT_COLUMNS.items()}
        )

    scoring = {
        **DEFAULT_SCORING,
        **{
            key: float(value)
            for key, value in (scoring_settings or {}).items()
            if key in DEFAULT_SCORING
        },
    }
    scoring["rec"] = {"STD": 0.0, "HALF": 0.5, "PPR": 1.0}[scoring_format]
    timestamp = retrieved_at or datetime.now(timezone.utc)
    records: list[ProjectionRecord] = []
    for (nfl_id, position), player_rows in sorted(grouped.items()):
        values: dict[str, float | None] = {}
        for field in STAT_COLUMNS:
            field_values = [row[field] for row in player_rows if row[field] is not None]
            values[field] = sum(field_values) / len(field_values) if field_values else None
        stats = ProjectionStats(**values)
        stats = ProjectionStats(**{**values, "fantasy_points": _points(stats, scoring)})
        records.append(
            ProjectionRecord(
                player_id=identity_map[nfl_id],
                external_player_id=nfl_id,
                season=season,
                week=target_week,
                position=position,
                projection=stats,
                scoring_format=scoring_format,
                source="nflverse",
                model_version="nflverse-opportunity-v1",
                retrieved_at=timestamp,
            )
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--scoring", choices=("STD", "PPR", "HALF"), default="PPR")
    parser.add_argument("--data-root", type=Path, default=PROJECT_ROOT / "data" / "nflverse")
    parser.add_argument("--identity", type=Path)
    parser.add_argument("--scoring-file", type=Path, default=DEFAULT_SCORING_PATH)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    season_root = args.data_root / str(args.season)
    identity_path = args.identity or season_root / "ff_playerids.parquet"
    rows = pl.read_parquet(season_root / "ff_opportunity.parquet")
    scoring_file = json.loads(args.scoring_file.read_text(encoding="utf-8"))
    scoring_settings = scoring_file.get("league_settings", {}).get("scoring", {})
    records = project_rows(
        rows,
        load_identity_map(identity_path),
        args.season,
        args.week,
        args.scoring,
        scoring_settings,
    )
    output_path = args.output or season_root / f"internal_projections_week_{args.week:02d}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            {
                "source": "nflverse",
                "model_version": "nflverse-opportunity-v1",
                "season": args.season,
                "week": args.week,
                "scoring_format": args.scoring,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "projections": [record.to_dict() for record in records],
            },
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    print(f"Internal projections: {len(records)}")
    print(f"Saved projections: {output_path}")


if __name__ == "__main__":
    main()
