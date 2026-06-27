/**
 * DHTMLX Gantt lifecycle hook for the integrated grid-plus-timeline view. Initializes
 * the imperative widget once against a stable container, configures the native left
 * grid (all schedule columns, draggable grid/timeline resizer), working-time so the
 * widget counts duration in working days, zoom, the today marker, and the
 * critical-path template, then parses the computed schedule and subscribes to the
 * store to batch-update only changed bars. Drag and resize translate to a
 * resizeActivity operation; native tree collapse syncs both ways with the store's
 * collapsed set behind an echo guard so applying the store never re-dispatches.
 * React never re-renders into the widget's DOM. Cleanup clears the widget's data with
 * clearAll rather than destructor: dhtmlx-gantt's standard build exposes a single
 * global instance, and destructor would permanently kill it, breaking the re-init that
 * React StrictMode's dev double-mount forces. Updates still flow through batchUpdate,
 * never clearAll + reparse.
 */
import { gantt } from "dhtmlx-gantt";
import type { ZoomLevel } from "dhtmlx-gantt";
import { useEffect } from "react";
import type { RefObject } from "react";

import { DEFAULT_WORK_WEEK } from "../../constants/calendar";
import { DEFAULT_DAY_WIDTH_PX } from "../../constants/ganttScale";
import {
    GANTT_DEFAULT_ZOOM,
    GANTT_ZOOM_DAY,
    GANTT_ZOOM_MONTH,
    GANTT_ZOOM_WEEK,
} from "../../constants/ganttZoom";
import { OPERATION_ORIGIN_GANTT } from "../../constants/operationOrigin";
import { computeSummaries } from "../../services/cpm/computeSummaries";
import { createCalendar } from "../../services/createCalendar";
import { getPhaseColorIndex } from "../../services/getPhaseColorIndex";
import { useScheduleStore } from "../../state/scheduleStore";
import { useScheduleSelection } from "../../state/useScheduleSelection";
import type { ComputedActivity } from "../../types/schedule";

import { attachGridResizer } from "./attachGridResizer";
import { GANTT_GRID_COLUMNS } from "./ganttGridColumns";
import { resolveCriticalLinkClass } from "./resolveCriticalLinkClass";
import { resolveCriticalTaskClass } from "./resolveCriticalTaskClass";
import { resolveGroupColorClass } from "./resolveGroupColorClass";
import { toGanttLinks } from "./toGanttLinks";
import { toGanttTasks } from "./toGanttTasks";

const CP_STAR_HTML = '<span class="cp-star">★</span>';
const DAY_SCALE_HEIGHT_PX = 27;
const DAYS_PER_WEEK = 7;
const GANTT_BAR_HEIGHT_PX = 18;
const GANTT_DATE_FORMAT = "%Y-%m-%d %H:%i";
const GANTT_DURATION_UNIT = "day";
const GANTT_GRID_WIDTH_PX = 920;
const GANTT_RESIZER_WIDTH_PX = 8;
const GANTT_ROW_HEIGHT_PX = 30;
const GROUP_ACTIVITY_TYPE = "group";
const MIN_BAR_DURATION_DAYS = 1;
const MONTH_COLUMN_WIDTH_PX = 120;
const MULTI_SCALE_HEIGHT_PX = 50;
const TODAY_MARKER_CSS = "today";
const TODAY_MARKER_TEXT = "Today";
const WEEK_COLUMN_WIDTH_PX = 80;
const WEEK_SCALE_FORMAT = "Week #%W";

// Draggable resizer between the grid and the timeline (the integrated split the
// task asks for); keep_grid_width holds the grid width steady while columns resize.
const GANTT_LAYOUT = {
    css: "gantt_container",
    rows: [
        {
            cols: [
                { id: "grid", scrollX: "scrollHor", scrollY: "scrollVer", view: "grid" },
                { resizer: true, width: GANTT_RESIZER_WIDTH_PX },
                { id: "timeline", scrollX: "scrollHor", scrollY: "scrollVer", view: "timeline" },
                { id: "scrollVer", scroll: "y", view: "scrollbar" },
            ],
        },
        { height: 20, id: "scrollHor", scroll: "x", view: "scrollbar" },
    ],
};

