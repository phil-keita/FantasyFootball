# FantasyPros Projection Data

Official docs: https://api.fantasypros.com/public/v2/docs/

## Role in This Project

FantasyPros is the initial external projection benchmark for the Yardage Warriors assistant. nflverse supplies raw NFL facts and opportunity metrics, while FantasyPros supplies consensus fantasy projections. The internal projection model and FantasyPros projection should be compared before the LLM makes a strategic recommendation.

```text
Sleeper -> league state
nflverse -> NFL facts and usage
FantasyPros -> external fantasy projections
Internal model -> independent projections
Comparison -> differences and evidence
LLM -> start, sit, waiver, and trade decision
```

## Access

- Base URL: `https://api.fantasypros.com/public/v2/json`
- Authentication: `x-api-key` HTTP header
- Environment variable: `FANTASYPROS_API_KEY`
- Request a free development key: https://secure.fantasypros.com/api-keys/request/
- The free tier is intended for personal, non-commercial development and testing.
- Production, personal-use, and commercial terms vary by plan. Review the current terms before deployment.
- Do not commit the key to the repository.

## Weekly NFL Projections

```text
GET /nfl/<season>/projections
```

Useful parameters:

```text
position=QB|RB|WR|TE|K|DST|ALL
week=<week>
players=<fantasypros_id>:<fantasypros_id>
```

The current official schema does not list `scoring` as a supported query
parameter for NFL projections. The response includes the provider's scoring
metadata (currently commonly `STD`); calculate league-specific PPR or half-PPR
points from the underlying projected statistics instead of sending `scoring`.

Example:

```text
https://api.fantasypros.com/public/v2/json/nfl/2026/projections?position=WR&week=3
```

The response includes FantasyPros player IDs, names, teams, positions, and a `stats` array containing projected statistics. Preserve the complete raw response before normalizing it.

## Other Useful Endpoints

```text
GET /nfl/players
GET /nfl/<season>/consensus-rankings
GET /nfl/news
GET /nfl/injuries?year=<season>&week=<week>
GET /nfl/<season>/player-points
```

`/nfl/players` includes external ID mappings that help join FantasyPros records to nflverse and Sleeper players. `/player-points` is useful for evaluating projections against actual fantasy production.

## Repository Client

The read-only client is in `fantasypros_client.py`:

```powershell
$env:FANTASYPROS_API_KEY = "your-key"
py -c "from fantasypros_client import FantasyProsClient; print(FantasyProsClient().weekly_projections(2026, 3, 'ALL').keys())"
```

The free tier may return `public_api_limited: true` with `count: "0"` and
`players: null`. Treat that as a valid limited response rather than assuming
that `players` is always a list.

Operational follow-up: retry the projections endpoint after a plan upgrade
propagates. The currently configured key still reports `tier: free`, while the
`/nfl/players` endpoint remains available.

The client returns provider responses unchanged. The adapter in
`fantasypros_adapter.py` loads the nflverse `ff_playerids` mapping, converts
matched players into `ProjectionRecord` objects, reports unmatched IDs, and
writes separate raw and normalized JSON artifacts:

```powershell
py fantasypros_adapter.py --season 2026 --week 3 --position WR --scoring PPR
```

The shared normalized contract is defined in `projection_contract.py`.

Normalized outputs can be compared with the internal model using
`projection_comparison.py`. The comparison reports MAE, RMSE, bias, correlation,
and calibration ratio overall and by position/week when actual results are
available. Records are joined by canonical player ID, season, and week.
Duplicate records for a player-season-week are rejected before metrics are
calculated.

## Projection Contract

Every normalized projection should include:

```json
{
  "player_id": "canonical-player-id",
  "external_player_id": 12345,
  "week": 3,
  "position": "WR",
  "projection": {
    "passing_attempts": null,
    "passing_yards": null,
    "passing_touchdowns": null,
    "interceptions": null,
    "rushing_attempts": null,
    "rushing_yards": null,
    "rushing_touchdowns": null,
    "receptions": 5.7,
    "receiving_yards": 71.0,
    "receiving_touchdowns": 0.42,
    "fantasy_points": 17.4
  },
  "scoring_format": "PPR",
  "source": "fantasypros",
  "model_version": "provider-response",
  "retrieved_at": "2026-08-27T00:00:00Z"
}
```

Projection weeks use NFL numbering: week `0` is preseason, weeks `1-18` are
regular season, and weeks `19-22` represent the playoff range supported by the
shared contract.

The exact field names in the provider response must be mapped after inspecting the selected position responses. Store underlying projected stats, not only the fantasy-point total. The adapter calculates normalized fantasy points locally from those stats and the requested STD, PPR, or HALF format; provider scoring metadata and raw point fields are retained only in the raw response.

## Identity Mapping

Keep all IDs:

```text
Sleeper player_id
FantasyPros fpid / player_id
nflverse player ID
ESPN or other provider IDs
```

Canonical ID priority is `sleeper_id -> gsis_id -> nfl_id`. Provider IDs are
still retained in the identity mapping so joins remain traceable.

Use `ff_playerids` from nflverse and FantasyPros `/nfl/players` to build an explicit mapping. Do not join players by display name alone.

The repository mapping is generated by `identity_matcher.py` and saved to
`data/identity_mapping.json`. It preserves Sleeper, GSIS, and FantasyPros IDs,
and records unmatched or duplicate IDs for review. The matcher selects the
identity dataset from `--season`, the Sleeper snapshot season, or
`NFLVERSE_SEASON`; pass `--nflverse-ids` when using a specific file.

## Evaluation

Preserve each projection as it existed before games begin. Compare:

```text
FantasyPros projected stats
-> league scoring calculator
-> calculated fantasy points

FantasyPros projection
vs internal projection
vs actual result
```

Track MAE, RMSE, bias, correlation, and calibration by position and week. Do not automatically average external and internal projections until historical evaluation supports a blending method.
