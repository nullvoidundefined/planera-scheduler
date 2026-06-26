/**
 * Web-worker entry for CPM recompute. Holds the last computed cache as worker
 * state and delegates every message to the pure handleWorkerMessage, posting
 * back only the changed delta so the main thread batch-updates the minimum set
 * of rows and bars. The store falls back to synchronous compute if this worker
 * fails to initialize.
 */
import type { ComputedActivity } from "../types/schedule";

import { handleWorkerMessage } from "./handleWorkerMessage";
import type { WorkerMessage } from "./handleWorkerMessage";

let previousComputed = new Map<string, ComputedActivity>();

self.onmessage = (event: MessageEvent<WorkerMessage>): void => {
    const { computed, delta } = handleWorkerMessage(event.data, previousComputed);
    previousComputed = computed;
    self.postMessage(delta);
};
