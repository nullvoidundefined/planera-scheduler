/**
 * Maps the unified schedule model and the computed cache to AG-Grid tree-data
 * rows. The path is the ancestry chain of ids from root to node, which
 * getDataPath returns so AG-Grid builds the project to phase to activity
 * hierarchy. Group rows are rolled up from descendant summaries; leaf rows carry
 * the engine's computed dates, float, and critical flag.
 */
import { computeSummaries } from "../../services/cpm/computeSummaries";
import type { Activity, ActivityType, ComputedActivity, ScheduleGraph } from "../../types/schedule";

const GROUP_ACTIVITY_TYPE = "group";

export interface TableRow {
    critical: boolean;
    duration: number;
    earlyFinish: number;
    earlyStart: number;
    id: string;
    name: string;
    path: string[];
    totalFloat: number;
    type: ActivityType;
    wbs: string;
}

export function toTableRows(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
): TableRow[] {
    const activitiesById = new Map(graph.activities.map((activity) => [activity.id, activity]));
    const summaries = computeSummaries(graph, computed);
    return graph.activities.map((activity) =>
        toTableRow(activity, activitiesById, resolveComputed(activity, computed, summaries)),
    );
}

function resolveComputed(
    activity: Activity,
    computed: Map<string, ComputedActivity>,
    summaries: Map<string, ComputedActivity>,
): ComputedActivity | undefined {
    return activity.type === "group" ? summaries.get(activity.id) : computed.get(activity.id);
}

function toTableRow(
    activity: Activity,
    activitiesById: Map<string, Activity>,
    computedActivity: ComputedActivity | undefined,
): TableRow {
    return {
        critical: computedActivity?.isCritical ?? false,
        duration: resolveDuration(activity, computedActivity),
        earlyFinish: computedActivity?.earlyFinish ?? 0,
        earlyStart: computedActivity?.earlyStart ?? 0,
        id: activity.id,
        name: activity.name,
        path: buildAncestryPath(activity, activitiesById),
        totalFloat: computedActivity?.totalFloat ?? 0,
        type: activity.type,
        wbs: activity.wbs,
    };
}

// Group rows show their rolled-up span (summary finish minus start), never the
// stored durationDays, which is 0 for a group. Leaf rows keep their own duration.
function resolveDuration(activity: Activity, computedActivity: ComputedActivity | undefined): number {
    if (activity.type === GROUP_ACTIVITY_TYPE) {
        return computedActivity === undefined
            ? 0
            : computedActivity.earlyFinish - computedActivity.earlyStart;
    }
    return activity.durationDays;
}

function buildAncestryPath(activity: Activity, activitiesById: Map<string, Activity>): string[] {
    const path: string[] = [activity.id];
    let parentId = activity.parentId;
    while (parentId !== null) {
        path.unshift(parentId);
        parentId = activitiesById.get(parentId)?.parentId ?? null;
    }
    return path;
}
