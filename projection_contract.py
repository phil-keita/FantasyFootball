"""Provider-neutral projection records for the fantasy football pipeline."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from math import isfinite
from typing import Any, Literal

ScoringFormat = Literal["STD", "PPR", "HALF"]


@dataclass(frozen=True)
class ProjectionStats:
    """Projected or actual NFL statistics used by the scoring engine."""

    passing_attempts: float | None = None
    passing_yards: float | None = None
    passing_touchdowns: float | None = None
    interceptions: float | None = None
    rushing_attempts: float | None = None
    rushing_yards: float | None = None
    rushing_touchdowns: float | None = None
    receptions: float | None = None
    receiving_yards: float | None = None
    receiving_touchdowns: float | None = None
    fantasy_points: float | None = None

    def __post_init__(self) -> None:
        nonnegative_fields = {
            "passing_attempts",
            "passing_touchdowns",
            "interceptions",
            "rushing_attempts",
            "rushing_touchdowns",
            "receptions",
            "receiving_touchdowns",
        }
        for field_name, value in asdict(self).items():
            if value is not None and (not isinstance(value, (int, float)) or not isfinite(value)):
                raise ValueError(f"{field_name} must be a finite number or null")
            if field_name in nonnegative_fields and value is not None and value < 0:
                raise ValueError(f"{field_name} cannot be negative")


@dataclass(frozen=True)
class ProjectionRecord:
    """One immutable projection snapshot in the shared internal contract."""

    player_id: str
    external_player_id: int | str
    season: int
    week: int
    position: str
    projection: ProjectionStats
    scoring_format: ScoringFormat
    source: str
    model_version: str
    retrieved_at: datetime
    actual: ProjectionStats | None = None

    def __post_init__(self) -> None:
        if not self.player_id.strip():
            raise ValueError("player_id is required")
        if isinstance(self.external_player_id, int) and self.external_player_id < 0:
            raise ValueError("external_player_id cannot be negative")
        if isinstance(self.external_player_id, str) and not self.external_player_id.strip():
            raise ValueError("external_player_id is required")
        if self.season < 2012:
            raise ValueError("season must be 2012 or later")
        if not 0 <= self.week <= 22:
            raise ValueError("week must be between 0 and 22")
        if not self.position.strip():
            raise ValueError("position is required")
        if self.scoring_format not in ("STD", "PPR", "HALF"):
            raise ValueError("scoring_format must be STD, PPR, or HALF")
        if not self.source.strip():
            raise ValueError("source is required")
        if not self.model_version.strip():
            raise ValueError("model_version is required")
        if self.retrieved_at.tzinfo is None or self.retrieved_at.utcoffset() is None:
            raise ValueError("retrieved_at must be timezone-aware")

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-compatible contract representation."""
        record = asdict(self)
        record["retrieved_at"] = self.retrieved_at.isoformat()
        return record
