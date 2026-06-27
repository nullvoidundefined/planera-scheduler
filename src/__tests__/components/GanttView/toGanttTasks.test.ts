import { describe, expect, test } from "vitest";

import { toGanttTasks } from "../../../components/GanttView/toGanttTasks";
import { createCalendar } from "../../../services/createCalendar";
import type { ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function computed(id: string, earlyStart: number, earlyFinish: number): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical: false,
        lateFinish: earlyFinish,
        lateStart: earlyStart,
        totalFloat: 0,
    };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        { durationDays: 5, id: "a", name: "A", parentId: "ph", type: "task", wbs: "1.1" },
        { durationDays: 0, id: "m", name: "M", parentId: "ph", type: "milestone", wbs: "1.2" },
    ],
    dependencies: [],
};

const COMPUTED = new Map<string, ComputedActivity>([
    ["a", computed("a", 0, 5)],
    ["m", computed("m", 5, 5)],
]);

describe("toGanttTasks", () => {
    test("maps a leaf task with computed start date and duration", () => {
        const tasks = toGanttTasks(GRAPH, COMPUTED, createCalendar());
        const taskRow = tasks.find((row) => row.id === "a");
        expect(taskRow?.type).toBe("task");
        expect(taskRow?.duration).toBe(5);
        expect(taskRow?.parent).toBe("ph");
        expect(taskRow?.start_date).toBeInstanceOf(Date);
    });

    test("maps a group node to a DHTMLX project row rolled up from descendants", () => {
        const tasks = toGanttTasks(GRAPH, COMPUTED, createCalendar());
        const groupRow = tasks.find((row) => row.id === "ph");
        expect(groupRow?.type).toBe("project");
        expect(groupRow?.parent).toBe("0");
    });

    test("maps a milestone to a DHTMLX milestone row", () => {
        const tasks = toGanttTasks(GRAPH, COMPUTED, createCalendar());
        expect(tasks.find((row) => row.id === "m")?.type).toBe("milestone");
    });

    test("carries wbs, total float, and critical flag for the native grid columns", () => {
        const taskRow = toGanttTasks(GRAPH, COMPUTED, createCalendar()).find((row) => row.id === "a");
        expect(taskRow?.wbs).toBe("1.1");
        expect(taskRow?.totalFloat).toBe(0);
        expect(taskRow?.isCritical).toBe(false);
    });

    test("group row duration is the rolled-up span, not the stored zero", () => {
        const groupRow = toGanttTasks(GRAPH, COMPUTED, createCalendar()).find((row) => row.id === "ph");
        // The phase spans a (0-5) and m (5), so the rolled-up duration is 5 working days.
        expect(groupRow?.duration).toBe(5);
    });
});
