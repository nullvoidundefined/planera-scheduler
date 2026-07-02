/**
 * Phase 1 of the two-phase recompute: the local, immediate, main-thread step.
 * When an operation changes timing, this recomputes only the downstream cone's
 * EARLY dates (earlyStart/earlyFinish) and returns them at once so a drag or edit
 * feels live. Late dates, total float, and the critical flag are global
 * properties; they are NOT recomputed here. Each returned ComputedActivity
 * carries its updated early dates and the stale lateStart/lateFinish/totalFloat/
 * isCritical copied verbatim from previousComputed, which phase 2 (the worker's
 * full computeDownstreamCone pass) corrects a beat later.
 */
import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../../types/schedule";

import { earlyStartFromDependency } from "./earlyStartFromDependency";
import { selectDownstreamCone } from "./selectDownstreamCone";
import { sortActivitiesTopologically } from "./sortActivitiesTopologically";

export function computeConeEarlyDates(
    leafGraph: ScheduleGraph,
    changedActivityIds: string[],
    previousComputed: Map<string, ComputedActivity>,
): ComputedActivity[] {
    const cone = collectChangedCone(leafGraph, changedActivityIds);
    const dependenciesBySuccessor = groupDependenciesBySuccessor(leafGraph.dependencies);
    const durations = buildDurationMap(leafGraph);
    const orderedConeActivities = sortActivitiesTopologically(leafGraph).filter((activity) =>
        cone.has(activity.id),
    );

    return runConeForwardPass(
        orderedConeActivities,
        dependenciesBySuccessor,
        durations,
        cone,
        previousComputed,
    );
}

function collectChangedCone(leafGraph: ScheduleGraph, changedActivityIds: string[]): Set<string> {
    const cone = new Set<string>();
    for (const activityId of changedActivityIds) {
        for (const member of selectDownstreamCone(leafGraph, activityId)) {
            cone.add(member);
        }
    }
    return cone;
}

function groupDependenciesBySuccessor(dependencies: Dependency[]): Map<string, Dependency[]> {
    const grouped = new Map<string, Dependency[]>();
    for (const dependency of dependencies) {
        const existing = grouped.get(dependency.successorId) ?? [];
        existing.push(dependency);
        grouped.set(dependency.successorId, existing);
    }
    return grouped;
}

function buildDurationMap(graph: ScheduleGraph): Map<string, number> {
    const durations = new Map<string, number>();
    for (const activity of graph.activities) {
        durations.set(activity.id, activity.durationDays);
    }
    return durations;
}

function runConeForwardPass(
    orderedConeActivities: Activity[],
    dependenciesBySuccessor: Map<string, Dependency[]>,
    durations: Map<string, number>,
    cone: Set<string>,
    previousComputed: Map<string, ComputedActivity>,
): ComputedActivity[] {
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();
    const delta: ComputedActivity[] = [];

    for (const activity of orderedConeActivities) {
        const staleComputed = previousComputed.get(activity.id);
        if (staleComputed === undefined) {
            throw new Error(
                `computeConeEarlyDates: cone activity ${activity.id} is missing from previousComputed`,
            );
        }

        const activityDuration = durations.get(activity.id) ?? 0;
        const predecessors = dependenciesBySuccessor.get(activity.id) ?? [];

        let start = 0;
        for (const dependency of predecessors) {
            const candidate = earlyStartFromDependency(
                dependency,
                readEarlyStart(dependency.predecessorId, cone, earlyStart, previousComputed),
                readEarlyFinish(dependency.predecessorId, cone, earlyFinish, previousComputed),
                activityDuration,
            );
            start = Math.max(start, candidate);
        }

        earlyStart.set(activity.id, start);
        earlyFinish.set(activity.id, start + activityDuration);
        delta.push({ ...staleComputed, earlyFinish: start + activityDuration, earlyStart: start });
    }

    return delta;
}

function readEarlyStart(
    predecessorId: string,
    cone: Set<string>,
    freshEarlyStart: Map<string, number>,
    previousComputed: Map<string, ComputedActivity>,
): number {
    if (cone.has(predecessorId)) {
        return freshEarlyStart.get(predecessorId) ?? 0;
    }
    return previousComputed.get(predecessorId)?.earlyStart ?? 0;
}

function readEarlyFinish(
    predecessorId: string,
    cone: Set<string>,
    freshEarlyFinish: Map<string, number>,
    previousComputed: Map<string, ComputedActivity>,
): number {
    if (cone.has(predecessorId)) {
        return freshEarlyFinish.get(predecessorId) ?? 0;
    }
    return previousComputed.get(predecessorId)?.earlyFinish ?? 0;
}
