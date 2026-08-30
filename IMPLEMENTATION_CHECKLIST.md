# Fantasy Football Agent - Implementation Checklist

This checklist turns the high-level design into small, testable work items. Complete the tasks in order unless a task is explicitly marked optional.

Status values:

- `[ ]` Not started
- `[-]` In progress
- `[x]` Complete

## Phase 1: Sleeper Foundation

- [x] **Collect Sleeper league data**
  - Use the fixed league, team, and user constants.
  - Save league, users, rosters, drafts, NFL state, matchups, transactions, and player index.
  - File: `sleeper_collector.py`
  - Output: `data/sleeper_latest.json`
  - The full player index is cached for 24 hours in `data/sleeper_players_nfl.json`.

- [x] **Preserve league rules**
  - Store scoring settings, roster positions, waiver settings, playoff settings, and trade deadline.
  - Confirm rules are available in a dedicated `league_settings` object.

- [x] **Resolve Yardage Warriors**
  - Identify the user's roster by user ID.
  - Confirm the current roster ID and team name.
  - Current roster ID: `7`

- [x] **Add snapshot validation**
  - Validate required top-level fields before saving.
  - Validate that the configured user and roster exist.
  - Reject incomplete data clearly before writing.

- [x] **Add historical snapshots**
  - Save snapshots with a timestamp instead of overwriting the only copy.
  - Keep `sleeper_latest.json` as the current convenience snapshot.
  - Store copies under `data/sleeper/<season>/week_<week>/`.
  - Retention policy remains an operational decision before long-term automated collection.
  - Current and historical JSON snapshots are written atomically.

## Phase 2: NFL Context

- [x] **Choose an NFL data provider**
  - Use free nflverse data through the `nflreadpy` Python package.
  - Confirm licensing, update schedules, reliability, and Python support before production use.
  - Document the decision in the project data-source notes.

- [x] **Choose an external projection source**
  - Use FantasyPros as the initial external projection benchmark.
  - Verify the free personal-development API key and endpoint access.
  - Document licensing, daily limits, update frequency, and historical availability.

- [x] **Define the projection data contract**
  - Include player, week, position, underlying projected stats, fantasy points, scoring format, source, model/version, and timestamp.
  - Normalize FantasyPros, internal, and future provider projections into the same contract.
  - Implemented in `projection_contract.py` with validation and JSON serialization.
  - Supports weeks 0-22, including the NFL playoff range.

- [x] **Build the FantasyPros projection adapter**
  - Request weekly NFL projections by season, week, and supported position filters.
  - Do not send `scoring`; the documented NFL projections endpoint does not accept it.
  - Preserve the raw provider response before normalization.
  - Handle free-tier responses where `players` is `null` and `public_api_limited` is true.
  - Map FantasyPros player IDs to canonical player IDs.
  - Calculate normalized fantasy points locally from underlying stats and the requested scoring format.
  - Keep the API key in `FANTASYPROS_API_KEY` and out of source control.
  - Implemented in `fantasypros_adapter.py`; writes raw and normalized JSON artifacts.
  - Follow-up: retry the projections endpoint after the FantasyPros plan upgrade propagates; the current key still reports `tier: free` and `public_api_limited: true`.

- [x] **Build internal projection V1**
  - Generate interpretable projections from nflverse usage, statistics, and opportunity data.
  - Respect league scoring and roster configuration.
  - Produce underlying stat estimates plus expected points.
  - Implemented in `internal_projection.py` using a four-week trailing average and model version `nflverse-opportunity-v1`.
  - Lookbacks filter explicitly by the requested season.
  - Missing season data is rejected with an explicit validation error.

- [x] **Build projection comparison**
  - Compare FantasyPros projections with the internal model and actual results.
  - Track MAE, RMSE, bias, correlation, and calibration by position and week.
  - Do not blend projections until historical evaluation supports a methodology.
  - Implemented in `projection_comparison.py`; preserves empty comparisons when a provider is limited.
  - Joins records by canonical player ID, season, and week.
  - Rejects duplicate player-season-week records before calculating metrics.

- [x] **Collect the NFL schedule**
  - Pull the current season schedule.
  - Store game date, week, home team, away team, and status.
  - Support bye-week detection and upcoming opponent lookup.

- [x] **Build player identity matching**
  - Join Sleeper player IDs to the selected NFL provider's IDs.
  - Store the mapping without replacing the original Sleeper IDs.
  - Handle unmatched, retired, and duplicate players.
  - Implemented in `identity_matcher.py`; writes `data/identity_mapping.json` and review lists.
  - Identity dataset selection is season-driven; use an explicit path until a requested season is published by nflverse.
  - Canonical fallback priority is `sleeper_id -> gsis_id -> nfl_id`.

- [x] **Collect player statistics**
  - Pull recent game-level passing, rushing, and receiving statistics.
  - Add snap counts, touches, targets, and red-zone usage when available.
  - Store the source and retrieval timestamp.
  - nflverse season lookup is deferred until collection instead of running at import time.

- [x] **Collect injuries**
  - Pull injury status, practice participation, lineup changes, and relevant updates.
  - Associate each item with a player and timestamp.
  - Mark expired reports separately from current reports.
  - nflverse currently supplies injuries.

