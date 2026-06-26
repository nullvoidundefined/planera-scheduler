/**
 * Zustand store holding the single source of truth: the raw schedule graph
 * (stored inputs only), the computed cache (engine outputs, never persisted),
 * and the shared collapse set. dispatchOperation is two-phase: it applies the
 * operation to the raw graph, then PHASE 1 recomputes the downstream cone's early
 * dates synchronously (computeConeEarlyDates) and merges them at once so the edit
 * feels live, then PHASE 2 runs the authoritative global pass (handleWorkerMessage)
 * and merges its delta to correct float and the critical path. Task 8 adds cycle
 * rejection for addDependency; Task 11 routes phase 2 through the web worker with
 * this synchronous path as the fallback.
 */
import { create } from "zustand";

import { computeConeEarlyDates } from "../services/cpm/computeConeEarlyDates";
import { selectLeafActivities } from "../services/cpm/selectLeafActivities";
import { handleWorkerMessage } from "../workers/handleWorkerMessage";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

interface ScheduleState {
    collapsed: Set<string>;
    computed: Map<string, ComputedActivity>;
    dispatchOperation(operation: Operation): { ok: boolean };
    graph: ScheduleGraph;
    loadGraph(graph: ScheduleGraph): void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
    collapsed: new Set<string>(),
    computed: new Map<string, ComputedActivity>(),
    dispatchOperation(operation: Operation): { ok: boolean } {
        if (operation.kind === "toggleCollapse") {
            set((state) => ({ collapsed: toggleMembership(state.collapsed, operation.rowId) }));
            return { ok: true };
        }

        const changedActivityIds = selectChangedActivityIds(get().graph, operation);
        const graph = applyOperationToGraph(get().graph, operation);

        // Phase 1 (local, immediate, main thread): recompute only the downstream cone's
        // early dates and merge them at once so the edit feels live.
        const earlyDelta = computeConeEarlyDates(
            selectLeafActivities(graph),
            changedActivityIds,
            get().computed,
        );
        set({ computed: mergeComputedDelta(get().computed, earlyDelta), graph });

        // Phase 2 (global, a beat later): the authoritative full pass that corrects float
        // and the critical flag. Task 7 runs it synchronously; Task 11 posts it to the
        // worker and keeps this synchronous call as the worker-unavailable fallback.
        const { delta } = handleWorkerMessage({ graph, kind: "operation", operation }, get().computed);
        set({ computed: mergeComputedDelta(get().computed, delta) });
        return { ok: true };
    },
    graph: { activities: [], dependencies: [] },
    loadGraph(graph: ScheduleGraph): void {
        const { computed } = handleWorkerMessage({ graph, kind: "full" }, new Map());
        set({ collapsed: new Set<string>(), computed, graph });
    },
}));

function applyOperationToGraph(graph: ScheduleGraph, operation: Operation): ScheduleGraph {
    switch (operation.kind) {
        case "addDependency":
            return { activities: graph.activities, dependencies: [...graph.dependencies, operation.edge] };
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

function mergeComputedDelta(
    computed: Map<string, ComputedActivity>,
    delta: ComputedActivity[],
): Map<string, ComputedActivity> {
    const next = new Map(computed);
    for (const entry of delta) {
        next.set(entry.id, entry);
    }
    return next;
}

function selectChangedActivityIds(graph: ScheduleGraph, operation: Operation): string[] {
    switch (operation.kind) {
        case "addDependency":
            return [operation.edge.successorId];
        case "removeDependency": {
            const removed = graph.dependencies.find((edge) => edge.id === operation.edgeId);
            return removed === undefined ? [] : [removed.successorId];
        }
        case "resizeActivity":
            return [operation.activityId];
        case "toggleCollapse":
            return [];
    }
}

function toggleMembership(members: Set<string>, id: string): Set<string> {
    const next = new Set(members);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    return next;
}
