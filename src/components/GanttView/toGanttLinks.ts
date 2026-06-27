/**
 * Maps dependency edges to DHTMLX link rows. The predecessor is the link source,
 * the successor the target, and the relationship type maps to DHTMLX's numeric
 * link-type code.
 */
import { RELATIONSHIP_TO_DHTMLX_LINK_TYPE } from "../../constants/ganttScale";
import type { Dependency } from "../../types/schedule";

export interface GanttLink {
    id: string;
    lag: number;
    source: string;
    target: string;
    type: string;
}

export function toGanttLinks(dependencies: Dependency[]): GanttLink[] {
    return dependencies.map((dependency) => ({
        id: dependency.id,
        lag: dependency.lagDays,
        source: dependency.predecessorId,
        target: dependency.successorId,
        type: RELATIONSHIP_TO_DHTMLX_LINK_TYPE[dependency.type],
    }));
}
