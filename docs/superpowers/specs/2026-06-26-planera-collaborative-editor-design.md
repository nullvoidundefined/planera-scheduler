# Planera Collaborative CPM Editor: technical design

Date: 2026-06-26
Status: APPROVED design for Sub-project 1. Governing technical spec.
Supersedes: `2026-06-26-planera-clone-v1-design.md` and `2026-06-26-gantt-chart-spec.md`
(both described the prior hand-rolled, frontend-only build, which is being replaced).
Product context: `PDD.md` (Product Definition Document).

## 1. Purpose

A working proof of the Planera system-design thesis: **one CPM graph, shown as multiple
synchronized views, edited live, rendered fast at thousands of activities, kept in sync without
corrupting the graph.** Built as a hiring artifact for Planera's Frontend Software Developer role,
so it deliberately matches the team's stack: React, TypeScript, DHTMLX Gantt, AG-Grid, PandaCSS,
TanStack Query, Vitest.

This spec is grounded in the system-design run-sheet (the "playbook"): a graph data model with a
separate edge list, computed-not-stored dates, a virtualized imperative widget boundary,
operation-based optimistic editing, and a web-worker CPM recompute over only the downstream cone.

## 2. Scope and decomposition

The full playbook spans two independent subsystems. They are built as separate spec to plan to
build cycles.

| Sub-project | Playbook phases | What it is | Backend |
|---|---|---|---|
| **1 (this spec)** | 1 to 4 | Single-user CPM editor: graph model + engine, DHTMLX Gantt + AG-Grid views in a split layout, optimistic operation-based editing, web-worker downstream recompute | None (MSW initial load, in-memory store) |
| **2 (future)** | 5 | Real-time collaboration: WebSocket rooms, server-authoritative ordering + versioning, DAG-validating server, CRDT (Yjs) offline, presence | Yes |

Sub-project 1 stands alone as a polished demo and is the foundation Sub-project 2 layers onto. The
operation pipeline in Sub-project 1 is the same pipeline Sub-project 2's transport will carry, so
the foundation is collaboration-ready by construction.

## 3. Stack

