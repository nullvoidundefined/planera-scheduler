import { beforeEach, describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, Dependency, ScheduleGraph } from "../../types/schedule";

function buildTask(id: string, durationDays: number, parentId: string): Activity {
    return { durationDays, id, name: id, parentId, type: "task", wbs: id };
}

function buildEdge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        buildTask("a", 5, "ph"),
        buildTask("b", 3, "ph"),
    ],
    dependencies: [buildEdge("e1", "a", "b")],
};

const FLOAT_GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        buildTask("S", 0, "ph"),
        buildTask("A", 4, "ph"),
        buildTask("B", 2, "ph"),
        buildTask("C", 5, "ph"),
        buildTask("D", 3, "ph"),
        buildTask("E", 0, "ph"),
    ],
    dependencies: [
        buildEdge("S->A", "S", "A"),
        buildEdge("S->B", "S", "B"),
        buildEdge("A->C", "A", "C"),
        buildEdge("B->D", "B", "D"),
        buildEdge("C->E", "C", "E"),
        buildEdge("D->E", "D", "E"),
    ],
};

describe("useScheduleStore", () => {
    beforeEach(() => {
        useScheduleStore.getState().loadGraph(structuredClone(GRAPH));
    });

    test("loadGraph computes the full schedule into the cache", () => {
        const { computed } = useScheduleStore.getState();
        expect(computed.get("a")?.earlyStart).toBe(0);
        expect(computed.get("b")?.earlyStart).toBe(5);
    });

    test("resizeActivity updates the duration and shifts the downstream successor", () => {
        useScheduleStore.getState().dispatchOperation({
            activityId: "a",
            durationDays: 8,
            kind: "resizeActivity",
        });
        const { computed, graph } = useScheduleStore.getState();
        expect(graph.activities.find((activity) => activity.id === "a")?.durationDays).toBe(8);
        expect(computed.get("b")?.earlyStart).toBe(8);
    });

    test("addDependency inserts the edge and recomputes", () => {
        useScheduleStore.getState().loadGraph({
            activities: [buildTask("a", 5, "ph"), buildTask("b", 3, "ph"), buildTask("c", 2, "ph")],
            dependencies: [],
        });
        const result = useScheduleStore.getState().dispatchOperation({
            edge: buildEdge("e9", "b", "c"),
            kind: "addDependency",
        });
        expect(result.ok).toBe(true);
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(1);
        expect(useScheduleStore.getState().computed.get("c")?.earlyStart).toBe(3);
    });

    test("removeDependency drops the edge and recomputes", () => {
        useScheduleStore.getState().dispatchOperation({ edgeId: "e1", kind: "removeDependency" });
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(0);
        expect(useScheduleStore.getState().computed.get("b")?.earlyStart).toBe(0);
    });

    test("toggleCollapse flips collapse membership without recompute", () => {
        useScheduleStore.getState().dispatchOperation({ kind: "toggleCollapse", rowId: "ph" });
        expect(useScheduleStore.getState().collapsed.has("ph")).toBe(true);
        useScheduleStore.getState().dispatchOperation({ kind: "toggleCollapse", rowId: "ph" });
        expect(useScheduleStore.getState().collapsed.has("ph")).toBe(false);
    });

    test("resize settles to an authoritative final cache: fresh early dates plus corrected global float and critical", () => {
        useScheduleStore.getState().loadGraph(structuredClone(FLOAT_GRAPH));

        // Before: S->A(4)->C(5)->E is the critical chain (length 9); S->B(2)->D(3)->E carries float 4.
        expect(useScheduleStore.getState().computed.get("A")?.isCritical).toBe(true);
        expect(useScheduleStore.getState().computed.get("B")?.totalFloat).toBe(4);

        useScheduleStore.getState().dispatchOperation({
            activityId: "B",
            durationDays: 8,
            kind: "resizeActivity",
        });
        const { computed } = useScheduleStore.getState();

        // The net final cache (after both phases settle): the downstream cone of B
        // (B, D, E) carries fresh early dates.
        expect(computed.get("B")?.earlyFinish).toBe(8);
        expect(computed.get("D")?.earlyStart).toBe(8);
        expect(computed.get("E")?.earlyStart).toBe(11);

        // B->D->E is now critical (length 11); A and C sit OUTSIDE B's cone yet their
        // float and critical flag are corrected by the authoritative global pass.
        expect(computed.get("B")?.isCritical).toBe(true);
        expect(computed.get("D")?.isCritical).toBe(true);
        expect(computed.get("A")?.isCritical).toBe(false);
        expect(computed.get("A")?.totalFloat).toBe(2);
        expect(computed.get("C")?.totalFloat).toBe(2);
    });
});
