/**
 * Seeded deterministic schedule generator emitting the unified node model.
 * Projects and phases are group-type activities; leaves are task or milestone
 * activities parented to a phase. Leaf dependencies follow a parallel-lane
 * model: each phase's leaves are split into lanes of roughly LANE_LENGTH
 * consecutive activities (one crew each), every activity after a lane's first
 * chains finish-to-start to the previous activity in the same lane, lanes run
 * concurrently, phases run sequentially (a phase's lanes anchor to the previous
 * phase's completion), projects run concurrently, and sparse cross-lane edges
 * let the critical path weave between crews. Every dependency is finish-to-start
 * with non-negative lag and points strictly forward, so the graph is a DAG by
 * construction. Reproducible per seed for stable tests and demos.
 */
import {
    CRITICAL_BAND_BUFFER,
    CRITICAL_LANES,
    CROSS_LANE_CHANCE,
    CROSS_LANE_MAX_LAG,
    DEFAULT_ACTIVITY_COUNT,
    DEFAULT_SEED,
    GROUPS_PER_PROJECT,
    LANE_LENGTH,
    MAX_DURATION_DAYS,
    MILESTONE_CHANCE,
    PHASE_TRANSITION_MAX_LAG,
    WITHIN_LANE_MAX_LAG,
} from "../constants/generator";
import type { Activity, ActivityType, Dependency, ScheduleGraph } from "../types/schedule";

import { buildActivityName } from "./buildActivityName";

interface PhaseSegment {
    endIndex: number;
    parentId: string;
    startIndex: number;
}

const PROJECT_NAMES = [
    "Site Preparation",
    "Structural Works",
    "MEP Installation",
    "Finishing Works",
];
const PHASE_NAMES = ["Planning", "Procurement", "Execution", "Inspection", "Closeout"];
const SEQUENTIAL_RELATIONSHIP_TYPE: Dependency["type"] = "FS";

export function generateSchedule(options?: {
    activityCount?: number;
    seed?: number;
}): ScheduleGraph {
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
        const laneIndex = Math.floor(position / LANE_LENGTH);
        const positionInLane = position % LANE_LENGTH;
        const isMilestone = rand() < MILESTONE_CHANCE;

        leaves.push({
            durationDays: isMilestone ? 0 : 1 + Math.floor(rand() * MAX_DURATION_DAYS),
            id: buildActivityId(index),
            name: buildActivityName(
                PROJECT_NAMES[projectIndex],
                PHASE_NAMES[phaseOrdinal],
                laneIndex,
                positionInLane,
            ),
            parentId: phase.id,
            type: isMilestone ? "milestone" : "task",
            wbs: buildWbs(projectIndex, phaseOrdinal, position),
        });
    }

    return leaves;
}

function buildDependencies(leaves: Activity[], rand: () => number): Dependency[] {
    const dependencies: Dependency[] = [];
    const earlyFinish = new Array<number>(leaves.length).fill(0);
    const segments = buildPhaseSegments(leaves);
    let previousMergeIndex: number | null = null;

    for (const segment of segments) {
        const isProjectFirstPhase = parsePhaseOrdinal(segment.parentId) === 0;
        const anchorIndex = isProjectFirstPhase ? null : previousMergeIndex;
        previousMergeIndex = appendPhaseDependencies(
            dependencies,
            leaves,
            earlyFinish,
            segment,
            anchorIndex,
            rand,
        );
    }
    return dependencies;
}

function buildPhaseSegments(leaves: Activity[]): PhaseSegment[] {
    const segments: PhaseSegment[] = [];
    let segmentStart = 0;
    for (let index = 1; index <= leaves.length; index++) {
        const reachedEnd = index === leaves.length;
        const crossedBoundary =
            !reachedEnd && leaves[index].parentId !== leaves[segmentStart].parentId;
        if (reachedEnd || crossedBoundary) {
            segments.push({
                endIndex: index,
                parentId: leaves[segmentStart].parentId ?? "",
                startIndex: segmentStart,
            });
            segmentStart = index;
        }
    }
    return segments;
}

// Wire one phase and return the index of its merge gate (the phase's last leaf),
// which the next phase anchors to so phases run sequentially. The phase's leaves
// before the gate are split into concurrent lanes (one crew each) that each run a
// finish-to-start staircase. The first CRITICAL_LANES lanes form the critical
// band: the merge gate depends on each band lane's last activity through a lag
// padded so all band lanes finish at the same time, which forces every band lane
// onto the critical path while the remaining concurrent lanes carry float. A
// forward pass over early-finish times (leaf order is topological) supplies the
// values the padding needs.
function appendPhaseDependencies(
    dependencies: Dependency[],
    leaves: Activity[],
    earlyFinish: number[],
    segment: PhaseSegment,
    anchorIndex: number | null,
    rand: () => number,
): number {
    const { endIndex, startIndex } = segment;
    const mergeIndex = endIndex - 1;
    const laneCount = Math.max(0, Math.ceil((mergeIndex - startIndex) / LANE_LENGTH));

    for (let index = startIndex; index < mergeIndex; index++) {
        earlyFinish[index] = wireLaneActivity(
            dependencies,
            leaves,
            earlyFinish,
            segment,
            anchorIndex,
            index,
            rand,
        );
    }

    const mergeEarlyStart = appendMergeGate(
        dependencies,
        leaves,
        earlyFinish,
        segment,
        anchorIndex,
        laneCount,
        rand,
    );
    earlyFinish[mergeIndex] = mergeEarlyStart + leaves[mergeIndex].durationDays;
    return mergeIndex;
}

