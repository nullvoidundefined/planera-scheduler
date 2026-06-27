import { describe, expect, test } from "vitest";

import { computeSchedule } from "../../../services/cpm/computeSchedule";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";

function task(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: "1" };
}

function edge(predecessorId: string, successorId: string): Dependency {
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
const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "Start", name: "Start", parentId: "ph", type: "milestone", wbs: "1" },
        task("A", 4),
        task("B", 2),
        task("C", 5),
        task("D", 3),
        { durationDays: 0, id: "End", name: "End", parentId: "ph", type: "milestone", wbs: "1" },
    ],
    dependencies: [
        edge("Start", "A"),
        edge("Start", "B"),
        edge("A", "C"),
        edge("B", "D"),
        edge("C", "End"),
        edge("D", "End"),
    ],
};

describe("computeSchedule critical path", () => {
    test("the longest chain Start->A->C->End is critical and the slack chain is not", () => {
        const result = computeSchedule(GRAPH);
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
