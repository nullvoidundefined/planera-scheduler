/**
 * Cross-view two-way editing E2E. Proves an edit propagates from the shared store
 * into the Gantt view and shifts downstream computed dates, that collapsing a phase
 * settles in both the grid and the store without oscillating (the AG-Grid
 * programmatic-expand feedback loop is guarded), and that a cycle-creating
 * dependency is rejected live without mutating the graph. Real DHTMLX drag and
 * AG-Grid cell typing are unreliable to drive in Playwright over thousands of
 * virtualized rows, so edits are driven through the DEV-only window.__scheduleStore
 * handle and asserted against the real Gantt DOM and the authoritative computed cache.
 */
import { expect, test } from "@playwright/test";

const GRID_READY_TIMEOUT_MS = 10000;
const LOAD_TIMEOUT_MS = 30000;
const NEW_DURATION_DAYS = 60;
// Lengthening a near-root activity recomputes a downstream cone of thousands of
// leaves on the main thread, then an async worker pass; under Playwright's parallel
// browser load on the full dataset this needs real headroom, not a masked race.
const PROPAGATION_TIMEOUT_MS = 20000;
// Idle gap between phase-2 propagation polls; see pollUntil for why a real gap matters.
const POLL_SETTLE_MS = 400;
// Cover the test's own declared sub-budgets: page load, the first Gantt bar, then
// two sequential 20s propagation polls (bar width, then downstream date). A 60s
// ceiling sits below that sum and tips over in the worst legitimate case, so the
// overall timeout must exceed LOAD + GRID_READY + 2 * PROPAGATION with margin.
const EDIT_TEST_TIMEOUT_MS =
    LOAD_TIMEOUT_MS + GRID_READY_TIMEOUT_MS + 2 * PROPAGATION_TIMEOUT_MS + 10000;
const SETTLE_MS = 800;

interface ComputedSnapshot {
    earlyFinish: number;
    earlyStart: number;
    isCritical: boolean;
}

interface ScheduleStoreWindow {
    __scheduleStore?: {
        getState(): {
            collapsed: Set<string>;
            computed: Map<string, ComputedSnapshot>;
            graph: {
                activities: {
                    durationDays: number;
                    id: string;
                    parentId: string | null;
                    type: string;
                }[];
                dependencies: { id: string; predecessorId: string; successorId: string }[];
            };
            dispatchOperation(op: unknown, origin?: string): { ok: boolean };
        };
    };
}

