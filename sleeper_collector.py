"""Collect read-only Sleeper data for the Yardage Warriors league."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE_URL = "https://api.sleeper.app/v1"
LEAGUE_ID = "1370840832885657600"
MY_TEAM_NAME = "Yardage Warriors"
MY_USER_ID = "1396530534531756032"
SPORT = "nfl"

PROJECT_ROOT = Path(__file__).parent
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "sleeper_latest.json"
HISTORICAL_OUTPUT_ROOT = PROJECT_ROOT / "data" / "sleeper"
PLAYER_INDEX_CACHE = PROJECT_ROOT / "data" / "sleeper_players_nfl.json"
PLAYER_INDEX_CACHE_HOURS = 24


def get_json(path: str) -> Any:
    """Fetch one JSON resource from Sleeper."""
    request = Request(
        f"{BASE_URL}{path}",
        headers={"User-Agent": "FantasyFootball/1.0"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        raise RuntimeError(f"Sleeper returned HTTP {error.code} for {path}") from error
    except URLError as error:
        raise RuntimeError(f"Unable to reach Sleeper for {path}: {error.reason}") from error


def get_player_index(cache_path: Path = PLAYER_INDEX_CACHE) -> dict[str, Any]:
    """Read a daily player-index cache or refresh it from Sleeper."""
    now = datetime.now(timezone.utc)
    try:
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
        fetched_at = datetime.fromisoformat(cached["fetched_at"])
        players = cached["players"]
        age_hours = (now - fetched_at.astimezone(timezone.utc)).total_seconds() / 3600
        if age_hours <= PLAYER_INDEX_CACHE_HOURS and isinstance(players, dict):
            return players
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        pass

    players = get_json(f"/players/{SPORT}")
    if not isinstance(players, dict):
        raise ValueError("Sleeper player index must be a JSON object")
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(
        json.dumps({"fetched_at": now.isoformat(), "players": players}, indent=2),
        encoding="utf-8",
    )
    return players


def collect_league_data() -> dict[str, Any]:
    """Collect the league data needed by the first weekly assistant."""
    league = get_json(f"/league/{LEAGUE_ID}")
    users = get_json(f"/league/{LEAGUE_ID}/users")
    rosters = get_json(f"/league/{LEAGUE_ID}/rosters")
    drafts = get_json(f"/league/{LEAGUE_ID}/drafts")
    nfl_state = get_json(f"/state/{SPORT}")
    current_week = nfl_state.get("week", 1)
    matchups = get_json(f"/league/{LEAGUE_ID}/matchups/{current_week}")
    transactions = get_json(f"/league/{LEAGUE_ID}/transactions/{current_week}")
    players = get_player_index()

    my_user = next(
        (user for user in users if user.get("user_id") == MY_USER_ID),
        None,
    )
    my_roster = next(
        (roster for roster in rosters if roster.get("owner_id") == MY_USER_ID),
        None,
    )

    if my_user is None:
        raise RuntimeError(f"User {MY_USER_ID} was not found in league {LEAGUE_ID}")
    if my_roster is None:
        raise RuntimeError(f"No roster was found for user {MY_USER_ID}")

    league_settings = {
        "scoring": league.get("scoring_settings", {}),
        "roster_positions": league.get("roster_positions", []),
        "waiver_type": league.get("settings", {}).get("waiver_type"),
        "waiver_budget": league.get("settings", {}).get("waiver_budget"),
        "playoff_teams": league.get("settings", {}).get("playoff_teams"),
        "playoff_week_start": league.get("settings", {}).get("playoff_week_start"),
        "trade_deadline": league.get("settings", {}).get("trade_deadline"),
    }
    player_index = {
        player_id: {
            key: player.get(key)
            for key in (
                "player_id",
                "full_name",
                "first_name",
                "last_name",
                "position",
                "fantasy_positions",
                "team",
                "status",
                "active",
                "injury_status",
            )
        }
        for player_id, player in players.items()
    }

    collected_at = datetime.now(timezone.utc).isoformat()
    return {
        "collected_at": collected_at,
        "source": "Sleeper API",
        "league_id": LEAGUE_ID,
        "team_name": MY_TEAM_NAME,
        "user_id": MY_USER_ID,
        "league": league,
        "league_settings": league_settings,
        "my_user": my_user,
        "my_roster": my_roster,
        "users": users,
        "rosters": rosters,
        "drafts": drafts,
        "nfl_state": nfl_state,
        "matchups": matchups,
        "transactions": transactions,
        "player_index": player_index,
    }


def validate_snapshot(snapshot: dict[str, Any]) -> None:
    """Reject incomplete or mismatched data before writing a snapshot."""
    required_fields = (
        "collected_at",
        "league_id",
        "user_id",
        "team_name",
        "league",
        "league_settings",
        "my_user",
        "my_roster",
        "users",
        "rosters",
        "drafts",
        "nfl_state",
        "matchups",
        "transactions",
        "player_index",
    )
    missing_fields = [field for field in required_fields if field not in snapshot]
    if missing_fields:
        raise ValueError(f"Snapshot is missing required fields: {', '.join(missing_fields)}")

    if snapshot["league_id"] != LEAGUE_ID:
        raise ValueError(f"Snapshot league ID does not match configured league {LEAGUE_ID}")
    if snapshot["user_id"] != MY_USER_ID:
        raise ValueError(f"Snapshot user ID does not match configured user {MY_USER_ID}")
    if snapshot["team_name"] != MY_TEAM_NAME:
        raise ValueError(f"Snapshot team name does not match configured team {MY_TEAM_NAME}")
    if snapshot["my_user"].get("user_id") != MY_USER_ID:
        raise ValueError("Snapshot user record does not match configured user")
    if snapshot["my_roster"].get("owner_id") != MY_USER_ID:
        raise ValueError("Snapshot roster is not owned by configured user")
    if not snapshot["my_roster"].get("players"):
        raise ValueError("Snapshot roster does not contain any players")
    if not isinstance(snapshot["player_index"], dict) or not snapshot["player_index"]:
        raise ValueError("Snapshot player index is empty")


def write_json_atomically(path: Path, payload: dict[str, Any]) -> None:
    """Write JSON through a same-directory temporary file before replacement."""
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    temporary_path.write_text(
        json.dumps(payload, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    temporary_path.replace(path)


def write_snapshot(
    snapshot: dict[str, Any],
    output_path: Path,
    historical_root: Path = HISTORICAL_OUTPUT_ROOT,
) -> Path:
    validate_snapshot(snapshot)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    write_json_atomically(output_path, snapshot)
    collected_at = datetime.fromisoformat(snapshot["collected_at"])
    week = snapshot["nfl_state"].get("week", 0)
    historical_path = (
        historical_root
        / str(snapshot["league"].get("season", "unknown"))
        / f"week_{int(week):02d}"
        / f"sleeper_{collected_at.astimezone(timezone.utc):%Y%m%dT%H%M%SZ}.json"
    )
    historical_path.parent.mkdir(parents=True, exist_ok=True)
    write_json_atomically(historical_path, snapshot)
    return historical_path


def main() -> None:
    output_path = Path(os.environ.get("SLEEPER_OUTPUT", DEFAULT_OUTPUT))
    snapshot = collect_league_data()
    historical_path = write_snapshot(snapshot, output_path)

    roster = snapshot["my_roster"]
    print(f"Collected {snapshot['league']['name']}")
    print(f"Team: {MY_TEAM_NAME} (roster {roster['roster_id']})")
    print(f"Players on roster: {len(roster.get('players', []))}")
    print(f"Saved snapshot: {output_path}")
    print(f"Saved historical snapshot: {historical_path}")


if __name__ == "__main__":
    main()