const ZOOM_LEVELS: { current: string; levels: ZoomLevel[] } = {
    current: GANTT_DEFAULT_ZOOM,
    levels: [
        {
            min_column_width: DEFAULT_DAY_WIDTH_PX,
            name: GANTT_ZOOM_DAY,
            scale_height: DAY_SCALE_HEIGHT_PX,
            scales: [{ format: "%d %M", step: 1, unit: GANTT_ZOOM_DAY }],
        },
        {
            min_column_width: WEEK_COLUMN_WIDTH_PX,
            name: GANTT_ZOOM_WEEK,
            scale_height: MULTI_SCALE_HEIGHT_PX,
            scales: [
                { format: WEEK_SCALE_FORMAT, step: 1, unit: GANTT_ZOOM_WEEK },
                { format: "%D", step: 1, unit: GANTT_ZOOM_DAY },
            ],
        },
        {
            min_column_width: MONTH_COLUMN_WIDTH_PX,
            name: GANTT_ZOOM_MONTH,
            scale_height: MULTI_SCALE_HEIGHT_PX,
            scales: [
                { format: "%F, %Y", step: 1, unit: GANTT_ZOOM_MONTH },
                { format: WEEK_SCALE_FORMAT, step: 1, unit: GANTT_ZOOM_WEEK },
            ],
        },
    ],
};

// Guards the collapse feedback loop: applyCollapseToGantt calls gantt.open/close
// programmatically, which fires onTaskOpened/onTaskClosed. Dispatching for those
// would flip the shared collapsed set back and oscillate forever, so the handler
// dispatches only when this flag is clear (a genuine user chevron click).
let suppressCollapseEcho = false;

// The phase -> color index map for the loaded schedule, derived once from the full
// activity list at init and read by the task_class template to paint each bar its
// phase tone. The activity list is stable for the session, so the map never changes.
let ganttPhaseColorIndex: Map<string, number> = new Map();

export function useGanttInit(containerRef: RefObject<HTMLDivElement | null>): void {
    useEffect(() => {
        const container = containerRef.current;
        if (container === null) {
            return;
        }

        const calendar = createCalendar();
        configureGantt();
        gantt.init(container);
        const detachGridResizer = attachGridResizer(container);
        applyZoomLevels();
        addTodayMarker();

        const { collapsed, computed, graph } = useScheduleStore.getState();
        ganttPhaseColorIndex = getPhaseColorIndex(graph.activities);
        gantt.parse({
            links: toGanttLinks(graph.dependencies),
            tasks: toGanttTasks(graph, computed, calendar),
        });
        applyCollapseToGantt(collapsed);
        scrollToProjectStart(computed, calendar);

        const detachDrag = attachDragHandler();
        const detachSelection = attachSelectionHandler();
        const detachCollapse = attachCollapseHandlers();
        const unsubscribe = subscribeComputed(calendar);
        const unsubscribeSelection = subscribeSelection();
        const unsubscribeCollapse = subscribeCollapse();

        return () => {
            detachDrag();
            detachGridResizer();
            detachSelection();
            detachCollapse();
            unsubscribe();
            unsubscribeSelection();
            unsubscribeCollapse();
            gantt.clearAll();
        };
    }, [containerRef]);
}