// Wire one lane activity's predecessors and return its early finish. A lane's
// first activity anchors to the previous phase's merge gate (or starts at zero in
// a project's first phase); every later activity chains finish-to-start to the one
// before it in the same lane. A sparse cross-lane edge can additionally tie the
// activity to an earlier lane at the same depth so the critical path can weave.
function wireLaneActivity(
    dependencies: Dependency[],
    leaves: Activity[],
    earlyFinish: number[],
    segment: PhaseSegment,
    anchorIndex: number | null,
    index: number,
    rand: () => number,
): number {
    const { startIndex } = segment;
    const positionInPhase = index - startIndex;
    const laneIndex = Math.floor(positionInPhase / LANE_LENGTH);
    const positionInLane = positionInPhase % LANE_LENGTH;
    let earlyStart = 0;

    if (positionInLane === 0) {
        if (anchorIndex !== null) {
            const lag = pushDependency(
                dependencies,
                anchorIndex,
                index,
                leaves,
                rand,
                PHASE_TRANSITION_MAX_LAG,
            );
            earlyStart = earlyFinish[anchorIndex] + lag;
        }
    } else {
        const lag = pushDependency(
            dependencies,
            index - 1,
            index,
            leaves,
            rand,
            WITHIN_LANE_MAX_LAG,
        );
        earlyStart = earlyFinish[index - 1] + lag;
    }

    if (laneIndex > 0 && rand() < CROSS_LANE_CHANCE) {
        const crossLaneIndex =
            startIndex + Math.floor(rand() * laneIndex) * LANE_LENGTH + positionInLane;
        if (crossLaneIndex < index) {
            const lag = pushDependency(
                dependencies,
                crossLaneIndex,
                index,
                leaves,
                rand,
                CROSS_LANE_MAX_LAG,
            );
            earlyStart = Math.max(earlyStart, earlyFinish[crossLaneIndex] + lag);
        }
    }

    return earlyStart + leaves[index].durationDays;
}

// Tie the critical band into the phase's merge gate. The gate's early start is
// pinned to the latest lane finish plus a buffer, so the band finishes after every
// other lane (the band determines the project span) and a zero-float critical path
// runs through it. Each band lane reaches that pinned time through a non-negative
// padding lag, giving the band exact ties rather than a single longest lane.
function appendMergeGate(
    dependencies: Dependency[],
    leaves: Activity[],
    earlyFinish: number[],
    segment: PhaseSegment,
    anchorIndex: number | null,
    laneCount: number,
    rand: () => number,
): number {
    const { startIndex } = segment;
    const mergeIndex = segment.endIndex - 1;
    const bandLaneCount = Math.min(CRITICAL_LANES, laneCount);

    if (bandLaneCount === 0) {
        if (anchorIndex === null) {
            return 0;
        }
        const lag = pushDependency(
            dependencies,
            anchorIndex,
            mergeIndex,
            leaves,
            rand,
            PHASE_TRANSITION_MAX_LAG,
        );
        return earlyFinish[anchorIndex] + lag;
    }

    let latestLaneFinish = 0;
    for (let index = startIndex; index < mergeIndex; index++) {
        latestLaneFinish = Math.max(latestLaneFinish, earlyFinish[index]);
    }
    const target = latestLaneFinish + CRITICAL_BAND_BUFFER;

    for (let lane = 0; lane < bandLaneCount; lane++) {
        const laneTerminalIndex =
            Math.min(startIndex + lane * LANE_LENGTH + LANE_LENGTH, mergeIndex) - 1;
        const paddingLag = target - earlyFinish[laneTerminalIndex];
        pushDependencyWithLag(dependencies, laneTerminalIndex, mergeIndex, leaves, paddingLag);
    }
    return target;
}

function pushDependency(
    dependencies: Dependency[],
    predecessorIndex: number,
    successorIndex: number,
    leaves: Activity[],
    rand: () => number,
    maxLag: number,
): number {
    const lagDays = Math.floor(rand() * (maxLag + 1));
    pushDependencyWithLag(dependencies, predecessorIndex, successorIndex, leaves, lagDays);
    return lagDays;
}

function pushDependencyWithLag(
    dependencies: Dependency[],
    predecessorIndex: number,
    successorIndex: number,
    leaves: Activity[],
    lagDays: number,
): void {
    dependencies.push({
        id: `e${dependencies.length}`,
        lagDays,
        predecessorId: leaves[predecessorIndex].id,
        successorId: leaves[successorIndex].id,
        type: SEQUENTIAL_RELATIONSHIP_TYPE,
    });
}

function parsePhaseOrdinal(phaseId: string): number {
    const lastSeparator = phaseId.lastIndexOf("-g");
    return Number(phaseId.slice(lastSeparator + 2));
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
