/**
 * Fetch wrapper for the schedule graph API route. Returns the full
 * ScheduleGraph including projects, groups, activities, and dependencies.
 * Throws on non-2xx responses.
 */
import { API_ROUTES } from "../constants/api";
import type { ScheduleGraph } from "../types/schedule";

export async function fetchScheduleGraph(): Promise<ScheduleGraph> {
    const response = await fetch(API_ROUTES.schedule);
    if (!response.ok) {
        throw new Error(`Failed to fetch schedule graph: ${response.status}`);
    }
    return response.json() as Promise<ScheduleGraph>;
}
