# Collaborative CPM scheduler (Sub-project 1)

Date: 2026-06-27
Branch: `feat/scheduler-v1`
Scope: the complete single-user collaborative-ready CPM scheduler, built task-by-task on top of the
repo foundation (spec, PDD, plan) that is already on `main`.

## Summary

One schedule graph, shown as two synchronized views (an AG-Grid Enterprise tree table and a DHTMLX
Gantt), edited live, with the critical path recomputed by a real CPM engine. Dates are computed, never
stored; the graph is always a DAG. Built on Planera's stack (React, TypeScript, DHTMLX Gantt, AG-Grid
Enterprise, PandaCSS, TanStack Query, Zustand, a web worker, Vitest, Playwright) as a hiring artifact.

## What changed

The branch is the whole build, in 15 reviewed tasks across 7 phases:

- Phase 1: Vite/React/TS scaffold; ported CPM engine (forward/backward pass, total float, critical
  flag, cycle detection), the unified node model (one activity array with project/phase group nodes),
  and the seeded generator.
- Phase 2: the two-phase recompute primitives (downstream-cone early dates for the optimistic step,
  full-recompute-plus-delta for the authoritative step), the pure worker-message handler, the Zustand
  store, and the cycle-rejection validity gate.
- Phase 3: the MSW data layer and the DHTMLX Gantt view (lifecycle hook, today marker, zoom, the
  critical template, drag to resize).
- Phase 4: the AG-Grid Enterprise tree table (getDataPath hierarchy, editable duration, computed
  columns, selection sync).
- Phase 5: two-way editing with three feedback-loop guards (origin echo, AG-Grid collapse api-source,
  worker generation-token sequencing) and the cross-view E2E suite.
- Phase 6: the "drafting table" PandaCSS visual system, the split-pane shell, and the realistic
  parallel-lane schedule.
- Phase 7: the consolidated E2E suite, a 5000-activity performance gate, and this documentation.

Final state: 88 Vitest tests, 12 Playwright specs, clean typecheck, and a clean run against the global
push-gate ESLint config.

## Architectural decisions

- **One model, two-phase recompute, uncontrolled views (chosen)** over each view owning its own state
  (rejected: the multi-source-of-truth trap) or routing every live edit through TanStack Query
  (rejected: awkward for continuous interaction). The store holds only stored inputs; a phase-1
  optimistic pass recomputes the downstream cone's early dates synchronously so the edit feels live,
  and a phase-2 authoritative pass runs the full CPM in a web worker (with a synchronous fallback) and
  corrects float and the critical path a beat later. This matches the system-design playbook the
  artifact is meant to demonstrate.
- **DHTMLX Gantt + AG-Grid Enterprise + PandaCSS (chosen)** over hand-rolling the Gantt (rejected
  after a first attempt: the bug surface was large and the result looked amateurish) because matching
  the employer's exact stack is the point of the artifact. The CPM engine stays the source of truth;
  the libraries are views fed from it.
- **Realistic parallel-lane seeded schedule (chosen)** over a single sequential staircase (rejected:
  5000 sequential activities span ~190 years and make ~76% of activities critical). Each phase's
  activities run as concurrent lanes, so 5000 activities span ~4.77 years and the critical path is a
  meaningful ~13% minority, which is what makes the critical-path signature read.
- **Scoped the global push-gate one-export rule (chosen)** to the function-module trees
  (services/api/clients) to match R-235's documented scope, rather than splitting every constants and
  types module into one-symbol files (rejected: contradicts R-222's grouping rule). Done with the
  user's approval.

## Testing

- 88 Vitest unit/component/integration tests, including a hand-built known-critical-path fixture, a
  property test that the incremental recompute equals a full recompute, the worker handler, the store
  two-phase and validity behavior, and the generator invariants (FS-only, strictly forward, DAG,
  deterministic, bounded span, critical fraction in range).
- 12 Playwright E2E specs: Gantt and table render at 5000, table editing, cross-view two-way editing
  (edit propagation, collapse without oscillation, cycle rejected and reverted), the app-shell layout
  with an axe accessibility gate (serious and critical), and a 5000-activity performance assertion
  (phase-1 optimistic update ~0.9s; the downstream cone for a near-leaf edit is bounded, not the whole
  graph).

## Reflection

What I understand now that I did not at the start: the headline "recompute only the downstream cone"
is only half-true, because float and the critical path are global properties of the whole graph, so a
correct implementation recomputes early dates locally for the optimistic step but must run a full pass
for the authoritative float and critical-path result. The two-phase split is exactly that distinction.

What I got wrong first: I let the schedule generator stay a single sequential staircase, which looked
empty at any readable zoom and made almost everything critical. The fix was not in the renderer or the
zoom but in the data: real construction runs activities in parallel, so the generator needed a
parallel-lane model before the visual system could read correctly. Several "it looks broken" reactions
traced back to that one data-shape decision.
