# Sleeper API Notes

Official docs: https://docs.sleeper.com/

## Repository Configuration

The current collector is configured for:

- League ID: `1370840832885657600`
- Team: `Yardage Warriors`
- Sleeper user ID: `1396530534531756032`
- Sport: `nfl`

Run the collector from the repository root with `py sleeper_collector.py`.
It writes the latest snapshot to `data/sleeper_latest.json` and a timestamped
historical copy under `data/sleeper/<season>/week_<week>/`.

## Basics

- Base URL: `https://api.sleeper.app/v1`
- The API is read-only.
- No API token or authentication is required.
- Intended for non-commercial use.
- Keep usage below roughly 1,000 requests per minute to avoid rate limiting.
- Use stable `user_id` values when storing users; usernames can change.

## Find a User

Get a user by username or user ID:

```text
GET /user/<username>
GET /user/<user_id>
```

Example:

```text
https://api.sleeper.app/v1/user/<username>
```

A user response includes `user_id`, `username`, `display_name`, and `avatar`.

## Find Leagues

List all leagues for a user and season:

```text
GET /user/<user_id>/leagues/<sport>/<season>
```

For NFL:

```text
https://api.sleeper.app/v1/user/<user_id>/leagues/nfl/<season>
```

Each league commonly includes `league_id`, `name`, `season`, `status`, `total_rosters`, `draft_id`, `settings`, `scoring_settings`, and `roster_positions`.

## League Information

Replace `<league_id>` with the ID returned above.

```text
GET /league/<league_id>
GET /league/<league_id>/users
GET /league/<league_id>/rosters
GET /league/<league_id>/matchups/<week>
GET /league/<league_id>/transactions/<week>
GET /league/<league_id>/traded_picks
GET /league/<league_id>/drafts
GET /league/<league_id>/winners_bracket
GET /league/<league_id>/losers_bracket
```

Useful details:

- `users` maps Sleeper users to league teams and may include team names.
- `rosters` contains `roster_id`, `owner_id`, `players`, `starters`, and standings such as wins, losses, and points.
- `matchups/<week>` returns one object per roster. Teams sharing the same `matchup_id` play each other.
- `transactions/<week>` returns trades, waivers, free-agent moves, drops, and adds. The collector requests the current NFL week.
- `drafts` can contain multiple drafts, especially for dynasty leagues.

Sleeper does not provide a single free-agent list in the league snapshot. Free
agents must be derived by subtracting rostered player IDs from the player index,
then filtering for eligible and available players.

## Draft Information

```text
GET /draft/<draft_id>
GET /draft/<draft_id>/picks
GET /draft/<draft_id>/traded_picks
```

Draft picks include the player ID, roster ID, round, pick number, and player metadata.

## Player Information

Fetch the player ID map sparingly, ideally no more than once per day:

```text
GET /players/nfl
GET /players/nfl?position=QB
GET /players/nfl?active=true
```

Rosters and draft picks contain player IDs. The repository collector stores a
lightweight `player_index` with identity, position, team, availability, and
injury fields while preserving the original IDs. The full `/players/nfl`
response should be cached separately if additional fields are needed.

## Current NFL State

```text
GET /state/nfl
```

This returns the current season, week, season type, and league season.

## JavaScript Example

```js
const response = await fetch(
  'https://api.sleeper.app/v1/league/<league_id>/rosters'
);

if (!response.ok) {
  throw new Error(`Sleeper API error: ${response.status}`);
}

const rosters = await response.json();
console.log(rosters);
```

## Error Codes

- `400`: Invalid request
- `404`: Resource not found
- `429`: Too many requests; slow down
- `500`: Sleeper server error
- `503`: Service unavailable

## Typical Workflow

1. Resolve a username to a `user_id`.
2. List that user's leagues for the desired season.
3. Select a `league_id`.
4. Fetch league users, rosters, matchups, transactions, and drafts.
5. Resolve player IDs using a locally cached `/players/nfl` response.

The collector's snapshot is a Sleeper-only layer. NFL statistics, projections,
news, and injuries should be collected separately and joined downstream using
stable player IDs or an explicit identity mapping.

The full `/players/nfl` response is cached in `data/sleeper_players_nfl.json`
for 24 hours by `sleeper_collector.py`. A missing, stale, or malformed cache is
refreshed automatically; league-specific endpoints remain live on each run.

Current and historical snapshot JSON files are written atomically through a
temporary file in the destination directory, preventing partially written
files from replacing a valid snapshot.
