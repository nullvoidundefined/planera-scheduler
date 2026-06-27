# PR: Planera micro-portfolio site

**Branch:** `feat/portfolio-site` -> `main`
**Date:** 2026-06-27

## Summary

Wraps the existing CPM schedule editor in a three-route portfolio site so the Planera
hiring team meets the demo through a short, honest framing instead of landing cold on a
5,000-activity grid. The editor itself is unchanged; it simply moves from `/` to `/demo`
and gains a dismissible "what am I looking at" caption. Two new prose routes (a Summary
landing page and an Architecture write-up with an AI-first section and a FAQ) carry the
voice: confident but humble, and explicit about which claims are inference rather than
inside knowledge of Planera's codebase.

## What changed

- **Routing.** Added `react-router-dom` v7. `App` mounts a `RouterProvider`; `appRoutes`
  is exported separately so tests build a memory router from the same definitions the
  browser uses. A shared `SiteShell` (skip link + persistent `SiteNav` + focusable
  `#main-content` outlet, no `<main>` of its own) wraps three routes.
- **Editor moved to `/demo`.** `main.tsx` now renders `<App/>`. The E2E entry helper
  `gotoSchedule` repoints to `/demo`; that single change keeps the entire existing suite
  green, which is the proof the move regressed nothing.
- **Summary route** (`/`): the cover-letter framing, honest scope (whiteboard left out,
  single-user), and two CTAs (open the demo, read the write-up).
- **Demo caption**: a dismissible `<aside>` over the editor with four "try this" hints.
- **Architecture route** (`/architecture`): an intro, seven build-system sections (one
  model / many views, computed vs stored, library choice, imperative widgets in React,
  virtualization, optimistic recompute, and the collaboration problem reasoned about but
  not built), an AI-first "how I built this" section, and a native `<details>` FAQ.
- **Content as typed data.** All copy lives in `src/content/*` modules typed against
  `src/types/prose.ts`, rendered through reusable `ProseSection` and `FaqList`
  components, so the words can be edited without touching layout.
- **Lint fix (separate commit).** `postcss.config.cjs` tripped `no-undef` on
  `module.exports`; the flat ESLint config gave `.cjs` files no Node globals. Fixed at
  the root with a CommonJS-globals override. Pre-existing, unrelated to routing, so it is
  its own `chore` commit.

## Architectural decisions

- **react-router-dom over hand-rolled routing or a meta-framework.** Chosen: the lightest
  thing that gives real URLs, history, and an SPA fallback that already works with the
  `serve -s dist` Railway setup. Alternative: adopt Next.js to match the spec's mention of
  the employer stack. Rejected because this is a Vite SPA demo; introducing a server
  framework for three static-ish routes would be cost without benefit and would disturb the
  editor's existing build.
- **Editor mounts unchanged at `/demo`.** Chosen: `DemoRoute` renders `AppShell` exactly as
  `main.tsx` used to, beneath a visually-hidden `<h1>`. Alternative: refactor `AppShell` to
  own its routing. Rejected: the whole point is to prove the move is non-invasive, and the
  unchanged E2E suite is the evidence.
- **Landmark discipline: `SiteShell` renders no `<main>`.** Each route (and the editor's
  `AppShell`) owns its own `<main>`, so the skip link targets a focusable `#main-content`
  wrapper instead. This keeps exactly one `<main>` per route and avoids nested-landmark
  a11y findings.
- **Content as typed modules, not JSX literals.** Chosen: copy in `src/content/*` typed
  against shared interfaces, asserted by content tests (motive framing, inference markers,
  scope honesty). Alternative: inline the prose in the route components. Rejected: the voice
  is the riskiest part of a hiring artifact and deserves to be editable and test-guarded on
  its own.

## Testing

- **Unit/component (Vitest):** 122 passed (37 files). New: `SiteNav`, `appRoutes`,
  `SummaryRoute`, `DemoCaption`, `ProseSection`/`ArchitectureRoute`, `FaqList`, and content
  modules. Content tests assert tone and honesty (cover-letter framing, "Not a flex",
  whiteboard-left-out, single-user, inference markers), not just presence.
- **E2E (Playwright):** 22 passed. New specs cover the `/demo` mount + caption dismissal and
  end-to-end nav (Summary -> Write-up -> Demo). axe-core reports zero serious/critical
  violations on all three routes (the demo route excludes the DHTMLX/AG-Grid vendor
  subtrees, matching the existing `appShellLayout` scan).
- **Gates:** `typecheck`, `lint`, and `build` all clean. The build runs `panda codegen` so
  every new `css()` call is emitted.
- Two test-only fixes during the sweep, neither a gate-weakening: the demo caption's
  first-paint visibility check uses the suite's `LOAD_TIMEOUT_MS` (cold render of the full
  dataset is the documented slow moment), and the nav-link locators use `exact: true` to
  disambiguate from the Summary CTAs ("Read the write-up" / "Open the demo").

## Reflection

Time from first task commit (`chore(lint)`, 15:18) to the final test commit (15:41) was
about 23 minutes of execution; the spec and plan predate it from earlier the same day.

What I understand now that I did not at the start: the cleanest seam for this whole change
is the E2E entry helper. Because every existing spec funnels through `gotoSchedule`, moving
the editor to `/demo` is genuinely a one-line behavioral change, and the unchanged suite is
a stronger regression proof than any new assertion.

What I got wrong first: I assumed the caption failing its E2E visibility check meant a
rendering or ARIA-role bug. It was neither. A live-page probe showed the `<aside>` present
with the right role and name; the real cause was the default 5-second timeout colliding with
the cold first paint of the 5,000-activity dataset. The lesson was to verify against the
running page before "fixing" code that was already correct.

A pre-existing latent item surfaced and is deliberately left out of scope: `prettier --write`
over the full `src` glob reformats 16 files that were committed un-prettier'd. I reverted
those so each commit stays scoped; the formatting debt remains and is worth its own `chore`.