function configureGantt(): void {
    gantt.plugins({ marker: true });
    gantt.config.date_format = GANTT_DATE_FORMAT;
    gantt.config.row_height = GANTT_ROW_HEIGHT_PX;
    gantt.config.bar_height = GANTT_BAR_HEIGHT_PX;
    gantt.config.columns = GANTT_GRID_COLUMNS;
    gantt.config.layout = GANTT_LAYOUT;
    gantt.config.grid_width = GANTT_GRID_WIDTH_PX;
    gantt.config.keep_grid_width = true;
    // Render the full date-header scale once instead of only its visible slice.
    // With smart_scales on (the default), DHTMLX tears down and rebuilds the scale
    // cells for each new visible window on every scroll event; a scroll that lands
    // mid-rebuild flashes a partially populated header, so the month and week rows
    // appear to collapse and misalign during fast horizontal scrolling. Rendering
    // the whole scale up front (a few hundred cells at the default Month zoom) keeps
    // it static in the DOM, so horizontal scroll only translates it and the rows
    // stay pixel-aligned with the bars. The data-area bars still virtualize through
    // smart_rendering, which is left on.
    gantt.config.smart_scales = false;
    applyWorkTime();
    gantt.templates.task_class = (_start, _end, task) => {
        const computed = useScheduleStore.getState().computed.get(String(task.id));
        const phaseClass = resolveGroupColorClass(
            { id: String(task.id), parent: String(task.parent) },
            ganttPhaseColorIndex,
        );
        return [phaseClass, resolveCriticalTaskClass(computed)].filter(Boolean).join(" ");
    };
    // A gold star to the left of every critical leaf bar: a non-color critical cue
    // that survives the pastel bars (the .cp-star outline holds it >= 3:1 on any hue).
    gantt.templates.leftside_text = (_start, _end, task) =>
        useScheduleStore.getState().computed.get(String(task.id))?.isCritical === true
            ? CP_STAR_HTML
            : "";
    gantt.templates.link_class = (link) => {
        const { computed } = useScheduleStore.getState();
        return resolveCriticalLinkClass(
            computed.get(String(link.source)),
            computed.get(String(link.target)),
        );
    };
}

function applyWorkTime(): void {
    // The CPM engine and the working-day calendar count duration in working days.
    // work_time makes DHTMLX count the same way, so a drag to N days stores N
    // working days and dateFromIndex round-trips exactly (no weekend-skew inflation).
    gantt.config.work_time = true;
    // skip_off_time hides weekend columns; it is a DHTMLX PRO-only feature and a
    // no-op in this GPL build. The drag-unit fix does not depend on it; work_time
    // alone aligns the duration counts. Set to document the intended PRO behavior.
    gantt.config.skip_off_time = true;
    gantt.config.duration_unit = GANTT_DURATION_UNIT;
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
        if (!DEFAULT_WORK_WEEK.includes(day)) {
            gantt.setWorkTime({ day, hours: false });
        }
    }
}

function applyZoomLevels(): void {
    gantt.ext.zoom.init(ZOOM_LEVELS);
    gantt.ext.zoom.setLevel(GANTT_DEFAULT_ZOOM);
}

function scrollToProjectStart(
    computed: Map<string, ComputedActivity>,
    calendar: ReturnType<typeof createCalendar>,
): void {
    let minEarlyStart = Infinity;
    for (const activity of computed.values()) {
        if (activity.earlyStart < minEarlyStart) {
            minEarlyStart = activity.earlyStart;
        }
    }
    if (isFinite(minEarlyStart)) {
        gantt.showDate(calendar.dateFromIndex(minEarlyStart));
    }
}

function addTodayMarker(): void {
    gantt.addMarker({ css: TODAY_MARKER_CSS, start_date: new Date(), text: TODAY_MARKER_TEXT });
}

function attachDragHandler(): () => void {
    const id = gantt.attachEvent("onAfterTaskDrag", (taskId) => {
        const task = gantt.getTask(taskId);
        useScheduleStore.getState().dispatchOperation(
            {
                activityId: String(taskId),
                durationDays: Number(task.duration),
                kind: "resizeActivity",
            },
            OPERATION_ORIGIN_GANTT,
        );
    });
    return () => gantt.detachEvent(id);
}

function attachSelectionHandler(): () => void {
    const id = gantt.attachEvent("onTaskSelected", (taskId) => {
        useScheduleSelection.getState().selectActivity(String(taskId));
    });
    return () => gantt.detachEvent(id);
}

