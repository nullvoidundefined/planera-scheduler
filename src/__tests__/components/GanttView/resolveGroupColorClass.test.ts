import { describe, expect, test } from "vitest";

import { resolveGroupColorClass } from "../../../components/GanttView/resolveGroupColorClass";
import type { GanttTask } from "../../../components/GanttView/types";

function buildTask(
    overrides: Partial<GanttTask> & Pick<GanttTask, "id" | "parent" | "type">,
): GanttTask {
    return {
        duration: 1,
        isCritical: false,
        open: true,
        start_date: new Date(0),
        text: overrides.id,
        totalFloat: 0,
        wbs: "1",
        ...overrides,
    };
}

describe("resolveGroupColorClass", () => {
    const phaseColorIndex = new Map<string, number>([
        ["G1", 3],
        ["G2", 0],
    ]);

    test("a leaf activity takes its parent phase color", () => {
        const task = buildTask({ id: "A1", parent: "G1", type: "task" });

        expect(resolveGroupColorClass(task, phaseColorIndex)).toBe("phase-3");
    });

    test("a phase rollup takes its own phase color as a summary class", () => {
        const task = buildTask({ id: "G1", parent: "P1", type: "project" });

        expect(resolveGroupColorClass(task, phaseColorIndex)).toBe("phase-summary-3");
    });

    test("a top-level project rollup is neutral", () => {
        const task = buildTask({ id: "P1", parent: "0", type: "project" });

        expect(resolveGroupColorClass(task, phaseColorIndex)).toBe("");
    });

    test("a leaf outside any known phase is neutral", () => {
        const task = buildTask({ id: "A9", parent: "UNKNOWN", type: "task" });

        expect(resolveGroupColorClass(task, phaseColorIndex)).toBe("");
    });

    test("the phase class is independent of the critical flag, so the caller can compose both", () => {
        const criticalLeaf = buildTask({ id: "A1", parent: "G2", type: "task", isCritical: true });

        expect(resolveGroupColorClass(criticalLeaf, phaseColorIndex)).toBe("phase-0");
    });
});
