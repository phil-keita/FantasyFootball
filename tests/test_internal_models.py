from datetime import datetime, timezone

from internal_models import (
    Game,
    InjuryRecord,
    League,
    Player,
    ProjectionSnapshot,
    Roster,
    StatisticRecord,
)
from projection_contract import ProjectionRecord, ProjectionStats


def test_league_and_roster_models_are_usable():
    league = League(
        league_id="123",
        name="Yardage Warriors",
        season=2026,
        franchise_id="7",
        roster=Roster(
            roster_id="7",
            owner_id="user_123",
            team_name="Yardage Warriors",
            starters=["p1", "p2"],
            bench=["p3"],
            player_ids=["p1", "p2", "p3"],
        ),
    )

    assert league.season == 2026
    assert league.roster.team_name == "Yardage Warriors"
    assert league.roster.starters == ["p1", "p2"]


def test_player_and_game_models_capture_identity_and_schedule():
    player = Player(
        player_id="p1",
        name="Jalen Hurts",
        position="QB",
        team="PHI",
        sleeper_id="101",
        gsis_id="00-0036219",
    )
    game = Game(
        game_id="2026-01",
        season=2026,
        week=1,
        home_team="PHI",
        away_team="DAL",
        kickoff=datetime(2026, 9, 12, 13, 0, tzinfo=timezone.utc),
    )

    assert player.position == "QB"
    assert game.home_team == "PHI"
    assert game.away_team == "DAL"


def test_injury_and_statistic_models_serialize_cleanly():
    injury = InjuryRecord(
        player_id="p1",
        source="nflverse",
        status="limited",
        details="ankle",
        active=True,
        reported_at=datetime(2026, 9, 11, 12, 0, tzinfo=timezone.utc),
    )
    stat = StatisticRecord(
        player_id="p1",
        season=2026,
        week=1,
        source="nflverse",
        passing_yards=245.0,
        passing_touchdowns=2,
        receptions=5,
    )

    assert injury.status == "limited"
    assert stat.passing_yards == 245.0
    assert stat.to_summary()["season"] == 2026


def test_projection_snapshot_wraps_existing_projection_contract():
    record = ProjectionRecord(
        player_id="player-1",
        external_player_id=42,
        season=2026,
        week=1,
        position="QB",
        projection=ProjectionStats(
            passing_yards=210.0,
            passing_touchdowns=2,
            rushing_yards=35.0,
            receptions=0,
            fantasy_points=18.2,
        ),
        scoring_format="PPR",
        source="fantasypros",
        model_version="provider-response",
        retrieved_at=datetime(2026, 9, 11, 12, 0, tzinfo=timezone.utc),
    )

    snapshot = ProjectionSnapshot(record=record, source_name="fantasypros")

    assert snapshot.record.player_id == "player-1"
    assert snapshot.to_summary()["scoring_format"] == "PPR"
