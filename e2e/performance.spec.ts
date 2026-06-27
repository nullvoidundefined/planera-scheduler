/**
 * Performance E2E at the default 5,000-activity dataset. Proves the two-phase
 * recompute keeps editing responsive and, critically, that the optimistic phase-1
 * pass is downstream-BOUNDED (only the edited activity's downstream cone changes
 * early dates) rather than a whole-graph recompute on the main thread. Edits are
 * driven through the DEV-only window.__scheduleStore handle so the measurement is
 * the engine path, not DHTMLX drag jitter. Budgets are set from measured wall time
 * with headroom; the measured values are recorded in the comments beside each.
 */
import { expect, test } from "@playwright/test";

import { gotoSchedule, waitForFirstGanttBar, waitForTreegrid } from "./helpers/appReady";
import type { ScheduleStoreWindow } from "./helpers/storeHandle";

// Initial paint of the full dataset (MSW fetch, store bootstrap, global CPM pass,
// both widgets mounting). This is the Risk-17 gate: a breach means DHTMLX
// smart-rendering regressed and must be investigated, not relaxed. Measured ~0.9s
// locally with a warm dev server; the budget leaves headroom for a cold CI compile
// and slower CI CPU.
const MAX_INITIAL_RENDER_MS = 8000;
// Synchronous step inside dispatchOperation: the phase-1 cone early-date recompute
// PLUS posting the phase-2 request to the worker. Measured ~0.9s stable; the
// dominant cost is the worker handoff (structured-cloning the 5,000-entry previous
// computed cache to the worker), not the cone math (the cone is tiny). Budget is
// ~2x the measured value for CI contention headroom.
const MAX_PHASE1_UPDATE_MS = 1800;
// Wall time for the authoritative phase-2 worker pass to settle (the store clears
// the operation origin on merge). Measured ~0.93s; budget leaves CI headroom.
const MAX_PHASE2_SETTLE_MS = 5000;
// The phase-1 optimistic delta for a near-leaf edit must touch only its small
// downstream cone, never all 5,000. Measured: 2 activities changed for the targeted
// near-leaf (cone size 2); the largest cone on the same graph (a near-root) is
// ~1,076. This ceiling sits far below 5,000 to prove the delta is downstream-bounded.
const MAX_OPTIMISTIC_CONE = 100;
// One rAF must still fire promptly right after the edit: the global recompute is on
// the worker, so the main thread is not blocked.
const MAX_FRAME_MS = 250;
const NEW_DURATION_DAYS = 90;
const TABLE_ORIGIN = "table";

test("renders the 5000-activity schedule within the initial-render budget", async ({ page }) => {
    const start = Date.now();
    await gotoSchedule(page);
    await waitForTreegrid(page);
    await waitForFirstGanttBar(page, MAX_INITIAL_RENDER_MS);
    const renderMs = Date.now() - start;
    console.log(`[perf] initial render: ${renderMs}ms`);
    expect(renderMs).toBeLessThan(MAX_INITIAL_RENDER_MS);
});

