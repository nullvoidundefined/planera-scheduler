/**
 * DHTMLX Gantt lifecycle hook. Initializes the imperative widget once against a
 * stable container, parses the computed schedule, configures zoom, the today
 * marker, and the critical-path template, and subscribes to the store to
 * batch-update only changed bars. Drag and resize translate to a resizeActivity
 * operation. React never re-renders into the widget's DOM. Zoom and the marker are
 * applied after gantt.init, since DHTMLX's zoom setLevel reaches into the timeline
 * views that only exist once the widget is initialized. Cleanup clears the widget's
 * data with clearAll rather than destructor: dhtmlx-gantt's standard build exposes a
 * single global instance, and destructor would permanently kill it, breaking the
 * re-init that React StrictMode's dev double-mount forces. Updates still flow through
 * batchUpdate, never clearAll + reparse.
 */
import { gantt } from "dhtmlx-gantt";
import type { ZoomLevel } from "dhtmlx-gantt";
import { useEffect } from "react";
import type { RefObject } from "react";

import { resolveCriticalLinkClass } from "./resolveCriticalLinkClass";
import { resolveCriticalTaskClass } from "./resolveCriticalTaskClass";
import { toGanttLinks } from "./toGanttLinks";
import { toGanttTasks } from "./toGanttTasks";
import { DEFAULT_DAY_WIDTH_PX } from "../../constants/ganttScale";
import { GANTT_ZOOM_DAY, GANTT_ZOOM_MONTH, GANTT_ZOOM_WEEK } from "../../constants/ganttZoom";
import { OPERATION_ORIGIN_GANTT } from "../../constants/operationOrigin";
import { createCalendar } from "../../services/createCalendar";
import { useScheduleStore } from "../../state/scheduleStore";
import { useScheduleSelection } from "../../state/useScheduleSelection";
import type { ComputedActivity } from "../../types/schedule";

const DAY_SCALE_HEIGHT_PX = 27;
const GANTT_BAR_HEIGHT_PX = 18;
const GANTT_DATE_FORMAT = "%Y-%m-%d %H:%i";
const GANTT_ROW_HEIGHT_PX = 30;
const MIN_BAR_DURATION_DAYS = 1;
const MONTH_COLUMN_WIDTH_PX = 120;
const MULTI_SCALE_HEIGHT_PX = 50;
const TODAY_MARKER_CSS = "today";
const TODAY_MARKER_TEXT = "Today";
const WEEK_COLUMN_WIDTH_PX = 80;
const WEEK_SCALE_FORMAT = "Week #%W";

const ZOOM_LEVELS: { current: string; levels: ZoomLevel[] } = {
    current: GANTT_ZOOM_DAY,
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

export function useGanttInit(containerRef: RefObject<HTMLDivElement | null>): void {
    useEffect(() => {
        const container = containerRef.current;
        if (container === null) {
            return;
        }

        const calendar = createCalendar();
        configureGantt();
        gantt.init(container);
        applyZoomLevels();
        addTodayMarker();

        const { computed, graph } = useScheduleStore.getState();
        gantt.parse({
            links: toGanttLinks(graph.dependencies),
            tasks: toGanttTasks(graph, computed, calendar),
        });

        const detachDrag = attachDragHandler();
        const detachSelection = attachSelectionHandler();
        const unsubscribe = subscribeComputed(calendar);
        const unsubscribeSelection = subscribeSelection();

        return () => {
            detachDrag();
            detachSelection();
            unsubscribe();
            unsubscribeSelection();
            gantt.clearAll();
        };
    }, [containerRef]);
}

function configureGantt(): void {
    gantt.plugins({ marker: true });
    gantt.config.date_format = GANTT_DATE_FORMAT;
    gantt.config.row_height = GANTT_ROW_HEIGHT_PX;
    gantt.config.bar_height = GANTT_BAR_HEIGHT_PX;
    gantt.templates.task_class = (_start, _end, task) =>
        resolveCriticalTaskClass(useScheduleStore.getState().computed.get(String(task.id)));
    gantt.templates.link_class = (link) => {
        const { computed } = useScheduleStore.getState();
        return resolveCriticalLinkClass(
            computed.get(String(link.source)),
            computed.get(String(link.target)),
        );
    };
}

function applyZoomLevels(): void {
    gantt.ext.zoom.init(ZOOM_LEVELS);
    gantt.ext.zoom.setLevel(GANTT_ZOOM_DAY);
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

function applyComputedToGantt(
    computed: Map<string, ComputedActivity>,
    calendar: ReturnType<typeof createCalendar>,
): void {
    gantt.batchUpdate(() => {
        for (const [id, entry] of computed) {
            if (gantt.isTaskExists(id)) {
                const task = gantt.getTask(id);
                // Set both endpoints, not duration: DHTMLX renders the bar from
                // start_date/end_date and recomputes duration from them on update, so
                // a duration-only assignment is discarded and the bar never resizes.
                const endIndex = Math.max(
                    entry.earlyFinish,
                    entry.earlyStart + MIN_BAR_DURATION_DAYS,
                );
                task.start_date = calendar.dateFromIndex(entry.earlyStart);
                task.end_date = calendar.dateFromIndex(endIndex);
                gantt.updateTask(id);
            }
        }
    });
}
