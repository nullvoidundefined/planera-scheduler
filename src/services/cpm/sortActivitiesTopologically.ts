/**
 * Topological sort for a CPM schedule graph using Kahn's algorithm. Returns
 * activities in dependency order so every predecessor appears before its successors.
 * Throws if the graph contains a cycle; callers should gate with detectCycle first.
 */

import type { Activity, ScheduleGraph } from "../../types/schedule";

export function sortActivitiesTopologically(graph: ScheduleGraph): Activity[] {
    const { inDegree, adjacency } = buildGraphStructures(graph);
    const activityMap = buildActivityMap(graph.activities);
    const queue = collectZeroInDegreeNodes(inDegree);
    const sorted: Activity[] = [];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const activity = activityMap.get(currentId);
        if (activity !== undefined) {
            sorted.push(activity);
        }

        const neighbors = adjacency.get(currentId) ?? [];
        for (const neighborId of neighbors) {
            const degree = (inDegree.get(neighborId) ?? 1) - 1;
            inDegree.set(neighborId, degree);
            if (degree === 0) {
                queue.push(neighborId);
            }
        }
    }

    if (sorted.length !== graph.activities.length) {
        throw new Error("Graph contains a cycle: topological sort is not possible.");
    }

    return sorted;
}

function buildActivityMap(activities: Activity[]): Map<string, Activity> {
    const activityMap = new Map<string, Activity>();
    for (const activity of activities) {
        activityMap.set(activity.id, activity);
    }
    return activityMap;
}

function buildGraphStructures(graph: ScheduleGraph): {
    adjacency: Map<string, string[]>;
    inDegree: Map<string, number>;
} {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const activity of graph.activities) {
        inDegree.set(activity.id, 0);
        adjacency.set(activity.id, []);
    }

    for (const dependency of graph.dependencies) {
        const neighbors = adjacency.get(dependency.predecessorId);
        if (neighbors !== undefined) {
            neighbors.push(dependency.successorId);
        }
        inDegree.set(dependency.successorId, (inDegree.get(dependency.successorId) ?? 0) + 1);
    }

    return { adjacency, inDegree };
}

function collectZeroInDegreeNodes(inDegree: Map<string, number>): string[] {
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
        if (degree === 0) {
            queue.push(id);
        }
    }
    return queue;
}
