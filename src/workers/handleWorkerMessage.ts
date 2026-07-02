/**
 * Pure handler for CPM worker messages. A "full" message recomputes the whole
 * schedule; an "operation" message recomputes and returns only the changed
 * delta, except toggleCollapse which is view-only and triggers no recompute.
 * Kept pure and free of the worker global so it is unit-testable in isolation.
 */
import { computeDownstreamCone } from "../services/cpm/computeDownstreamCone";
import { computeSchedule } from "../services/cpm/computeSchedule";
import { selectLeafActivities } from "../services/cpm/selectLeafActivities";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

type WorkerMessage =
    | { graph: ScheduleGraph; kind: "full" }
    | { graph: ScheduleGraph; kind: "operation"; operation: Operation };

interface WorkerResult {
    computed: Map<string, ComputedActivity>;
    delta: ComputedActivity[];
}

export function handleWorkerMessage(
    message: WorkerMessage,
    previousComputed: Map<string, ComputedActivity>,
): WorkerResult {
    const leafGraph = selectLeafActivities(message.graph);

    if (message.kind === "operation" && message.operation.kind === "toggleCollapse") {
        return { computed: previousComputed, delta: [] };
    }

    if (message.kind === "full") {
        const result = computeSchedule(leafGraph);
        if (!result.ok) {
            throw new Error("handleWorkerMessage: full graph is cyclic");
        }
        return { computed: result.activities, delta: [...result.activities.values()] };
    }

    return computeDownstreamCone(leafGraph, previousComputed);
}
