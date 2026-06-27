import { describe, expect, test } from "vitest";

import { AREAS } from "../../constants/activityNaming";
import { buildActivityName } from "../../services/buildActivityName";

describe("buildActivityName", () => {
    test("uses the correct area for lane index 0", () => {
        const name = buildActivityName("Site Preparation", "Execution", 0, 0);
        expect(name).toContain(AREAS[0]);
    });

    test("wraps area selection by AREAS.length", () => {
        const name = buildActivityName("Site Preparation", "Planning", AREAS.length, 0);
        expect(name).toContain(AREAS[0]);
    });

    test("returns task and area without section qualifier when cycle is 0", () => {
        const name = buildActivityName("Structural Works", "Execution", 1, 0);
        expect(name).toBe("Excavate footings, Parking Structure");
    });

    test("appends Sec. 2 when positionInLane cycles past the task list once", () => {
        // "Structural Works" Execution has 12 tasks; positionInLane 12 wraps to index 0 again
        const name = buildActivityName("Structural Works", "Execution", 0, 12);
        expect(name).toBe("Excavate footings, Laboratory Wing (Sec. 2)");
    });

    test("appends Sec. 3 for the second cycle wrap", () => {
        // "Finishing Works" Execution has 10 tasks; positionInLane 20 is index 0, cycle 2
        const name = buildActivityName("Finishing Works", "Execution", 2, 20);
        expect(name).toBe("Frame partitions, Central Lobby (Sec. 3)");
    });

    test("uses PHASE_TASKS for Planning phase", () => {
        const name = buildActivityName("MEP Installation", "Planning", 0, 0);
        expect(name).toBe("Site survey, Laboratory Wing");
    });

    test("uses PHASE_TASKS for Closeout phase", () => {
        const name = buildActivityName("Finishing Works", "Closeout", 3, 0);
        expect(name).toBe("Develop punch list, East Tower");
    });

    test("is a pure function: same inputs always produce the same output", () => {
        const first = buildActivityName("MEP Installation", "Inspection", 5, 3);
        const second = buildActivityName("MEP Installation", "Inspection", 5, 3);
        expect(first).toBe(second);
    });
});
