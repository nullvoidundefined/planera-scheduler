/**
 * Maps the unified schedule model and the computed cache to DHTMLX task rows.
 * Group activities become DHTMLX "project" rows positioned by the rolled-up
 * summary; tasks and milestones become their respective row types positioned by
 * the computed early start. Dates are derived from working-day indices through
 * the calendar, never read from stored fields. Each row also carries the custom
 * wbs, totalFloat, and isCritical properties the native grid columns render.
 */
import { computeSummaries } from "../../services/cpm/computeSummaries";
import type { Calendar } from "../../types/calendar";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../types/schedule";

import type { GanttTask } from "./types";

const MIN_BAR_DURATION_DAYS = 1;
const ROOT_PARENT = "0";

export function toGanttTasks(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
    calendar: Calendar,
): GanttTask[] {
    const summaries = computeSummaries(graph, computed);
    return graph.activities.map((activity) =>
        toGanttTask(activity, resolveComputed(activity, computed, summaries), calendar),
    );
}

function resolveComputed(
    activity: Activity,
    computed: Map<string, ComputedActivity>,
    summaries: Map<string, ComputedActivity>,
): ComputedActivity | undefined {
    return activity.type === "group" ? summaries.get(activity.id) : computed.get(activity.id);
}

function toGanttTask(
    activity: Activity,
    entry: ComputedActivity | undefined,
    calendar: Calendar,
): GanttTask {
    const earlyFinish = entry?.earlyFinish ?? 0;
    const earlyStart = entry?.earlyStart ?? 0;
    return {
        duration: Math.max(
            earlyFinish - earlyStart,
            activity.type === "milestone" ? 0 : MIN_BAR_DURATION_DAYS,
        ),
        id: activity.id,
        isCritical: entry?.isCritical ?? false,
        open: true,
        parent: activity.parentId ?? ROOT_PARENT,
        start_date: calendar.dateFromIndex(earlyStart),
        text: activity.name,
        totalFloat: entry?.totalFloat ?? 0,
        type: toGanttTaskType(activity.type),
        wbs: activity.wbs,
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
