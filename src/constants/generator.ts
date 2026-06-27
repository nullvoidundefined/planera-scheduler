/**
 * Default options and tuning constants for the seeded schedule generator.
 * Centralised here so tests and the generator function share the same source
 * of truth.
 *
 * The dependency tuning produces a realistic parallel-lane construction
 * schedule. Each phase's leaves are partitioned into lanes of roughly
 * LANE_LENGTH consecutive activities; a lane is one crew running a clean local
 * finish-to-start staircase. Lanes run concurrently within a phase, phases run
 * sequentially within a project (a phase's lanes start once the previous phase's
 * merge gate completes), and projects run concurrently. The first CRITICAL_LANES
 * lanes of each phase form the critical band: the merge gate ties them together
 * with padding lags so they finish in lock-step and all sit on the critical path,
 * while the remaining concurrent lanes carry float. Sparse cross-lane edges let
 * the path weave between crews. Every generated edge is finish-to-start with
 * non-negative lag pointing strictly forward, so the graph is a DAG by
 * construction.
 *
 * Tuning note: with leaf durations spread across 1..MAX_DURATION_DAYS, a single
 * longest chain would mark only a few percent of activities critical at a
 * realistic span. CRITICAL_LANES sets how many lanes are tied into the band, which
 * is what lifts the critical fraction into a realistic 10..35% range without
 * inflating the span.
 */
export const CRITICAL_BAND_BUFFER = 6;
export const CRITICAL_LANES = 13;
export const CROSS_LANE_CHANCE = 0.08;
export const CROSS_LANE_MAX_LAG = 3;
export const DEFAULT_ACTIVITY_COUNT = 5000;
export const DEFAULT_SEED = 1;
export const GROUPS_PER_PROJECT = 5;
export const LANE_LENGTH = 14;
export const MAX_DURATION_DAYS = 20;
export const MILESTONE_CHANCE = 0.05;
export const PHASE_TRANSITION_MAX_LAG = 4;
export const WITHIN_LANE_MAX_LAG = 2;
