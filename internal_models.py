"""Normalized internal domain models for league, player, and prediction data."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from projection_contract import ProjectionRecord


@dataclass(frozen=True)
class Roster:
    roster_id: str
    owner_id: str
    team_name: str
    starters: list[str]
    bench: list[str]
    player_ids: list[str]


@dataclass(frozen=True)
class League:
    league_id: str
    name: str
    season: int
    franchise_id: str
    roster: Roster


@dataclass(frozen=True)
class Player:
    player_id: str
    name: str
    position: str
    team: str | None = None
    sleeper_id: str | None = None
    gsis_id: str | None = None
    nfl_id: str | None = None


@dataclass(frozen=True)
class Game:
    game_id: str
    season: int
    week: int
    home_team: str
    away_team: str
    kickoff: datetime
    status: str = "scheduled"


@dataclass(frozen=True)
class InjuryRecord:
    player_id: str
    source: str
    status: str
    details: str
    active: bool
    reported_at: datetime
    expires_at: datetime | None = None


@dataclass(frozen=True)
class StatisticRecord:
    player_id: str
    season: int
    week: int
    source: str
    passing_yards: float | None = None
    passing_touchdowns: float | None = None
    rushing_yards: float | None = None
    rushing_touchdowns: float | None = None
    receptions: float | None = None
    receiving_yards: float | None = None
    targets: float | None = None
    snaps: float | None = None

    def to_summary(self) -> dict[str, Any]:
        return {
            "player_id": self.player_id,
            "season": self.season,
            "week": self.week,
            "source": self.source,
            "passing_yards": self.passing_yards,
            "passing_touchdowns": self.passing_touchdowns,
            "rushing_yards": self.rushing_yards,
            "rushing_touchdowns": self.rushing_touchdowns,
            "receptions": self.receptions,
            "receiving_yards": self.receiving_yards,
            "targets": self.targets,
            "snaps": self.snaps,
        }


@dataclass(frozen=True)
class ProjectionSnapshot:
    record: ProjectionRecord
    source_name: str

    def to_summary(self) -> dict[str, Any]:
        return {
            "player_id": self.record.player_id,
            "season": self.record.season,
            "week": self.record.week,
            "position": self.record.position,
            "scoring_format": self.record.scoring_format,
            "source": self.record.source,
            "source_name": self.source_name,
            "model_version": self.record.model_version,
            "fantasy_points": self.record.projection.fantasy_points,
        }


@dataclass(frozen=True)
class NewsRecord:
    player_id: str
    source: str
    published_at: datetime
    headline: str
    summary: str
    category: str = "other"
    impact_score: int = 0
    confidence: float = 0.0
    url: str | None = None
    expires_at: datetime | None = None