test.describe("two-way editing", () => {
    test("a duration edit resizes the matching Gantt bar and shifts downstream dates", async ({
        page,
    }) => {
        test.setTimeout(EDIT_TEST_TIMEOUT_MS);
        await page.goto("/");
        await expect(
            page.getByRole("region", { name: "Schedule table" }).getByRole("treegrid"),
        ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
        await expect(page.locator(".gantt_task_line").first()).toBeVisible({
            timeout: GRID_READY_TIMEOUT_MS,
        });

        // Pick, from the store, the first task leaf whose successor depends on it
        // alone. With a single predecessor the successor's early start is tied
        // directly to this activity's finish, so lengthening it provably pushes the
        // downstream date forward (no merge predecessor can mask the shift).
        const target = await page.evaluate(() => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            if (store === undefined) {
                return null;
            }
            const { activities, dependencies } = store.getState().graph;
            const predecessorCount = new Map<string, number>();
            for (const edge of dependencies) {
                predecessorCount.set(
                    edge.successorId,
                    (predecessorCount.get(edge.successorId) ?? 0) + 1,
                );
            }
            for (const activity of activities) {
                if (activity.type !== "task" || activity.durationDays <= 0) {
                    continue;
                }
                const soleSuccessor = dependencies.find(
                    (edge) =>
                        edge.predecessorId === activity.id &&
                        predecessorCount.get(edge.successorId) === 1,
                );
                if (soleSuccessor === undefined) {
                    continue;
                }
                const successorEarlyStart =
                    store.getState().computed.get(soleSuccessor.successorId)?.earlyStart ?? null;
                return {
                    activityId: activity.id,
                    successorEarlyStartBefore: successorEarlyStart,
                    successorId: soleSuccessor.successorId,
                };
            }
            return null;
        });
        expect(target).not.toBeNull();
        expect(target!.successorEarlyStartBefore).not.toBeNull();

        const ganttBar = page.locator(`.gantt_task_line[task_id="${target!.activityId}"]`);
        await expect(ganttBar).toBeVisible();
        const widthBefore = (await ganttBar.boundingBox())?.width ?? 0;
        expect(widthBefore).toBeGreaterThan(0);

        // Drive the edit through the store (standing in for a table-side duration
        // edit) with the table origin, so the Gantt subscription is allowed to echo
        // it into the widget rather than skipping it as its own drag.
        await page.evaluate(
            ({ activityId, durationDays }) => {
                const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
                store
                    ?.getState()
                    .dispatchOperation(
                        { activityId, durationDays, kind: "resizeActivity" },
                        "table",
                    );
            },
            { activityId: target!.activityId, durationDays: NEW_DURATION_DAYS },
        );

        // The Gantt bar for the edited activity widens: the store edit propagated
        // into the other view.
        await expect
            .poll(async () => (await ganttBar.boundingBox())?.width ?? 0, {
                timeout: PROPAGATION_TIMEOUT_MS,
            })
            .toBeGreaterThan(widthBefore);

        // The downstream successor's computed early start moves later: the engine
        // recomputed the dependent cone, not just the edited bar.
        await expect
            .poll(
                async () =>
                    page.evaluate((successorId) => {
                        const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
                        return store?.getState().computed.get(successorId)?.earlyStart ?? null;
                    }, target!.successorId),
                { timeout: PROPAGATION_TIMEOUT_MS },
            )
            .toBeGreaterThan(target!.successorEarlyStartBefore!);
    });

    test("a gantt-origin edit reflows the recomputed schedule into the Gantt", async ({ page }) => {
        test.setTimeout(EDIT_TEST_TIMEOUT_MS);
        await page.goto("/");
        await expect(
            page.getByRole("region", { name: "Schedule table" }).getByRole("treegrid"),
        ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
        await expect(page.locator(".gantt_task_line").first()).toBeVisible({
            timeout: GRID_READY_TIMEOUT_MS,
        });

        // Same sole-successor selection as the table-origin case: a successor tied to a
        // single predecessor provably shifts when that predecessor lengthens.
        const target = await page.evaluate(() => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            if (store === undefined) {
                return null;
            }
            const { activities, dependencies } = store.getState().graph;
            const predecessorCount = new Map<string, number>();
            for (const edge of dependencies) {
                predecessorCount.set(
                    edge.successorId,
                    (predecessorCount.get(edge.successorId) ?? 0) + 1,
                );
            }
            for (const activity of activities) {
                if (activity.type !== "task" || activity.durationDays <= 0) {
                    continue;
                }
                const soleSuccessor = dependencies.find(
                    (edge) =>
                        edge.predecessorId === activity.id &&
                        predecessorCount.get(edge.successorId) === 1,
                );
                if (soleSuccessor === undefined) {
                    continue;
                }
                const successorEarlyStart =
                    store.getState().computed.get(soleSuccessor.successorId)?.earlyStart ?? null;
                return {
                    activityId: activity.id,
                    successorEarlyStartBefore: successorEarlyStart,
                    successorId: soleSuccessor.successorId,
                };
            }
            return null;
        });
        expect(target).not.toBeNull();
        expect(target!.successorEarlyStartBefore).not.toBeNull();

        const ganttBar = page.locator(`.gantt_task_line[task_id="${target!.activityId}"]`);
        await expect(ganttBar).toBeVisible();
        const widthBefore = await readGanttBarWidth(page, target!.activityId);
        expect(widthBefore).toBeGreaterThan(0);

        // Drive the resize with the GANTT origin. The optimistic phase-1 update is
        // suppressed in the Gantt (a real drag already shows the dragged bar), but the
        // authoritative phase-2 merge must still reflow the recomputed schedule into the
        // widget. Before the fix a gantt-origin dispatch suppressed BOTH phases, so the
        // Gantt DOM never moved and downstream successors stayed stale.
        await page.evaluate(
            ({ activityId, durationDays }) => {
                const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
                store
                    ?.getState()
                    .dispatchOperation(
                        { activityId, durationDays, kind: "resizeActivity" },
                        "gantt",
                    );
            },
            { activityId: target!.activityId, durationDays: NEW_DURATION_DAYS },
        );

        // The edited bar widens in the real Gantt DOM: the phase-2 reflow reached the
        // widget despite the gantt origin, exercising the real subscribeComputed path.
        // Polled with explicit settle gaps rather than expect.poll: the authoritative
        // pass arrives on the CPM web worker's message, and only a real idle gap lets
        // that message be dispatched and DHTMLX's frame-scheduled bar repaint flush; a
        // back-to-back evaluate poll starves the worker handler and never observes it.
        const widthAfter = await pollUntil(
            page,
            () => readGanttBarWidth(page, target!.activityId),
            (width) => width > widthBefore,
        );
        expect(widthAfter).toBeGreaterThan(widthBefore);

        // The downstream successor's computed early start moves later: the authoritative
        // pass recomputed and reflowed the dependent cone, not just the edited bar.
        const successorEarlyStartAfter = await pollUntil(
            page,
            () =>
                page.evaluate((successorId) => {
                    const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
                    return store?.getState().computed.get(successorId)?.earlyStart ?? null;
                }, target!.successorId),
            (earlyStart) =>
                earlyStart !== null && earlyStart > target!.successorEarlyStartBefore!,
        );
        expect(successorEarlyStartAfter).toBeGreaterThan(target!.successorEarlyStartBefore!);
    });

    test("collapsing a phase propagates to the grid and does not oscillate", async ({ page }) => {
        await page.goto("/");
        await expect(
            page.getByRole("region", { name: "Schedule table" }).getByRole("treegrid"),
        ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });
        await expect(page.locator(".ag-row").first()).toBeVisible({
            timeout: GRID_READY_TIMEOUT_MS,
        });

        // A phase is a group with a parent (projects are parentless groups). Its
        // first child leaf is a rendered top row, so its disappearance is the
        // grid-visible proof of the collapse.
        const phase = await page.evaluate(() => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            if (store === undefined) {
                return null;
            }
            const { activities } = store.getState().graph;
            const group = activities.find((a) => a.type === "group" && a.parentId !== null);
            if (group === undefined) {
                return null;
            }
            const child = activities.find((a) => a.parentId === group.id);
            return child === undefined ? null : { childLeafId: child.id, phaseId: group.id };
        });
        expect(phase).not.toBeNull();

        const childRow = page.locator(`[row-id="${phase!.childLeafId}"]`);
        await expect(childRow).toHaveCount(1);

        // Drive collapse from the store (standing in for the other view). The
        // STORE -> GRID effect calls node.setExpanded programmatically; without the
        // api-source guard that programmatic event would re-dispatch and flip the
        // state back forever.
        await page.evaluate((phaseId) => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            store?.getState().dispatchOperation({ kind: "toggleCollapse", rowId: phaseId });
        }, phase!.phaseId);

        // The grid reflects the collapse: the phase's child leaf row is gone.
        await expect(childRow).toHaveCount(0);

        // The store records exactly the one collapsed phase.
        const collapsedAfterToggle = await readCollapsedIds(page);
        expect(collapsedAfterToggle).toEqual([phase!.phaseId]);

        // No oscillation: after settling, the collapsed set is unchanged (a feedback
        // loop would have toggled the phase back out or piled on extra entries) and
        // the grid stays collapsed.
        await page.waitForTimeout(SETTLE_MS);
        const collapsedAfterSettle = await readCollapsedIds(page);
        expect(collapsedAfterSettle).toEqual([phase!.phaseId]);
        await expect(childRow).toHaveCount(0);
    });

    test("a cycle-creating edit is rejected and the graph is unchanged", async ({ page }) => {
        await page.goto("/");
        await expect(
            page.getByRole("region", { name: "Schedule table" }).getByRole("treegrid"),
        ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

        const outcome = await page.evaluate(() => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            if (store === undefined) {
                return null;
            }
            const { dependencies } = store.getState().graph;
            const before = dependencies.length;
            const sample = dependencies[0];
            const result = store.getState().dispatchOperation(
                {
                    edge: {
                        id: "cycle-test",
                        lagDays: 0,
                        predecessorId: sample.successorId,
                        successorId: sample.predecessorId,
                        type: "FS",
                    },
                    kind: "addDependency",
                },
                "table",
            );
            return { after: store.getState().graph.dependencies.length, before, ok: result.ok };
        });

        expect(outcome).not.toBeNull();
        // Rejected (ok === false) and the dependency list is unchanged: the graph
        // stayed a DAG, the edit reverted with no mutation.
        expect(outcome!.ok).toBe(false);
        expect(outcome!.after).toBe(outcome!.before);
    });
});

