/**
 * Maps the unified schedule model and the computed cache to DHTMLX task rows.
 * Group activities become DHTMLX "project" rows positioned by the rolled-up
 * summary; tasks and milestones become their respective row types positioned by
 * the computed early start. Dates are derived from working-day indices through
 * the calendar, never read from stored fields.
 */
import { computeSummaries } from "../../services/cpm/computeSummaries";
import type { Calendar } from "../../types/calendar";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../types/schedule";

const ROOT_PARENT = "0";

export interface GanttTask {
    duration: number;
    id: string;
    open: boolean;
    parent: string;
    start_date: Date;
    text: string;
    type: string;
}

export function toGanttTasks(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
    calendar: Calendar,
): GanttTask[] {
    const summaries = computeSummaries(graph, computed);
    return graph.activities.map((activity) =>
        toGanttTask(activity, resolveBounds(activity, computed, summaries), calendar),
    );
}

function resolveBounds(
    activity: Activity,
    computed: Map<string, ComputedActivity>,
    summaries: Map<string, ComputedActivity>,
): { earlyFinish: number; earlyStart: number } {
    const bounds = activity.type === "group" ? summaries.get(activity.id) : computed.get(activity.id);
    return { earlyFinish: bounds?.earlyFinish ?? 0, earlyStart: bounds?.earlyStart ?? 0 };
}

function toGanttTask(
    activity: Activity,
    bounds: { earlyFinish: number; earlyStart: number },
    calendar: Calendar,
): GanttTask {
    return {
        duration: Math.max(bounds.earlyFinish - bounds.earlyStart, activity.type === "milestone" ? 0 : 1),
        id: activity.id,
        open: true,
        parent: activity.parentId ?? ROOT_PARENT,
        start_date: calendar.dateFromIndex(bounds.earlyStart),
        text: activity.name,
        type: toGanttTaskType(activity.type),
    };
}

function toGanttTaskType(type: Activity["type"]): string {
    switch (type) {
        case "group":
            return "project";
        case "milestone":
            return "milestone";
        case "task":
            return "task";
    }
}
