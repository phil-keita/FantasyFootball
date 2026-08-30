# Fantasy Football LLM Agent

## Goal

Build an AI fantasy-football assistant that studies the NFL and the user's specific Sleeper league, then recommends practical roster decisions such as:

- Which players to start or bench
- Which free agents to add
- Which players to drop
- Whether to propose or accept a trade
- Which trades to propose
- How the roster projects over the next several weeks
- The roster's biggest weaknesses
- Which moves maximize the probability of winning this week

The system should provide recommendations for the user's team, **Yardage Warriors**, using current league and NFL information rather than generic fantasy advice.

## Core Principle

The LLM should reason over current, structured facts. It should not be responsible for independently knowing what is happening in the NFL.

Application code should collect and normalize the data first, then provide the relevant context to the model:

```text
Live data sources
       |
       v
Structured league and NFL data
       |
       +--> Statistical and projection engines
       |
       v
LLM reasoning agent
       |
       v
Recommendations with explanations, risks, and confidence
```

## Data Sources

Initial sources can include:

- Sleeper API: league settings, rosters, players, matchups, transactions, drafts, and standings
- nflverse via `nflreadpy`: schedules, game results, rosters, player statistics, snap counts, injuries, depth charts, player IDs, and fantasy opportunity data
- ESPN or another reputable news source: editorial injury reports, lineup changes, and breaking news
- FantasyPros API: external weekly projections, rankings, player IDs, news, and injuries

The Sleeper API is read-only and does not execute roster changes. Recommendations must be applied manually in Sleeper unless an officially supported write integration becomes available.

The current Sleeper configuration is the C.L.A.N.S. Family League: league ID
`1370840832885657600`, user ID `1396530534531756032`, and team **Yardage
Warriors**. Sleeper remains authoritative for league state; NFL statistics,
injuries, news, and projections are separate data layers joined by player ID.

The free NFL data layer uses `nflreadpy` and nflverse. The package currently
provides data through the 2025 season; the 2026 Sleeper league remains the
target league, while 2026 NFL datasets will be collected when nflverse
publishes them. nflverse's `ff_opportunity` data is a useful projection input,
not a complete replacement for a weekly fantasy projection model.

FantasyPros is the initial external projection benchmark. The project will
preserve FantasyPros' underlying projected statistics, independently calculate
league fantasy points, and compare them with an interpretable internal model
before the LLM makes a strategic decision.

FantasyPros API v2 uses the base URL
`https://api.fantasypros.com/public/v2/json` and the `x-api-key` header. The
NFL projections endpoint does not accept a scoring query parameter; league
scoring is applied locally from the returned statistics. A successful free-tier
response can be marked `public_api_limited` with `players: null`, so downstream
code must handle that state explicitly. See
[FANTASYPROS_DATA.md](FANTASYPROS_DATA.md) for the current endpoint details.

## League Context

The agent should learn the user's actual league rather than relying only on general rankings. Include:

- League scoring settings
- Roster positions and lineup rules
- Waiver type, priority, and budget
- Trade rules and deadline
- Playoff structure
- User's roster and starters
- Every opponent's roster
- League standings
- Available free agents
- Previous trades, waivers, and transactions
- Draft picks and future traded picks

This allows the agent to identify opportunities specific to the league. For example, it can find teams that are overloaded at one position and suggest a mutually useful trade.

Free agents should be derived from the Sleeper player index by subtracting all
rostered player IDs, then applying availability and position filters.

## Suggested Tools

Expose focused tools to the LLM instead of sending one large prompt every time:

```text
get_my_roster()
get_free_agents()
get_league_standings()
get_player_stats(player)
get_player_news(player)
get_injury_report()
get_nfl_schedule()
get_recent_games(team)
get_trade_history()
simulate_matchup(...)
simulate_trade(...)
```

A typical investigation might be:

```text
Question: Should I drop Player X?

1. Get Player X's recent stats and news.
2. Check Player X's injury status and team situation.
3. Check the team's upcoming schedule.
4. Inspect available free agents.
5. Compare projected value and roster fit.
6. Return a recommendation with reasoning and uncertainty.
```

