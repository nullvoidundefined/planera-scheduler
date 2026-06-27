# Product Definition Document: Planera Clone

> **Revision 2026-06-26.** The product is being rebuilt on Planera's actual stack (React, TypeScript,
> DHTMLX Gantt, AG-Grid, PandaCSS, TanStack Query, Vitest), grounded in the system-design playbook.
> Deltas from the original: **two** synchronized views (Table and Gantt), not three (the Whiteboard
> is dropped); the Gantt and grid use **DHTMLX Gantt** and **AG-Grid Enterprise**; styling moves from
> SCSS to **PandaCSS**; drag-to-reschedule with web-worker downstream recompute is core, not P1. The
> governing technical spec is
> `docs/superpowers/specs/2026-06-26-planera-collaborative-editor-design.md`.

## 1. Purpose & context

A best-guess clone of **Planera**'s collaborative, CPM-based construction scheduling tool,
built as a **portfolio / hiring artifact** for Planera's *Frontend Software Developer* role.

It must read as production-grade frontend engineering, because the audience is the team that
builds the real thing. The bar is not "a Gantt chart" - it is "a credible re-creation of the
hard parts of Planera's product, engineered to the standards of the repository it lives in."

> Implementation conventions (naming, SCSS structure, semantic HTML, TDD workflow, file layout,
> commit hygiene) are **owned by the repository's root `CLAUDE.md`**. This document defines *what*
> to build and *why*; it deliberately does not prescribe code style.

## 2. The problem the product solves

Construction scheduling is the highest-leverage, least-forgiving part of a project. The incumbents
(Oracle Primavera P6, MS Project) are powerful but single-user, file-based, expert-only, and
visually inaccessible to everyone except a trained scheduler. Planera keeps full CPM rigor but
makes it visual, collaborative, and usable by the whole team.

This clone re-creates the engineering core of that experience: **one schedule model rendered as
three synchronized, high-performance views**, accurate to the way real schedules behave.

## 3. Target users (of the product being cloned)

- **Schedulers / planners** - build and maintain the network of activities and dependencies.
- **Project managers / supers** - read the schedule, track the critical path, drill into phases.
- **Owners / stakeholders** - consume a clear visual of where the project stands.

## 4. Product concept - one model, three views

The schedule is a single **directed acyclic graph** (activities = nodes, dependencies = directed
edges). It is presented through three synchronized surfaces over that one model:

| View | What it is | Why it matters |
|---|---|---|
| **Table** | Spreadsheet of activities (name, WBS, duration, dates, float). | Fast data entry and scanning; the familiar grid. |
| **Gantt** | A **sidebar table** + a time-axis of bars and dependency arrows. | The canonical schedule visualization; bars are positioned by *computed* dates. |

Editing or collapsing in one view is reflected in all three, because all three derive from the
same model.

## 5. Feature requirements

### P0 - must have (the core artifact)
- **Mock dataset** of several thousand activities, organized **projects → groups (phases) →
  activities**, wired into a valid dependency graph. Served from a mock API.
- **CPM engine**: forward/backward pass computing early/late dates, total float, and the critical
  path. Dates are **computed, never stored**. Cycle detection (invalid schedule).
- **Collapsible hierarchy**: collapse/expand projects and groups; state shared across all views.
- **Table view**: virtualized, semantic, scannable; critical activities visually distinct.
- **Gantt view**: frozen **sidebar table** + horizontally scrollable timeline; bars positioned by
  computed dates; critical path highlighted; milestones rendered distinctly; summary bars for
  project/group rows.
- **Whiteboard view**: layered DAG layout; **A\* orthogonal edge routing** that avoids node
  obstacles; pan/zoom; viewport culling; critical path highlighted.
- **Performance**: smooth at thousands of activities via virtualization on both axes; off-screen
  content is unmounted, not hidden.

### P1 - strong to have
- Drag-to-reschedule with **optimistic update**, downstream-only recompute, CPM recompute moved to
  a **web worker**.
- Edits modeled as **change-vector operations**, not whole-state writes.
- Filtering / saved views; custom activity codes (responsibility, location).
- Schedule **versions / what-if** with side-by-side comparison.

### P2 - aspirational (maps to Planera proper)
- **Real-time collaboration**: WebSocket transport, server-authoritative operation ordering +
  versioning, presence/awareness, and a **CRDT (Yjs)** for offline (the iPad field case). Conflict
  resolution is two-layered: last-write-wins on the granular atom, plus **semantic validity**
  (reject any merge that creates a cycle / leaves the graph a non-DAG).
- **PDF export**: server-side headless render, 2D page tiling for tall-and-wide schedules.
- DCMA quality check, resource loading, Monte Carlo risk.

## 6. Non-functional requirements

- **Performance**: interaction stays responsive (≈60fps) while scrolling/panning thousands of
  activities. Initial render and view-switches feel instant.
- **Correctness**: the CPM engine is provably correct against known fixtures (this is the part that
  must never be hand-wavy).
- **Accessibility**: semantic structure; keyboard navigability; ARIA grid semantics where
  virtualization precludes native table elements.
- **Quality bar**: the codebase must satisfy the repository's root `CLAUDE.md` - conventions, SCSS
  architecture, semantic HTML, test-driven workflow. A passing build and green tests are the floor,
  not the goal.

## 7. Out of scope (for v1)
- Authentication, billing, org/folder management, persistence beyond the mock API.
- Mobile/iPad layouts (noted as a P2 driver for the offline/CRDT design).
- Importing real P6/MSP files.

## 8. Success criteria
1. A reviewer from Planera opens it and recognizes their product's hard problems handled credibly.
2. The CPM engine is correct and unit-tested; the critical path is demonstrably right.
3. All three views render the same model in sync, and stay smooth at multi-thousand scale.
4. Editing a duration or dragging a bar recomputes only the downstream cone (off the main thread) and both views stay in sync.
5. The code passes the repo's conventions and CI; it reads like the author's production work.

## 9. Stack intent
React + TypeScript + TanStack Query, mirroring Planera's stack; SCSS per repo conventions; Vitest
for tests. Gantt/grid may use DHTMLX/AG-Grid in production, or hand-built virtualization to
demonstrate mastery - a decision recorded in the technical spec, not here.
