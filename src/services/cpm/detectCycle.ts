/**
 * Cycle detection for a CPM schedule graph. Uses depth-first search with a
 * recursion stack to identify back edges and return the cycle path as activity ids.
 */

import type { ScheduleGraph } from "../../types/schedule";

export function detectCycle(graph: ScheduleGraph): string[] | null {
    const adjacency = buildAdjacency(graph);
    const activityIds = graph.activities.map((activity) => activity.id);

    const visited = new Set<string>();
    const stack = new Set<string>();
    const stackOrder: string[] = [];
    const stackIndex = new Map<string, number>();

    for (const id of activityIds) {
        if (!visited.has(id)) {
            const cycle = visitNode(id, adjacency, visited, stack, stackOrder, stackIndex);
            if (cycle !== null) {
                return cycle;
            }
        }
    }

    return null;
}

function buildAdjacency(graph: ScheduleGraph): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const activity of graph.activities) {
        adjacency.set(activity.id, []);
    }

    for (const dependency of graph.dependencies) {
        const neighbors = adjacency.get(dependency.predecessorId);
        if (neighbors !== undefined) {
            neighbors.push(dependency.successorId);
        }
    }

    return adjacency;
}

function visitNode(
    nodeId: string,
    adjacency: Map<string, string[]>,
    visited: Set<string>,
    stack: Set<string>,
    stackOrder: string[],
    stackIndex: Map<string, number>,
): string[] | null {
    visited.add(nodeId);
    stack.add(nodeId);
    stackIndex.set(nodeId, stackOrder.length);
    stackOrder.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
            const cycle = visitNode(neighbor, adjacency, visited, stack, stackOrder, stackIndex);
            if (cycle !== null) {
                return cycle;
            }
        } else if (stack.has(neighbor)) {
            const cycleStart = stackIndex.get(neighbor) ?? 0;
            return stackOrder.slice(cycleStart);
        }
    }

    stack.delete(nodeId);
    stackOrder.pop();
    stackIndex.delete(nodeId);
    return null;
}
