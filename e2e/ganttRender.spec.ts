import { expect, test } from "@playwright/test";

test("renders Gantt bars for the seeded 5000-activity schedule", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("gantt-container")).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".gantt_task_line").first()).toBeVisible({ timeout: 30000 });
    const barCount = await page.locator(".gantt_task_line").count();
    expect(barCount).toBeGreaterThan(0);
});