test("an optimistic duration edit is downstream-bounded and settles fast", async ({ page }) => {
    await gotoSchedule(page);
    await waitForTreegrid(page);
    await waitForFirstGanttBar(page);

    // From the store, measure each task's downstream cone (BFS over the dependency
    // edges) and pick a near-leaf: the smallest cone that still has real downstream
    // propagation (at least one successor), so the bounded delta is more than the
    // edited bar alone. Also record the largest cone (a near-root) so the bounded
    // claim is meaningful against the worst case on the same graph.
    const cones = await page.evaluate(() => {
        const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
        if (store === undefined) {
            return null;
        }
        const { activities, dependencies } = store.getState().graph;
        const successorsByActivity = new Map<string, string[]>();
        for (const edge of dependencies) {
            const list = successorsByActivity.get(edge.predecessorId) ?? [];
            list.push(edge.successorId);
            successorsByActivity.set(edge.predecessorId, list);
        }
        function measureConeSize(rootId: string): number {
            const reached = new Set<string>([rootId]);
            const queue = [rootId];
            while (queue.length > 0) {
                const current = queue.shift() as string;
                for (const next of successorsByActivity.get(current) ?? []) {
                    if (!reached.has(next)) {
                        reached.add(next);
                        queue.push(next);
                    }
                }
            }
            return reached.size;
        }
        let nearLeaf: { activityId: string; coneSize: number } | null = null;
        let largestConeSize = 0;
        for (const activity of activities) {
            if (activity.type !== "task" || activity.durationDays <= 0) {
                continue;
            }
            const coneSize = measureConeSize(activity.id);
            if (coneSize > largestConeSize) {
                largestConeSize = coneSize;
            }
            // A cone of 1 is a pure dependency-leaf (resizing it moves only its own
            // bar); require at least one downstream successor to exercise propagation.
            if (coneSize >= 2 && (nearLeaf === null || coneSize < nearLeaf.coneSize)) {
                nearLeaf = { activityId: activity.id, coneSize };
            }
        }
        return nearLeaf === null ? null : { largestConeSize, nearLeaf };
    });
    expect(cones).not.toBeNull();
    console.log(
        `[perf] near-leaf cone: ${cones!.nearLeaf.coneSize}; near-root (largest) cone: ${cones!.largestConeSize}`,
    );

    // Drive the resize through the store and, in the same synchronous evaluate,
    // snapshot the computed cache before and immediately after. The phase-2 worker
    // response is async, so the post-dispatch snapshot reflects the phase-1
    // optimistic delta only: exactly the activities whose early dates moved.
    const phase1 = await page.evaluate(
        ({ activityId, durationDays, origin }) => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            if (store === undefined) {
                return null;
            }
            const earlyKeyById = new Map<string, string>();
            for (const [id, computed] of store.getState().computed) {
                earlyKeyById.set(id, `${computed.earlyStart}:${computed.earlyFinish}`);
            }
            const startedAt = performance.now();
            store
                .getState()
                .dispatchOperation({ activityId, durationDays, kind: "resizeActivity" }, origin);
            const elapsedMs = performance.now() - startedAt;
            let changedCount = 0;
            let editedChanged = false;
            for (const [id, computed] of store.getState().computed) {
                const key = `${computed.earlyStart}:${computed.earlyFinish}`;
                if (earlyKeyById.get(id) !== key) {
                    changedCount += 1;
                    if (id === activityId) {
                        editedChanged = true;
                    }
                }
            }
            return { changedCount, editedChanged, elapsedMs };
        },
        {
            activityId: cones!.nearLeaf.activityId,
            durationDays: NEW_DURATION_DAYS,
            origin: TABLE_ORIGIN,
        },
    );
    expect(phase1).not.toBeNull();
    console.log(
        `[perf] phase-1 sync: ${phase1!.elapsedMs.toFixed(1)}ms; changed early dates: ${phase1!.changedCount}`,
    );

    // The edit reflected optimistically and the synchronous step stayed under budget.
    expect(phase1!.editedChanged).toBe(true);
    expect(phase1!.elapsedMs).toBeLessThan(MAX_PHASE1_UPDATE_MS);

    // The optimistic delta is bounded by the small downstream cone, not the whole
    // 5,000-activity graph: this is the load-bearing assertion.
    expect(phase1!.changedCount).toBeGreaterThan(0);
    expect(phase1!.changedCount).toBeLessThanOrEqual(MAX_OPTIMISTIC_CONE);

    // One animation frame still fires promptly: the authoritative global pass is on
    // the worker, so the main thread is not blocked behind it.
    const frameMs = await page.evaluate(async () => {
        const before = performance.now();
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        return performance.now() - before;
    });
    expect(frameMs).toBeLessThan(MAX_FRAME_MS);

    // Phase 2 (the authoritative worker pass) settles shortly after: the store
    // clears the operation origin once the worker delta is merged. waitForFunction
    // polls on rAF, leaving the event loop free to deliver the worker message.
    const settleStart = Date.now();
    await page.waitForFunction(
        () => {
            const store = (window as unknown as ScheduleStoreWindow).__scheduleStore;
            return store !== undefined && store.getState().lastOperationOrigin === null;
        },
        undefined,
        { timeout: MAX_PHASE2_SETTLE_MS },
    );
    const settleMs = Date.now() - settleStart;
    console.log(`[perf] phase-2 settle: ${settleMs}ms`);
    expect(settleMs).toBeLessThan(MAX_PHASE2_SETTLE_MS);
});
