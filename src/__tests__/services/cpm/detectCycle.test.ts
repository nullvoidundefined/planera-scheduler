import { describe, expect, test } from "vitest";
import { detectCycle } from "../../../services/cpm/detectCycle";
import type { Activity, ScheduleGraph } from "../../../types/schedule";

function makeActivity(id: string): Activity {
    return { durationDays: 5, id, name: id, parentId: null, type: "task", wbs: "1" };
}

describe("detectCycle", () => {
    test("returns null for a linear chain A->B->C", () => {
        const graph: ScheduleGraph = {
            activities: [makeActivity("A"), makeActivity("B"), makeActivity("C")],
            dependencies: [
                { id: "A->B", lagDays: 0, predecessorId: "A", successorId: "B", type: "FS" },
                { id: "B->C", lagDays: 0, predecessorId: "B", successorId: "C", type: "FS" },
            ],
        };
        expect(detectCycle(graph)).toBeNull();
    });

    test("returns a non-null array containing cycle ids for A->B->C->A", () => {
        const graph: ScheduleGraph = {
            activities: [makeActivity("A"), makeActivity("B"), makeActivity("C")],
            dependencies: [
                { id: "A->B", lagDays: 0, predecessorId: "A", successorId: "B", type: "FS" },
                { id: "B->C", lagDays: 0, predecessorId: "B", successorId: "C", type: "FS" },
                { id: "C->A", lagDays: 0, predecessorId: "C", successorId: "A", type: "FS" },
            ],
        };
        const result = detectCycle(graph);
        expect(result).not.toBeNull();
        expect(Array.isArray(result)).toBe(true);
        // The cycle path must contain exactly A, B, and C: no more, no less
        expect(result).toEqual(expect.arrayContaining(["A", "B", "C"]));
        expect(result).toHaveLength(3);
    });

    test("returns null for an acyclic diamond A->B, A->C, B->D, C->D", () => {
        // Diamond (parallel convergence) is the dominant shape in real CPM schedules.
        // Two paths from A converge on D; this must not be treated as a cycle.
        const graph: ScheduleGraph = {
            activities: [
                makeActivity("A"),
                makeActivity("B"),
                makeActivity("C"),
                makeActivity("D"),
            ],
            dependencies: [
                { id: "A->B", lagDays: 0, predecessorId: "A", successorId: "B", type: "FS" },
                { id: "A->C", lagDays: 0, predecessorId: "A", successorId: "C", type: "FS" },
                { id: "B->D", lagDays: 0, predecessorId: "B", successorId: "D", type: "FS" },
                { id: "C->D", lagDays: 0, predecessorId: "C", successorId: "D", type: "FS" },
            ],
        };
        expect(detectCycle(graph)).toBeNull();
    });

    test("returns null for an empty graph", () => {
        const graph: ScheduleGraph = {
            activities: [],
            dependencies: [],
        };
        expect(detectCycle(graph)).toBeNull();
    });
});