function attachCollapseHandlers(): () => void {
    const openId = gantt.attachEvent("onTaskOpened", handleCollapseToggle);
    const closeId = gantt.attachEvent("onTaskClosed", handleCollapseToggle);
    return () => {
        gantt.detachEvent(openId);
        gantt.detachEvent(closeId);
    };
}

function handleCollapseToggle(taskId: string | number): boolean {
    if (!suppressCollapseEcho) {
        useScheduleStore
            .getState()
            .dispatchOperation(
                { kind: "toggleCollapse", rowId: String(taskId) },
                OPERATION_ORIGIN_GANTT,
            );
    }
    return true;
}

function subscribeComputed(calendar: ReturnType<typeof createCalendar>): () => void {
    return useScheduleStore.subscribe((state, previous) => {
        if (state.computed === previous.computed) {
            return;
        }
        // Skip echoing the Gantt's own drag: the bar already reflects the user's
        // drag, so re-applying the store update it triggered would be redundant work.
        if (state.lastOperationOrigin === OPERATION_ORIGIN_GANTT) {
            return;
        }
        applyComputedToGantt(state.computed, calendar);
    });
}

function subscribeSelection(): () => void {
    return useScheduleSelection.subscribe((state, previous) => {
        if (state.selectedActivityId === previous.selectedActivityId) {
            return;
        }
        if (state.selectedActivityId !== null && gantt.isTaskExists(state.selectedActivityId)) {
            gantt.selectTask(state.selectedActivityId);
        }
    });
}

function subscribeCollapse(): () => void {
    return useScheduleStore.subscribe((state, previous) => {
        if (state.collapsed === previous.collapsed) {
            return;
        }
        applyCollapseToGantt(state.collapsed);
    });
}

function applyCollapseToGantt(collapsed: Set<string>): void {
    const { graph } = useScheduleStore.getState();
    suppressCollapseEcho = true;
    gantt.batchUpdate(() => {
        for (const activity of graph.activities) {
            if (activity.type !== GROUP_ACTIVITY_TYPE || !gantt.isTaskExists(activity.id)) {
                continue;
            }
            const shouldCollapse = collapsed.has(activity.id);
            const isOpen = gantt.getTask(activity.id).$open !== false;
            if (shouldCollapse && isOpen) {
                gantt.close(activity.id);
            } else if (!shouldCollapse && !isOpen) {
                gantt.open(activity.id);
            }
        }
    });
    suppressCollapseEcho = false;
}

function applyComputedToGantt(
    computed: Map<string, ComputedActivity>,
    calendar: ReturnType<typeof createCalendar>,
): void {
    const { graph } = useScheduleStore.getState();
    const summaries = computeSummaries(graph, computed);
    gantt.batchUpdate(() => {
        for (const [id, entry] of computed) {
            if (!gantt.isTaskExists(id)) {
                continue;
            }
            const task = gantt.getTask(id);
            // Set both endpoints, not duration: DHTMLX renders the bar from
            // start_date/end_date and recomputes duration from them on update, so
            // a duration-only assignment is discarded and the bar never resizes.
            const endIndex = Math.max(entry.earlyFinish, entry.earlyStart + MIN_BAR_DURATION_DAYS);
            task.start_date = calendar.dateFromIndex(entry.earlyStart);
            task.end_date = calendar.dateFromIndex(endIndex);
            task.totalFloat = entry.totalFloat;
            task.isCritical = entry.isCritical;
            gantt.updateTask(id);
        }
        // Refresh the rolled-up float and critical cue on group rows; DHTMLX
        // auto-rolls their span dates and duration from the updated leaves.
        for (const [id, summary] of summaries) {
            if (!gantt.isTaskExists(id)) {
                continue;
            }
            const task = gantt.getTask(id);
            task.totalFloat = summary.totalFloat;
            task.isCritical = summary.isCritical;
            gantt.updateTask(id);
        }
    });
}
