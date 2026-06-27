import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { gotoSchedule, LOAD_TIMEOUT_MS, waitForTreegrid } from "./helpers/appReady";

const SEPARATOR_NAME = "Resize the table and timeline panes";

// DHTMLX (.gantt_container) and AG-Grid (.ag-root-wrapper) each manage their own
// internal ARIA tree; AG-Grid's treegrid root raises a known vendor
// aria-required-children finding we do not control. The shell's own chrome,
// landmarks, headings, toolbar, legend, and separator are what this suite audits,
// so the vendor widget subtrees are excluded from the scan.
const VENDOR_WIDGET_SELECTORS = [".ag-root-wrapper", ".gantt_container"];

test("renders the toolbar and both split panes", async ({ page }) => {
    await gotoSchedule(page);
    await expect(page.getByRole("toolbar", { name: "Schedule controls" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    await waitForTreegrid(page);
    await expect(page.getByTestId("gantt-container")).toBeVisible();
    await expect(page.getByRole("separator", { name: SEPARATOR_NAME })).toBeVisible();
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
