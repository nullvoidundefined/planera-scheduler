import { describe, expect, test } from "vitest";

import { computeSchedule } from "../../services/cpm/computeSchedule";
import { detectCycle } from "../../services/cpm/detectCycle";
import { selectLeafActivities } from "../../services/cpm/selectLeafActivities";
import { generateSchedule } from "../../services/generateSchedule";

const GROUPS_PER_PROJECT = 5;

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
            graph.activities.filter((activity) => activity.type !== "group").map((activity) => activity.id),
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

    test("most leaves chain to their immediate predecessor (sequential staircase)", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 3 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const predecessorsBySuccessor = new Map<number, number[]>();
        for (const dependency of graph.dependencies) {
            const predecessorIndex = Number(dependency.predecessorId.slice(1));
            const successorIndex = Number(dependency.successorId.slice(1));
            const existing = predecessorsBySuccessor.get(successorIndex) ?? [];
            existing.push(predecessorIndex);
            predecessorsBySuccessor.set(successorIndex, existing);
        }
        let sequentialCount = 0;
        for (let index = 1; index < leaves.length; index++) {
            if ((predecessorsBySuccessor.get(index) ?? []).includes(index - 1)) {
                sequentialCount++;
            }
        }
        expect(sequentialCount / (leaves.length - 1)).toBeGreaterThan(0.7);
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
