# Planera Micro-Portfolio Site: design spec

Date: 2026-06-27
Status: design approved in brainstorming. Extends the existing `planera-scheduler` Vite SPA (the live
DHTMLX Gantt + AG-Grid Table CPM editor) with a router and three routes. No blocking dependency: the
editor already ships on `main`; this site wraps it.

## 0. Why this exists (read this first)

This site is an expression of genuine interest, not a show-off piece. The intent: Planera's product is
an unusually interesting frontend problem (one CPM graph rendered as three synchronized views, edited
live at thousands of activities), and the most honest way to show interest in working on it is to go
and rebuild a slice of it. The site exists so a reader at Planera can click through that work in about
three minutes and see that the interest is real and informed.

Everything below serves that goal. When a wording, scope, or tone decision is ambiguous, resolve it
toward "shows sincere interest and did the homework," never toward "look how clever I am."

## 1. Audience and framing

- 1.1 Primary reader: the Planera hiring team (an unknown peer developer, plus whoever screens
  applications). Not a general portfolio audience.
- 1.2 The site assumes the reader knows Planera's product and stack better than the author does. It
  never explains Planera to Planera; it shows the author's read of how Planera is built and invites
  correction.
- 1.3 The artifact is homework-you-can-click-on: a live demo (proof), a written assessment (reasoning),
  and a short summary (the friendly handshake that explains why a stranger built a tribute to their
  architecture).

## 2. Tone and voice (binding on all copy)

