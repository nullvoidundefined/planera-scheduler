/**
 * Seeded deterministic schedule generator emitting the unified node model.
 * Projects and phases are group-type activities; leaves are task or milestone
 * activities parented to a phase. Every dependency is finish-to-start with
 * non-negative lag and points strictly forward, so the graph is a DAG by
 * construction. Reproducible per seed for stable tests and demos.
 */
import {
    DEFAULT_ACTIVITY_COUNT,
    DEFAULT_SEED,
    GROUPS_PER_PROJECT,
    MAX_DURATION_DAYS,
    MAX_LAG_DAYS,
    MERGE_PREDECESSOR_CHANCE,
    MERGE_PREDECESSOR_LOOKBACK,
    MILESTONE_CHANCE,
    PARALLEL_BRANCH_CHANCE,
    PARALLEL_BRANCH_LOOKBACK,
} from "../constants/generator";
import type { Activity, ActivityType, Dependency, ScheduleGraph } from "../types/schedule";

const PROJECT_NAMES = ["Site Preparation", "Structural Works", "MEP Installation", "Finishing Works"];
const PHASE_NAMES = ["Planning", "Procurement", "Execution", "Inspection", "Closeout"];
const SEQUENTIAL_RELATIONSHIP_TYPE: Dependency["type"] = "FS";

export function generateSchedule(options?: { activityCount?: number; seed?: number }): ScheduleGraph {
    const seed = options?.seed ?? DEFAULT_SEED;
    const activityCount = options?.activityCount ?? DEFAULT_ACTIVITY_COUNT;
    const rand = buildPrng(seed);

    const projects = buildProjectNodes();
    const phases = buildPhaseNodes(projects);
    const leaves = buildLeafActivities(activityCount, phases, rand);
    const dependencies = buildDependencies(leaves, rand);

    return { activities: [...projects, ...phases, ...leaves], dependencies };
}

function buildPrng(seed: number): () => number {
    let state = seed;
    return function prng(): number {
        state = (state + 0x6d2b79f5) | 0;
        let z = Math.imul(state ^ (state >>> 15), 1 | state);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) | 0;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

function buildProjectNodes(): Activity[] {
    return PROJECT_NAMES.map((name, index) => ({
        durationDays: 0,
        id: buildProjectId(index),
        name,
        parentId: null,
        type: "group" as ActivityType,
        wbs: `${index + 1}`,
    }));
}

function buildPhaseNodes(projects: Activity[]): Activity[] {
    const phases: Activity[] = [];
    for (let projectIndex = 0; projectIndex < projects.length; projectIndex++) {
        for (let phaseIndex = 0; phaseIndex < GROUPS_PER_PROJECT; phaseIndex++) {
            phases.push({
                durationDays: 0,
                id: buildPhaseId(projects[projectIndex].id, phaseIndex),
                name: PHASE_NAMES[phaseIndex],
                parentId: projects[projectIndex].id,
                type: "group",
                wbs: `${projectIndex + 1}.${phaseIndex + 1}`,
            });
        }
    }
    return phases;
}

function buildLeafActivities(
    activityCount: number,
    phases: Activity[],
    rand: () => number,
): Activity[] {
    const leaves: Activity[] = [];
    const positionWithinPhase = new Array<number>(phases.length).fill(0);
    const activitiesPerPhase = Math.ceil(activityCount / phases.length);

    for (let index = 0; index < activityCount; index++) {
        const phaseIndex = Math.min(Math.floor(index / activitiesPerPhase), phases.length - 1);
        const phase = phases[phaseIndex];
        const position = positionWithinPhase[phaseIndex];
        positionWithinPhase[phaseIndex]++;

        const projectIndex = Math.floor(phaseIndex / GROUPS_PER_PROJECT);
        const phaseOrdinal = phaseIndex % GROUPS_PER_PROJECT;
        const isMilestone = rand() < MILESTONE_CHANCE;

        leaves.push({
            durationDays: isMilestone ? 0 : 1 + Math.floor(rand() * MAX_DURATION_DAYS),
            id: buildActivityId(index),
            name: `Activity ${index + 1}`,
            parentId: phase.id,
            type: isMilestone ? "milestone" : "task",
            wbs: buildWbs(projectIndex, phaseOrdinal, position),
        });
    }

    return leaves;
}

function buildDependencies(leaves: Activity[], rand: () => number): Dependency[] {
    const dependencies: Dependency[] = [];
    for (let index = 1; index < leaves.length; index++) {
        const predecessorIndices = selectPredecessorIndices(index, rand);
        for (const predecessorIndex of predecessorIndices) {
            dependencies.push(
                buildDependency(
                    leaves[predecessorIndex].id,
                    leaves[index].id,
                    dependencies.length,
                    rand,
                ),
            );
        }
    }
    return dependencies;
}

function selectPredecessorIndices(activityIndex: number, rand: () => number): number[] {
    const primaryIndex = selectPrimaryPredecessorIndex(activityIndex, rand);
    const predecessorIndices = [primaryIndex];
    const mergeIndex = selectMergePredecessorIndex(activityIndex, primaryIndex, rand);
    if (mergeIndex !== null) {
        predecessorIndices.push(mergeIndex);
    }
    return predecessorIndices;
}

function selectPrimaryPredecessorIndex(activityIndex: number, rand: () => number): number {
    if (activityIndex >= 2 && rand() < PARALLEL_BRANCH_CHANCE) {
        const branchStart = Math.max(0, activityIndex - PARALLEL_BRANCH_LOOKBACK);
        const branchPoolSize = activityIndex - 1 - branchStart;
        if (branchPoolSize > 0) {
            return branchStart + Math.floor(rand() * branchPoolSize);
        }
    }
    return activityIndex - 1;
}

function selectMergePredecessorIndex(
    activityIndex: number,
    primaryIndex: number,
    rand: () => number,
): number | null {
    if (rand() >= MERGE_PREDECESSOR_CHANCE || primaryIndex <= 0) {
        return null;
    }
    const mergeStart = Math.max(0, activityIndex - MERGE_PREDECESSOR_LOOKBACK);
    const mergePoolSize = primaryIndex - mergeStart;
    if (mergePoolSize <= 0) {
        return null;
    }
    return mergeStart + Math.floor(rand() * mergePoolSize);
}

function buildDependency(
    predecessorId: string,
    successorId: string,
    edgeIndex: number,
    rand: () => number,
): Dependency {
    return {
        id: `e${edgeIndex}`,
        lagDays: Math.floor(rand() * (MAX_LAG_DAYS + 1)),
        predecessorId,
        successorId,
        type: SEQUENTIAL_RELATIONSHIP_TYPE,
    };
}

function buildActivityId(activityIndex: number): string {
    return `a${activityIndex}`;
}

function buildPhaseId(projectId: string, phaseIndex: number): string {
    return `${projectId}-g${phaseIndex}`;
}

function buildProjectId(projectIndex: number): string {
    return `p${projectIndex}`;
}

function buildWbs(projectIndex: number, phaseOrdinal: number, positionWithinPhase: number): string {
    return `${projectIndex + 1}.${phaseOrdinal + 1}.${positionWithinPhase + 1}`;
}
