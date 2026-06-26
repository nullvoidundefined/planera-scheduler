/**
 * Result type for the CPM schedule engine. A successful computation returns the
 * computed schedule keyed by activity id; a cyclic graph returns the offending
 * cycle so the caller can surface it without throwing.
 */

import type { ComputedActivity } from "./schedule";

export type ScheduleResult =
    | { activities: Map<string, ComputedActivity>; ok: true }
    | { cycle: string[]; ok: false };