// Poll a value through real idle gaps until it satisfies the predicate or the budget
// runs out, returning the last read either way for the caller to assert on. The gap is
// load-bearing: the authoritative phase-2 delta arrives on the CPM web worker's
// message, and only a genuine idle interval lets that handler run; expect.poll's
// back-to-back evaluate cadence starves it (observed: the store origin never clears).
async function pollUntil<T>(
    page: import("@playwright/test").Page,
    read: () => Promise<T>,
    predicate: (value: T) => boolean,
): Promise<T> {
    const deadline = Date.now() + PROPAGATION_TIMEOUT_MS;
    let latest = await read();
    while (!predicate(latest) && Date.now() < deadline) {
        await page.waitForTimeout(POLL_SETTLE_MS);
        latest = await read();
    }
    return latest;
}

async function readGanttBarWidth(
    page: import("@playwright/test").Page,
    taskId: string,
): Promise<number> {
    return page.evaluate((id) => {
        const bar = document.querySelector(`.gantt_task_line[task_id="${id}"]`);
        return bar === null ? 0 : bar.getBoundingClientRect().width;
    }, taskId);
}

async function readCollapsedIds(page: import("@playwright/test").Page): Promise<string[]> {
    return page.evaluate(() => {
        const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
        return store === undefined ? [] : [...store.getState().collapsed];
    });
}
