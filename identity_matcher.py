"""Build explicit Sleeper, FantasyPros, and nflverse identity mappings."""

from __future__ import annotations

import argparse
import json
import os
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping

import polars as pl

from fantasypros_client import FantasyProsClient

PROJECT_ROOT = Path(__file__).parent
DEFAULT_SLEEPER_SNAPSHOT = PROJECT_ROOT / "data" / "sleeper_latest.json"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "identity_mapping.json"


def _resolve_fantasypros_payload(
    load_from_disk: Mapping[str, Any] | None,
    live_fetch: bool,
) -> Mapping[str, Any]:
    """Resolve FantasyPros player metadata without silently making a network call."""
    if load_from_disk is not None:
        return load_from_disk
    if live_fetch:
        return FantasyProsClient().players()
    raise ValueError("FantasyPros player data requires an explicit opt-in via --live-fetch or a --fantasypros input file.")


def _text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _external_id(player: Mapping[str, Any]) -> str | None:
    value = player.get("fpid", player.get("player_id"))
    return _text(value)


def _duplicate_values(rows: Iterable[Mapping[str, Any]], field: str) -> list[str]:
    values: dict[str, int] = defaultdict(int)
    for row in rows:
        value = _text(row.get(field))
        if value:
            values[value] += 1
    return sorted(value for value, count in values.items() if count > 1)


def build_mapping(
    nflverse_path: Path,
    sleeper_snapshot: Mapping[str, Any],
    fantasypros_response: Mapping[str, Any],
) -> dict[str, Any]:
    """Create a crosswalk without using display names as join keys."""
    frame = pl.read_parquet(nflverse_path)
    required = {"sleeper_id", "gsis_id", "fantasypros_id", "name", "position", "team"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Identity file is missing required columns: {', '.join(sorted(missing))}")

    nflverse_rows = [dict(zip(frame.columns, row)) for row in frame.iter_rows()]
    mappings: list[dict[str, Any]] = []
    for row in nflverse_rows:
        sleeper_id = _text(row.get("sleeper_id"))
        gsis_id = _text(row.get("gsis_id"))
        fantasypros_id = _text(row.get("fantasypros_id"))
        canonical_id = sleeper_id or gsis_id
        if not canonical_id:
            continue
        mappings.append(
            {
                "player_id": canonical_id,
                "sleeper_id": sleeper_id,
                "gsis_id": gsis_id,
                "fantasypros_id": fantasypros_id,
                "name": _text(row.get("name")),
                "position": _text(row.get("position")),
                "team": _text(row.get("team")),
            }
        )

    sleeper_ids = {
        str(player_id)
        for player_id in (sleeper_snapshot.get("player_index") or {}).keys()
    }
    fantasypros_players = fantasypros_response.get("players") or []
    fantasypros_ids = {
        player_id
        for player_id in (_external_id(player) for player in fantasypros_players)
        if player_id
    }
    mapped_sleeper_ids = {row["sleeper_id"] for row in mappings if row["sleeper_id"]}
    mapped_fantasypros_ids = {row["fantasypros_id"] for row in mappings if row["fantasypros_id"]}

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "nflverse ff_playerids crosswalk",
        "mappings": mappings,
        "unmatched": {
            "sleeper_ids": sorted(sleeper_ids - mapped_sleeper_ids),
            "fantasypros_ids": sorted(fantasypros_ids - mapped_fantasypros_ids),
            "nflverse_rows_without_sleeper_or_fantasypros": sum(
                not row["sleeper_id"] or not row["fantasypros_id"] for row in mappings
            ),
        },
        "duplicates": {
            "sleeper_id": _duplicate_values(nflverse_rows, "sleeper_id"),
            "gsis_id": _duplicate_values(nflverse_rows, "gsis_id"),
            "fantasypros_id": _duplicate_values(nflverse_rows, "fantasypros_id"),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nflverse-ids", type=Path)
    parser.add_argument("--season", type=int)
    parser.add_argument("--sleeper", type=Path, default=DEFAULT_SLEEPER_SNAPSHOT)
    parser.add_argument("--fantasypros", type=Path)
    parser.add_argument("--live-fetch", action="store_true", help="Opt in to a live FantasyPros player fetch.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    sleeper_snapshot = json.loads(args.sleeper.read_text(encoding="utf-8"))
    season = args.season or sleeper_snapshot.get("league", {}).get("season") or os.environ.get("NFLVERSE_SEASON")
    if not season:
        raise ValueError("Provide --season or a season in the Sleeper snapshot")
    identity_path = args.nflverse_ids or PROJECT_ROOT / "data" / "nflverse" / str(season) / "ff_playerids.parquet"
    fantasypros_response = (
        json.loads(args.fantasypros.read_text(encoding="utf-8"))
        if args.fantasypros
        else _resolve_fantasypros_payload(None, args.live_fetch)
    )
    result = build_mapping(identity_path, sleeper_snapshot, fantasypros_response)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True), encoding="utf-8")
    print(f"Identity mappings: {len(result['mappings'])}")
    print(f"Duplicate IDs: {sum(len(values) for values in result['duplicates'].values())}")
    print(f"Saved identity mapping: {args.output}")


if __name__ == "__main__":
    main()
