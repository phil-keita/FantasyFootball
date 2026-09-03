"""Single canonical scoring engine for all fantasy-football projections."""

from __future__ import annotations

from typing import Any

from projection_contract import ProjectionStats, ScoringFormat

DEFAULT_SCORING: dict[str, float] = {
    "pass_yd": 0.04,
    "pass_td": 4.0,
    "pass_int": -2.0,
    "rush_yd": 0.1,
    "rush_td": 6.0,
    "rec": 0.0,
    "rec_yd": 0.1,
    "rec_td": 6.0,
}


def scoring_for_format(scoring_format: ScoringFormat) -> dict[str, float]:
    scoring = dict(DEFAULT_SCORING)
    scoring["rec"] = {
        "STD": 0.0,
        "HALF": 0.5,
        "PPR": 1.0,
    }[scoring_format]
    return scoring


def calculate_fantasy_points(
    stats: ProjectionStats,
    scoring_settings: dict[str, Any] | None = None,
    scoring_format: ScoringFormat = "PPR",
) -> float:
    """Calculate fantasy points from underlying stats using one canonical engine."""
    scoring = dict(DEFAULT_SCORING)
    if scoring_settings:
        for key, value in scoring_settings.items():
            if key in scoring and value is not None:
                scoring[key] = float(value)
    scoring.update(scoring_for_format(scoring_format))

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
