# Planera scheduler

A collaborative, CPM-based construction scheduler: one schedule graph rendered through a synchronized
AG-Grid table and a DHTMLX Gantt, with live two-phase critical-path recompute on every edit. It is a
hiring artifact built on Planera's actual stack, modeling the hard parts of their product (a large
dependency graph, two high-performance views over one model, and responsive editing at scale) rather
than a toy Gantt chart.

The governing documents are the product definition in [`PDD.md`](./PDD.md) and the technical spec in
[`docs/superpowers/specs/2026-06-26-planera-collaborative-editor-design.md`](./docs/superpowers/specs/2026-06-26-planera-collaborative-editor-design.md).

## Stack

- React + TypeScript on Vite.
- DHTMLX Gantt for the timeline view.
- AG-Grid Enterprise for the tree-data table (native Tree Data; see the note below).
- PandaCSS for the styling system.
- TanStack Query for data fetching, Zustand for the single schedule store.
- A web worker for the authoritative CPM pass.
- MSW for the mock API, Vitest for unit and component tests, Playwright for E2E.

## Architecture in brief

One Zustand store holds the single source of truth, and it stores inputs only: the activity and
dependency graph plus the shared collapse set. Dates are computed by the CPM engine and never stored.

Every timing edit runs a two-phase recompute:

- Phase 1 (optimistic, main thread): recompute only the edited activity's downstream cone's early
  dates and merge them synchronously, so the edit is visible before the worker responds.
- Phase 2 (authoritative, web worker): run the full global pass that corrects total float and the
  critical path across the whole schedule, then merge its delta a beat later. A dispatch token orders
  worker responses so a stale delta cannot overwrite newer state.

Both views are driven imperatively rather than re-rendered from React on every change. The Gantt
(DHTMLX) owns its DOM entirely and is updated through a store subscription. The table (AG-Grid)
rebuilds its row data on each recompute but passes it as immutable data keyed by row id, so AG-Grid
diffs and patches only the changed rows instead of re-rendering the grid. The graph is always a DAG:
an edit that would create a cycle is rejected up front, with no mutation.

The critical path is computed by the forward/backward CPM pass (total float of zero marks a critical
activity) and rendered distinctly in both views.

## The seeded schedule

The mock dataset is a deterministic, seeded schedule of 5,000 activities organized as projects ->
groups (phases) -> activities. It uses a parallel-lane model: each phase's leaves are partitioned into
lanes (one crew running a finish-to-start staircase), lanes run concurrently within a phase, phases
run sequentially within a project, and projects run concurrently. A critical band ties the leading
lanes of each phase together so the critical path is a realistic share of the graph (~13% critical)
across a roughly 4.77-year span, rather than a single thin longest chain. Every generated edge points
strictly forward, so the graph is a DAG by construction.

## Running it

```bash
npm install
npm run dev      # Vite dev server on http://localhost:3000 (MSW serves the mock schedule)
npm run test     # Vitest unit and component suite
npm run e2e      # Playwright E2E suite (boots the dev server automatically)
npm run smoke    # service-start smoke check
npm run build    # panda codegen + typecheck + production build
```

This is a backend-less demo: the mock schedule (MSW) and the `window.__scheduleStore` test handle are
gated to the dev server, so `npm run dev` is the way to run it. A production `npm run build` compiles
cleanly but ships without the mock data source.

In development, the store is exposed as `window.__scheduleStore` so the E2E suite can drive operations
through the real engine path.

## Note on the AG-Grid Enterprise evaluation watermark

The table uses AG-Grid Enterprise for its native Tree Data feature, which matches the employer's
stack. There is no production license key, so AG-Grid prints an evaluation banner to the console and
shows an evaluation watermark. This is expected and intentional for a hiring artifact; it is not a
bug, and it would be removed by supplying a license key in a real deployment.
