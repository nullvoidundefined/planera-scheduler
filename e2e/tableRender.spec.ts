import { expect, test } from "@playwright/test";

test("renders the tree-data grid with grouped rows", async ({ page }) => {
    await page.goto("/");
    const tableSection = page.getByRole("region", { name: "Schedule table" });
    await expect(tableSection.getByRole("treegrid")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Site Preparation").first()).toBeVisible();
    await expect(page.locator(".ag-row").first()).toBeVisible();
});