## Deterministic Analysis

Use code for calculations that should be consistent, testable, and reproducible. The LLM should interpret the results and explain the decision.

Useful calculated fields include:

```text
expected_points
floor
ceiling
probability_of_starting
schedule_strength
injury_probability
target_share
red_zone_share
recent_usage
replacement_value
roster positional need
playoff schedule value
```

The overall analysis can combine:

```text
FantasyPros projections
+ internal player projections
+ matchup model
+ injury and news analysis
+ schedule strength
+ roster construction
+ league context
+ statistical simulations
+ LLM reasoning
```

## Recommendation Format

Recommendations should be actionable and explain the evidence behind them. A roster alert might look like this:

```text
Roster Alert

Your WR2 is questionable and his team's starting quarterback is inactive.

Recommendation: Bench him.
Replacement: Player X from waivers.
Expected change: +3.8 projected points.
Confidence: 87%.
Reason: Player X has increased target share over the last three games and faces a favorable pass defense.
```

The agent should clearly distinguish facts, projections, assumptions, and uncertainty. It should avoid presenting a projection as a guarantee.

## Model Strategy

Choose models based on actual availability, quality, tool-calling support, latency, and cost at implementation time. A strong architecture can support multiple providers behind one agent interface.

Possible roles:

- Primary reasoning model: evaluates roster decisions and coordinates tools
- Second-opinion model: independently reviews important trade or lineup decisions
- Lower-cost model: performs routine monitoring and alerts
- Deterministic code: performs projections, simulations, comparisons, and validation

For high-impact decisions, two independent analyses can be compared. The
second opinion should be requested selectively when confidence is below a
configured threshold, impact is high, deterministic analysis disagrees, or the
decision involves a trade:

```text
Fantasy data
    |
    +--> Primary model analysis
    |
    +--> Second-opinion analysis
    |
    v
Judge or final reasoning step
    |
    v
Final recommendation and disagreement summary
```

Do not select a model solely because it sounds confident. Evaluate recommendations against historical outcomes and compare them with a replacement-level strategy.

## Automated Monitoring

A scheduled workflow can refresh data and generate recommendations:

```text
1. Pull current news and injury information.
2. Pull NFL results, schedules, and player statistics.
3. Pull the latest Sleeper league data.
4. Update projections and simulations.
5. Evaluate the user's roster and upcoming opponent.
6. Evaluate waiver and trade opportunities.
7. Generate alerts and recommendations.
```

The system should avoid unnecessary API calls, cache slowly changing data, and respect each provider's rate limits and terms of use.

## Suggested Technology

An initial implementation could use:

- Python for data collection, normalization, projections, and simulations
- Sleeper API for league data
- ESPN or other news sources for injury and news updates
- nflverse via `nflreadpy` for games, schedules, rosters, and statistics
- PostgreSQL for historical league, player, and decision data
- An LLM API with function calling or tool use for reasoning

Fine-tuning is not required for the first version. Start with reliable data retrieval, clear tool contracts, deterministic calculations, and good evaluation records.

## Evaluation and Backtesting

Record every recommendation with:

- Data timestamp
- Available evidence
- Model and prompt version
- Recommendation
- Confidence
- Alternatives considered
- Actual outcome

Backtest decisions against previous weeks to measure whether the system improves lineup points, waiver value, trade value, playoff probability, or win probability. The goal is to measure decisions, not merely whether the explanations sound convincing.

## First Milestone

Build a read-only weekly assistant for Yardage Warriors that:

1. Loads the league settings and roster from Sleeper.
2. Identifies the weekly opponent and current standings.
3. Retrieves player news, injuries, schedules, and projections.
4. Calculates projected starters and bench alternatives.
5. Finds relevant waiver targets.
6. Produces a start/sit report with evidence and confidence.
7. Stores the recommendation and later records the result.

Trade analysis, multi-model review, and automated monitoring can be added after this foundation is reliable.
