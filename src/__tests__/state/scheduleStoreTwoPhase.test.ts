import { beforeEach, describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../../types/schedule";

function task(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: id };
}

function edge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

// Two paths from S to E: S->A(4)->C(5)->E (the critical chain, length 9) and
// S->B(2)->D(3)->E (float 4). Resizing B to 8 makes B->D->E critical (length 11)
// and corrects A and C, which sit OUTSIDE B's downstream cone.
const FLOAT_GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        task("S", 0),
        task("A", 4),
        task("B", 2),
        task("C", 5),
        task("D", 3),
        task("E", 0),
    ],
    dependencies: [
        edge("S->A", "S", "A"),
        edge("S->B", "S", "B"),
        edge("A->C", "A", "C"),
        edge("B->D", "B", "D"),
        edge("C->E", "C", "E"),
        edge("D->E", "D", "E"),
    ],
};

describe("useScheduleStore two-phase recompute", () => {
    beforeEach(() => {
        useScheduleStore.getState().loadGraph(structuredClone(FLOAT_GRAPH));
    });

    test("phase 1 updates the cone's early dates before phase 2 corrects global float and critical", () => {
        const snapshots: Map<string, ComputedActivity>[] = [];
        const unsubscribe = useScheduleStore.subscribe((state, previous) => {
            if (state.computed !== previous.computed) {
                snapshots.push(state.computed);
            }
        });

        useScheduleStore.getState().dispatchOperation({
            activityId: "B",
            durationDays: 8,
            kind: "resizeActivity",
        });
        unsubscribe();

        // Phase 1 then phase 2 each merge once, so two distinct snapshots land.
        expect(snapshots.length).toBeGreaterThanOrEqual(2);

        // Phase 1 (first snapshot): the downstream cone of B (B, D, E) has fresh EARLY
        // dates, but global critical/float are still the pre-edit values. B is not yet
        // flagged critical and A (outside the cone) still carries its pre-edit flag.
        const afterPhaseOne = snapshots[0];
        expect(afterPhaseOne.get("B")?.earlyFinish).toBe(8);
        expect(afterPhaseOne.get("D")?.earlyStart).toBe(8);
        expect(afterPhaseOne.get("E")?.earlyStart).toBe(11);
        expect(afterPhaseOne.get("B")?.isCritical).toBe(false);
        expect(afterPhaseOne.get("A")?.isCritical).toBe(true);

        // Phase 2 (last snapshot): the authoritative global pass corrects critical and
        // float across the whole schedule, including out-of-cone A and C.
        const afterPhaseTwo = snapshots[snapshots.length - 1];
        expect(afterPhaseTwo.get("B")?.isCritical).toBe(true);
        expect(afterPhaseTwo.get("D")?.isCritical).toBe(true);
        expect(afterPhaseTwo.get("A")?.isCritical).toBe(false);
        expect(afterPhaseTwo.get("A")?.totalFloat).toBe(2);
        expect(afterPhaseTwo.get("C")?.totalFloat).toBe(2);
    });
});
