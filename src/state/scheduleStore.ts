/**
 * Zustand store holding the single source of truth: the raw schedule graph
 * (stored inputs only), the computed cache (engine outputs, never persisted),
 * and the shared collapse set. dispatchOperation applies the operation to the raw
 * graph, runs the cycle gate for addDependency (rejecting without mutation if a
 * cycle would be introduced), then runs the authoritative full pass via
 * handleWorkerMessage and merges its delta to update float and the critical path.
 * Task 11 routes the full pass through the web worker with this synchronous call
 * as the worker-unavailable fallback.
 */
import { create } from "zustand";

import { detectCycle } from "../services/cpm/detectCycle";
import { handleWorkerMessage } from "../workers/handleWorkerMessage";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

interface ScheduleState {
    collapsed: Set<string>;
    computed: Map<string, ComputedActivity>;
    dispatchOperation(operation: Operation): { ok: true } | { cycle: string[]; ok: false };
    graph: ScheduleGraph;
    loadGraph(graph: ScheduleGraph): void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
    collapsed: new Set<string>(),
    computed: new Map<string, ComputedActivity>(),
    dispatchOperation(operation: Operation): { ok: true } | { cycle: string[]; ok: false } {
        if (operation.kind === "toggleCollapse") {
            set((state) => ({ collapsed: toggleMembership(state.collapsed, operation.rowId) }));
            return { ok: true };
        }

        const graph = applyOperationToGraph(get().graph, operation);

        if (operation.kind === "addDependency") {
            const cycle = detectCycle(graph);
            if (cycle !== null) {
                return { cycle, ok: false };
            }
        }

        const { computed, delta } = handleWorkerMessage(
            { graph, kind: "operation", operation },
            get().computed,
        );
        set({ computed: mergeComputedDelta(computed, delta), graph });
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

function toggleMembership(members: Set<string>, id: string): Set<string> {
    const next = new Set(members);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    return next;
}