| Concern | Choice | Notes |
|---|---|---|
| Build/runtime | Vite + React + TypeScript | Fresh scaffold, same repo |
| Gantt | DHTMLX Gantt (GPL Standard, npm `dhtmlx-gantt`) | Free, public-repo-safe. Critical path drawn from our CPM via CSS classes (DHTMLX's own critical-path is Pro and unused) |
| Table | AG-Grid Enterprise | Native Tree Data for the project to phase to activity hierarchy. Evaluation watermark accepted |
| Styling | PandaCSS | Build-time CSS-in-JS, design tokens. From the start |
| Data fetching | TanStack Query + MSW | Initial schedule load only; store owns it after |
| State | Zustand | Single source of truth for stored inputs |
| Compute | Web Worker | CPM off the main thread |
| Tests | Vitest + Playwright | Unit/property + E2E |

Ported verbatim from the prior build (stack-agnostic, fully tested): the CPM engine, the schedule
model types, the seeded generator (including the FS-only forward-staircase fix), the calendar and
date formatting.

## 4. Architecture spine

**One source of truth, derived compute, uncontrolled views.**

```
MSW + TanStack Query (initial load)
        |
        v
  Zustand store   <-- stored inputs only: activities[], dependencies[] (edge list),
        |             durations, types, parent/WBS. No dates ever stored.
        |  dispatchOperation(op)
        v
  cpmWorker (web worker)  -- full pass on load; downstream-cone delta on edit
        |
        v
  computed cache (early/late dates, total float, isCritical)
        |
   +----+----+
   v         v
 DHTMLX    AG-Grid     <-- uncontrolled: each owns its DOM, mounted once,
 Gantt     Table           fed by granular batched updates. React never
 (right)   (left)          re-renders into their DOM.
```

The store holds only inputs. Dates, float, and the critical path are computed outputs, never
stored. No cycles, so the graph is a DAG.

## 5. Data model

The schedule is a directed acyclic graph.

- **Activity (node):** `id`, `name`, `wbs`, `durationDays`, `type` (`task` | `milestone` |
  `group`), `parentId`. (Resources, %complete, calendars, and date constraints are out of scope
  for Sub-project 1; the type field is added now so milestones/groups are explicit rather than
  inferred from duration.)
- **Dependency (edge):** a separate **edge list**, not arrays on the node:
  `{ id, predecessorId, successorId, type: FS | SS | FF | SF, lagDays }`. Direction is the
  predecessor to successor relationship: one edge, two sides. An adjacency index
  (predecessors-by-successor, successors-by-predecessor) is derived for fast lookups.
- **Computed vs stored:** durations, dependencies, and (later) constraints/calendars are stored
  inputs. Early/late start and finish, total float, and critical flag are computed outputs from
  the CPM engine.

### Operations (edits are change vectors, not whole-state writes)

A discriminated union applied optimistically and posted to the worker:

- `ResizeActivity { activityId, durationDays }`
- `AddDependency { edge }`
- `RemoveDependency { edgeId }`
- `ToggleCollapse { rowId }` (view state, no recompute)

Each operation is the small change vector the playbook describes ("extend X by N days"). It is the
unit the store dispatches, the worker recomputes from, and (in Sub-project 2) the transport
broadcasts. Resize (duration) and dependency add/remove are the edits that keep dates fully
computed; freely moving a start would impose a date constraint, which is deferred with the rest of
the constraint model.

## 6. CPM engine and the worker boundary

- **Ported engine:** `computeSchedule(graph)` runs the forward pass (early start/finish in
  topological order), the backward pass (late start/finish in reverse), total float, and the
  critical flag. Gated by `detectCycle` first. Each of the four relationship types contributes its
  constraint per edge.
- **Incremental recompute (`computeDownstreamCone`):** on an edit, recompute only the successor
  cone reachable from the changed activity (early dates flow downstream). Global float and the
  critical path are refreshed in a second pass "a beat later," because float is a global property.
- **Worker:** `cpmWorker.ts` receives either a full graph (on load) or an operation plus the
  current graph snapshot (on edit) and posts back the computed delta (only the activities whose
  computed values changed). Keeps a drag at 60fps. If the worker fails to initialize, the store
  falls back to synchronous main-thread compute so the app still works.

## 7. State

- **`scheduleStore` (Zustand):** holds the raw graph and the computed cache; exposes
  `dispatchOperation(op)`. Dispatch applies the operation to the raw graph optimistically, requests
  a worker recompute, and merges the returned delta into the computed cache. Collapse state lives
  here too (shared across both views).
- **`useScheduleSelection`:** the currently selected activity id, shared so selecting a row in the
  grid highlights its bar in the Gantt and vice versa.

## 8. View layer

### Layout
A two-pane **split**: AG-Grid Table on the left, DHTMLX Gantt on the right, the classic scheduler
arrangement. A draggable splitter sets the divide. Both panes scroll their own rows but share the
collapse and selection state, so the two stay logically aligned.

### DHTMLX boundary (the hard part)
- A stable `<div ref>` container rendered by React once.
- `gantt.init(el)` + `gantt.parse({ tasks, links })` in `useEffect([])`; destructor
  (`gantt.destructor()`) on unmount.
- Subsequent updates via `gantt.batchUpdate(() => gantt.updateTask(...))`. Never `clearAll` +
  reparse (that flickers and drops scroll/zoom state).
- Critical path via `gantt.templates.task_class` returning a `critical` class from our computed
  `isCritical`. Today line via the marker extension. Day/week/month zoom via the zoom config.
- `onAfterTaskDrag` (and resize) translate the change to an `Operation` and call
  `dispatchOperation`.
- `React.memo` + a latest-ref for callbacks so parent re-renders never reach into DHTMLX's DOM.
- Adapter functions map our model to DHTMLX task/link shapes and back; these are the unit-tested
  seam.

### AG-Grid boundary
- Enterprise **Tree Data** via `getDataPath` returning the WBS path, giving project to phase to
  activity grouping natively.
- Columns: name, WBS, duration (editable), start, finish (computed, read-only), total float,
  critical (cell style from `isCritical`).
- Group expand/collapse bound to the shared collapse state.
- Duration cell-edit emits a `ResizeActivity` operation. Row selection writes the shared selection.

## 9. Editing flow (optimistic, operation-based)

1. User drags a bar (Gantt) or edits a duration (grid).
2. The view emits an `Operation`.
3. The store applies it optimistically to the raw graph and updates the emitting view immediately
   (visible-first, so the drag feels live).
4. The store posts the operation to the worker.
5. The worker recomputes the downstream cone and posts back the computed delta.
6. The store merges the delta; both view adapters batch-update only the changed tasks/rows.

## 10. Validity and error handling

- **Semantic validity (single-user form):** an `AddDependency` that would create a cycle is
  rejected by `detectCycle` before it is applied, so the graph never enters a non-DAG state. The
  rejection surfaces as a non-destructive toast; the view reverts the optimistic edge. This is the
  same validity gate Sub-project 2's server will enforce on merges.
- **Worker failure:** fall back to synchronous main-thread compute.
- **Initial load failure (MSW/query):** the app shell shows an error state with a retry.

## 11. Performance targets

- Smooth (about 60fps) interaction while dragging and scrolling at 5,000 activities.
- Initial render and the first full CPM pass complete without a visible stall (worker-driven).
- Edits recompute the downstream cone only; a local edit never triggers a full 5,000-activity
  recompute on the main thread.
- DHTMLX smart-rendering provides the Gantt's row/column virtualization; AG-Grid provides the
  grid's row virtualization. These libraries realize the 2D-virtualization principle the playbook
  describes hand-rolling.

## 12. Accessibility

- The grid is AG-Grid's accessible grid semantics; the Gantt is an imperative canvas-like widget,
  so it carries an accessible name and a textual summary, with keyboard operation through DHTMLX
  where supported.
- App shell, toolbar, and toasts follow the repo accessibility bar (semantic HTML, labels, focus
  management, reduced-motion).

## 13. Module and file structure

```
src/
  api/                 own-backend fetch wrappers (initial schedule load)
  components/
    AppShell/          layout, split pane, toolbar, view state
    GanttView/         DHTMLX container + useGanttInit + model<->DHTMLX adapters
    TableView/         AG-Grid container + tree-data config + cell editors
  constants/           generator + scale constants
  mocks/               MSW handlers + worker registration
  services/
    cpm/               computeSchedule, forward/backward, detectCycle, topo sort,
                       computeDownstreamCone (new)
    generateSchedule.ts  ported seeded generator
    createCalendar.ts, formatScheduleDate.ts
  state/
    scheduleStore.ts   Zustand: raw graph + computed cache + dispatchOperation
    useScheduleSelection.ts
  types/               Activity, Dependency (edge), ComputedActivity, Operation union
  workers/
    cpmWorker.ts       worker boundary
panda.config.ts        design tokens and recipes
```

File and naming conventions follow the repository root `CLAUDE.md` (one exported function per
service/api module, verb-noun names, file headers, etc.). PandaCSS replaces SCSS modules; this is a
deliberate override of the repo's SCSS convention to match the job stack, recorded here.

## 14. Testing strategy

- **CPM engine:** ported unit tests plus a known-critical-path fixture. The engine is the part that
  must never be hand-wavy.
- **Downstream-cone:** property test asserting incremental recompute equals full recompute for
  random operation sequences.
- **Operations and validity:** each operation applied to the store yields the expected raw model
  and computed delta; a cycle-creating `AddDependency` is rejected and reverted.
- **Generator:** ported invariants (FS-only, strictly-forward edges, sequential-staircase ratio,
  contiguous grouping, determinism per seed).
- **Adapters:** model to DHTMLX and model to AG-Grid mapping unit-tested at the seam.
- **E2E (Playwright):** load 5,000; drag a bar and assert downstream dates shift and the critical
  path updates; edit a duration in the grid and assert the Gantt bar resizes; collapse a phase and
  assert both views update; attempt a cycle and assert it is rejected; a perf assertion at 5,000.

## 15. Delivery phases (each independently shippable)

1. **Scaffold** Vite + React + TS + PandaCSS + Vitest + MSW; port the CPM engine, model, and
   generator with their tests.
2. **Store + worker:** Zustand store, `cpmWorker`, `computeDownstreamCone`.
3. **Gantt view:** DHTMLX rendering the computed schedule (critical path, today marker, zoom).
4. **Table view:** AG-Grid Tree Data + computed columns.
5. **Two-way editing:** operations, optimistic apply, both views synced, selection sync, cycle
   rejection.
6. **PandaCSS theming and aesthetics:** tokens, app shell, split-pane and toolbar polish. This
   phase is driven by the `frontend-design` skill to set the visual system (type scale, color,
   spacing, density, the DHTMLX and AG-Grid theme overrides) so the artifact reads as
   production-grade, not just functional.
7. **E2E + perf:** full Playwright suite, 5,000-activity perf validation.

## 16. Out of scope (Sub-project 2 and beyond)

Real-time collaboration (WebSocket rooms, server-authoritative ordering and versioning, the
DAG-validating server, CRDT/Yjs offline, presence cursors), PDF export, DCMA checks, resource
loading, Monte Carlo, authentication, and persistence beyond the mock API. The whiteboard view from
the prior build is dropped.

## 17. Risks

- **DHTMLX at 5,000 with live editing:** smart-rendering handles display, but very wide timelines
  and frequent batched updates need validation; the perf E2E gates this.
- **AG-Grid Enterprise watermark:** accepted, but it is visible in the demo; note it in the README
  so a reviewer understands the licensing choice.
- **Two imperative widgets sharing one store:** the adapter seams must be disciplined so an update
  originating in one view does not echo back as a spurious operation; adapters mark
  store-originated updates to avoid feedback loops.
