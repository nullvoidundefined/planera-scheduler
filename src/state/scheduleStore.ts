/**
 * Zustand store holding the single source of truth: the raw schedule graph
 * (stored inputs only), the computed cache (engine outputs, never persisted), and
 * the shared collapse set. dispatchOperation is two-phase. PHASE 1 recomputes the
 * downstream cone's early dates synchronously on the main thread
 * (computeConeEarlyDates) and merges them at once, so the edit is visible before
 * the worker responds. PHASE 2 runs the authoritative global pass that corrects
 * float and the critical path: it posts to the CPM web worker when one exists and
 * merges the worker's delta a beat later, falling back to a synchronous
 * handleWorkerMessage pass when no Worker is available (jsdom, SSR). addDependency
 * is gated by detectCycle against the prospective graph and rejected without
 * mutation. The net final cache equals a full recompute on either phase-2 path.
 */
import { create } from "zustand";

import { computeConeEarlyDates } from "../services/cpm/computeConeEarlyDates";
import { detectCycle } from "../services/cpm/detectCycle";
import { selectLeafActivities } from "../services/cpm/selectLeafActivities";
import type { Operation, OperationOrigin } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";
import type { CpmWorkerRequest } from "../workers/types";
import { createCpmWorker } from "../workers/createCpmWorker";
import { handleWorkerMessage } from "../workers/handleWorkerMessage";

interface ScheduleState {
    collapsed: Set<string>;
    computed: Map<string, ComputedActivity>;
    dispatchOperation(
        operation: Operation,
        origin?: OperationOrigin,
    ): { ok: true } | { cycle: string[]; ok: false };
    graph: ScheduleGraph;
    lastOperationOrigin: OperationOrigin | null;
    loadGraph(graph: ScheduleGraph): void;
    reconcileGlobalPass(graph: ScheduleGraph, operation: Operation, dispatchToken: number): void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
    collapsed: new Set<string>(),
    computed: new Map<string, ComputedActivity>(),
    dispatchOperation(
        operation: Operation,
        origin?: OperationOrigin,
    ): { ok: true } | { cycle: string[]; ok: false } {
        if (operation.kind === "toggleCollapse") {
            set((state) => ({
                collapsed: toggleMembership(state.collapsed, operation.rowId),
                lastOperationOrigin: origin ?? null,
            }));
            return { ok: true };
        }

        const changedActivityIds = selectChangedActivityIds(get().graph, operation);
        const graph = applyOperationToGraph(get().graph, operation);

        if (operation.kind === "addDependency") {
            const cycle = detectCycle(graph);
            if (cycle !== null) {
                return { cycle, ok: false };
            }
        }

        // Phase 1 (synchronous, main thread): recompute only the downstream cone's
        // early dates and merge them at once so the edit is visible before the worker
        // responds. Float and the critical flag stay stale on the cone for a beat.
        const earlyDelta = computeConeEarlyDates(
            selectLeafActivities(graph),
            changedActivityIds,
            get().computed,
        );
        set({
            computed: mergeComputedDelta(get().computed, earlyDelta),
            graph,
            lastOperationOrigin: origin ?? null,
        });

        // Phase 2 (asynchronous worker, or synchronous fallback): the authoritative
        // global pass that corrects float and the critical flag across the whole
        // schedule, including activities outside the cone. The token orders worker
        // responses so a slow, stale delta cannot overwrite a newer authoritative state.
        get().reconcileGlobalPass(graph, operation, nextDispatchToken());
        return { ok: true };
    },
    graph: { activities: [], dependencies: [] },
    lastOperationOrigin: null,
    loadGraph(graph: ScheduleGraph): void {
        const { computed } = handleWorkerMessage({ graph, kind: "full" }, new Map());
        set({ collapsed: new Set<string>(), computed, graph, lastOperationOrigin: null });
    },
    reconcileGlobalPass(graph: ScheduleGraph, operation: Operation, dispatchToken: number): void {
        const worker = getCpmWorker();
        if (worker === null) {
            const { delta } = handleWorkerMessage(
                { graph, kind: "operation", operation },
                get().computed,
            );
            // Clear the origin alongside the authoritative phase-2 merge so the Gantt
            // subscription applies this set: it skips only the optimistic phase-1
            // gantt-origin update, which DHTMLX already shows on the dragged bar.
            // Programmatic gantt.updateTask inside batchUpdate does not re-fire
            // onAfterTaskDrag, so reapplying cannot echo back as a new operation.
            set({ computed: mergeComputedDelta(get().computed, delta), lastOperationOrigin: null });
            return;
        }

        worker.onmessage = (event: MessageEvent<ComputedActivity[]>): void => {
            // Drop a stale delta: a newer dispatch already advanced the token, so this
            // late worker response must not overwrite the newer authoritative state.
            if (dispatchToken < latestDispatchToken) {
                return;
            }
            // Clear the origin with the authoritative phase-2 merge so the Gantt
            // subscription reflows downstream successors and critical coloring; see the
            // synchronous-fallback note above for why this cannot create an echo loop.
            set((state) => ({
                computed: mergeComputedDelta(state.computed, event.data),
                lastOperationOrigin: null,
            }));
        };
        const request: CpmWorkerRequest = {
            graph,
            operation,
            previousComputed: [...get().computed.entries()],
        };
        worker.postMessage(request);
    },
}));

let cpmWorker: Worker | null = null;
let latestDispatchToken = 0;
let isWorkerInitialized = false;

function applyOperationToGraph(graph: ScheduleGraph, operation: Operation): ScheduleGraph {
    switch (operation.kind) {
        case "addDependency":
            return {
                activities: graph.activities,
                dependencies: [...graph.dependencies, operation.edge],
            };
        case "removeDependency":
            return {
                activities: graph.activities,
                dependencies: graph.dependencies.filter((edge) => edge.id !== operation.edgeId),
            };
        case "resizeActivity":
            return {
                activities: graph.activities.map((activity) =>
                    activity.id === operation.activityId
                        ? { ...activity, durationDays: operation.durationDays }
                        : activity,
                ),
                dependencies: graph.dependencies,
            };
        case "toggleCollapse":
            return graph;
    }
}

function getCpmWorker(): Worker | null {
    if (!isWorkerInitialized) {
        cpmWorker = createCpmWorker();
        isWorkerInitialized = true;
    }
    return cpmWorker;
}

function nextDispatchToken(): number {
    latestDispatchToken += 1;
    return latestDispatchToken;
}

function mergeComputedDelta(
    computed: Map<string, ComputedActivity>,
    delta: ComputedActivity[],
): Map<string, ComputedActivity> {
    const nextComputed = new Map(computed);
    for (const entry of delta) {
        nextComputed.set(entry.id, entry);
    }
    return nextComputed;
}

function selectChangedActivityIds(graph: ScheduleGraph, operation: Operation): string[] {
    switch (operation.kind) {
        case "addDependency":
            return [operation.edge.successorId];
        case "removeDependency": {
            const removedDependency = graph.dependencies.find(
                (edge) => edge.id === operation.edgeId,
            );
            return removedDependency === undefined ? [] : [removedDependency.successorId];
        }
        case "resizeActivity":
            return [operation.activityId];
        case "toggleCollapse":
            return [];
    }
}

function toggleMembership(members: Set<string>, id: string): Set<string> {
    const nextMembers = new Set(members);
    if (nextMembers.has(id)) {
        nextMembers.delete(id);
    } else {
        nextMembers.add(id);
    }
    return nextMembers;
}
