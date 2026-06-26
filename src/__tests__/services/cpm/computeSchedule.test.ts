import { describe, expect, test } from "vitest";
import { computeSchedule } from "../../../services/cpm/computeSchedule";
import { ACYCLIC_FIXTURES, CYCLIC } from "../../../__fixtures__/cpmNetworks";

describe("computeSchedule", () => {
    test.each(ACYCLIC_FIXTURES)("computes $name correctly", (fixture) => {
        const result = computeSchedule(fixture.graph);
        expect(result.ok).toBe(true);
        if (result.ok) {
            for (const [id, expected] of Object.entries(fixture.expected)) {
                expect(result.activities.get(id)).toEqual(expected);
            }
            expect(result.activities.size).toBe(Object.keys(fixture.expected).length);
        }
    });

    test("returns an invalid-schedule result with a non-empty cycle on a cyclic graph", () => {
        const result = computeSchedule(CYCLIC.graph);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.cycle.length).toBeGreaterThan(0);
            expect(result.cycle).toEqual(expect.arrayContaining(["A", "B", "C"]));
            expect(result.cycle).toHaveLength(3);
        }
    });
});
