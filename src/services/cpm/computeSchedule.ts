/**
 * Critical Path Method engine. Computes early/late start and finish, total
 * float, and the critical flag for every activity in a schedule graph.
 *
 * The engine is pure integer arithmetic over working-day indices, not dates: an
 * activity occupies the half-open interval [earlyStart, earlyStart + duration),
 * so earlyFinish = earlyStart + duration and a zero-duration milestone has
 * earlyFinish === earlyStart. Index-to-date conversion happens elsewhere.
 *
 * Forward pass (topological order) sets earlyStart from predecessor constraints;
 * the backward pass (reverse order) sets lateFinish from successor constraints.
 * Each of the four relationship types (FS, SS, FF, SF) contributes a constraint
 * per edge, and the binding constraint is the max (forward) or min (backward).
 * The graph is gated through detectCycle first, so the topological sort and both
 * passes always run on an acyclic graph.
 */

import type { ScheduleResult } from "../../types/cpm";
import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../../types/schedule";

import { detectCycle } from "./detectCycle";
import { sortActivitiesTopologically } from "./sortActivitiesTopologically";

export function computeSchedule(graph: ScheduleGraph): ScheduleResult {
    const cycle = detectCycle(graph);
    if (cycle !== null) {
        return { cycle, ok: false };
    }

    const sorted = sortActivitiesTopologically(graph);
    const durations = buildDurationMap(sorted);
    const dependenciesBySuccessor = groupDependenciesBySuccessor(graph.dependencies);
    const dependenciesByPredecessor = groupDependenciesByPredecessor(graph.dependencies);

    const { earlyStart, earlyFinish } = runForwardPass(sorted, durations, dependenciesBySuccessor);
    const projectFinish = computeProjectFinish(earlyFinish);
    const { lateStart, lateFinish } = runBackwardPass(
        sorted,
        durations,
        dependenciesByPredecessor,
        projectFinish,
    );

    const activities = assembleComputedActivities(
        sorted,
        earlyStart,
        earlyFinish,
        lateStart,
        lateFinish,
    );

    return { activities, ok: true };
}

function buildDurationMap(activities: Activity[]): Map<string, number> {
    const durations = new Map<string, number>();
    for (const activity of activities) {
        durations.set(activity.id, activity.durationDays);
    }
    return durations;
}

function groupDependenciesBySuccessor(dependencies: Dependency[]): Map<string, Dependency[]> {
    const grouped = new Map<string, Dependency[]>();
    for (const dependency of dependencies) {
        appendToGroup(grouped, dependency.successorId, dependency);
    }
    return grouped;
}

function groupDependenciesByPredecessor(dependencies: Dependency[]): Map<string, Dependency[]> {
    const grouped = new Map<string, Dependency[]>();
    for (const dependency of dependencies) {
        appendToGroup(grouped, dependency.predecessorId, dependency);
    }
    return grouped;
}

function appendToGroup(
    grouped: Map<string, Dependency[]>,
    key: string,
    dependency: Dependency,
): void {
    const existing = grouped.get(key);
    if (existing !== undefined) {
        existing.push(dependency);
    } else {
        grouped.set(key, [dependency]);
    }
}

function runForwardPass(
    sorted: Activity[],
    durations: Map<string, number>,
    dependenciesBySuccessor: Map<string, Dependency[]>,
): { earlyFinish: Map<string, number>; earlyStart: Map<string, number> } {
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();

    for (const activity of sorted) {
        const activityDuration = durations.get(activity.id) ?? 0;
        const predecessors = dependenciesBySuccessor.get(activity.id) ?? [];

        let start = 0;
        for (const dependency of predecessors) {
            const predecessorEarlyStart = earlyStart.get(dependency.predecessorId) ?? 0;
            const predecessorEarlyFinish = earlyFinish.get(dependency.predecessorId) ?? 0;
            const candidate = earlyStartFromDependency(
                dependency,
                predecessorEarlyStart,
                predecessorEarlyFinish,
                activityDuration,
            );
            start = Math.max(start, candidate);
        }

        earlyStart.set(activity.id, start);
        earlyFinish.set(activity.id, start + activityDuration);
    }

    return { earlyFinish, earlyStart };
}

function earlyStartFromDependency(
    dependency: Dependency,
    predecessorEarlyStart: number,
    predecessorEarlyFinish: number,
    activityDuration: number,
): number {
    switch (dependency.type) {
        case "FS":
            return predecessorEarlyFinish + dependency.lagDays;
        case "SS":
            return predecessorEarlyStart + dependency.lagDays;
        case "FF":
            return predecessorEarlyFinish + dependency.lagDays - activityDuration;
        case "SF":
            return predecessorEarlyStart + dependency.lagDays - activityDuration;
    }
}

function computeProjectFinish(earlyFinish: Map<string, number>): number {
    let projectFinish = 0;
    for (const finish of earlyFinish.values()) {
        projectFinish = Math.max(projectFinish, finish);
    }
    return projectFinish;
}

function runBackwardPass(
    sorted: Activity[],
    durations: Map<string, number>,
    dependenciesByPredecessor: Map<string, Dependency[]>,
    projectFinish: number,
): { lateFinish: Map<string, number>; lateStart: Map<string, number> } {
    const lateStart = new Map<string, number>();
    const lateFinish = new Map<string, number>();

    for (let index = sorted.length - 1; index >= 0; index -= 1) {
        const activity = sorted[index];
        const activityDuration = durations.get(activity.id) ?? 0;
        const successors = dependenciesByPredecessor.get(activity.id) ?? [];

        let finish = projectFinish;
        for (const dependency of successors) {
            const successorLateStart = lateStart.get(dependency.successorId) ?? projectFinish;
            const successorLateFinish = lateFinish.get(dependency.successorId) ?? projectFinish;
            const candidate = lateFinishFromDependency(
                dependency,
                successorLateStart,
                successorLateFinish,
                activityDuration,
            );
            finish = Math.min(finish, candidate);
        }

        lateFinish.set(activity.id, finish);
        lateStart.set(activity.id, finish - activityDuration);
    }

    return { lateFinish, lateStart };
}

function lateFinishFromDependency(
    dependency: Dependency,
    successorLateStart: number,
    successorLateFinish: number,
    activityDuration: number,
): number {
    switch (dependency.type) {
        case "FS":
            return successorLateStart - dependency.lagDays;
        case "SS":
            return successorLateStart - dependency.lagDays + activityDuration;
        case "FF":
            return successorLateFinish - dependency.lagDays;
        case "SF":
            return successorLateFinish - dependency.lagDays + activityDuration;
    }
}

function assembleComputedActivities(
    sorted: Activity[],
    earlyStart: Map<string, number>,
    earlyFinish: Map<string, number>,
    lateStart: Map<string, number>,
    lateFinish: Map<string, number>,
): Map<string, ComputedActivity> {
    const activities = new Map<string, ComputedActivity>();

    for (const activity of sorted) {
        const activityEarlyStart = earlyStart.get(activity.id) ?? 0;
        const activityLateStart = lateStart.get(activity.id) ?? 0;
        const totalFloat = activityLateStart - activityEarlyStart;

        activities.set(activity.id, {
            earlyFinish: earlyFinish.get(activity.id) ?? 0,
            earlyStart: activityEarlyStart,
            id: activity.id,
            isCritical: totalFloat <= 0,
            lateFinish: lateFinish.get(activity.id) ?? 0,
            lateStart: activityLateStart,
            totalFloat,
        });
    }

    return activities;
}
