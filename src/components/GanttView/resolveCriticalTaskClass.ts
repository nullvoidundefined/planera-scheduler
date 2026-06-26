/**
 * Resolves the CSS class DHTMLX applies to a task bar from our computed critical
 * flag. Wired into gantt.templates.task_class so the critical path is drawn from
 * our CPM engine, not DHTMLX's Pro critical-path feature.
 */
import type { ComputedActivity } from "../../types/schedule";

const CRITICAL_CLASS = "critical";

export function resolveCriticalTaskClass(computed: ComputedActivity | undefined): string {
    return computed?.isCritical === true ? CRITICAL_CLASS : "";
}
