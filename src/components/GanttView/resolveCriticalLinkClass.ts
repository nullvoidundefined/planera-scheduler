/**
 * Resolves the CSS class DHTMLX applies to a dependency link from the computed
 * critical flags of the two activities it connects. A link is part of the
 * critical chain only when both its predecessor and successor are critical, so
 * the start-to-finish red chain spans bars and the links between them.
 */
import type { ComputedActivity } from "../../types/schedule";

const CRITICAL_LINK_CLASS = "critical-link";

export function resolveCriticalLinkClass(
    source: ComputedActivity | undefined,
    target: ComputedActivity | undefined,
): string {
    return source?.isCritical === true && target?.isCritical === true ? CRITICAL_LINK_CLASS : "";
}
