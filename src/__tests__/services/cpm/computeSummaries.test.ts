import { describe, expect, test } from "vitest";

import { computeSummaries } from "../../../services/cpm/computeSummaries";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function group(id: string, parentId: string | null): Activity {
    return { durationDays: 0, id, name: id, parentId, type: "group", wbs: "1" };
}

function leaf(id: string, parentId: string | null): Activity {
    return { durationDays: 1, id, name: id, parentId, type: "task", wbs: "1" };
}

function computed(
    id: string,
    earlyStart: number,
    earlyFinish: number,
    lateStart: number,
    lateFinish: number,
    isCritical: boolean,
): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical,
        lateFinish,
        lateStart,
        totalFloat: lateStart - earlyStart,
    };
}

const GRAPH: ScheduleGraph = {
    activities: [group("p", null), group("ph", "p"), leaf("t1", "ph"), leaf("t2", "ph")],
    dependencies: [],
};

const LEAF_COMPUTED = new Map<string, ComputedActivity>([
    ["t1", computed("t1", 0, 5, 0, 5, true)],
    ["t2", computed("t2", 5, 8, 7, 10, false)],
]);

describe("computeSummaries", () => {
    test("rolls a group up to min-descendant-earlyStart and max-descendant-earlyFinish", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        const phase = summaries.get("ph");
        expect(phase?.earlyStart).toBe(0);
        expect(phase?.earlyFinish).toBe(8);
    });

    test("rolls late bounds to max-descendant-lateFinish and min-descendant-lateStart", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        const phase = summaries.get("ph");
        expect(phase?.lateStart).toBe(0);
        expect(phase?.lateFinish).toBe(10);
    });

    test("marks a group critical when any descendant leaf is critical", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        expect(summaries.get("ph")?.isCritical).toBe(true);
        expect(summaries.get("p")?.isCritical).toBe(true);
    });

    test("nests grandparent rollup over the whole subtree", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        const project = summaries.get("p");
        expect(project?.earlyStart).toBe(0);
        expect(project?.earlyFinish).toBe(8);
    });
});
