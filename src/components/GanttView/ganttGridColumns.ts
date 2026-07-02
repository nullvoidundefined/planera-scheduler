/**
 * Column definitions for the DHTMLX Gantt's native left grid: the integrated grid
 * half of the unified grid-plus-timeline. Columns render WBS, the Name tree column
 * (indent and collapse chevron), Duration, Start, Finish, Total Float, and a
 * non-color critical cue, in that order. Date columns format the task's live
 * Date endpoints through the shared label formatter; WBS, Float, and the critical
 * flag read the custom properties toGanttTasks writes onto each row. Group rows
 * carry DHTMLX's rolled-up span on duration and the endpoints, so summaries show a
 * span, never zero.
 */
import type { GridColumn, Task } from "dhtmlx-gantt";

import { formatDateLabel } from "../../services/formatDateLabel";

const CRITICAL_COLUMN_WIDTH_PX = 56;
const CRITICAL_TAG_HTML = '<span class="gantt-critical-tag">★ CP</span>';
const DURATION_COLUMN_WIDTH_PX = 96;
const EMPTY_CELL = "";
const FINISH_COLUMN_WIDTH_PX = 104;
const FLOAT_COLUMN_WIDTH_PX = 88;
const NAME_COLUMN_MIN_WIDTH_PX = 200;
const NAME_COLUMN_WIDTH = "*";
const START_COLUMN_WIDTH_PX = 104;
const WBS_COLUMN_WIDTH_PX = 96;

export const GANTT_GRID_COLUMNS: GridColumn[] = [
    {
        align: "left",
        label: "WBS",
        name: "wbs",
        resize: true,
        template: renderWbs,
        width: WBS_COLUMN_WIDTH_PX,
    },
    {
        align: "left",
        label: "Name",
        min_width: NAME_COLUMN_MIN_WIDTH_PX,
        name: "text",
        resize: true,
        tree: true,
        width: NAME_COLUMN_WIDTH,
    },
    {
        align: "right",
        label: "Duration (d)",
        name: "duration",
        resize: true,
        template: renderDuration,
        width: DURATION_COLUMN_WIDTH_PX,
    },
    {
        align: "center",
        label: "Start",
        name: "start_date",
        resize: true,
        template: renderStart,
        width: START_COLUMN_WIDTH_PX,
    },
    {
        align: "center",
        label: "Finish",
        name: "end_date",
        resize: true,
        template: renderFinish,
        width: FINISH_COLUMN_WIDTH_PX,
    },
    {
        align: "right",
        label: "Total Float (d)",
        name: "totalFloat",
        resize: true,
        template: renderTotalFloat,
        width: FLOAT_COLUMN_WIDTH_PX,
    },
    {
        align: "center",
        label: "CP",
        name: "critical",
        template: renderCritical,
        width: CRITICAL_COLUMN_WIDTH_PX,
    },
];

function renderWbs(task: Task): string {
    return String(task.wbs ?? EMPTY_CELL);
}

function renderDuration(task: Task): string {
    return String(task.duration ?? 0);
}

function renderStart(task: Task): string {
    return task.start_date ? formatDateLabel(task.start_date) : EMPTY_CELL;
}

function renderFinish(task: Task): string {
    return task.end_date ? formatDateLabel(task.end_date) : EMPTY_CELL;
}

function renderTotalFloat(task: Task): string {
    return String(task.totalFloat ?? 0);
}

function renderCritical(task: Task): string {
    return task.isCritical === true ? CRITICAL_TAG_HTML : EMPTY_CELL;
}
