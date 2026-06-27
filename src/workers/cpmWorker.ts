/**
 * Web-worker entry for CPM recompute. Receives an operation request carrying the
 * graph, the operation, and the serialized previous computed cache (as Map
 * entries), reconstructs the Map, delegates to the pure handleWorkerMessage, and
 * posts back only the changed delta so the main thread batch-updates the minimum
 * set of rows and bars. Holds no cross-message state: the store owns the
 * authoritative cache and passes it on every request. The store falls back to a
 * synchronous handleWorkerMessage call when this worker fails to initialize.
 */
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

import { handleWorkerMessage } from "./handleWorkerMessage";

export interface CpmWorkerRequest {
    graph: ScheduleGraph;
    operation: Operation;
    previousComputed: [string, ComputedActivity][];
}

self.onmessage = (event: MessageEvent<CpmWorkerRequest>): void => {
    const { graph, operation, previousComputed } = event.data;
    const { delta } = handleWorkerMessage(
        { graph, kind: "operation", operation },
        new Map(previousComputed),
    );
    self.postMessage(delta);
};
