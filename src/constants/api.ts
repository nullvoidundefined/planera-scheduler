/**
 * API base path and route path constants used by mock handlers and fetch
 * wrappers to keep URLs consistent across the application.
 */

export const API_BASE = "/api";

export const API_ROUTES = {
    projects: `${API_BASE}/projects`,
    schedule: `${API_BASE}/schedule`,
} as const;
