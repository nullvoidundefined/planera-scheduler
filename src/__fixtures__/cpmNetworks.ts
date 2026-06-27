/**
 * Hand-computed CPM network fixtures for the schedule engine, expressed in the
 * unified node model. Each acyclic fixture pairs a ScheduleGraph of leaf
 * activities with the ComputedActivity map derived by hand from the forward and
 * backward pass equations. Values are integer working-day indices: an activity
 * occupies [earlyStart, earlyStart + duration).
 */

import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../types/schedule";

interface CpmFixture {
    expected: Record<string, ComputedActivity>;
    graph: ScheduleGraph;
    name: string;
}

interface CyclicFixture {
    graph: ScheduleGraph;
    name: string;
}

function makeActivity(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: null, type: "task", wbs: "1" };
}

function makeEdge(
    predecessorId: string,
    successorId: string,
    type: Dependency["type"],
    lagDays: number,
): Dependency {
    return { id: `${predecessorId}->${successorId}`, lagDays, predecessorId, successorId, type };
}

function makeGraph(activities: Activity[], dependencies: Dependency[]): ScheduleGraph {
    return { activities, dependencies };
}

// A(5) --FS lag 2--> B(3). B cannot start until 2 days after A finishes.
export const FS_WITH_LAG: CpmFixture = {
    name: "FS_WITH_LAG",
    graph: makeGraph(
        [makeActivity("A", 5), makeActivity("B", 3)],
        [makeEdge("A", "B", "FS", 2)],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 5,
            lateStart: 0,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 7,
            earlyFinish: 10,
            lateStart: 7,
            lateFinish: 10,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// A(5) --SS lag 2--> B(3). B starts 2 days after A starts.
export const SS_WITH_LAG: CpmFixture = {
    name: "SS_WITH_LAG",
    graph: makeGraph(
        [makeActivity("A", 5), makeActivity("B", 3)],
        [makeEdge("A", "B", "SS", 2)],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 5,
            lateStart: 0,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 2,
            earlyFinish: 5,
            lateStart: 2,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// A(5) --FF lag 2--> B(3). B finishes 2 days after A finishes.
export const FF_WITH_LAG: CpmFixture = {
    name: "FF_WITH_LAG",
    graph: makeGraph(
        [makeActivity("A", 5), makeActivity("B", 3)],
        [makeEdge("A", "B", "FF", 2)],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 5,
            lateStart: 0,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 4,
            earlyFinish: 7,
            lateStart: 4,
            lateFinish: 7,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// A(5) --SF lag 5--> B(3). B finishes 5 days after A starts (EF_B = ES_A + 5 = 5).
export const SF_WITH_LAG: CpmFixture = {
    name: "SF_WITH_LAG",
    graph: makeGraph(
        [makeActivity("A", 5), makeActivity("B", 3)],
        [makeEdge("A", "B", "SF", 5)],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 5,
            lateStart: 0,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 2,
            earlyFinish: 5,
            lateStart: 2,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// A(5) --FS lag -2 (lead)--> B(4). B may start 2 days before A finishes.
export const NEGATIVE_LAG: CpmFixture = {
    name: "NEGATIVE_LAG",
    graph: makeGraph(
        [makeActivity("A", 5), makeActivity("B", 4)],
        [makeEdge("A", "B", "FS", -2)],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 5,
            lateStart: 0,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 3,
            earlyFinish: 7,
            lateStart: 3,
            lateFinish: 7,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// A(5) --FS--> M(0 milestone) --FS--> B(4). The zero-duration milestone sits on
// the critical path; EF_M === ES_M.
export const MILESTONE_ON_PATH: CpmFixture = {
    name: "MILESTONE_ON_PATH",
    graph: makeGraph(
        [makeActivity("A", 5), { ...makeActivity("M", 0), type: "milestone" }, makeActivity("B", 4)],
        [makeEdge("A", "M", "FS", 0), makeEdge("M", "B", "FS", 0)],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 5,
            lateStart: 0,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        M: {
            id: "M",
            earlyStart: 5,
            earlyFinish: 5,
            lateStart: 5,
            lateFinish: 5,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 5,
            earlyFinish: 9,
            lateStart: 5,
            lateFinish: 9,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// Diamond with two parallel paths from A to D, both FS lag 0:
//   long  path A(2)->B(6)->D(2) is critical (length 10)
//   short path A(2)->C(3)->D(2) carries positive total float of 3
export const PARALLEL_PATHS: CpmFixture = {
    name: "PARALLEL_PATHS",
    graph: makeGraph(
        [makeActivity("A", 2), makeActivity("B", 6), makeActivity("C", 3), makeActivity("D", 2)],
        [
            makeEdge("A", "B", "FS", 0),
            makeEdge("A", "C", "FS", 0),
            makeEdge("B", "D", "FS", 0),
            makeEdge("C", "D", "FS", 0),
        ],
    ),
    expected: {
        A: {
            id: "A",
            earlyStart: 0,
            earlyFinish: 2,
            lateStart: 0,
            lateFinish: 2,
            totalFloat: 0,
            isCritical: true,
        },
        B: {
            id: "B",
            earlyStart: 2,
            earlyFinish: 8,
            lateStart: 2,
            lateFinish: 8,
            totalFloat: 0,
            isCritical: true,
        },
        C: {
            id: "C",
            earlyStart: 2,
            earlyFinish: 5,
            lateStart: 5,
            lateFinish: 8,
            totalFloat: 3,
            isCritical: false,
        },
        D: {
            id: "D",
            earlyStart: 8,
            earlyFinish: 10,
            lateStart: 8,
            lateFinish: 10,
            totalFloat: 0,
            isCritical: true,
        },
    },
};

// A->B->C->A: a cycle, used to exercise the ok:false branch.
export const CYCLIC: CyclicFixture = {
    name: "CYCLIC",
    graph: makeGraph(
        [makeActivity("A", 5), makeActivity("B", 5), makeActivity("C", 5)],
        [
            makeEdge("A", "B", "FS", 0),
            makeEdge("B", "C", "FS", 0),
            makeEdge("C", "A", "FS", 0),
        ],
    ),
};

export const ACYCLIC_FIXTURES: CpmFixture[] = [
    FS_WITH_LAG,
    SS_WITH_LAG,
    FF_WITH_LAG,
    SF_WITH_LAG,
    NEGATIVE_LAG,
    MILESTONE_ON_PATH,
    PARALLEL_PATHS,
];
