from fantasy_scoring import DEFAULT_SCORING, calculate_fantasy_points, scoring_for_format
from projection_contract import ProjectionStats


def test_standard_scoring_calculates_expected_points():
    stats = ProjectionStats(
        passing_yards=250.0,
        passing_touchdowns=2,
        interceptions=1,
        rushing_yards=40.0,
        rushing_touchdowns=1,
        receptions=5,
        receiving_yards=70.0,
        receiving_touchdowns=0,
    )

    assert calculate_fantasy_points(stats, DEFAULT_SCORING, "STD") == 33.0


def test_ppr_scoring_counts_receptions():
    stats = ProjectionStats(
        passing_yards=200.0,
        passing_touchdowns=1,
        interceptions=0,
        rushing_yards=50.0,
        rushing_touchdowns=0,
        receptions=6,
        receiving_yards=80.0,
        receiving_touchdowns=1,
    )

    assert calculate_fantasy_points(stats, DEFAULT_SCORING, "PPR") == 37.0


def test_half_ppr_uses_half_reception_value():
    stats = ProjectionStats(
        passing_yards=0.0,
        passing_touchdowns=0,
        interceptions=0,
        rushing_yards=0.0,
        rushing_touchdowns=0,
        receptions=4,
        receiving_yards=20.0,
        receiving_touchdowns=0,
    )

    assert calculate_fantasy_points(stats, DEFAULT_SCORING, "HALF") == 4.0
