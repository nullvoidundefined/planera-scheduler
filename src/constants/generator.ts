/**
 * Default options and tuning constants for the seeded schedule generator.
 * Centralised here so tests and the generator function share the same source
 * of truth.
 *
 * The dependency tuning produces a realistic construction schedule with a
 * strong sequential bias: most activities follow their immediate predecessor
 * (the clean descending staircase), a minority branch off an earlier activity
 * to run in parallel, and some converge a second, earlier predecessor as a
 * merge. Every generated edge is finish-to-start with non-negative lag, so
 * every dependency arrow points forward (down and to the right).
 */
export const DEFAULT_ACTIVITY_COUNT = 5000;
export const DEFAULT_SEED = 1;
export const GROUPS_PER_PROJECT = 5;
export const MAX_DURATION_DAYS = 20;
export const MAX_LAG_DAYS = 5;
export const MERGE_PREDECESSOR_CHANCE = 0.2;
export const MERGE_PREDECESSOR_LOOKBACK = 10;
export const MILESTONE_CHANCE = 0.05;
export const PARALLEL_BRANCH_CHANCE = 0.2;
export const PARALLEL_BRANCH_LOOKBACK = 3;
