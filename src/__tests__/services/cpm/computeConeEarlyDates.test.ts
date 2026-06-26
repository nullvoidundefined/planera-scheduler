import { describe, expect, test } from "vitest";

import { computeConeEarlyDates } from "../../../services/cpm/computeConeEarlyDates";
import { computeSchedule } from "../../../services/cpm/computeSchedule";
import { selectLeafActivities } from "../../../services/cpm/selectLeafActivities";
import { generateSchedule } from "../../../services/generateSchedule";
import type { ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function fullCompute(graph: ScheduleGraph): Map<string, ComputedActivity> {
    const result = computeSchedule(selectLeafActivities(graph));
    if (!result.ok) {
        throw new Error("fixture unexpectedly cyclic");
    }
    return result.activities;
}

function stale(
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

describe("computeConeEarlyDates", () => {
    test("phase-1 early dates match a full computeSchedule for every cone member", () => {
        const graph = generateSchedule({ activityCount: 120, seed: 4 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const previousComputed = fullCompute(graph);

        const target = leaves[10];
        target.durationDays += 7;

        const coneDelta = computeConeEarlyDates(
            selectLeafActivities(graph),
            [target.id],
            previousComputed,
        );
        const authoritative = fullCompute(graph);

        expect(coneDelta.length).toBeGreaterThan(0);
        for (const entry of coneDelta) {
            expect(entry.earlyStart).toBe(authoritative.get(entry.id)?.earlyStart);
            expect(entry.earlyFinish).toBe(authoritative.get(entry.id)?.earlyFinish);
        }
    });

    test("a predecessor outside the cone is read from previousComputed, not recomputed", () => {
        // a -> b -> c, all leaves. Changing b cones to {b, c}; a is upstream and outside.
        const graph: ScheduleGraph = {
            activities: [
                { durationDays: 5, id: "a", name: "a", parentId: "ph", type: "task", wbs: "1" },
                { durationDays: 4, id: "b", name: "b", parentId: "ph", type: "task", wbs: "2" },
                { durationDays: 2, id: "c", name: "c", parentId: "ph", type: "task", wbs: "3" },
            ],
            dependencies: [
                { id: "a->b", lagDays: 0, predecessorId: "a", successorId: "b", type: "FS" },
                { id: "b->c", lagDays: 0, predecessorId: "b", successorId: "c", type: "FS" },
            ],
        };

        // Tamper a's cached early finish to a sentinel so the assertion proves the cone
        // reads it verbatim from previousComputed instead of recomputing activity "a".
        const previousComputed = new Map<string, ComputedActivity>([
            ["a", stale("a", 0, 100, 0, 100, false)],
            ["b", stale("b", 5, 8, 5, 8, true)],
            ["c", stale("c", 8, 10, 8, 10, false)],
        ]);

        const coneDelta = computeConeEarlyDates(graph, ["b"], previousComputed);
        const byId = new Map(coneDelta.map((entry) => [entry.id, entry]));

        expect(byId.has("a")).toBe(false);
        expect(byId.get("b")?.earlyStart).toBe(100);
        expect(byId.get("b")?.earlyFinish).toBe(104);
        expect(byId.get("c")?.earlyStart).toBe(104);
        // Stale late/float/critical are carried verbatim for phase 2 to correct.
        expect(byId.get("b")?.lateStart).toBe(5);
        expect(byId.get("b")?.isCritical).toBe(true);
    });
});
