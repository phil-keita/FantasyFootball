"""Collect free NFL data from nflverse through nflreadpy."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

import nflreadpy as nfl

PROJECT_ROOT = Path(__file__).parent


DATASETS: dict[str, Callable[..., Any]] = {
    "schedules": nfl.load_schedules,
    "rosters": nfl.load_rosters,
    "rosters_weekly": nfl.load_rosters_weekly,
    "player_stats": nfl.load_player_stats,
    "snap_counts": nfl.load_snap_counts,
    "injuries": nfl.load_injuries,
    "depth_charts": nfl.load_depth_charts,
    "ff_playerids": nfl.load_ff_playerids,
    "ff_opportunity": nfl.load_ff_opportunity,
}


def get_season() -> int:
    """Resolve the target season only when collection is requested."""
    configured_season = os.environ.get("NFLVERSE_SEASON")
    return int(configured_season) if configured_season else int(nfl.get_current_season())


def collect_datasets(season: int | None = None) -> tuple[dict[str, Any], dict[str, Any]]:
    """Load the first NFL data bundle and return data plus a manifest."""
    season = season or get_season()
    collected_at = datetime.now(timezone.utc).isoformat()
    data: dict[str, Any] = {}
    manifest: dict[str, Any] = {
        "source": "nflverse via nflreadpy",
        "package_version": getattr(nfl, "__version__", "unknown"),
        "season": season,
        "collected_at": collected_at,
        "datasets": {},
    }

    for name, loader in DATASETS.items():
        if name == "ff_playerids":
            frame = loader()
        elif name == "ff_opportunity":
            frame = loader(seasons=season)
        elif name == "player_stats":
            frame = loader(seasons=season, summary_level="week")
        else:
            frame = loader(seasons=season)
        data[name] = frame
        manifest["datasets"][name] = {
            "rows": frame.height,
            "columns": frame.columns,
        }

    return data, manifest


def write_datasets(
    data: dict[str, Any],
    manifest: dict[str, Any],
    output_root: Path | None = None,
) -> None:
    output_root = output_root or PROJECT_ROOT / "data" / "nflverse" / str(manifest["season"])
    output_root.mkdir(parents=True, exist_ok=True)
    for name, frame in data.items():
        frame.write_parquet(output_root / f"{name}.parquet")
    (output_root / "manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    season = get_season()
    data, manifest = collect_datasets(season)
    output_root = PROJECT_ROOT / "data" / "nflverse" / str(season)
    write_datasets(data, manifest, output_root)
    print(f"Collected nflverse data for {season}")
    for name, details in manifest["datasets"].items():
        print(f"{name}: {details['rows']} rows")
    print(f"Saved datasets: {output_root}")


if __name__ == "__main__":
    main()
