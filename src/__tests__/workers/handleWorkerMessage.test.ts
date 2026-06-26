import { describe, expect, test } from "vitest";

import { generateSchedule } from "../../services/generateSchedule";
import type { ComputedActivity } from "../../types/schedule";
import { handleWorkerMessage } from "../../workers/handleWorkerMessage";

const EMPTY = new Map<string, ComputedActivity>();

describe("handleWorkerMessage", () => {
    test("full returns every leaf computation as both delta and computed", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const leafCount = graph.activities.filter((activity) => activity.type !== "group").length;
        const result = handleWorkerMessage({ graph, kind: "full" }, EMPTY);
        expect(result.delta).toHaveLength(leafCount);
        expect(result.computed.size).toBe(leafCount);
    });

    test("operation resize returns only the changed downstream entries", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const baseline = handleWorkerMessage({ graph, kind: "full" }, EMPTY);
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        // Use a mid-graph target (not the root a0) so that only the downstream
        // cone of the target is in the delta. Choosing leaves[0] (the root) would
        // shift all 50 activities and produce delta === leaves.length, defeating
        // the purpose of this assertion.
        const target = leaves[Math.floor(leaves.length / 2)];
        target.durationDays += 10;

        const result = handleWorkerMessage(
            {
                graph,
                kind: "operation",
                operation: { activityId: target.id, durationDays: target.durationDays, kind: "resizeActivity" },
            },
            baseline.computed,
        );

        expect(result.delta.length).toBeGreaterThan(0);
        expect(result.delta.length).toBeLessThan(leaves.length);
        const merged = new Map(baseline.computed);
        for (const entry of result.delta) {
            merged.set(entry.id, entry);
        }
        expect(merged).toEqual(result.computed);
    });

    test("toggleCollapse recomputes nothing and returns an empty delta", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const baseline = handleWorkerMessage({ graph, kind: "full" }, EMPTY);
        const result = handleWorkerMessage(
            { graph, kind: "operation", operation: { kind: "toggleCollapse", rowId: "p0" } },
            baseline.computed,
        );
        expect(result.delta).toEqual([]);
        expect(result.computed).toBe(baseline.computed);
    });
});