- 2.1 Confident but humble. Confident about the patterns and the reasoning ("here is the pattern and
  why it fits"). Humble about the conclusions ("this is my read from the outside; I would love to learn
  where I am wrong").
- 2.2 Friendly, fun, approachable. Real personality, contractions, short sentences. No corporate
  filler, no buzzword stacking, no breathless superlatives.
- 2.3 Every claim about Planera's actual internal architecture is explicitly marked as inference, not
  fact (e.g. "I am guessing", "from the outside it looks like", "my bet is"). The author never asserts
  private knowledge of their codebase.
- 2.4 No show-off register. The emotional default is curiosity and enthusiasm for the problem, not
  self-promotion. Accomplishments are stated plainly and in service of "so I could build this", never
  as a highlight reel.
- 2.5 No em dashes (repo and global rule). Use periods, commas, colons, parentheses.

## 3. Architecture

- 3.1 The site is the existing `planera-scheduler` Vite + React + TypeScript SPA, extended with a
  client-side router and three routes. Same stack as the demo and as Planera (React, TypeScript, DHTMLX
  Gantt, AG-Grid, PandaCSS, TanStack Query, Vitest). One build, one deploy (the existing Railway
  static-serve setup).
- 3.2 Choosing Vite over Next.js is deliberate and on-brand: the write-up itself argues that an
  authenticated, canvas-style app on a separate API is better served by a Vite SPA than by Next. The
  site practices that.
- 3.3 A persistent thin top nav (Summary, Demo, Architecture) is present on every route. The existing
  PandaCSS "drafting table" tokens and recipes are shared across all routes so the prose pages and the
  live demo read as one product.
- 3.4 Routing is the only new cross-cutting concern. The Demo route mounts the existing `AppShell`
  unchanged. `AppShell` keeps both the DHTMLX Gantt and the AG-Grid Table mounted at once (the inactive
  one is `inert` + visibility-hidden) so the costly DHTMLX widget survives view toggles. The router
  must not unmount or re-init `AppShell` on navigation within the demo; nav between unrelated routes may
  unmount it, which is acceptable because it re-seeds from MSW on return.
- 3.5 Landmark discipline: `AppShell` already renders its own `<main aria-label="Planera schedule
editor">`. The shared site shell therefore must NOT render a second `<main>`. The shell renders a
  `<header>` with the nav; each route owns its own `<main>` (the Demo route's `<main>` is the one inside
  `AppShell`; the prose routes render their own).

### 3.6 Route map

| Route        | Path            | Purpose                                         |
| ------------ | --------------- | ----------------------------------------------- |
| Summary      | `/`             | Landing. The handshake: who, why, scope, links. |
| Demo         | `/demo`         | The live CPM editor (existing AppShell).        |
| Architecture | `/architecture` | The technical write-up (the assessment).        |

## 4. Route: Summary (`/`)

- 4.1 Short and warm. Target under ~250 words of body copy. The reader should finish it knowing who the
  author is, that they are applying to Planera, and why they built a demo instead of writing a cover
  letter.
- 4.2 States the bet plainly in the reader's own language: "Planera is one CPM graph shown as three
  views. I rebuilt two of them, the Gantt and the Table, on what looks like your actual stack, to check
  whether I understand how the system fits together."
- 4.3 Is honest about scope up front: the Whiteboard is a custom D3/SVG build with its own design
  problem, so it was deliberately left out rather than faked. Single-user, no real backend
  collaboration; the write-up discusses collaboration as the hard part rather than pretending to have
  built it.
- 4.4 Names the motive explicitly and without apology: this is about interest, not showing off.
- 4.5 Two clear calls to action: open the Demo, read the Architecture write-up.
- 4.6 No resume dump. At most a one-line "who I am" with a link out; the site is about the work, not a
  CV.

## 5. Route: Demo (`/demo`)

- 5.1 Renders the existing `AppShell`: a Toolbar sub-nav toggling the DHTMLX Gantt and the AG-Grid
  Table, both renderers over one Zustand-held CPM graph (`scheduleStore`), with web-worker downstream
  recompute and operation-based optimistic edits. Editing in one view re-derives the other because they
  read one store.
- 5.2 Near-full-bleed layout. The demo is the centerpiece; chrome is minimal (just the top nav above
  the existing Toolbar).
- 5.3 A small, dismissible "what am I looking at" affordance (a caption or collapsible note) tells the
  reader what to try: drag a Gantt bar and watch successors recompute, edit a Table cell and watch the
  Gantt re-derive, scroll to feel the 2D virtualization at thousands of activities, toggle Gantt/Table.
- 5.4 The demo carries its existing E2E and a11y guarantees forward (see section 8). Mounting it inside
  a route must not regress the existing `e2e/` specs.
- 5.5 Out of scope for the demo: Whiteboard, multi-user collaboration, AI/Manny features, PDF export.
  These are named in the write-up, not built here.

## 6. Route: Architecture (`/architecture`)

The assessment. Centered reading column, generous typography, code/diagram blocks where they earn their
place. The write-up covers the **library-based build-system slice**: the two views that are renderers
over a shared model (Gantt on DHTMLX, Table on AG-Grid). The Whiteboard is explicitly bracketed out as
a custom build with separate design considerations.

Section spine (each section is short, skimmable, and marks inference as inference):

- 6.1 **The bet: one model, three views.** One CPM graph is the source of truth; the three surfaces are
  renderers that subscribe to it; editing in one re-derives the others. Why this avoids three-way sync
  bugs. Stated as the author's read.
- 6.2 **Computed vs stored.** Durations, dependencies, constraints, and calendars are stored inputs;
  dates, float, and the critical-path flag are computed outputs from the CPM engine. The graph is a
  DAG; cycles are rejected. This is what makes it a schedule and not a to-do list.
- 6.3 **Why these libraries.** DHTMLX for the Gantt (rows + time axis + dependency arrows, a finished
  imperative widget) and AG-Grid for the Table (enterprise grid: virtualization, tree-data/WBS
  grouping, Excel paste, server-side row model). Build-vs-buy on a small team. Honest about the
  tradeoffs (AG-Grid Enterprise licensing, headless alternatives like TanStack Table).
- 6.4 **The imperative-widget-in-React pattern.** React renders a stable container once, the widget owns
  its own DOM, init in `useEffect([])` with a cleanup destructor, `React.memo` plus latest-ref
  callbacks so parent churn does not reach it, and granular batched updates (`addTask`/`updateTask`)
  instead of `clearAll` + full re-parse. One source of truth, uncontrolled widget emits committed
  changes up. (This repo's `useGanttInit` is the concrete example.)
- 6.5 **Rendering at scale: 2D virtualization.** Project the graph into a flattened ordered row array;
  `length × rowHeight` = honest scroll height; render only the visible rows absolutely positioned at
  `index × rowHeight`; virtualize the time axis too so only bars in the visible window render. SVG
  memory scales with element count, so off-screen nodes are removed, not hidden.
- 6.6 **Interaction and recompute.** Optimistic visible-first edits; send the operation, not the state
  ("extend X by N days" as a small change vector); recompute only the downstream successor cone, not
  all activities; run it in a web worker so the main thread stays at 60fps. Subtlety: early dates flow
  downstream, but float and the critical path are global, so the worker returns the fully-correct
  values a beat later. (This repo's `cpmWorker` + `handleWorkerMessage` are the concrete example.)
- 6.7 **The hard part the author did not build: collaboration.** Honest section. Real-time is the
  genuinely hard problem and it is not in the demo. The author's read of how it must work: WebSocket
  rooms per project, granular operations so edits can be ordered and merged, server-authoritative
  ordering with versioning (optimistic concurrency), and the two-layer conflict story: (1) concurrency
  control (LWW on the atomic operation, ordered by server sequence, never LWW the whole state) and (2)
  semantic validity (two individually valid edits can merge into an illegal graph, e.g. Framing to
  Drywall plus Drywall to Framing makes a cycle, so the server validates the merged graph stays a legal
  DAG). Marked throughout as the author's reasoning, not claimed experience.

(The earlier "where I am probably wrong" beats are folded into the FAQ, 6.8, so they are not repeated as
a separate section.)

### 6.8 FAQ

A friendly FAQ closes the Architecture route. It anticipates the reader's real questions and answers
them plainly, in the same confident-but-humble voice, so the reader never has to dig for the honest
answer. It is the home for the "where I am probably wrong" beats.

- 6.8.1 Format: short question, short answer. Conversational. Each answer is two to four sentences, no
  marketing.
- 6.8.2 Seed questions (final list set in the implementation plan, kept honest):
    - "Why did you build this instead of just applying?" (interest, not show-off; the demo is the cover
      letter.)
    - "Why only the Gantt and Table, not the Whiteboard?" (the two grid/timeline views are library-based
      and similar; the Whiteboard is a custom D3/SVG build with its own design problem, so faking it would
      be dishonest.)
    - "Is this actually real-time / multiplayer?" (no; it is single-user. Collaboration is the genuinely
      hard part and the write-up reasons about it rather than pretending to have built it.)
    - "Did AI write all of this?" (honest split of judgment vs leverage, pointing at section 7.)
    - "How much of your read of Planera's architecture is guessing?" (a fair amount; here is what is
      inference vs what is standard practice, and the things I would ask on day one.)
    - "Can I see the code?" (links to the repo if 11.3 resolves yes; omitted by default until then.)
- 6.8.3 The FAQ never invents a flattering question. Every question is one a skeptical reader would
  actually ask; soft-ball questions are cut.

## 7. Route section: the AI-first build (its own section in the write-up)

- 7.1 A dedicated section within `/architecture` on how the work was built, because AI-first methodology
  is the explicit #1 responsibility in Planera's job description.
- 7.2 Honest and specific, not hype. What the AI-first workflow actually was: the Claude Code / agentic
  loop, spec-then-plan-then-execute, tests written before implementation as the guardrail that lets an
  agent move fast without breaking the schedule invariants.
- 7.3 Draws the line between what the AI did (mechanical implementation, test scaffolding, refactors)
  and what the author decided (architecture, the model, the scope cuts, the tradeoffs). The point is
  judgment plus leverage, not "the AI did it."
- 7.4 Ties to the second strongest card: testing as non-negotiable. The test suite is what made the
  AI-first build trustworthy. This section and section 8 reinforce each other.
- 7.5 Same humble register: "here is how I work", not "here is why I am great at AI."

## 8. Testing and accessibility (visible on purpose)

Testing-non-negotiable and AI-first are the author's two strongest cards, so the site demonstrates the
first as a quiet matter of fact.

- 8.1 Playwright E2E (in `e2e/`) covers the three routes and the persistent nav: each route renders its
  landmark, nav links route correctly, and the demo route mounts the live editor without console
  errors. Uses the existing `e2e/helpers/appReady` and `storeHandle` helpers where relevant.
- 8.2 The demo route carries forward the existing `e2e/` editor coverage (`ganttRender`,
  `tableRender`, `twoWayEditing`, `appShellLayout`, `performance`); mounting inside a route must not
  regress them.
- 8.3 Vitest component/unit tests (in `src/__tests__/` mirroring source) cover the new shell, router,
  route components, and content modules. New source files follow the repo's one-exported-function-per-
  module and file-header-comment rules.
- 8.4 Accessibility bar: 100% Lighthouse a11y on every route. Semantic HTML (one `<h1>` per route, no
  skipped headings, landmarks per route), keyboard-operable nav and demo, `prefers-reduced-motion`
  respected, WCAG 2.1 AA contrast. axe (via `@axe-core/playwright`) reports zero serious/critical
  violations on all three routes.
- 8.5 External links (e.g. to a GitHub repo or profile) use `rel="noopener noreferrer"`.

## 9. Scope: in and out

**In scope (this spec):**

- Client-side routing and the three routes (Summary, Demo, Architecture).
- The shared site shell and top nav, styled with the existing PandaCSS tokens.
- All site copy (Summary, the architecture write-up sections 6.1 to 6.8, the AI-first section 7).
- E2E + a11y coverage for the routes and nav.

**Out of scope (named, not built):**

- The Whiteboard view (custom D3/SVG; its own design problem).
- Real multi-user collaboration backend (discussed in 6.7, not implemented).
- AI/Manny-style features, DCMA quality check, Monte Carlo risk, versions/compare, PDF export.
- Any resume/CV page beyond a one-line link.
- Any change to the existing editor behavior; the Demo route mounts `AppShell` unchanged.

**No blocking dependency:**

- 9.1 The editor (`AppShell` with the two synchronized views over one CPM graph) already exists and is
  deployed. This site extends it; it does not re-specify or modify the editor.

## 10. File and component structure (additive to the existing app)

New work is the routing shell and the two prose routes; the demo is mounted as-is.

```
src/main.tsx                                   render the router instead of AppShell directly (MODIFY)
src/App.tsx                                     mounts RouterProvider (CREATE)
src/router/appRoutes.tsx                        route table: Summary, Demo, Architecture (data + router)
src/components/SiteNav/SiteNav.tsx              persistent top nav
src/components/SiteShell/SiteShell.tsx          shared layout wrapper: <header><nav> + <Outlet/> (no <main>)
src/components/ProseSection/ProseSection.tsx    reusable <section><h2> renderer for one content section
src/components/FaqList/FaqList.tsx              reusable <details>/<summary> FAQ renderer
src/components/DemoCaption/DemoCaption.tsx      dismissible "what am I looking at" note for the demo
src/routes/SummaryRoute/SummaryRoute.tsx        Summary page
src/routes/DemoRoute/DemoRoute.tsx              mounts the existing AppShell + DemoCaption
src/routes/ArchitectureRoute/ArchitectureRoute.tsx   the write-up page (maps content + AI-first + FAQ)
src/content/summaryContent.ts                   Summary prose as a typed module
src/content/architectureSections.ts             write-up sections 6.1 to 6.7 as typed ProseSection[]
src/content/aiFirstContent.ts                    AI-first section 7 prose as a typed module
src/content/faqContent.ts                        FAQ 6.8 as a typed FaqEntry[]
src/types/prose.ts                               ProseSection, FaqEntry interfaces
```

- 10.1 Router: add `react-router-dom` (the lightest standard choice for three static routes plus nav
  active state in a Vite SPA). The implementation plan pins the version.
- 10.2 Write-up prose lives in typed content modules under `src/content/`, not inline JSX, so copy can
  be edited and reviewed without touching layout. Reusable `ProseSection` and `FaqList` components
  render the content; the route maps over the typed arrays (DRY, rather than one bespoke component per
  section).
- 10.3 New files follow repo conventions: file-header comment, one exported function per module in the
  function-module trees, verb-noun names, PandaCSS only, 4-space indent, alphabetized declaration
  groups.

## 11. Open questions for the implementation plan

- 11.1 Pin the `react-router-dom` version (v7 line) and confirm it tree-shakes cleanly into the existing
  Vite build and the Railway static-serve (`serve -s dist`) setup (SPA fallback for deep links).
- 11.2 Whether the AI-first content is a section inside `/architecture` or its own `/process` route.
  Default: a section inside `/architecture` (section 7) unless it grows past ~400 words.
- 11.3 Whether to include a real link to the source repo (and if so, that the repo is public and clean
  per the push-guard rules before linking).
- 11.4 The Railway static-serve must serve `index.html` for unknown deep-link paths (`/demo`,
  `/architecture`) so client routes survive a hard refresh; confirm `serve -s` already does SPA
  fallback (it does) and that no rewrite config is missing.
