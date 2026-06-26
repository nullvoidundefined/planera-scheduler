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

import { resolveCriticalTaskClass } from "./resolveCriticalTaskClass";
import { toGanttLinks } from "./toGanttLinks";
import { toGanttTasks } from "./toGanttTasks";
import { DEFAULT_DAY_WIDTH_PX } from "../../constants/ganttScale";
import { createCalendar } from "../../services/createCalendar";
import { useScheduleStore } from "../../state/scheduleStore";
import type { ComputedActivity } from "../../types/schedule";

const DAY_SCALE_HEIGHT_PX = 27;
const DAY_ZOOM_LEVEL = "day";
const GANTT_DATE_FORMAT = "%Y-%m-%d %H:%i";
const MIN_BAR_DURATION_DAYS = 1;
const MONTH_COLUMN_WIDTH_PX = 120;
const MONTH_ZOOM_LEVEL = "month";
const MULTI_SCALE_HEIGHT_PX = 50;
const TODAY_MARKER_CSS = "today";
const TODAY_MARKER_TEXT = "Today";
const WEEK_COLUMN_WIDTH_PX = 80;
const WEEK_SCALE_FORMAT = "Week #%W";
const WEEK_ZOOM_LEVEL = "week";

const ZOOM_LEVELS: { current: string; levels: ZoomLevel[] } = {
    current: DAY_ZOOM_LEVEL,
    levels: [
        {
            min_column_width: DEFAULT_DAY_WIDTH_PX,
            name: DAY_ZOOM_LEVEL,
            scale_height: DAY_SCALE_HEIGHT_PX,
            scales: [{ format: "%d %M", step: 1, unit: DAY_ZOOM_LEVEL }],
        },
        {
            min_column_width: WEEK_COLUMN_WIDTH_PX,
            name: WEEK_ZOOM_LEVEL,
            scale_height: MULTI_SCALE_HEIGHT_PX,
            scales: [
                { format: WEEK_SCALE_FORMAT, step: 1, unit: WEEK_ZOOM_LEVEL },
                { format: "%D", step: 1, unit: DAY_ZOOM_LEVEL },
            ],
        },
        {
            min_column_width: MONTH_COLUMN_WIDTH_PX,
            name: MONTH_ZOOM_LEVEL,
            scale_height: MULTI_SCALE_HEIGHT_PX,
            scales: [
                { format: "%F, %Y", step: 1, unit: MONTH_ZOOM_LEVEL },
                { format: WEEK_SCALE_FORMAT, step: 1, unit: WEEK_ZOOM_LEVEL },
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
        const unsubscribe = subscribeComputed(calendar);

        return () => {
            detachDrag();
            unsubscribe();
            gantt.clearAll();
        };
    }, [containerRef]);
}

function configureGantt(): void {
    gantt.plugins({ marker: true });
    gantt.config.date_format = GANTT_DATE_FORMAT;
    gantt.templates.task_class = (_start, _end, task) =>
        resolveCriticalTaskClass(useScheduleStore.getState().computed.get(String(task.id)));
}

function applyZoomLevels(): void {
    gantt.ext.zoom.init(ZOOM_LEVELS);
    gantt.ext.zoom.setLevel(DAY_ZOOM_LEVEL);
}

function addTodayMarker(): void {
    gantt.addMarker({ css: TODAY_MARKER_CSS, start_date: new Date(), text: TODAY_MARKER_TEXT });
}

function attachDragHandler(): () => void {
    const id = gantt.attachEvent("onAfterTaskDrag", (taskId) => {
        const task = gantt.getTask(taskId);
        useScheduleStore.getState().dispatchOperation({
            activityId: String(taskId),
            durationDays: Number(task.duration),
            kind: "resizeActivity",
        });
    });
    return () => gantt.detachEvent(id);
}

function subscribeComputed(calendar: ReturnType<typeof createCalendar>): () => void {
    return useScheduleStore.subscribe((state, previous) => {
        if (state.computed === previous.computed && state.graph === previous.graph) {
            return;
        }
        applyComputedToGantt(state.computed, calendar);
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
                task.start_date = calendar.dateFromIndex(entry.earlyStart);
                task.duration = Math.max(
                    entry.earlyFinish - entry.earlyStart,
                    MIN_BAR_DURATION_DAYS,
                );
                gantt.updateTask(id);
            }
        }
    });
}
