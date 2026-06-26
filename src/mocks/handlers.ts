/**
 * MSW request handlers for the mock API. Generates the unified schedule graph
 * once at module scope so every request within a run returns the same stable
 * dataset of projects, phases, activities, and dependencies.
 */
import { http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";

import { API_ROUTES } from "../constants/api";
import { generateSchedule } from "../services/generateSchedule";

const scheduleGraph = generateSchedule();

export const handlers: RequestHandler[] = [
    http.get(API_ROUTES.schedule, () => {
        return HttpResponse.json(scheduleGraph);
    }),
];
