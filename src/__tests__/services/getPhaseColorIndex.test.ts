import { describe, expect, test } from "vitest";

import { PHASE_PALETTE_SIZE } from "../../constants/phasePaletteSize";
import { getPhaseColorIndex } from "../../services/getPhaseColorIndex";
import type { Activity } from "../../types/schedule";

function buildActivity(overrides: Partial<Activity> & Pick<Activity, "id">): Activity {
    return {
        durationDays: 0,
        name: overrides.id,
        parentId: "P1",
        type: "group",
        wbs: "1",
        ...overrides,
    };
}

function buildPhases(count: number): Activity[] {
    return Array.from({ length: count }, (_, index) =>
        buildActivity({ id: `G${index + 1}`, parentId: "P1" }),
    );
}

describe("getPhaseColorIndex", () => {
    test("assigns sequential color indices to phases in schedule order", () => {
        const phaseColorIndex = getPhaseColorIndex(buildPhases(3));

        expect(phaseColorIndex.get("G1")).toBe(0);
        expect(phaseColorIndex.get("G2")).toBe(1);
        expect(phaseColorIndex.get("G3")).toBe(2);
    });

    test("cycles the palette after PHASE_PALETTE_SIZE phases", () => {
        const phaseColorIndex = getPhaseColorIndex(buildPhases(PHASE_PALETTE_SIZE + 2));

        expect(phaseColorIndex.get(`G${PHASE_PALETTE_SIZE}`)).toBe(PHASE_PALETTE_SIZE - 1);
        expect(phaseColorIndex.get(`G${PHASE_PALETTE_SIZE + 1}`)).toBe(0);
        expect(phaseColorIndex.get(`G${PHASE_PALETTE_SIZE + 2}`)).toBe(1);
    });

    test("indexes phases only, ignoring leaf activities and top-level projects", () => {
        const activities: Activity[] = [
            buildActivity({ id: "P1", parentId: null, type: "group" }),
            buildActivity({ id: "G1", parentId: "P1", type: "group" }),
            buildActivity({ id: "A1", parentId: "G1", type: "task" }),
            buildActivity({ id: "M1", parentId: "G1", type: "milestone" }),
            buildActivity({ id: "G2", parentId: "P1", type: "group" }),
        ];

        const phaseColorIndex = getPhaseColorIndex(activities);

        expect(phaseColorIndex.has("P1")).toBe(false);
        expect(phaseColorIndex.has("A1")).toBe(false);
        expect(phaseColorIndex.has("M1")).toBe(false);
        expect(phaseColorIndex.get("G1")).toBe(0);
        expect(phaseColorIndex.get("G2")).toBe(1);
        expect(phaseColorIndex.size).toBe(2);
    });

    test("returns an empty map for empty input", () => {
        expect(getPhaseColorIndex([]).size).toBe(0);
    });
});
