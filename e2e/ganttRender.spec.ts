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

test("renders the integrated native grid with all schedule columns", async ({ page }) => {
    await gotoSchedule(page);
    await waitForFirstGanttBar(page, GANTT_RENDER_TIMEOUT_MS);
    // The DHTMLX grid (left half of the integrated view) carries every schedule
    // column; assert the header row renders the full ordered set.
    const headers = page.locator(".gantt_grid_scale .gantt_grid_head_cell");
    for (const label of ["WBS", "Name", "Duration (d)", "Start", "Finish", "Total Float (d)", "CP"]) {
        await expect(headers.filter({ hasText: label }).first()).toBeVisible();
    }
    // The integrated view renders both halves: the native grid alongside the timeline.
    await expect(page.locator(".gantt_grid").first()).toBeVisible();
    await expect(page.locator(".gantt_task").first()).toBeVisible();
});
