import { describe, expect, test } from "vitest";

import { toTableRows } from "../../../components/TableView/toTableRows";
import type { ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function computed(id: string, earlyStart: number, earlyFinish: number, isCritical: boolean): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical,
        lateFinish: earlyFinish,
        lateStart: earlyStart,
        totalFloat: 0,
    };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "p", name: "Project", parentId: null, type: "group", wbs: "1" },
        { durationDays: 0, id: "ph", name: "Phase", parentId: "p", type: "group", wbs: "1.1" },
        { durationDays: 5, id: "a", name: "A", parentId: "ph", type: "task", wbs: "1.1.1" },
    ],
    dependencies: [],
};

const COMPUTED = new Map<string, ComputedActivity>([["a", computed("a", 0, 5, true)]]);

describe("toTableRows", () => {
    test("builds the ancestry path from root to node for tree data", () => {
        const rows = toTableRows(GRAPH, COMPUTED);
        expect(rows.find((row) => row.id === "a")?.path).toEqual(["p", "ph", "a"]);
        expect(rows.find((row) => row.id === "ph")?.path).toEqual(["p", "ph"]);
    });

    test("exposes computed dates, float, and critical flag on leaf rows", () => {
        const leaf = toTableRows(GRAPH, COMPUTED).find((row) => row.id === "a");
        expect(leaf?.earlyStart).toBe(0);
        expect(leaf?.earlyFinish).toBe(5);
        expect(leaf?.critical).toBe(true);
        expect(leaf?.duration).toBe(5);
    });

    test("rolls group rows up from descendant summaries", () => {
        const group = toTableRows(GRAPH, COMPUTED).find((row) => row.id === "ph");
        expect(group?.earlyStart).toBe(0);
        expect(group?.earlyFinish).toBe(5);
        expect(group?.critical).toBe(true);
    });

    test("group duration is the rolled-up span, not the stored zero", () => {
        const rows = toTableRows(GRAPH, COMPUTED);
        // The stored durationDays on both groups is 0; the displayed duration must be
        // the descendant span (finish - start), here 5 working days.
        expect(rows.find((row) => row.id === "p")?.duration).toBe(5);
        expect(rows.find((row) => row.id === "ph")?.duration).toBe(5);
    });
});
