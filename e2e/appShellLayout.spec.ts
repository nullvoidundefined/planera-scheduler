import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { gotoSchedule, LOAD_TIMEOUT_MS, showTableView, waitForFirstGanttBar } from "./helpers/appReady";

// DHTMLX (.gantt_container) and AG-Grid (.ag-root-wrapper) each manage their own
// internal ARIA tree; AG-Grid's treegrid root raises a known vendor
// aria-required-children finding we do not control. The shell's own chrome,
// landmarks, headings, toolbar, sub-nav, and legend are what this suite audits, so
// the vendor widget subtrees are excluded from the scan.
const VENDOR_WIDGET_SELECTORS = [".ag-root-wrapper", ".gantt_container"];

test("renders the toolbar and the integrated Gantt by default", async ({ page }) => {
    await gotoSchedule(page);
    await expect(page.getByRole("toolbar", { name: "Schedule controls" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    // The Gantt/Table sub-nav exposes both surfaces; Gantt is selected on load.
    await expect(page.getByRole("button", { name: "Gantt", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
    await expect(page.getByRole("button", { name: "Table", exact: true })).toHaveAttribute(
        "aria-pressed",
        "false",
    );
    // The integrated DHTMLX grid-plus-timeline is the visible surface.
    await expect(page.getByTestId("gantt-container")).toBeVisible();
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
});

test("the sub-nav switches to the standalone table and hides the Gantt controls", async ({
    page,
}) => {
    await gotoSchedule(page);
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
    await showTableView(page);

    // Table is now active; the Gantt-only zoom toolbar is gone from the chrome.
    await expect(page.getByRole("button", { name: "Table", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
    await expect(page.getByRole("toolbar", { name: "Schedule controls" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Schedule table" }).getByRole("treegrid")).toBeVisible();
});

test("the shell has no serious or critical accessibility violations", async ({ page }) => {
    await gotoSchedule(page);
    await expect(page.getByRole("toolbar", { name: "Schedule controls" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    let builder = new AxeBuilder({ page });
    for (const selector of VENDOR_WIDGET_SELECTORS) {
        builder = builder.exclude(selector);
    }
    const results = await builder.analyze();
    const seriousOrCritical = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(seriousOrCritical).toEqual([]);
});
