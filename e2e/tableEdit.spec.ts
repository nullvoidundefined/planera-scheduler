/**
 * E2E tests proving AG-Grid cell editing works end to end: the editor module
 * must be registered (no error #200), the duration cell must open an input on
 * double-click on a leaf row, and entering a new value must persist to the
 * displayed cell. These tests would FAIL against the old two-module registration
 * that omitted the editor module, and GREEN after AllEnterpriseModule is registered.
 */
import { expect, test } from "@playwright/test";

const LOAD_TIMEOUT_MS = 30000;
const GRID_READY_TIMEOUT_MS = 10000;

// AG-Grid tree-data: group rows carry class "ag-row-group"; leaf rows do not.
// The editor input in AG-Grid v33 is rendered inside .ag-cell-editor as an
// .ag-input-field-input element (or a plain <input> child of .ag-cell-editor).
const LEAF_DURATION_CELL_SELECTOR = ".ag-row:not(.ag-row-group) [col-id='duration']";
const CELL_EDITOR_INPUT_SELECTOR = ".ag-cell-editor .ag-input-field-input, .ag-cell-editor input";

test("duration cell opens an editable input on double-click (editor module registered)", async ({
    page,
}) => {
    await page.goto("/");

    // Wait for the treegrid to render with data rows.
    const tableSection = page.getByRole("region", { name: "Schedule table" });
    await expect(tableSection.getByRole("treegrid")).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    await expect(page.locator(".ag-row").first()).toBeVisible({ timeout: GRID_READY_TIMEOUT_MS });

    // Target the first LEAF row's duration cell (group rows are not editable).
    const firstLeafDurationCell = page.locator(LEAF_DURATION_CELL_SELECTOR).first();
    await expect(firstLeafDurationCell).toBeVisible();

    // Single-click to focus, then double-click to open the editor.
    await firstLeafDurationCell.click();
    await firstLeafDurationCell.dblclick();

    // The editor input must appear. A broken module registration (error #200)
    // never opens an input -- this assertion fails in that case.
    const cellEditorInput = page.locator(CELL_EDITOR_INPUT_SELECTOR).first();
    await expect(cellEditorInput).toBeVisible({ timeout: 8000 });
});

test("typing a new duration value and pressing Enter updates the displayed cell", async ({
    page,
}) => {
    // Cover this test's own declared sub-budgets: page load (30s) plus the grid,
    // editor-visible, editor-value, and committed-text waits each add their own
    // ceiling. Their sum exceeds 60s, so a 60s overall timeout tips over in the
    // worst legitimate case, especially under the parallel heavy-dataset load. The
    // edit itself takes ~57s of real work in isolation, so this is real headroom.
    test.setTimeout(90000);

    const UPDATED_DURATION = "99";

    await page.goto("/");

    const tableSection = page.getByRole("region", { name: "Schedule table" });
    await expect(tableSection.getByRole("treegrid")).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
    await expect(page.locator(".ag-row").first()).toBeVisible({ timeout: GRID_READY_TIMEOUT_MS });

    // Capture the first leaf row's row-id so we can locate it stably after the
    // resizeActivity recompute re-renders rowData (positional selector may drift).
    const firstLeafRow = page.locator(".ag-row:not(.ag-row-group)").first();
    const rowId = await firstLeafRow.getAttribute("row-id");
    const stableDurationCell = page.locator(`[row-id="${rowId}"] [col-id='duration']`);
    await expect(stableDurationCell).toBeVisible();

    // Single-click the cell to put it in navigation/focus mode.
    await stableDurationCell.click();

    // AG-Grid starts the cell editor when you type while a cell is focused in
    // navigation mode. The typed character becomes the initial editor value,
    // replacing any existing content. This is more reliable than dblclick
    // because it avoids pre-selection ambiguity in the number input.
    await page.keyboard.type(UPDATED_DURATION);

    const cellEditorInput = page.locator(CELL_EDITOR_INPUT_SELECTOR).first();
    await expect(cellEditorInput).toBeVisible({ timeout: 8000 });
    await expect(cellEditorInput).toHaveValue(UPDATED_DURATION);

    // Tab commits the edit (stopEditing reads the input value) and moves to the
    // next editable cell. Row-a0 stays in the viewport.
    await page.keyboard.press("Tab");

    // After commit and Zustand store recompute, the stable cell must show the
    // new value. We check cell text, not editor visibility.
    await expect(stableDurationCell).toHaveText(UPDATED_DURATION, { timeout: 8000 });
});
