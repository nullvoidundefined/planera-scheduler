/** Playwright end-to-end configuration: runs e2e/ specs against the Vite dev server. */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const WEB_SERVER_TIMEOUT_MS = 120000;
// Each worker boots its own page and renders the full 5,000-activity dataset, so
// an unbounded worker pool starves specs of CPU and inflates edit latency under
// contention (a single duration edit was seen taking ~57s when ~7 workers ran the
// heavy dataset at once). Cap the pool: serial in CI, two locally.
const WORKERS = process.env.CI ? 1 : 2;

export default defineConfig({
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    reporter: "list",
    retries: process.env.CI ? 2 : 0,
    testDir: "./e2e",
    use: { baseURL: BASE_URL, trace: "on-first-retry" },
    webServer: {
        command: "npm run dev",
        reuseExistingServer: !process.env.CI,
        timeout: WEB_SERVER_TIMEOUT_MS,
        url: BASE_URL,
    },
    workers: WORKERS,
});
