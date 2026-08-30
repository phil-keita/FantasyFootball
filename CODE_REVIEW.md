# Code Review

Date: 2026-08-27
Scope: Python collectors, projection pipeline, generated data behavior, and project documentation.

## Priority Order

### Critical

#### CR-1: Internal scoring label does not control scoring (Fixed)

**File:** `internal_projection.py`, `project_rows()`

`scoring_format` is stored on the output record but does not determine the scoring calculation. The calculation can still use the Sleeper league's reception value, so `--scoring STD` can produce PPR points labeled as STD.

**Impact:** Projection values and labels disagree, corrupting comparisons.

**Resolution:** The model now derives reception scoring from the requested format while retaining the league's other custom scoring values. Focused validation covers STD, HALF, and PPR.

#### CR-2: FantasyPros points can be STD while records are labeled PPR (Fixed)

**File:** `fantasypros_adapter.py`

FantasyPros currently reports provider scoring as `STD`. The adapter preserves provider fantasy-point stats while stamping records with the CLI scoring value, such as `PPR`.

**Impact:** FantasyPros and internal projections can be compared using incompatible point totals.

**Resolution:** The adapter now recalculates fantasy points locally from normalized underlying stats and the requested scoring format. Provider point fields are not used for normalized totals.

### High

#### H-1: Freshness source names do not match pipeline sources (Fixed)

**File:** `freshness_rules.py`

Freshness rules use categories such as `projections` and `statistics`, while records use sources such as `fantasypros` and `nflverse`. Calling `freshness_status("fantasypros", ...)` currently raises `ValueError`.

**Resolution:** Freshness rules now accept `fantasypros` and `nflverse` directly, using the projection and statistics thresholds respectively, while retaining category names.

#### H-2: Comparison key omits season (Fixed)

**File:** `projection_comparison.py`, `_key()`

Records are joined by `(player_id, week)` only.

**Impact:** Same-player weeks from different seasons can be joined incorrectly.

**Resolution:** Comparison keys now include `(player_id, season, week)`, and emitted pairs retain the season value.

#### H-3: Identity defaults are hardcoded to 2025 (Fixed)

**Files:** `fantasypros_adapter.py`, `identity_matcher.py`

Default identity paths point to `data/nflverse/2025`, even when processing another season.

**Resolution:** Adapter identity paths now derive from `--season`; the identity matcher derives from `--season`, the Sleeper snapshot season, or `NFLVERSE_SEASON`. An explicit path remains available for exceptions.

#### H-4: Sleeper downloads the full player index every run (Fixed)

**File:** `sleeper_collector.py`, `collect_league_data()`

The full `/players/nfl` response is fetched unconditionally despite project documentation recommending daily caching.

**Resolution:** `sleeper_collector.py` now caches `/players/nfl` in `data/sleeper_players_nfl.json` for 24 hours and refreshes it when missing, stale, or invalid.

#### H-5: Canonical fallback IDs are inconsistent (Fixed)

**Files:** `fantasypros_adapter.py`, `internal_projection.py`

One path falls back to `nfl_id`, while the other uses `gsis_id`.

**Impact:** Players without Sleeper IDs cannot be paired consistently.

**Resolution:** Both projection paths now use `sleeper_id -> gsis_id -> nfl_id` as the canonical fallback order.

### Medium

#### M-1: nflverse season lookup occurs at import time (Fixed)

**File:** `nflverse_collector.py`

**Resolution:** Season resolution now occurs inside `get_season()` when collection is requested; imports no longer invoke the nflverse current-season lookup.

#### M-2: Playoff weeks are rejected (Fixed)

**File:** `projection_contract.py`

**Resolution:** Validation now permits weeks 0 through 22, covering preseason, regular season, and NFL playoff weeks.

#### M-3: Internal lookback does not filter by season (Fixed)

**File:** `internal_projection.py`

**Resolution:** The lookback now requires an explicit season and filters by
season plus the four completed weeks. Season and week columns are cast before
filtering to accommodate the stored nflverse parquet types.

#### M-4: Missing season fallback is misleading (Fixed)

**File:** `internal_projection.py`

**Resolution:** The internal model now requires a `season` input column and raises an explicit missing-column error before filtering.

**Action:** Raise an explicit missing-column error.

#### M-5: Duplicate comparison records are silently discarded (Fixed)

**File:** `projection_comparison.py`

**Resolution:** Comparison indexing now rejects duplicate player-season-week records and reports each conflicting key.

**Action:** Detect duplicate keys and raise or report them.

#### M-6: Future timestamps are treated as fresh (Fixed)

**File:** `freshness_rules.py`

**Resolution:** Freshness evaluation now rejects future `retrieved_at` values with an explicit clock-skew error.

**Action:** Reject future timestamps or return a clock-skew warning.

#### M-7: Sleeper snapshot writes are not atomic (Fixed)

**File:** `sleeper_collector.py`, `write_snapshot()`

**Resolution:** Current and historical snapshots now write through same-directory temporary files and atomically replace their destinations.

**Action:** Write temporary files and rename atomically.

### Low

#### L-1: `polars` is not explicit in requirements (Fixed)

Add `polars` directly to `requirements.txt` because it is imported by project modules.

#### L-2: nflverse collection has no per-dataset isolation

One dataset failure aborts the full collection. Decide whether partial collection should be supported and record failures in the manifest.

#### L-3: No `.gitignore` (Fixed)

Add exclusions for `.env`, key files, Python caches, and generated data that should not be committed.

#### L-4: Injuries/news checklist item is overstated (Fixed)

nflverse injuries are implemented, but a separate editorial news source is still missing. Split this into separate checklist items.

#### L-5: No automated tests (Fixed)

Add focused tests for contract validation, scoring, normalization, identity matching, freshness, and comparison metrics.

#### L-6: Optional actual values are not type-narrowed (Fixed)

Narrow or assert the optional values in `projection_comparison.py` before passing them to metric functions.

#### L-7: Identity matcher defaults to a live API call (Fixed)

Running without `--fantasypros` performs a network request. Prefer an explicit input or an opt-in live-fetch flag.

#### L-8: Unused scoring argument in FantasyPros client (Fixed)

`weekly_projections()` accepts `scoring` but does not send it. Remove the argument or clearly deprecate it to avoid implying that it changes the request.

## Recommended Execution Sequence

1. Fix CR-1 and CR-2 so all point values have truthful scoring labels.
2. Fix H-1 through H-5 to make cross-source joins and freshness checks reliable.
3. Add focused automated tests before continuing Phase 3.
4. Fix M-1 through M-7.
5. Address dependency, repository hygiene, and checklist cleanup items.

## Review Conclusion

The architecture is a reasonable foundation and the collectors are readable, but the projection pipeline should not be used for strategic recommendations until the two scoring mismatches and cross-source identity/freshness issues are resolved.
