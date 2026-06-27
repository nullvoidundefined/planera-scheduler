import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { LOAD_TIMEOUT_MS, waitForFirstGanttBar } from "./helpers/appReady";

// The DHTMLX and AG-Grid widget subtrees manage their own ARIA and raise known vendor
// findings we do not control; the demo route's a11y scan excludes them, matching
// appShellLayout.spec.ts. The prose routes have no vendor widgets, so they scan whole.
const VENDOR_WIDGET_SELECTORS = [".ag-root-wrapper", ".gantt_container"];

test("navigates Summary to Write-up to Demo through the nav", async ({ page }) => {
    await page.goto("/");
    await expect(
        page.getByRole("heading", { level: 1, name: "I built you a Planera demo" }),
    ).toBeVisible();

    // Exact match: the Summary route also has a "Read the write-up" CTA and an
    // "Open the demo" CTA, so the persistent nav links must be matched exactly.
    await page.getByRole("link", { exact: true, name: "Write-up" }).click();
    await expect(
        page.getByRole("heading", { level: 1, name: "How I think Planera's frontend is built" }),
    ).toBeVisible();

    await page.getByRole("link", { exact: true, name: "Demo" }).click();
    await expect(page.getByRole("main", { name: "Planera schedule editor" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
});

test("Summary route has no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
});

test("Architecture route has no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/architecture");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
});

test("Demo route has no serious or critical a11y violations outside vendor widgets", async ({
    page,
}) => {
    await page.goto("/demo");
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
    let builder = new AxeBuilder({ page });
    for (const selector of VENDOR_WIDGET_SELECTORS) {
        builder = builder.exclude(selector);
    }
    const results = await builder.analyze();
    const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
});