- [ ] **Build news aggregation**
  - Collect ESPN NFL, team, and player news.
  - Collect FantasyPros player notes and breaking updates.
  - Optionally collect NFL.com as an independent corroboration source.
  - Normalize each item into a player-linked record with source, URL, headline, summary, timestamps, category, impact score, and expiration status.
  - Deduplicate syndicated or repeated reports across sources.
  - Track corroboration across multiple outlets before treating a story as high-confidence.
  - Store enough metadata for downstream ranking, projection refreshes, and LLM context assembly.

- [x] **Define data freshness rules**
  - Set refresh intervals for schedules, statistics, injuries, news, and projections.
  - Mark stale data in downstream reports.
  - Implemented in `freshness_rules.py`: schedules 24h, statistics/nflverse 6h, injuries 1h, news 30m, projections/fantasypros 12h.
  - Rejects future retrieval timestamps as clock skew or corrupted metadata.

## Phase 3: Deterministic Analysis

- [ ] **Create normalized internal models**
  - Define Python models for league, roster, player, game, injury, statistic, and projection records.
  - Keep provider-specific parsing inside connector modules.

- [ ] **Implement projection inputs**
  - Use the shared projection contract for external and internal projections.
  - Add expected points, floor, ceiling, distribution, and confidence.
  - Include league scoring and roster rules in calculations.

- [ ] **Implement schedule and matchup metrics**
  - Calculate upcoming opponents and schedule strength.
  - Account for bye weeks and defensive matchup data when available.

- [ ] **Implement roster analysis**
  - Compare starters with bench alternatives.
  - Identify positional depth, risk, and replacement value.
  - Detect injured or unavailable starters.

- [ ] **Implement start/sit ranking**
  - Rank eligible players by projected value for each lineup slot.
  - Respect the league's roster constraints.
  - Return recommended starters, bench players, and the expected point difference.

- [ ] **Implement waiver analysis**
  - Find relevant free agents by position.
  - Compare projected value with drop candidates.
  - Account for waiver priority and FAAB budget.

- [ ] **Implement matchup simulation**
  - Simulate Yardage Warriors against the weekly opponent.
  - Estimate win probability and the impact of lineup alternatives.

## Phase 3.5: Decision Context

- [ ] **Build the decision context builder**
  - Convert raw league and NFL data into focused contexts.
  - Create separate contexts for start/sit, waiver, trade, roster, and matchup decisions.
  - Include only relevant data for each decision.
  - Preserve source timestamps and calculation versions.

## Phase 4: LLM Agent

- [ ] **Define LLM provider adapter**
  - Create one internal interface for chat, structured output, and tool calling.
  - Keep provider credentials in environment variables.
  - Support model replacement without changing fantasy logic.

- [ ] **Define read-only tools**
  - Implement tools for roster, league context, standings, free agents, player news, statistics, schedules, and simulations.
  - Return structured JSON with source timestamps.
  - Enforce an allowlist, timeouts, and input validation.

- [ ] **Define recommendation schema**
  - Require decision, subject, confidence, evidence, risks, alternatives, and data timestamp.
  - Reject malformed or unsupported model responses.

- [ ] **Build the start/sit agent**
  - Give the model focused context and access to read-only tools.
  - Require it to distinguish facts, projections, assumptions, and uncertainty.
  - Produce a weekly report for Yardage Warriors.

- [ ] **Build waiver recommendations**
  - Ask the agent to rank adds and corresponding drops.
  - Include roster fit, expected impact, and opportunity cost.

- [ ] **Build trade analysis**
  - Identify possible trade partners from league roster weaknesses.
  - Simulate short-term and playoff impact.
  - Generate proposals for manual review only.

- [ ] **Add second-opinion review**
  - Request a second opinion when confidence is below the configured threshold, impact is high, the recommendation conflicts with deterministic analysis, or the decision involves a trade.
  - Compare disagreements before presenting the final result.

## Phase 5: Delivery and Automation

- [ ] **Build a command-line report**
  - Add a command that generates the current weekly analysis.
  - Make output readable without requiring a web UI.

- [ ] **Add scheduled refresh jobs**
  - Refresh data according to freshness rules.
  - Add retries, backoff, idempotency, and failure reporting.

- [ ] **Add alerts**
  - Notify about questionable starters, inactive players, and meaningful lineup changes.
  - Include the data timestamp and manual action required.

- [ ] **Add a web dashboard**
  - Show roster, matchup, projections, recommendations, and evidence.
  - Keep actions read-only and link users to Sleeper for manual changes.

## Phase 6: Persistence and Evaluation

- [ ] **Add PostgreSQL storage**
  - Store normalized data, historical snapshots, recommendations, evidence, and outcomes.
  - Preserve provider IDs and calculation versions.

- [ ] **Add recommendation audit records**
  - Record model, prompt version, evidence, confidence, alternatives, and timestamp.

- [ ] **Record recommendation outcomes**
  - Capture the lineup used, actual player results, waiver outcomes, and trade results.
  - Record when the user overrides the recommendation.

- [ ] **Build backtesting**
  - Replay historical decisions using only information available at that time.
  - Compare against a baseline strategy.

- [ ] **Measure system quality**
  - Track lineup points, start/sit accuracy, waiver value, trade value, calibration, and user overrides.
  - Use results to improve data quality and prompts.

## Current Next Task

**Create normalized internal models** in Phase 3.

Definition of done:

- Define Python models for league, roster, player, game, injury, statistic, and projection records.
- Keep provider-specific parsing inside connector modules.
- Reuse the projection contract and identity mapping in downstream models.
