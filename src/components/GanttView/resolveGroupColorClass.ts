/**
 * Resolves the pastel phase CSS class DHTMLX applies to a task bar. A phase rollup
 * (its own id is a phase) paints with the paler "phase-summary-N" tone; a leaf
 * activity paints with the "phase-N" tone of its parent phase; top-level project
 * rollups and anything outside a known phase stay neutral. The phase color map is
 * the single source of truth (it already excludes projects and leaves), so the
 * resolver needs only an id-then-parent lookup. Wired into gantt.templates.task_class
 * alongside resolveCriticalTaskClass, which the caller composes onto the result.
 */
import type { GanttTask } from "./toGanttTasks";

const LEAF_CLASS_PREFIX = "phase-";
const SUMMARY_CLASS_PREFIX = "phase-summary-";

export function resolveGroupColorClass(
    task: GanttTask,
    phaseColorIndex: Map<string, number>,
): string {
    const summaryIndex = phaseColorIndex.get(task.id);
    if (summaryIndex !== undefined) {
        return `${SUMMARY_CLASS_PREFIX}${summaryIndex}`;
    }
    const leafIndex = phaseColorIndex.get(task.parent);
    if (leafIndex !== undefined) {
        return `${LEAF_CLASS_PREFIX}${leafIndex}`;
    }
    return "";
}
