/**
 * Wire shape for the CPM web-worker request: the graph, the operation, and the
 * previous computed cache serialized as Map entries. Extracted so the worker
 * entry module carries only its side-effecting onmessage wiring.
 */
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

export interface CpmWorkerRequest {
    graph: ScheduleGraph;
    operation: Operation;
    previousComputed: [string, ComputedActivity][];
}
