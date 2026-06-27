/**
 * Recomputes the schedule and returns the delta against a previous computed
 * cache. The worker runs the full pass off the main thread; this function
 * narrows the result to only the activities whose computed values changed (for a
 * resize, exactly the downstream cone), so each view batch-updates the minimum
 * set of rows and bars. Callers pass a leaf-only graph; a cyclic graph throws.
 */
import type { ComputedActivity, ScheduleGraph } from "../../types/schedule";

import { computeSchedule } from "./computeSchedule";

export function computeDownstreamCone(
    graph: ScheduleGraph,
    previousComputed: Map<string, ComputedActivity>,
): { computed: Map<string, ComputedActivity>; delta: ComputedActivity[] } {
    const result = computeSchedule(graph);
    if (!result.ok) {
        throw new Error("computeDownstreamCone: graph is cyclic; gate with detectCycle first");
    }

    const computed = result.activities;
    const delta: ComputedActivity[] = [];
    for (const [id, current] of computed) {
        if (!isSameComputedActivity(previousComputed.get(id), current)) {
            delta.push(current);
        }
    }

    return { computed, delta };
}

function isSameComputedActivity(
    previous: ComputedActivity | undefined,
    current: ComputedActivity,
): boolean {
    return (
        previous !== undefined &&
        previous.earlyFinish === current.earlyFinish &&
        previous.earlyStart === current.earlyStart &&
        previous.isCritical === current.isCritical &&
        previous.lateFinish === current.lateFinish &&
        previous.lateStart === current.lateStart &&
        previous.totalFloat === current.totalFloat
    );
}
