import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";

import { fetchScheduleGraph } from "../../api/fetchScheduleGraph";
import { API_ROUTES } from "../../constants/api";
import { server } from "../../mocks/mswNodeServer";

const RELATIONSHIP_TYPE_FS = "FS";
const ROOT_PROJECT_COUNT = 4;
const SERVER_ERROR_STATUS = 500;

describe("fetchScheduleGraph", () => {
    test("resolves the unified graph with the four root projects and finish-to-start edges", async () => {
        const graph = await fetchScheduleGraph();

        const rootProjects = graph.activities.filter((activity) => activity.parentId === null);
        expect(rootProjects).toHaveLength(ROOT_PROJECT_COUNT);
        expect(rootProjects.every((activity) => activity.type === "group")).toBe(true);
        expect(graph.activities.some((activity) => activity.type === "task")).toBe(true);
        expect(graph.dependencies.length).toBeGreaterThan(0);
        expect(graph.dependencies.every((edge) => edge.type === RELATIONSHIP_TYPE_FS)).toBe(true);
        expect(graph).not.toHaveProperty("projects");
    });

    test("throws when the API responds with a non-2xx status", async () => {
        server.use(
            http.get(API_ROUTES.schedule, () =>
                HttpResponse.json({}, { status: SERVER_ERROR_STATUS }),
            ),
        );
        await expect(fetchScheduleGraph()).rejects.toThrow(
            `Failed to fetch schedule graph: ${SERVER_ERROR_STATUS}`,
        );
    });
});
