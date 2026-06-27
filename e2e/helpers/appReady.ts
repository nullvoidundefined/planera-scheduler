/**
 * Shared E2E setup: navigate to the schedule and wait for the surfaces to be
 * ready. The shell now shows one full-width surface at a time behind a Gantt/Table
 * sub-nav; the Gantt is the default, so table specs switch to it via showTableView
 * before asserting on the grid. Factored out so every spec opens the app and waits
 * the same way, with one set of load-budget constants instead of per-file copies.
 */
import { expect, type Page } from "@playwright/test";

const TABLE_VIEW_BUTTON_NAME = "Table";

// First paint of the full 5,000-activity dataset (MSW fetch, store bootstrap, CPM
// pass, both widgets mounting) is the slowest moment; the grid/Gantt are ready
// shortly after the treegrid mounts, so they get a tighter ceiling.
export const GRID_READY_TIMEOUT_MS = 10000;
export const LOAD_TIMEOUT_MS = 30000;

export function getScheduleTable(page: Page) {
    return page.getByRole("region", { name: "Schedule table" });
}

export async function gotoSchedule(page: Page): Promise<void> {
    await page.goto("/");
}

export async function waitForFirstGanttBar(
    page: Page,
    timeoutMs: number = GRID_READY_TIMEOUT_MS,
): Promise<void> {
    await expect(page.locator(".gantt_task_line").first()).toBeVisible({ timeout: timeoutMs });
}

export async function waitForTreegrid(page: Page): Promise<void> {
    await expect(getScheduleTable(page).getByRole("treegrid")).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
}

// Switch the shell to the standalone AG-Grid table surface, then wait for its
// treegrid to be visible. Table specs call this after gotoSchedule because the
// Gantt is the default surface and the table starts hidden behind the sub-nav.
export async function showTableView(page: Page): Promise<void> {
    await page.getByRole("button", { exact: true, name: TABLE_VIEW_BUTTON_NAME }).click();
    await waitForTreegrid(page);
}
