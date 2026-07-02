import { describe, expect, test } from "vitest";

import { computeDownstreamCone } from "../../../services/cpm/computeDownstreamCone";
import { computeSchedule } from "../../../services/cpm/computeSchedule";
import { selectLeafActivities } from "../../../services/cpm/selectLeafActivities";
import { generateSchedule } from "../../../services/generateSchedule";
import type { ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function computeFullSchedule(graph: ScheduleGraph): Map<string, ComputedActivity> {
    const result = computeSchedule(selectLeafActivities(graph));
    if (!result.ok) {
        throw new Error("fixture unexpectedly cyclic");
    }
    return result.activities;
}

function makePrng(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let z = Math.imul(state ^ (state >>> 15), 1 | state);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) | 0;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

describe("computeDownstreamCone", () => {
    test("the delta merged into the previous cache equals a full recompute", () => {
        const graph = generateSchedule({ activityCount: 120, seed: 4 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        let cache = computeFullSchedule(graph);
        const rand = makePrng(99);

        for (let step = 0; step < 40; step++) {
            const target = leaves[Math.floor(rand() * leaves.length)];
            target.durationDays = 1 + Math.floor(rand() * 15);

            const { computed, delta } = computeDownstreamCone(selectLeafActivities(graph), cache);
            const merged = new Map(cache);
            for (const entry of delta) {
                merged.set(entry.id, entry);
            }

            expect(merged).toEqual(computed);
            expect(merged).toEqual(computeFullSchedule(graph));
            cache = merged;
        }
    });

    test("delta is empty when nothing changed", () => {
        const graph = generateSchedule({ activityCount: 60, seed: 2 });
        const cache = computeFullSchedule(graph);
        const { delta } = computeDownstreamCone(selectLeafActivities(graph), cache);
        expect(delta).toEqual([]);
    });
});
