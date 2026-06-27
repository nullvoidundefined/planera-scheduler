import { expect, test } from "@playwright/test";

import { LOAD_TIMEOUT_MS, waitForFirstGanttBar } from "./helpers/appReady";

test("the demo route mounts the live editor", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("main", { name: "Planera schedule editor" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
});

test("the demo caption can be dismissed", async ({ page }) => {
    await page.goto("/demo");
    const caption = page.getByRole("complementary", { name: "How to explore the demo" });
    // First paint of the full dataset is the slow moment, so the caption's first
    // appearance gets the same load budget the other first-paint assertions use.
    await expect(caption).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    await page.getByRole("button", { exact: true, name: "Dismiss" }).click();
    await expect(caption).toBeHidden();
});
