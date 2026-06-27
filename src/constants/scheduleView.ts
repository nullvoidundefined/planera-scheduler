/**
 * Identifiers for the two full-width schedule surfaces the toolbar sub-nav toggles
 * between: the integrated DHTMLX grid-plus-timeline Gantt and the standalone
 * AG-Grid table. The toggle control, the view store, and the AppShell layer
 * stack all reference these names so the control and the rendered surface never
 * drift apart.
 */
export const SCHEDULE_VIEW_GANTT = "gantt";
export const SCHEDULE_VIEW_TABLE = "table";

export type ScheduleViewKey = typeof SCHEDULE_VIEW_GANTT | typeof SCHEDULE_VIEW_TABLE;

export interface ScheduleViewOption {
    key: ScheduleViewKey;
    label: string;
}

export const SCHEDULE_VIEW_OPTIONS: ScheduleViewOption[] = [
    { key: SCHEDULE_VIEW_GANTT, label: "Gantt" },
    { key: SCHEDULE_VIEW_TABLE, label: "Table" },
];
