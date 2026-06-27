/**
 * Collects the downstream cone of a changed activity: the activity itself plus
 * every successor reachable by following dependency edges forward. Early dates
 * flow downstream, so a duration or edge change can only alter the cone's early
 * bounds; the cone scopes which rows a view must refresh.
 */
import type { ScheduleGraph } from "../../types/schedule";

export function selectDownstreamCone(graph: ScheduleGraph, activityId: string): Set<string> {
    const successorsByPredecessor = groupSuccessorsByPredecessor(graph);
    const cone = new Set<string>([activityId]);
    const stack = [activityId];

    while (stack.length > 0) {
        const current = stack.pop()!;
        for (const successor of successorsByPredecessor.get(current) ?? []) {
            if (!cone.has(successor)) {
                cone.add(successor);
                stack.push(successor);
            }
        }
    }

    return cone;
}

function groupSuccessorsByPredecessor(graph: ScheduleGraph): Map<string, string[]> {
    const successorsByPredecessor = new Map<string, string[]>();
    for (const dependency of graph.dependencies) {
        const successors = successorsByPredecessor.get(dependency.predecessorId) ?? [];
        successors.push(dependency.successorId);
        successorsByPredecessor.set(dependency.predecessorId, successors);
    }
    return successorsByPredecessor;
}
