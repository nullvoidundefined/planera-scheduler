/**
 * Narrows a schedule graph to the activities the CPM engine operates on: the
 * leaf nodes (tasks and milestones), excluding group rollups. The dependency
 * edge list is preserved unchanged because edges only ever connect leaves.
 */
import type { ScheduleGraph } from "../../types/schedule";

export function selectLeafActivities(graph: ScheduleGraph): ScheduleGraph {
    const activities = graph.activities.filter((activity) => activity.type !== "group");
    return { activities, dependencies: graph.dependencies };
}
