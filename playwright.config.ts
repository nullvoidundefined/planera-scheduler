/** Playwright end-to-end configuration: runs e2e/ specs against the Vite dev server. */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const WEB_SERVER_TIMEOUT_MS = 120000;

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
});
