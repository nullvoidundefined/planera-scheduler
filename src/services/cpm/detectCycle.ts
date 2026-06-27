/**
 * Cycle detection for a CPM schedule graph. Uses depth-first search with an
 * explicit worklist (iterative) to identify back edges and return the cycle
 * path as activity ids. The iterative approach avoids call-stack overflow for
 * large graphs (5 000+ nodes).
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
            const cycle = visitNodeIteratively(id, adjacency, visited, stack, stackOrder, stackIndex);
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

interface DfsFrame {
    neighbors: string[];
    nextIndex: number;
    nodeId: string;
}

function pushDfsNode(
    nodeId: string,
    adjacency: Map<string, string[]>,
    visited: Set<string>,
    stack: Set<string>,
    stackOrder: string[],
    stackIndex: Map<string, number>,
    worklist: DfsFrame[],
): void {
    visited.add(nodeId);
    stack.add(nodeId);
    stackIndex.set(nodeId, stackOrder.length);
    stackOrder.push(nodeId);
    worklist.push({ neighbors: adjacency.get(nodeId) ?? [], nextIndex: 0, nodeId });
}

function popDfsNode(
    frame: DfsFrame,
    stack: Set<string>,
    stackOrder: string[],
    stackIndex: Map<string, number>,
    worklist: DfsFrame[],
): void {
    worklist.pop();
    stack.delete(frame.nodeId);
    stackOrder.pop();
    stackIndex.delete(frame.nodeId);
}

function visitNodeIteratively(
    startId: string,
    adjacency: Map<string, string[]>,
    visited: Set<string>,
    stack: Set<string>,
    stackOrder: string[],
    stackIndex: Map<string, number>,
): string[] | null {
    const worklist: DfsFrame[] = [];
    pushDfsNode(startId, adjacency, visited, stack, stackOrder, stackIndex, worklist);

    while (worklist.length > 0) {
        const frame = worklist[worklist.length - 1];

        if (frame.nextIndex < frame.neighbors.length) {
            const neighbor = frame.neighbors[frame.nextIndex++];

            if (!visited.has(neighbor)) {
                pushDfsNode(neighbor, adjacency, visited, stack, stackOrder, stackIndex, worklist);
            } else if (stack.has(neighbor)) {
                const cycleStart = stackIndex.get(neighbor) ?? 0;
                return stackOrder.slice(cycleStart);
            }
        } else {
            popDfsNode(frame, stack, stackOrder, stackIndex, worklist);
        }
    }

    return null;
}
