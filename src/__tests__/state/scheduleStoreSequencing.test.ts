import { beforeEach, describe, expect, test, vi } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../../types/schedule";

type WorkerHandler = (event: MessageEvent<ComputedActivity[]>) => void;

const STALE_EARLY_FINISH = 999;

// A fake worker whose onmessage handler the store assigns on each dispatch. Capturing
// the handler after each dispatch lets us replay worker responses out of order and
// prove the monotonic dispatch token drops a stale (older-token) delta.
const fakeWorker = {
    onmessage: null as WorkerHandler | null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
};

vi.mock("../../workers/createCpmWorker", () => ({
    createCpmWorker: (): typeof fakeWorker => fakeWorker,
}));

function task(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: id };
}

function edge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        task("a", 5),
        task("b", 3),
    ],
    dependencies: [edge("e1", "a", "b")],
};

describe("useScheduleStore worker delta sequencing", () => {
    beforeEach(() => {
        fakeWorker.onmessage = null;
        useScheduleStore.getState().loadGraph(structuredClone(GRAPH));
    });

    test("ignores a stale worker delta whose token predates a newer dispatch", () => {
        // Dispatch one: the store wires the first worker handler (token 1).
        useScheduleStore.getState().dispatchOperation(
            { activityId: "a", durationDays: 8, kind: "resizeActivity" },
            "table",
        );
        const staleHandler = fakeWorker.onmessage;
        expect(staleHandler).not.toBeNull();

        // Dispatch two: a newer operation advances the token to 2 and rewires onmessage.
        useScheduleStore.getState().dispatchOperation(
            { activityId: "a", durationDays: 6, kind: "resizeActivity" },
            "table",
        );
        const freshHandler = fakeWorker.onmessage;
        expect(freshHandler).not.toBeNull();

        const computedB = useScheduleStore.getState().computed.get("b");
        expect(computedB).toBeDefined();
        const freshDelta: ComputedActivity[] = [{ ...computedB!, earlyFinish: 6 + 6 }];
        const staleDelta: ComputedActivity[] = [{ ...computedB!, earlyFinish: STALE_EARLY_FINISH }];

        // The fresh (token 2) response merges; the late stale (token 1) response is dropped.
        freshHandler!({ data: freshDelta } as MessageEvent<ComputedActivity[]>);
        staleHandler!({ data: staleDelta } as MessageEvent<ComputedActivity[]>);

        expect(useScheduleStore.getState().computed.get("b")?.earlyFinish).toBe(12);
        expect(useScheduleStore.getState().computed.get("b")?.earlyFinish).not.toBe(
            STALE_EARLY_FINISH,
        );
    });
});
