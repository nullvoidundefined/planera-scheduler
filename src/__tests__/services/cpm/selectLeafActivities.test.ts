import { describe, expect, test } from "vitest";

import { selectLeafActivities } from "../../../services/cpm/selectLeafActivities";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";

function leaf(id: string, parentId: string | null): Activity {
    return { durationDays: 1, id, name: id, parentId, type: "task", wbs: "1" };
}

function group(id: string, parentId: string | null): Activity {
    return { durationDays: 0, id, name: id, parentId, type: "group", wbs: "1" };
}

const EDGE: Dependency = { id: "e1", lagDays: 0, predecessorId: "t1", successorId: "t2", type: "FS" };

const GRAPH: ScheduleGraph = {
    activities: [group("p", null), group("ph", "p"), leaf("t1", "ph"), leaf("t2", "ph")],
    dependencies: [EDGE],
};

describe("selectLeafActivities", () => {
    test("keeps only non-group activities and preserves the edge list", () => {
        const result = selectLeafActivities(GRAPH);
        expect(result.activities.map((activity) => activity.id)).toEqual(["t1", "t2"]);
        expect(result.dependencies).toEqual([EDGE]);
    });

    test("includes milestone activities as leaves", () => {
        const milestone: Activity = {
            durationDays: 0,
            id: "m1",
            name: "m1",
            parentId: "ph",
            type: "milestone",
            wbs: "1",
        };
        const result = selectLeafActivities({ activities: [group("p", null), milestone], dependencies: [] });
        expect(result.activities.map((activity) => activity.id)).toEqual(["m1"]);
    });
});
