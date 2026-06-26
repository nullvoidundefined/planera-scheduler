import { describe, expect, test } from "vitest";

import { resolveCriticalTaskClass } from "../../../components/GanttView/resolveCriticalTaskClass";
import type { ComputedActivity } from "../../../types/schedule";

function computed(isCritical: boolean): ComputedActivity {
    return {
        earlyFinish: 1,
        earlyStart: 0,
        id: "a",
        isCritical,
        lateFinish: 1,
        lateStart: 0,
        totalFloat: 0,
    };
}

describe("resolveCriticalTaskClass", () => {
    test("returns critical for a critical activity", () => {
        expect(resolveCriticalTaskClass(computed(true))).toBe("critical");
    });

    test("returns an empty class for a non-critical or unknown activity", () => {
        expect(resolveCriticalTaskClass(computed(false))).toBe("");
        expect(resolveCriticalTaskClass(undefined)).toBe("");
    });
});
