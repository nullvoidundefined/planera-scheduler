import { beforeEach, describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, Dependency, ScheduleGraph } from "../../types/schedule";

function buildTask(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: id };
}

function buildEdge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

// a -> b -> c chain; adding c -> a would close a cycle.
const GRAPH: ScheduleGraph = {
    activities: [buildTask("a", 2), buildTask("b", 2), buildTask("c", 2)],
    dependencies: [buildEdge("e1", "a", "b"), buildEdge("e2", "b", "c")],
};

describe("useScheduleStore cycle rejection", () => {
    beforeEach(() => {
        useScheduleStore.getState().loadGraph(structuredClone(GRAPH));
    });

    test("rejects a cycle-creating addDependency without mutating the graph", () => {
        const result = useScheduleStore.getState().dispatchOperation({
            edge: buildEdge("e3", "c", "a"),
            kind: "addDependency",
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.cycle.length).toBeGreaterThan(0);
        }
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(2);
    });

    test("leaves the computed cache untouched after a rejected edge", () => {
        const before = useScheduleStore.getState().computed.get("c")?.earlyStart;
        useScheduleStore
            .getState()
            .dispatchOperation({ edge: buildEdge("e3", "c", "a"), kind: "addDependency" });
        expect(useScheduleStore.getState().computed.get("c")?.earlyStart).toBe(before);
    });

    test("still accepts a valid addDependency", () => {
        const result = useScheduleStore.getState().dispatchOperation({
            edge: buildEdge("e4", "a", "c"),
            kind: "addDependency",
        });
        expect(result.ok).toBe(true);
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(3);
    });
});
