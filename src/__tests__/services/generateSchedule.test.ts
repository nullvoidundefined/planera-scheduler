import { describe, expect, test } from "vitest";

import { AREAS } from "../../constants/activityNaming";
import { LANE_LENGTH } from "../../constants/generator";
import { computeSchedule } from "../../services/cpm/computeSchedule";
import { detectCycle } from "../../services/cpm/detectCycle";
import { selectLeafActivities } from "../../services/cpm/selectLeafActivities";
import { generateSchedule } from "../../services/generateSchedule";
import type { Activity, ScheduleGraph } from "../../types/schedule";

const GROUPS_PER_PROJECT = 5;
// Representative leaf count for the span/critical-fraction assertions: large
// enough that every phase is many lanes deep (so concurrency and a tied critical
// band are exercised) yet fast to schedule.
const REPRESENTATIVE_COUNT = 2000;
const MIN_SPAN_DAYS = 600;
const MAX_SPAN_DAYS = 1500;
const MIN_CRITICAL_FRACTION = 0.1;
const MAX_CRITICAL_FRACTION = 0.35;

function selectLeaves(graph: ScheduleGraph): Activity[] {
    return graph.activities.filter((activity) => activity.type !== "group");
}

function indexOf(activityId: string): number {
    return Number(activityId.slice(1));
}

function computeSpanAndCritical(graph: ScheduleGraph): {
    criticalFraction: number;
    span: number;
    sumDurations: number;
} {
    const leafGraph = selectLeafActivities(graph);
    const result = computeSchedule(leafGraph);
    if (!result.ok) {
        throw new Error("generated graph unexpectedly cyclic");
    }
    let span = 0;
    let criticalCount = 0;
    for (const computed of result.activities.values()) {
        span = Math.max(span, computed.earlyFinish);
        if (computed.isCritical) {
            criticalCount += 1;
        }
    }
    const sumDurations = leafGraph.activities.reduce(
        (total, activity) => total + activity.durationDays,
        0,
    );
    return { criticalFraction: criticalCount / result.activities.size, span, sumDurations };
}

