import { describe, expect, test } from "vitest";

import { selectDownstreamCone } from "../../../services/cpm/selectDownstreamCone";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";

function buildTask(id: string): Activity {
    return { durationDays: 1, id, name: id, parentId: "ph", type: "task", wbs: "1" };
}

function buildEdge(predecessorId: string, successorId: string): Dependency {
    return {
        id: `${predecessorId}->${successorId}`,
        lagDays: 0,
        predecessorId,
        successorId,
        type: "FS",
    };
}

// a -> b -> d ; a -> c -> d ; e is isolated
const GRAPH: ScheduleGraph = {
    activities: [buildTask("a"), buildTask("b"), buildTask("c"), buildTask("d"), buildTask("e")],
    dependencies: [
        buildEdge("a", "b"),
        buildEdge("a", "c"),
        buildEdge("b", "d"),
        buildEdge("c", "d"),
    ],
};

describe("selectDownstreamCone", () => {
    test("includes the activity and all transitive successors", () => {
        expect([...selectDownstreamCone(GRAPH, "a")].sort()).toEqual(["a", "b", "c", "d"]);
    });

    test("a leaf with no successors cones to itself", () => {
        expect([...selectDownstreamCone(GRAPH, "d")]).toEqual(["d"]);
    });

    test("an isolated activity cones to itself", () => {
        expect([...selectDownstreamCone(GRAPH, "e")]).toEqual(["e"]);
    });
});
