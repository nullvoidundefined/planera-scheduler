/**
 * Gantt timeline scale constants and the mapping from CPM relationship types to
 * DHTMLX link-type codes ("0" FS, "1" SS, "2" FF, "3" SF).
 */
import type { RelationshipType } from "../types/schedule";

export const DEFAULT_DAY_WIDTH_PX = 24;
export const TICK_INTERVAL_DAYS = 5;

export const RELATIONSHIP_TO_DHTMLX_LINK_TYPE: Record<RelationshipType, string> = {
    FF: "2",
    FS: "0",
    SF: "3",
    SS: "1",
};
