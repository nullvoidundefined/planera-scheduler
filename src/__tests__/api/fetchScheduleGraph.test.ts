import { describe, expect, test } from "vitest";

import { fetchScheduleGraph } from "../../api/fetchScheduleGraph";

describe("fetchScheduleGraph", () => {
    test("resolves the unified graph with activities and dependencies", async () => {
        const graph = await fetchScheduleGraph();
        expect(graph.activities.length).toBeGreaterThan(0);
        expect(graph.dependencies.length).toBeGreaterThan(0);
        expect(graph.activities.some((activity) => activity.type === "group")).toBe(true);
        expect(graph).not.toHaveProperty("projects");
    });
});
