import { expect, test } from "@playwright/test";

import { gotoSchedule, waitForFirstGanttBar } from "./helpers/appReady";

// The Gantt mounts after the grid on this dataset, so its first paint gets the
// full load ceiling rather than the tighter grid-ready budget.
const GANTT_RENDER_TIMEOUT_MS = 30000;

// The viewport fits roughly ten date-header cells across the two scale rows. The
// multi-year seeded schedule has hundreds of week and month cells, so a full-scale
// header far exceeds this. The threshold separates a fully rendered static header
// (smart_scales off) from a visible-window-only header that rebuilds on scroll.
const MIN_FULL_SCALE_CELL_COUNT = 100;

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

test("renders the full date-header scale so horizontal scroll never rebuilds it", async ({
    page,
}) => {
    await gotoSchedule(page);
    await waitForFirstGanttBar(page, GANTT_RENDER_TIMEOUT_MS);
    // The whole multi-year scale is rendered up front rather than only the visible
    // slice, so horizontal scroll translates a static header instead of tearing it
    // down and rebuilding it for each window, which is what made the month and week
    // rows collapse mid-scroll. A visible-window-only header would hold ~10 cells.
    const scaleCellCount = await page.locator(".gantt_task_scale .gantt_scale_cell").count();
    expect(scaleCellCount).toBeGreaterThan(MIN_FULL_SCALE_CELL_COUNT);
});
