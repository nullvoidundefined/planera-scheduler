import { expect, test } from "@playwright/test";

import { gotoSchedule, waitForTreegrid } from "./helpers/appReady";

test("renders the tree-data grid with grouped rows", async ({ page }) => {
    await gotoSchedule(page);
    await waitForTreegrid(page);
    await expect(page.getByText("Site Preparation").first()).toBeVisible();
    await expect(page.locator(".ag-row").first()).toBeVisible();
});
