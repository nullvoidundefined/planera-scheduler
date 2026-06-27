import { describe, expect, test } from "vitest";

import { resolveTableRowClass } from "../../../components/TableView/resolveTableRowClass";
import type { TableRow } from "../../../components/TableView/toTableRows";

function buildRow(overrides: Partial<TableRow> & Pick<TableRow, "id" | "path" | "type">): TableRow {
    return {
        critical: false,
        duration: 1,
        earlyFinish: 1,
        earlyStart: 0,
        name: overrides.id,
        totalFloat: 0,
        wbs: "1",
        ...overrides,
    };
}

describe("resolveTableRowClass", () => {
    const phaseColorIndex = new Map<string, number>([
        ["G1", 5],
        ["G2", 0],
    ]);

    test("a phase group row takes its phase tint class", () => {
        const row = buildRow({ id: "G1", path: ["P1", "G1"], type: "group" });

        expect(resolveTableRowClass(row, phaseColorIndex)).toBe("phase-5");
    });

    test("a top-level project group row is untinted", () => {
        const row = buildRow({ id: "P1", path: ["P1"], type: "group" });

        expect(resolveTableRowClass(row, phaseColorIndex)).toBeUndefined();
    });

    test("a leaf row stays white even though it sits under a phase", () => {
        const row = buildRow({ id: "A1", path: ["P1", "G1", "A1"], type: "task" });

        expect(resolveTableRowClass(row, phaseColorIndex)).toBeUndefined();
    });

    test("a critical leaf row takes only the critical class", () => {
        const row = buildRow({ id: "A1", path: ["P1", "G1", "A1"], type: "task", critical: true });

        expect(resolveTableRowClass(row, phaseColorIndex)).toBe("ag-row-critical");
    });

    test("a critical phase group row composes the phase and critical classes", () => {
        const row = buildRow({ id: "G2", path: ["P1", "G2"], type: "group", critical: true });

        expect(resolveTableRowClass(row, phaseColorIndex)).toBe("phase-0 ag-row-critical");
    });

    test("an undefined row yields no class", () => {
        expect(resolveTableRowClass(undefined, phaseColorIndex)).toBeUndefined();
    });
});
