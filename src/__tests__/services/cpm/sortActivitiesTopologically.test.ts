import { describe, expect, test } from "vitest";
import { sortActivitiesTopologically } from "../../../services/cpm/sortActivitiesTopologically";
import type { Activity, ScheduleGraph } from "../../../types/schedule";

function makeActivity(id: string): Activity {
    return { durationDays: 5, id, name: id, parentId: null, type: "task", wbs: "1" };
}

describe("sortActivitiesTopologically", () => {
    test("returns A before B before C for a linear chain A->B->C (activities in shuffled order)", () => {
        const graph: ScheduleGraph = {
            // Intentionally shuffled
            activities: [makeActivity("C"), makeActivity("A"), makeActivity("B")],
            dependencies: [
                { id: "A->B", lagDays: 0, predecessorId: "A", successorId: "B", type: "FS" },
                { id: "B->C", lagDays: 0, predecessorId: "B", successorId: "C", type: "FS" },
            ],
        };
        const sorted = sortActivitiesTopologically(graph);
        expect(sorted.map((a) => a.id)).toEqual(["A", "B", "C"]);
    });

    test("includes isolated node and preserves full activity count", () => {
        // An activity with no dependencies must appear in the output; no node may be silently dropped.
        const graph: ScheduleGraph = {
            activities: [makeActivity("A"), makeActivity("B"), makeActivity("ISO")],
            dependencies: [
                { id: "A->B", lagDays: 0, predecessorId: "A", successorId: "B", type: "FS" },
                // ISO has no predecessors and no successors
            ],
        };
        const sorted = sortActivitiesTopologically(graph);
        expect(sorted.length).toBe(graph.activities.length);
        const sortedIds = sorted.map((a) => a.id);
        expect(sortedIds).toContain("ISO");
        // A must still precede B
        expect(sortedIds.indexOf("A")).toBeLessThan(sortedIds.indexOf("B"));
    });

    test("throws for a cyclic graph A->B->C->A", () => {
        const graph: ScheduleGraph = {
            activities: [makeActivity("A"), makeActivity("B"), makeActivity("C")],
            dependencies: [
                { id: "A->B", lagDays: 0, predecessorId: "A", successorId: "B", type: "FS" },
                { id: "B->C", lagDays: 0, predecessorId: "B", successorId: "C", type: "FS" },
                { id: "C->A", lagDays: 0, predecessorId: "C", successorId: "A", type: "FS" },
            ],
        };
        expect(() => sortActivitiesTopologically(graph)).toThrow();
    });
});
