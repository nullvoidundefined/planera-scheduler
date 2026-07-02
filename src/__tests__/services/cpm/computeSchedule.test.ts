import { describe, expect, test } from "vitest";

import { computeSchedule } from "../../../services/cpm/computeSchedule";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";
import { ACYCLIC_FIXTURES, CYCLIC } from "../../../__fixtures__/cpmNetworks";

function buildTask(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: "1" };
}

function buildEdge(predecessorId: string, successorId: string): Dependency {
    return {
        id: `${predecessorId}->${successorId}`,
        lagDays: 0,
        predecessorId,
        successorId,
        type: "FS",
    };
}

// Start -> {A(4), B(2)} -> ... two chains to End.
//   critical chain: Start(0) -> A(4) -> C(5) -> End(0)  length 9
//   slack   chain: Start(0) -> B(2) -> D(3) -> End(0)  length 5, total float 4
const CRITICAL_PATH_GRAPH: ScheduleGraph = {
    activities: [
        {
            durationDays: 0,
            id: "Start",
            name: "Start",
            parentId: "ph",
            type: "milestone",
            wbs: "1",
        },
        buildTask("A", 4),
        buildTask("B", 2),
        buildTask("C", 5),
        buildTask("D", 3),
        { durationDays: 0, id: "End", name: "End", parentId: "ph", type: "milestone", wbs: "1" },
    ],
    dependencies: [
        buildEdge("Start", "A"),
        buildEdge("Start", "B"),
        buildEdge("A", "C"),
        buildEdge("B", "D"),
        buildEdge("C", "End"),
        buildEdge("D", "End"),
    ],
};

describe("computeSchedule", () => {
    test.each(ACYCLIC_FIXTURES)("computes $name correctly", (fixture) => {
        const result = computeSchedule(fixture.graph);
        expect(result.ok).toBe(true);
        if (result.ok) {
            for (const [id, expected] of Object.entries(fixture.expected)) {
                expect(result.activities.get(id)).toEqual(expected);
            }
            expect(result.activities.size).toBe(Object.keys(fixture.expected).length);
        }
    });

    test("returns an invalid-schedule result with a non-empty cycle on a cyclic graph", () => {
        const result = computeSchedule(CYCLIC.graph);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.cycle.length).toBeGreaterThan(0);
            expect(result.cycle).toEqual(expect.arrayContaining(["A", "B", "C"]));
            expect(result.cycle).toHaveLength(3);
        }
    });
});

describe("computeSchedule critical path", () => {
    test("the longest chain Start->A->C->End is critical and the slack chain is not", () => {
        const result = computeSchedule(CRITICAL_PATH_GRAPH);
        expect(result.ok).toBe(true);
        if (!result.ok) {
            return;
        }
        const criticalIds = [...result.activities.values()]
            .filter((activity) => activity.isCritical)
            .map((activity) => activity.id)
            .sort();
        expect(criticalIds).toEqual(["A", "C", "End", "Start"]);
        expect(result.activities.get("B")?.totalFloat).toBe(4);
        expect(result.activities.get("D")?.totalFloat).toBe(4);
        expect(result.activities.get("End")?.earlyFinish).toBe(9);
    });
});
