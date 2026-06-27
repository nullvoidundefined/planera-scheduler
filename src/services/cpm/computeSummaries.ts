/**
 * Computes group rollup bounds. Each group activity spans its descendant leaves:
 * earlyStart is the minimum descendant earlyStart, earlyFinish the maximum
 * descendant earlyFinish, lateStart the minimum descendant lateStart, lateFinish
 * the maximum descendant lateFinish. A group is critical when any descendant leaf
 * is critical. Groups with no computed descendants are omitted from the result.
 */
import type { Activity, ComputedActivity, ScheduleGraph } from "../../types/schedule";

export function computeSummaries(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
): Map<string, ComputedActivity> {
    const childrenByParent = groupActivitiesByParent(graph.activities);
    const summaries = new Map<string, ComputedActivity>();

    for (const activity of graph.activities) {
        if (activity.type === "group") {
            const leaves = collectDescendantComputed(activity.id, childrenByParent, computed);
            const summary = summarizeLeaves(activity.id, leaves);
            if (summary !== null) {
                summaries.set(activity.id, summary);
            }
        }
    }

    return summaries;
}

function groupActivitiesByParent(activities: Activity[]): Map<string, Activity[]> {
    const childrenByParent = new Map<string, Activity[]>();
    for (const activity of activities) {
        if (activity.parentId !== null) {
            const siblings = childrenByParent.get(activity.parentId) ?? [];
            siblings.push(activity);
            childrenByParent.set(activity.parentId, siblings);
        }
    }
    return childrenByParent;
}

function collectDescendantComputed(
    groupId: string,
    childrenByParent: Map<string, Activity[]>,
    computed: Map<string, ComputedActivity>,
): ComputedActivity[] {
    const leaves: ComputedActivity[] = [];
    const stack = [...(childrenByParent.get(groupId) ?? [])];

    while (stack.length > 0) {
        const child = stack.pop()!;
        if (child.type === "group") {
            stack.push(...(childrenByParent.get(child.id) ?? []));
        } else {
            const leafComputed = computed.get(child.id);
            if (leafComputed !== undefined) {
                leaves.push(leafComputed);
            }
        }
    }

    return leaves;
}

function summarizeLeaves(groupId: string, leaves: ComputedActivity[]): ComputedActivity | null {
    if (leaves.length === 0) {
        return null;
    }

    let earlyStart = Infinity;
    let earlyFinish = -Infinity;
    let lateStart = Infinity;
    let lateFinish = -Infinity;
    let isCritical = false;

    for (const leaf of leaves) {
        earlyStart = Math.min(earlyStart, leaf.earlyStart);
        earlyFinish = Math.max(earlyFinish, leaf.earlyFinish);
        lateStart = Math.min(lateStart, leaf.lateStart);
        lateFinish = Math.max(lateFinish, leaf.lateFinish);
        isCritical = isCritical || leaf.isCritical;
    }

    return {
        earlyFinish,
        earlyStart,
        id: groupId,
        isCritical,
        lateFinish,
        lateStart,
        totalFloat: lateStart - earlyStart,
    };
}
