import { expect, test } from "@playwright/test";

import { getScheduleTable, gotoSchedule, showTableView } from "./helpers/appReady";

test("renders the tree-data grid with grouped rows", async ({ page }) => {
    await gotoSchedule(page);
    // The table is the standalone surface behind the sub-nav; switch to it first.
    await showTableView(page);
    // Scope to the AG-Grid region: activity names also appear in the DHTMLX Name
    // column on the hidden Gantt layer, so an unscoped text match is ambiguous.
    const table = getScheduleTable(page);
    await expect(table.getByText("Site Preparation").first()).toBeVisible();
    await expect(table.locator(".ag-row").first()).toBeVisible();
});