describe("generateSchedule", () => {
    test("is deterministic per seed", () => {
        expect(generateSchedule({ activityCount: 200, seed: 7 })).toEqual(
            generateSchedule({ activityCount: 200, seed: 7 }),
        );
    });

    test("produces different output for different seeds", () => {
        expect(generateSchedule({ activityCount: 200, seed: 7 })).not.toEqual(
            generateSchedule({ activityCount: 200, seed: 8 }),
        );
    });

    test("produces an acyclic graph with the requested leaf count", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 1 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        expect(leaves).toHaveLength(500);
        expect(detectCycle(graph)).toBeNull();
    });

    test("emits project and phase group nodes", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const projects = graph.activities.filter(
            (activity) => activity.type === "group" && activity.parentId === null,
        );
        const phases = graph.activities.filter(
            (activity) => activity.type === "group" && activity.parentId !== null,
        );
        expect(projects.length).toBeGreaterThanOrEqual(1);
        expect(phases.length).toBeGreaterThanOrEqual(GROUPS_PER_PROJECT);
    });

    test("every leaf parentId refers to an existing phase group", () => {
        const graph = generateSchedule({ activityCount: 100, seed: 1 });
        const phaseIds = new Set(
            graph.activities
                .filter((activity) => activity.type === "group" && activity.parentId !== null)
                .map((activity) => activity.id),
        );
        for (const leaf of graph.activities.filter((activity) => activity.type !== "group")) {
            expect(phaseIds.has(leaf.parentId ?? "")).toBe(true);
        }
    });

    test("every phase parentId refers to an existing project group", () => {
        const graph = generateSchedule({ activityCount: 100, seed: 1 });
        const projectIds = new Set(
            graph.activities
                .filter((activity) => activity.type === "group" && activity.parentId === null)
                .map((activity) => activity.id),
        );
        for (const phase of graph.activities.filter(
            (activity) => activity.type === "group" && activity.parentId !== null,
        )) {
            expect(projectIds.has(phase.parentId ?? "")).toBe(true);
        }
    });

    test("assigns leaves to phases in contiguous blocks, not interleaved", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 1 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const seenParents = new Set<string>();
        let previousParent = "";
        for (const leaf of leaves) {
            const parent = leaf.parentId ?? "";
            if (parent !== previousParent) {
                expect(seenParents.has(parent)).toBe(false);
                seenParents.add(parent);
                previousParent = parent;
            }
        }
    });

    test("every dependency is finish-to-start with non-negative lag", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 3 });
        for (const dependency of graph.dependencies) {
            expect(dependency.type).toBe("FS");
            expect(dependency.lagDays).toBeGreaterThanOrEqual(0);
        }
    });

    test("every dependency connects two leaf activities", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 3 });
        const leafIds = new Set(
            graph.activities
                .filter((activity) => activity.type !== "group")
                .map((activity) => activity.id),
        );
        for (const dependency of graph.dependencies) {
            expect(leafIds.has(dependency.predecessorId)).toBe(true);
            expect(leafIds.has(dependency.successorId)).toBe(true);
        }
    });

    test("every dependency points strictly forward", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 3 });
        for (const dependency of graph.dependencies) {
            const predecessorIndex = Number(dependency.predecessorId.slice(1));
            const successorIndex = Number(dependency.successorId.slice(1));
            expect(predecessorIndex).toBeLessThan(successorIndex);
        }
    });

    test("each lane runs a within-lane finish-to-start staircase", () => {
        const graph = generateSchedule({ activityCount: REPRESENTATIVE_COUNT, seed: 3 });
        const leaves = selectLeaves(graph);
        const edgePairs = new Set(
            graph.dependencies.map(
                (dependency) =>
                    `${indexOf(dependency.predecessorId)}->${indexOf(dependency.successorId)}`,
            ),
        );

        // Group leaf indices by phase, in order, so lane boundaries can be derived.
        const phaseRanges = new Map<string, { end: number; start: number }>();
        leaves.forEach((leaf, index) => {
            const parent = leaf.parentId ?? "";
            const range = phaseRanges.get(parent);
            if (range === undefined) {
                phaseRanges.set(parent, { end: index, start: index });
            } else {
                range.end = index;
            }
        });

        let withinLanePairs = 0;
        let linkedPairs = 0;
        for (const { end, start } of phaseRanges.values()) {
            const mergeIndex = end; // the phase's last leaf is the merge gate, not a lane member
            for (let index = start + 1; index < mergeIndex; index += 1) {
                const positionInPhase = index - start;
                const isLaneStart = positionInPhase % LANE_LENGTH === 0;
                if (isLaneStart) {
                    continue;
                }
                withinLanePairs += 1;
                if (edgePairs.has(`${index - 1}->${index}`)) {
                    linkedPairs += 1;
                }
            }
        }

        expect(withinLanePairs).toBeGreaterThan(100);
        // Every non-lane-start activity chains to the previous activity in its lane.
        expect(linkedPairs).toBe(withinLanePairs);
    });

    test("runs lanes concurrently: span is far below the summed durations", () => {
        const { span, sumDurations } = computeSpanAndCritical(
            generateSchedule({ activityCount: REPRESENTATIVE_COUNT, seed: 3 }),
        );
        // Pure sequencing would make span approach the duration sum; concurrent lanes
        // collapse it to a small fraction of that total.
        expect(span).toBeLessThan(sumDurations / 4);
        expect(span).toBeGreaterThanOrEqual(MIN_SPAN_DAYS);
        expect(span).toBeLessThanOrEqual(MAX_SPAN_DAYS);
    });

    test("keeps the critical fraction in a realistic minority band", () => {
        for (const seed of [1, 3, 9]) {
            const { criticalFraction } = computeSpanAndCritical(
                generateSchedule({ activityCount: REPRESENTATIVE_COUNT, seed }),
            );
            expect(criticalFraction).toBeGreaterThanOrEqual(MIN_CRITICAL_FRACTION);
            expect(criticalFraction).toBeLessThanOrEqual(MAX_CRITICAL_FRACTION);
        }
    });

    test("default 5000-activity schedule stays within span and critical targets", () => {
        const { criticalFraction, span } = computeSpanAndCritical(generateSchedule({}));
        expect(span).toBeGreaterThanOrEqual(MIN_SPAN_DAYS);
        expect(span).toBeLessThanOrEqual(MAX_SPAN_DAYS);
        expect(criticalFraction).toBeGreaterThanOrEqual(MIN_CRITICAL_FRACTION);
        expect(criticalFraction).toBeLessThanOrEqual(MAX_CRITICAL_FRACTION);
    });

    test("leaf names are coherent construction task names, not the old Activity-N pattern", () => {
        const graph = generateSchedule({ activityCount: 200, seed: 1 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const areaSet = new Set(AREAS);
        for (const leaf of leaves) {
            expect(leaf.name).not.toMatch(/^Activity \d+$/);
            const containsArea = AREAS.some((area) => leaf.name.includes(area));
            expect(containsArea).toBe(true);
            const area = AREAS.find((a) => leaf.name.includes(a));
            expect(areaSet.has(area!)).toBe(true);
        }
    });

    test("leaf names are deterministic across two calls with the same seed", () => {
        const graphA = generateSchedule({ activityCount: 100, seed: 42 });
        const graphB = generateSchedule({ activityCount: 100, seed: 42 });
        const leavesA = graphA.activities.filter((a) => a.type !== "group").map((a) => a.name);
        const leavesB = graphB.activities.filter((a) => a.type !== "group").map((a) => a.name);
        expect(leavesA).toEqual(leavesB);
    });

    test("every dependency id is unique", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 1 });
        const ids = graph.dependencies.map((dependency) => dependency.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test("all WBS codes are unique across leaves", () => {
        const graph = generateSchedule({ activityCount: 200, seed: 1 });
        const wbs = graph.activities
            .filter((activity) => activity.type !== "group")
            .map((activity) => activity.wbs);
        expect(new Set(wbs).size).toBe(wbs.length);
    });

    test("generated leaf graph is schedulable by the CPM engine", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 1 });
        const leafGraph = selectLeafActivities(graph);
        const result = computeSchedule(leafGraph);
        expect(result.ok).toBe(true);
    });
});
