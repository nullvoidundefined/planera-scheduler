/**
 * Shared DHTMLX Gantt zoom-level identifiers and the ordered Day/Week/Month
 * options the toolbar renders. Both the Gantt lifecycle hook (which registers the
 * zoom levels) and the toolbar (which switches between them) reference these names
 * so the control and the widget never drift apart.
 */
export const GANTT_ZOOM_DAY = "day";
export const GANTT_ZOOM_MONTH = "month";
export const GANTT_ZOOM_WEEK = "week";

/** The zoom level applied on initial load. Month shows many months at once,
 * making the descending staircase and critical chain visible without scrolling. */
export const GANTT_DEFAULT_ZOOM = GANTT_ZOOM_MONTH;

export interface GanttZoomOption {
    label: string;
    level: string;
}

export const GANTT_ZOOM_OPTIONS: GanttZoomOption[] = [
    { label: "Day", level: GANTT_ZOOM_DAY },
    { label: "Week", level: GANTT_ZOOM_WEEK },
    { label: "Month", level: GANTT_ZOOM_MONTH },
];
