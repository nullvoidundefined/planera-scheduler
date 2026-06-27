import { expect, test } from "@playwright/test";

import { gotoSchedule, waitForFirstGanttBar } from "./helpers/appReady";

// The Gantt mounts after the grid on this dataset, so its first paint gets the
// full load ceiling rather than the tighter grid-ready budget.
const GANTT_RENDER_TIMEOUT_MS = 30000;

test("renders Gantt bars for the seeded 5000-activity schedule", async ({ page }) => {
    await gotoSchedule(page);
    await expect(page.getByTestId("gantt-container")).toBeVisible({
        timeout: GANTT_RENDER_TIMEOUT_MS,
    });
    await waitForFirstGanttBar(page, GANTT_RENDER_TIMEOUT_MS);
    const barCount = await page.locator(".gantt_task_line").count();
    expect(barCount).toBeGreaterThan(0);
});
