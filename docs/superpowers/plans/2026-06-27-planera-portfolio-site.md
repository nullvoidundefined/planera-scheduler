# Planera Micro-Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing `planera-scheduler` CPM editor in a three-route portfolio site (Summary, Demo, Architecture write-up) that shows the Planera hiring team a genuine, informed architectural assessment.

**Architecture:** Add `react-router-dom` to the existing Vite SPA. A shared `SiteShell` (skip link + persistent nav + routed outlet, no `<main>` of its own) wraps three routes. The Demo route mounts the existing `AppShell` unchanged (editor moves from `/` to `/demo`). The two prose routes render typed content modules through reusable `ProseSection` and `FaqList` components. No editor behavior changes.

**Tech Stack:** Vite + React 19 + TypeScript, react-router-dom v7, PandaCSS (existing "drafting table" tokens), DHTMLX Gantt + AG-Grid (existing, untouched), Vitest + Testing Library, Playwright + @axe-core/playwright.

## Global Constraints

Every task implicitly includes these. Values copied verbatim from the spec (`docs/superpowers/specs/2026-06-27-planera-portfolio-site-design.md`).

- **Tone (binding on all copy):** confident but humble, friendly, fun, approachable. No corporate filler, no breathless superlatives. The motive is interest, not show-off. Every claim about Planera's internal architecture is marked as inference ("my bet", "from the outside it looks like", "I'm guessing"); never assert private knowledge of their codebase.
- **No U+2014 em dash** anywhere (code, comments, copy, commits). Use periods, commas, colons, parentheses.
- **PandaCSS only** for styling: `css()` and recipes from `../../../styled-system/css`. No inline style objects, no CSS files. Reference existing semantic tokens: `ink`, `inkMuted`, `primary`, `primaryHover`, `inkOnPrimary`, `canvas`, `surface`, `borderHairline`; fonts `sans`, `mono`.
- **File headers:** every new source file opens with a `/** */` block stating what it provides and why. Skip for test files only.
- **One exported function (or one component) per module** in `components/`, `routes/`, `services/`, `api/`. Content modules under `src/content/` export typed data (constants), not behavior. Helpers stay unexported.
- **Tests:** Vitest component/unit under `src/__tests__/` mirroring source; E2E under `e2e/`. Never co-locate tests beside source.
- **Prettier:** 4-space indent, 100-char width, trailing commas. Run `npx prettier --write` on touched files before each commit.
- **Naming:** verb-noun functions, `is`/`has`/`can`/`should` booleans, descriptive variables (R-217/R-232/R-233). Alphabetize declaration groups and object keys where order is free.
- **Accessibility bar:** one `<h1>` per route, no skipped headings, landmarks per route, keyboard-operable, WCAG 2.1 AA contrast, `prefers-reduced-motion` respected. axe reports zero serious/critical violations on all three routes.
- **Commit cadence:** one commit per task (test + implementation together), message ending with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Branch: `feat/portfolio-site`. Verify branch with `git branch --show-current` before each commit.
- **Task cost tags** (R-500): all tasks below are `[standard]` (one implementer + one reviewer).

## File Structure

```
package.json                                          add react-router-dom (MODIFY)
src/main.tsx                                           render <App/> not <AppShell/> (MODIFY)
src/App.tsx                                            mounts RouterProvider (CREATE)
src/router/appRoutes.tsx                               route table + browser router (CREATE)
src/components/SiteShell/SiteShell.tsx                 skip link + nav + #main-content outlet, no <main> (CREATE)
src/components/SiteNav/SiteNav.tsx                     persistent top nav with active state (CREATE)
src/components/ProseSection/ProseSection.tsx           reusable <section><h2> + paragraphs renderer (CREATE)
src/components/FaqList/FaqList.tsx                      reusable <details>/<summary> FAQ renderer (CREATE)
src/components/DemoCaption/DemoCaption.tsx             dismissible "what am I looking at" note (CREATE)
src/routes/SummaryRoute/SummaryRoute.tsx               Summary landing page (CREATE)
src/routes/DemoRoute/DemoRoute.tsx                     mounts AppShell + DemoCaption (CREATE)
src/routes/ArchitectureRoute/ArchitectureRoute.tsx     write-up: sections + AI-first + FAQ (CREATE)
src/types/prose.ts                                     ProseSection, FaqEntry interfaces (CREATE)
src/content/summaryContent.ts                          Summary copy (CREATE)
src/content/architectureSections.ts                    write-up sections 6.1 to 6.7 (CREATE)
src/content/aiFirstContent.ts                          AI-first section 7 (CREATE)
src/content/faqContent.ts                              FAQ entries (CREATE)
e2e/helpers/appReady.ts                                gotoSchedule -> "/demo" (MODIFY)
```

---

### Task 1: Routing shell, mount the editor at /demo, keep the existing suite green

**Files:**

- Modify: `package.json`, `src/main.tsx`, `e2e/helpers/appReady.ts`
- Create: `src/App.tsx`, `src/router/appRoutes.tsx`, `src/components/SiteShell/SiteShell.tsx`, `src/components/SiteNav/SiteNav.tsx`, `src/routes/SummaryRoute/SummaryRoute.tsx`, `src/routes/DemoRoute/DemoRoute.tsx`, `src/routes/ArchitectureRoute/ArchitectureRoute.tsx`
- Test: `src/__tests__/components/SiteNav/SiteNav.test.tsx`, `src/__tests__/router/appRoutes.test.tsx`

**Interfaces:**

- Consumes: existing `AppShell` from `../../components/AppShell/AppShell` (renders `<main aria-label="Planera schedule editor">`).
- Produces:
    - `function App(): JSX.Element` (mounts the router)
    - `appRoutes: RouteObject[]` and `appRouter` (createBrowserRouter result)
    - `function SiteShell(): JSX.Element`, `function SiteNav(): JSX.Element`
    - `function SummaryRoute(): JSX.Element`, `function DemoRoute(): JSX.Element`, `function ArchitectureRoute(): JSX.Element` (Summary/Architecture are stubs with their final `<h1>` only; bodies land in later tasks)

- [ ] **Step 1: Install the router**

```bash
npm install react-router-dom@^7
```

Expected: `npm ls react-router-dom` prints a resolved 7.x version, no `UNMET`.

- [ ] **Step 2: Write the failing SiteNav test** `src/__tests__/components/SiteNav/SiteNav.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { SiteNav } from "../../../components/SiteNav/SiteNav";

describe("SiteNav", () => {
    test("renders the three site links with correct destinations", () => {
        render(
            <MemoryRouter>
                <SiteNav />
            </MemoryRouter>,
        );
        expect(screen.getByRole("link", { name: "Summary" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Demo" })).toHaveAttribute("href", "/demo");
        expect(screen.getByRole("link", { name: "Write-up" })).toHaveAttribute(
            "href",
            "/architecture",
        );
    });
});
```

- [ ] **Step 3: Write the failing routing test** `src/__tests__/router/appRoutes.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { appRoutes } from "../../router/appRoutes";

function renderAt(path: string): void {
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
}

describe("site routing", () => {
    test("renders the Summary route at /", () => {
        renderAt("/");
        expect(
            screen.getByRole("heading", { level: 1, name: "I built you a Planera demo" }),
        ).toBeInTheDocument();
    });

    test("navigates from Summary to the write-up via the nav", async () => {
        const user = userEvent.setup();
        renderAt("/");
        await user.click(screen.getByRole("link", { name: "Write-up" }));
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "How I think Planera's frontend is built",
            }),
        ).toBeInTheDocument();
    });
});
```

- [ ] **Step 4: Run both tests, expect FAIL** (modules not found)

```bash
npm run test -- src/__tests__/components/SiteNav src/__tests__/router
```

Expected: FAIL resolving `../../../components/SiteNav/SiteNav` and `../../router/appRoutes`.

- [ ] **Step 5: Create `src/components/SiteNav/SiteNav.tsx`**

```tsx
/**
 * Persistent top navigation shared across the three portfolio routes. NavLink sets
 * aria-current="page" on the active route, which drives both the active style and
 * assistive-tech state.
 */
import type { JSX } from "react";
import { NavLink } from "react-router-dom";

import { css } from "../../../styled-system/css";

const navClass = css({
    alignItems: "center",
    display: "flex",
    fontFamily: "sans",
    gap: "20px",
    paddingBlock: "12px",
    paddingInline: "20px",
});

const linkClass = css({
    "&[aria-current=page]": { color: "ink", fontWeight: "600" },
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { color: "ink" },
    color: "inkMuted",
    fontSize: "14px",
    textDecoration: "none",
});

export function SiteNav(): JSX.Element {
    return (
        <nav aria-label="Site" className={navClass}>
            <NavLink className={linkClass} end to="/">
                Summary
            </NavLink>
            <NavLink className={linkClass} to="/demo">
                Demo
            </NavLink>
            <NavLink className={linkClass} to="/architecture">
                Write-up
            </NavLink>
        </nav>
    );
}
```

- [ ] **Step 6: Create `src/components/SiteShell/SiteShell.tsx`**

```tsx
/**
 * Shared site chrome: a keyboard skip link, the persistent top nav, and the routed
 * outlet wrapped in a focusable #main-content region. Renders no <main> of its own
 * because each route (and the Demo route's AppShell) owns its own <main> landmark.
 */
import type { JSX } from "react";
import { Outlet } from "react-router-dom";

import { css } from "../../../styled-system/css";
import { SiteNav } from "../SiteNav/SiteNav";

const shellClass = css({
    bg: "canvas",
    color: "ink",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "0",
});

const contentClass = css({
    display: "flex",
    flex: "1",
    flexDirection: "column",
    minHeight: "0",
    overflow: "auto",
});

const headerClass = css({ borderBottom: "1px solid token(colors.borderHairline)" });

const skipLinkClass = css({
    _focus: {
        bg: "primary",
        color: "inkOnPrimary",
        clip: "auto",
        height: "auto",
        left: "8px",
        padding: "8px 12px",
        top: "8px",
        width: "auto",
    },
    clip: "rect(0 0 0 0)",
    fontFamily: "sans",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    width: "1px",
});

export function SiteShell(): JSX.Element {
    return (
        <div className={shellClass}>
            <a className={skipLinkClass} href="#main-content">
                Skip to content
            </a>
            <header className={headerClass}>
                <SiteNav />
            </header>
            <div className={contentClass} id="main-content" tabIndex={-1}>
                <Outlet />
            </div>
        </div>
    );
}
```

- [ ] **Step 7: Create the two prose route stubs** (final `<h1>` only; bodies added in Tasks 2/4 to 6)

`src/routes/SummaryRoute/SummaryRoute.tsx`:

```tsx
/** Summary (landing) route: the friendly handshake. Body copy lands in Task 2. */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "680px",
    padding: "48px 24px",
});

export function SummaryRoute(): JSX.Element {
    return (
        <main aria-label="Summary" className={mainClass}>
            <h1>I built you a Planera demo</h1>
        </main>
    );
}
```

`src/routes/ArchitectureRoute/ArchitectureRoute.tsx`:

```tsx
/** Architecture write-up route: the assessment. Sections, AI-first, and FAQ land in Tasks 4 to 6. */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "720px",
    padding: "48px 24px",
});

export function ArchitectureRoute(): JSX.Element {
    return (
        <main aria-label="Architecture write-up" className={mainClass}>
            <h1>How I think Planera's frontend is built</h1>
        </main>
    );
}
```

- [ ] **Step 8: Create `src/routes/DemoRoute/DemoRoute.tsx`** (mounts the real editor now, so the suite stays green)

```tsx
/**
 * Demo route: the live CPM editor. Mounts the existing AppShell unchanged beneath a
 * visually-hidden page heading (AppShell supplies the <main> landmark but no <h1>).
 * The DemoCaption affordance is added in Task 3.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { AppShell } from "../../components/AppShell/AppShell";

const visuallyHiddenClass = css({
    clip: "rect(0 0 0 0)",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
});

const demoFrameClass = css({ display: "flex", flex: "1", minHeight: "0" });

export function DemoRoute(): JSX.Element {
    return (
        <>
            <h1 className={visuallyHiddenClass}>Live demo</h1>
            <div className={demoFrameClass}>
                <AppShell />
            </div>
        </>
    );
}
```

- [ ] **Step 9: Create `src/router/appRoutes.tsx`**

```tsx
/**
 * Route table for the portfolio site: the shared SiteShell wraps the Summary (index),
 * Demo, and Architecture routes. appRoutes is exported on its own so tests can build a
 * memory router from the same definitions the browser router uses.
 */
import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { SiteShell } from "../components/SiteShell/SiteShell";
import { ArchitectureRoute } from "../routes/ArchitectureRoute/ArchitectureRoute";
import { DemoRoute } from "../routes/DemoRoute/DemoRoute";
import { SummaryRoute } from "../routes/SummaryRoute/SummaryRoute";

export const appRoutes: RouteObject[] = [
    {
        children: [
            { element: <SummaryRoute />, index: true },
            { element: <DemoRoute />, path: "demo" },
            { element: <ArchitectureRoute />, path: "architecture" },
        ],
        element: <SiteShell />,
    },
];

export const appRouter = createBrowserRouter(appRoutes);
```

- [ ] **Step 10: Create `src/App.tsx`**

```tsx
/** Application root: provides the client-side router for the three-route portfolio site. */
import type { JSX } from "react";
import { RouterProvider } from "react-router-dom";

import { appRouter } from "./router/appRoutes";

export function App(): JSX.Element {
    return <RouterProvider router={appRouter} />;
}
```

- [ ] **Step 11: Modify `src/main.tsx`** to render `<App/>` instead of `<AppShell/>`. Replace the `AppShell` import with `import { App } from "./App";`, and change the render body from `<AppShell />` to `<App />`. Keep everything else (font imports, MSW `worker.start`, the dev `__scheduleStore` handle, `QueryClientProvider`, `StrictMode`).

The render block becomes:

```tsx
createRoot(rootElement).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StrictMode>,
);
```

- [ ] **Step 12: Run the unit tests, expect PASS**

```bash
npm run test -- src/__tests__/components/SiteNav src/__tests__/router
```

Expected: all pass (Summary stub `<h1>` and Architecture stub `<h1>` resolve; nav links route).

- [ ] **Step 13: Repoint the E2E entry helper** in `e2e/helpers/appReady.ts`: the editor now lives at `/demo`, not `/`. Change `gotoSchedule`:

```ts
export async function gotoSchedule(page: Page): Promise<void> {
    await page.goto("/demo");
}
```

- [ ] **Step 14: Run the FULL existing E2E suite, expect PASS** (this proves moving the editor to `/demo` regressed nothing)

```bash
npm run e2e
```

Expected: all existing specs (`ganttRender`, `tableRender`, `twoWayEditing`, `appShellLayout`, `tableEdit`, `performance`) pass against `/demo`.

- [ ] **Step 15: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all exit 0 (build runs `panda codegen` so the new `css()` calls are emitted).

- [ ] **Step 16: Commit**

```bash
git branch --show-current   # must print feat/portfolio-site
npx prettier --write "src/**/*.{ts,tsx}" e2e/helpers/appReady.ts
git add -A && git commit -m "feat: three-route site shell; editor moves to /demo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Summary route copy

**Files:**

- Create: `src/content/summaryContent.ts`
- Modify: `src/routes/SummaryRoute/SummaryRoute.tsx`
- Test: `src/__tests__/content/summaryContent.test.ts`, `src/__tests__/routes/SummaryRoute/SummaryRoute.test.tsx`

**Interfaces:**

- Consumes: nothing new.
- Produces: `SUMMARY_HEADING: string`, `SUMMARY_PARAGRAPHS: string[]`; `SummaryRoute` renders them plus two CTA links (`/demo`, `/architecture`).

- [ ] **Step 1: Write the failing content test** `src/__tests__/content/summaryContent.test.ts`

```ts
import { describe, expect, test } from "vitest";

import { SUMMARY_HEADING, SUMMARY_PARAGRAPHS } from "../../content/summaryContent";

describe("summary content", () => {
    test("leads with the cover-letter framing", () => {
        expect(SUMMARY_HEADING).toBe("I built you a Planera demo");
        expect(SUMMARY_PARAGRAPHS.some((p) => p.includes("instead of a cover letter"))).toBe(true);
    });

    test("is honest about scope: whiteboard left out and single-user", () => {
        const joined = SUMMARY_PARAGRAPHS.join(" ");
        expect(joined).toContain("left the whiteboard out");
        expect(joined).toContain("single-user");
    });

    test("names the motive as interest, not a flex", () => {
        expect(SUMMARY_PARAGRAPHS.some((p) => p.includes("Not a flex"))).toBe(true);
    });
});
```

- [ ] **Step 2: Run, expect FAIL** (module missing)

```bash
npm run test -- src/__tests__/content/summaryContent.test.ts
```

- [ ] **Step 3: Create `src/content/summaryContent.ts`**

```ts
/**
 * Copy for the Summary (landing) route, kept in one typed module so the words can be
 * edited and reviewed without touching layout. Tone: confident but humble, friendly,
 * interest over show-off (see the design spec, section 2).
 */
export const SUMMARY_HEADING = "I built you a Planera demo";

export const SUMMARY_PARAGRAPHS = [
    "Hi, I'm Ian. I'm applying for the frontend role at Planera, and instead of a cover letter I built you this.",
    "Planera is one CPM graph shown as three views: a whiteboard, a Gantt, and a table. Edit in one and the others re-derive, because they're all renderers over a single source of truth. I found that genuinely interesting, so I rebuilt two of those views, the Gantt and the table, on what looks like your actual stack (React, TypeScript, DHTMLX Gantt, AG-Grid, PandaCSS, Vitest) to check whether I actually understand how the pieces fit together.",
    "I left the whiteboard out on purpose. It's a custom D3/SVG build with its own design problems, and faking it would have told you nothing true. This demo is also single-user. Real-time collaboration is the genuinely hard part of your system, so I wrote about how I think it works rather than pretending to have built it.",
    "That's the whole idea. Not a flex, just a way to show I'm interested enough to do the homework, and honest about where the homework stops.",
];
```

- [ ] **Step 4: Run, expect PASS**

```bash
npm run test -- src/__tests__/content/summaryContent.test.ts
```

- [ ] **Step 5: Write the failing route test** `src/__tests__/routes/SummaryRoute/SummaryRoute.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { SummaryRoute } from "../../../routes/SummaryRoute/SummaryRoute";

function renderRoute(): void {
    render(
        <MemoryRouter>
            <SummaryRoute />
        </MemoryRouter>,
    );
}

describe("SummaryRoute", () => {
    test("renders one h1 and the body copy", () => {
        renderRoute();
        expect(
            screen.getByRole("heading", { level: 1, name: "I built you a Planera demo" }),
        ).toBeInTheDocument();
        expect(screen.getByText(/instead of a cover letter/)).toBeInTheDocument();
    });

    test("offers the two calls to action", () => {
        renderRoute();
        expect(screen.getByRole("link", { name: "Open the demo" })).toHaveAttribute(
            "href",
            "/demo",
        );
        expect(screen.getByRole("link", { name: "Read the write-up" })).toHaveAttribute(
            "href",
            "/architecture",
        );
    });
});
```

- [ ] **Step 6: Run, expect FAIL** (no body copy, no CTA links yet)

```bash
npm run test -- src/__tests__/routes/SummaryRoute
```

- [ ] **Step 7: Rewrite `src/routes/SummaryRoute/SummaryRoute.tsx`**

```tsx
/**
 * Summary (landing) route: the friendly handshake. Renders the typed summary copy and
 * two calls to action (open the demo, read the write-up). The author byline carries no
 * external link until the source repo is confirmed public (spec open question 11.3).
 */
import type { JSX } from "react";
import { Link } from "react-router-dom";

import { css } from "../../../styled-system/css";
import { SUMMARY_HEADING, SUMMARY_PARAGRAPHS } from "../../content/summaryContent";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "680px",
    padding: "48px 24px",
});

const headingClass = css({ color: "ink", fontSize: "32px", lineHeight: "1.2", margin: "0 0 24px" });

const paragraphClass = css({
    color: "ink",
    fontSize: "17px",
    lineHeight: "1.6",
    margin: "0 0 16px",
});

const ctaRowClass = css({ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "28px" });

const ctaPrimaryClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { bg: "primaryHover" },
    bg: "primary",
    borderRadius: "4px",
    color: "inkOnPrimary",
    fontSize: "15px",
    fontWeight: "500",
    padding: "10px 16px",
    textDecoration: "none",
});

const ctaSecondaryClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { borderColor: "primary", color: "ink" },
    border: "1px solid token(colors.borderHairline)",
    borderRadius: "4px",
    color: "ink",
    fontSize: "15px",
    fontWeight: "500",
    padding: "10px 16px",
    textDecoration: "none",
});

const bylineClass = css({ color: "inkMuted", fontSize: "14px", marginTop: "32px" });

export function SummaryRoute(): JSX.Element {
    return (
        <main aria-label="Summary" className={mainClass}>
            <h1 className={headingClass}>{SUMMARY_HEADING}</h1>
            {SUMMARY_PARAGRAPHS.map((paragraph) => (
                <p className={paragraphClass} key={paragraph.slice(0, 24)}>
                    {paragraph}
                </p>
            ))}
            <div className={ctaRowClass}>
                <Link className={ctaPrimaryClass} to="/demo">
                    Open the demo
                </Link>
                <Link className={ctaSecondaryClass} to="/architecture">
                    Read the write-up
                </Link>
            </div>
            <p className={bylineClass}>Built by Ian Greenough.</p>
        </main>
    );
}
```

- [ ] **Step 8: Run the route test, expect PASS**

```bash
npm run test -- src/__tests__/routes/SummaryRoute src/__tests__/content/summaryContent.test.ts
```

- [ ] **Step 9: Typecheck and commit**

```bash
npm run typecheck
git branch --show-current
npx prettier --write "src/**/*.{ts,tsx}"
git add -A && git commit -m "feat: Summary route copy and calls to action

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Demo route caption (dismissible "what am I looking at")

**Files:**

- Create: `src/components/DemoCaption/DemoCaption.tsx`
- Modify: `src/routes/DemoRoute/DemoRoute.tsx`
- Test: `src/__tests__/components/DemoCaption/DemoCaption.test.tsx`, `e2e/demoRoute.spec.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `function DemoCaption(): JSX.Element | null` (an `<aside aria-label="How to explore the demo">` with a "Dismiss" button that hides it via local state).

- [ ] **Step 1: Write the failing component test** `src/__tests__/components/DemoCaption/DemoCaption.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { DemoCaption } from "../../../components/DemoCaption/DemoCaption";

describe("DemoCaption", () => {
    test("shows guidance and can be dismissed", async () => {
        const user = userEvent.setup();
        render(<DemoCaption />);
        const aside = screen.getByRole("complementary", { name: "How to explore the demo" });
        expect(aside).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Dismiss" }));
        expect(
            screen.queryByRole("complementary", { name: "How to explore the demo" }),
        ).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm run test -- src/__tests__/components/DemoCaption
```

- [ ] **Step 3: Create `src/components/DemoCaption/DemoCaption.tsx`**

```tsx
/**
 * A small, dismissible note over the demo that tells a first-time reader what to try
 * (drag a bar, edit a cell, scroll the dataset, toggle Gantt/Table). Uses an <aside>
 * landmark and a native button; once dismissed it renders nothing for the session.
 */
import { useState, type JSX } from "react";

import { css } from "../../../styled-system/css";

const HINTS = [
    "Drag a Gantt bar and watch its successors recompute.",
    "Edit a Table cell and watch the Gantt re-derive.",
    "Scroll to feel the virtualization across thousands of activities.",
    "Toggle Gantt and Table: one model, two renderers.",
];

const asideClass = css({
    bg: "surface",
    border: "1px solid token(colors.borderHairline)",
    borderRadius: "6px",
    fontFamily: "sans",
    insetInlineEnd: "16px",
    maxWidth: "320px",
    padding: "12px 14px",
    position: "absolute",
    top: "16px",
    zIndex: "10",
});

const headerRowClass = css({
    alignItems: "center",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between",
});

const titleClass = css({ color: "ink", fontSize: "13px", fontWeight: "600" });

const dismissButtonClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    _hover: { color: "ink" },
    background: "none",
    border: "none",
    color: "inkMuted",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px 4px",
});

const listClass = css({
    color: "inkMuted",
    display: "flex",
    flexDirection: "column",
    fontSize: "12px",
    gap: "4px",
    lineHeight: "1.45",
    margin: "8px 0 0",
    paddingInlineStart: "16px",
});

export function DemoCaption(): JSX.Element | null {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) {
        return null;
    }

    return (
        <aside aria-label="How to explore the demo" className={asideClass}>
            <div className={headerRowClass}>
                <span className={titleClass}>What am I looking at?</span>
                <button
                    className={dismissButtonClass}
                    onClick={() => setIsDismissed(true)}
                    type="button"
                >
                    Dismiss
                </button>
            </div>
            <ul className={listClass}>
                {HINTS.map((hint) => (
                    <li key={hint}>{hint}</li>
                ))}
            </ul>
        </aside>
    );
}
```

- [ ] **Step 4: Run, expect PASS**

```bash
npm run test -- src/__tests__/components/DemoCaption
```

- [ ] **Step 5: Mount the caption in `src/routes/DemoRoute/DemoRoute.tsx`.** The demo frame becomes `position: relative` so the absolutely-positioned caption anchors to it. Add the import and render `<DemoCaption />` inside the frame, before `<AppShell />`:

```tsx
/**
 * Demo route: the live CPM editor. Mounts the existing AppShell unchanged beneath a
 * visually-hidden page heading, with a dismissible DemoCaption anchored over it.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { AppShell } from "../../components/AppShell/AppShell";
import { DemoCaption } from "../../components/DemoCaption/DemoCaption";

const visuallyHiddenClass = css({
    clip: "rect(0 0 0 0)",
    height: "1px",
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
});

const demoFrameClass = css({ display: "flex", flex: "1", minHeight: "0", position: "relative" });

export function DemoRoute(): JSX.Element {
    return (
        <>
            <h1 className={visuallyHiddenClass}>Live demo</h1>
            <div className={demoFrameClass}>
                <DemoCaption />
                <AppShell />
            </div>
        </>
    );
}
```

- [ ] **Step 6: Write the failing demo E2E** `e2e/demoRoute.spec.ts`

```ts
import { expect, test } from "@playwright/test";

import { LOAD_TIMEOUT_MS, waitForFirstGanttBar } from "./helpers/appReady";

test("the demo route mounts the live editor", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("main", { name: "Planera schedule editor" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
});

test("the demo caption can be dismissed", async ({ page }) => {
    await page.goto("/demo");
    const caption = page.getByRole("complementary", { name: "How to explore the demo" });
    await expect(caption).toBeVisible();
    await page.getByRole("button", { exact: true, name: "Dismiss" }).click();
    await expect(caption).toBeHidden();
});
```

- [ ] **Step 7: Run the demo E2E, expect PASS**

```bash
npm run e2e -- e2e/demoRoute.spec.ts
```

Expected: both tests pass (editor mounts at `/demo`, caption dismisses).

- [ ] **Step 8: Typecheck and commit**

```bash
npm run typecheck
git branch --show-current
npx prettier --write "src/**/*.{ts,tsx}" e2e/demoRoute.spec.ts
git add -A && git commit -m "feat: dismissible demo caption on the /demo route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Architecture write-up sections (6.1 to 6.7)

**Files:**

- Create: `src/types/prose.ts`, `src/components/ProseSection/ProseSection.tsx`, `src/content/architectureSections.ts`
- Modify: `src/routes/ArchitectureRoute/ArchitectureRoute.tsx`
- Test: `src/__tests__/content/architectureSections.test.ts`, `src/__tests__/routes/ArchitectureRoute/ArchitectureRoute.test.tsx`

**Interfaces:**

- Consumes: nothing new.
- Produces:
    - `interface ProseSection { body: string[]; heading: string; id: string }`, `interface FaqEntry { answer: string; question: string }`
    - `function ProseSection({ section }: { section: ProseSection }): JSX.Element`
    - `ARCHITECTURE_SECTIONS: ProseSection[]` (the seven sections 6.1 to 6.7)

- [ ] **Step 1: Create `src/types/prose.ts`**

```ts
/**
 * Shared content shapes for the portfolio site's prose routes: a titled section with
 * paragraphs (ProseSection) and a single FAQ disclosure (FaqEntry). Content modules
 * under src/content/ are typed against these.
 */
export interface FaqEntry {
    answer: string;
    question: string;
}

export interface ProseSection {
    body: string[];
    heading: string;
    id: string;
}
```

- [ ] **Step 2: Write the failing content test** `src/__tests__/content/architectureSections.test.ts`

```ts
import { describe, expect, test } from "vitest";

import { ARCHITECTURE_SECTIONS } from "../../content/architectureSections";

const EXPECTED_IDS = [
    "oneModelThreeViews",
    "computedVsStored",
    "whyTheseLibraries",
    "imperativeWidgetInReact",
    "virtualizationAtScale",
    "interactionAndRecompute",
    "collaboration",
];

const INFERENCE_MARKERS = ["my bet", "from the outside", "I'm guessing", "I think", "I'd want to"];

describe("architecture sections", () => {
    test("covers the seven build-system sections in order", () => {
        expect(ARCHITECTURE_SECTIONS.map((section) => section.id)).toEqual(EXPECTED_IDS);
    });

    test("every section has a heading and non-empty body", () => {
        for (const section of ARCHITECTURE_SECTIONS) {
            expect(section.heading.length).toBeGreaterThan(0);
            expect(section.body.length).toBeGreaterThan(0);
            expect(section.body.every((paragraph) => paragraph.length > 0)).toBe(true);
        }
    });

    test("marks claims about Planera as inference, not fact", () => {
        const corpus = ARCHITECTURE_SECTIONS.flatMap((section) => section.body)
            .join(" ")
            .toLowerCase();
        expect(INFERENCE_MARKERS.some((marker) => corpus.includes(marker.toLowerCase()))).toBe(
            true,
        );
    });
});
```

- [ ] **Step 3: Run, expect FAIL**

```bash
npm run test -- src/__tests__/content/architectureSections.test.ts
```

- [ ] **Step 4: Create `src/content/architectureSections.ts`** (real copy, inference marked)

```ts
/**
 * The Architecture write-up's library-based build-system sections (spec 6.1 to 6.7):
 * the author's outside read of how Planera's Gantt and Table are built over one CPM
 * graph. Whiteboard is bracketed out. Every claim about Planera's internals is marked
 * as inference.
 */
import type { ProseSection } from "../types/prose";

export const ARCHITECTURE_SECTIONS: ProseSection[] = [
    {
        body: [
            "From the outside, the cleanest way to explain Planera is that there isn't really a Gantt and a table and a whiteboard. There's one CPM graph, and those three things are just different ways of drawing it. Activities are nodes, dependencies are edges, and each view subscribes to the same source of truth.",
            "Edit a duration in the table and the Gantt bar moves, because they're reading the same data, not syncing three copies. My bet is that this single-model-many-renderers shape is the thing that keeps the product from drowning in three-way sync bugs.",
        ],
        heading: "The bet: one model, three views",
        id: "oneModelThreeViews",
    },
    {
        body: [
            "The detail that makes this a schedule and not a to-do list: most of what you see is computed, not stored. Durations, dependencies, constraints, and calendars are the inputs you save. The dates, the float, and the critical-path flag are outputs the CPM engine derives from the graph.",
            "That's also why the graph has to stay a DAG. A cycle has no valid set of dates. So 'add dependency' isn't just an insert, it's an insert that has to be rejected if it would close a loop.",
        ],
        heading: "Computed versus stored",
        id: "computedVsStored",
    },
    {
        body: [
            "DHTMLX for the Gantt and AG-Grid for the table both look like build-versus-buy calls a small team makes on purpose. A Gantt is a finished, fiddly widget: rows, a time axis, draggable bars, dependency arrows. AG-Grid brings the enterprise grid behaviors the domain actually needs: virtualization, tree-data grouping for WBS, Excel paste, a server-side row model.",
            "You could hand-roll both on something headless like TanStack Table, and you'd trade a license fee for a lot of code to own. On a small team, buying the hard parts and owning the glue is the move. (AG-Grid's enterprise features need a paid license, which is the honest cost of that choice.)",
        ],
        heading: "Why these libraries",
        id: "whyTheseLibraries",
    },
    {
        body: [
            "This is the part I was most curious whether I could get right, because it's the actual day-job skill. DHTMLX and AG-Grid own their own DOM; React doesn't get to reconcile inside them. So you render a stable container once, init the widget in a useEffect with an empty dependency array, and return its destructor for cleanup.",
            "You memo the wrapper and use a latest-ref for callbacks so a parent re-render never reaches the widget. And you feed it data with granular batched updates, addTask and updateTask, never a clearAll and full re-parse, because that flickers. One source of truth: the widget owns live interaction and emits committed changes back up.",
        ],
        heading: "Keeping imperative widgets happy inside React",
        id: "imperativeWidgetInReact",
    },
    {
        body: [
            "You can't put thousands of DOM rows on screen, so the graph gets flattened into an ordered array, and only the visible window renders. The container is the full height (rows times row-height) so the scrollbar tells the truth, and each rendered row is absolutely positioned at its real offset.",
            "Because it's a Gantt, the same trick runs on the time axis: project dates to pixels and only draw the bars in the visible window. SVG memory scales with element count, not how wide the viewBox is, so off-screen bars get removed, not just hidden.",
        ],
        heading: "Rendering thousands of rows",
        id: "virtualizationAtScale",
    },
    {
        body: [
            "When you drag a bar, the on-screen row should move instantly, before any math finishes. So the edit is optimistic and visible-first, and what gets sent is the operation ('extend X by N days'), not the whole plan. The recompute only touches the downstream cone, the successors after the changed activity, not every row.",
            "And it runs in a web worker so the main thread keeps painting at sixty frames a second. One subtlety I'd want to confirm: early dates flow downstream cleanly, but float and the critical path are global properties, so the fully-correct values land a beat later.",
        ],
        heading: "Dragging a bar without freezing",
        id: "interactionAndRecompute",
    },
    {
        body: [
            "My demo is single-user, and I want to be upfront that real-time is the genuinely hard problem here, not the rendering. Here's how I think it has to work, as reasoning rather than experience. Each project is a WebSocket room; the server broadcasts edits to everyone in it. You send granular operations so they can be ordered and merged, and the server is authoritative: entities carry a version, and stale edits get rejected and retried.",
            "The insight I'd lead with is that conflict resolution is two separate problems. One is concurrency: if two people move the same activity, last-write-wins is fine, but only on that one atomic operation, ordered by a server sequence, never on the whole plan. The other is semantic validity: two perfectly valid edits can merge into an invalid schedule. I add Framing to Drywall, you add Drywall to Framing, and now there's a cycle with no valid dates.",
            "So the server has to validate that the merged graph is still a legal DAG and reject what isn't. Convergence isn't the same as correctness.",
        ],
        heading: "The hard part I didn't build: collaboration",
        id: "collaboration",
    },
];
```

- [ ] **Step 5: Run the content test, expect PASS**

```bash
npm run test -- src/__tests__/content/architectureSections.test.ts
```

- [ ] **Step 6: Create `src/components/ProseSection/ProseSection.tsx`**

```tsx
/**
 * Renders one titled prose section: an <h2> heading wired to its <section> via
 * aria-labelledby, followed by the section's paragraphs. Reused for every write-up
 * section and for the AI-first section so the route stays DRY.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import type { ProseSection as ProseSectionData } from "../../types/prose";

interface ProseSectionProps {
    section: ProseSectionData;
}

const sectionClass = css({ margin: "0 0 36px" });

const headingClass = css({ color: "ink", fontSize: "22px", lineHeight: "1.3", margin: "0 0 12px" });

const paragraphClass = css({
    color: "ink",
    fontSize: "17px",
    lineHeight: "1.6",
    margin: "0 0 14px",
});

export function ProseSection({ section }: ProseSectionProps): JSX.Element {
    return (
        <section aria-labelledby={`${section.id}-heading`} className={sectionClass}>
            <h2 className={headingClass} id={`${section.id}-heading`}>
                {section.heading}
            </h2>
            {section.body.map((paragraph) => (
                <p className={paragraphClass} key={paragraph.slice(0, 24)}>
                    {paragraph}
                </p>
            ))}
        </section>
    );
}
```

- [ ] **Step 7: Write the failing route test** `src/__tests__/routes/ArchitectureRoute/ArchitectureRoute.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { ARCHITECTURE_SECTIONS } from "../../../content/architectureSections";
import { ArchitectureRoute } from "../../../routes/ArchitectureRoute/ArchitectureRoute";

function renderRoute(): void {
    render(
        <MemoryRouter>
            <ArchitectureRoute />
        </MemoryRouter>,
    );
}

describe("ArchitectureRoute", () => {
    test("renders exactly one h1", () => {
        renderRoute();
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "How I think Planera's frontend is built",
            }),
        ).toBeInTheDocument();
    });

    test("renders every build-system section heading", () => {
        renderRoute();
        for (const section of ARCHITECTURE_SECTIONS) {
            expect(
                screen.getByRole("heading", { level: 2, name: section.heading }),
            ).toBeInTheDocument();
        }
    });
});
```

- [ ] **Step 8: Run, expect FAIL** (route still a stub)

```bash
npm run test -- src/__tests__/routes/ArchitectureRoute
```

- [ ] **Step 9: Rewrite `src/routes/ArchitectureRoute/ArchitectureRoute.tsx`** to render the intro and map the sections. (AI-first and FAQ are appended in Tasks 5 and 6.)

```tsx
/**
 * Architecture write-up route: the author's outside read of how Planera's library-based
 * frontend (DHTMLX Gantt + AG-Grid Table over one CPM graph) is built. Maps the typed
 * section content through ProseSection. The AI-first section and FAQ are appended in
 * later tasks.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import { ProseSection } from "../../components/ProseSection/ProseSection";
import { ARCHITECTURE_SECTIONS } from "../../content/architectureSections";

const INTRO =
    "This is my read, from the outside, of how the library-based half of Planera's frontend fits together: the Gantt and the table as two renderers over one CPM graph. I left the whiteboard out because it's a custom build with its own design problem. Where I'm reasoning about your internals rather than stating a fact, I've tried to say so.";

const mainClass = css({
    fontFamily: "sans",
    marginInline: "auto",
    maxWidth: "720px",
    padding: "48px 24px",
});

const headingClass = css({ color: "ink", fontSize: "32px", lineHeight: "1.2", margin: "0 0 16px" });

const introClass = css({
    color: "inkMuted",
    fontSize: "18px",
    lineHeight: "1.6",
    margin: "0 0 40px",
});

export function ArchitectureRoute(): JSX.Element {
    return (
        <main aria-label="Architecture write-up" className={mainClass}>
            <h1 className={headingClass}>How I think Planera's frontend is built</h1>
            <p className={introClass}>{INTRO}</p>
            {ARCHITECTURE_SECTIONS.map((section) => (
                <ProseSection key={section.id} section={section} />
            ))}
        </main>
    );
}
```

- [ ] **Step 10: Run the route test, expect PASS**

```bash
npm run test -- src/__tests__/routes/ArchitectureRoute src/__tests__/content/architectureSections.test.ts
```

- [ ] **Step 11: Typecheck and commit**

```bash
npm run typecheck
git branch --show-current
npx prettier --write "src/**/*.{ts,tsx}"
git add -A && git commit -m "feat: architecture write-up sections over one CPM graph

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: AI-first build section

**Files:**

- Create: `src/content/aiFirstContent.ts`
- Modify: `src/routes/ArchitectureRoute/ArchitectureRoute.tsx`
- Test: `src/__tests__/content/aiFirstContent.test.ts` (extends the ArchitectureRoute test)

**Interfaces:**

- Consumes: `ProseSection` type, `ProseSection` component.
- Produces: `AI_FIRST_SECTION: ProseSection` (id `aiFirst`, heading "How I built this").

- [ ] **Step 1: Write the failing content test** `src/__tests__/content/aiFirstContent.test.ts`

```ts
import { describe, expect, test } from "vitest";

import { AI_FIRST_SECTION } from "../../content/aiFirstContent";

describe("AI-first section", () => {
    test("is the 'How I built this' section and splits judgment from leverage", () => {
        expect(AI_FIRST_SECTION.id).toBe("aiFirst");
        expect(AI_FIRST_SECTION.heading).toBe("How I built this");
        const corpus = AI_FIRST_SECTION.body.join(" ");
        expect(corpus).toContain("tests");
        expect(corpus.toLowerCase()).toContain("judgment");
    });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm run test -- src/__tests__/content/aiFirstContent.test.ts
```

- [ ] **Step 3: Create `src/content/aiFirstContent.ts`**

```ts
/**
 * The AI-first build section (spec section 7). Planera's job description puts AI-first
 * methodology first, so this explains honestly how the work was made: leverage from an
 * agentic loop, judgment from the author, tests as the guardrail. Same humble register
 * as the rest of the write-up.
 */
import type { ProseSection } from "../types/prose";

export const AI_FIRST_SECTION: ProseSection = {
    body: [
        "Planera's job description puts AI-first methodology at the top, so it's fair to ask how this was actually made. The honest version: I worked spec first, then a written plan, then execution, with an agentic coding loop doing a lot of the mechanical typing.",
        "What made that safe wasn't the AI, it was the tests. Every behavior got a failing test before the implementation existed, so the loop could move fast without quietly breaking a schedule invariant. The AI wrote implementations, scaffolded tests, and did refactors. I made the calls that matter: the data model, what to build and what to leave out, the library tradeoffs, where to stop.",
        "That's the pairing I'd bring: judgment plus leverage, with a test suite as the guardrail that makes the leverage trustworthy. It's also why I treat testing as non-negotiable rather than a nice-to-have. The two go together.",
    ],
    heading: "How I built this",
    id: "aiFirst",
};
```

- [ ] **Step 4: Run, expect PASS**

```bash
npm run test -- src/__tests__/content/aiFirstContent.test.ts
```

- [ ] **Step 5: Append the AI-first section in `ArchitectureRoute.tsx`.** Add `import { AI_FIRST_SECTION } from "../../content/aiFirstContent";` and render `<ProseSection section={AI_FIRST_SECTION} />` immediately after the `ARCHITECTURE_SECTIONS.map(...)` block (still inside `<main>`).

- [ ] **Step 6: Extend the ArchitectureRoute test.** In `src/__tests__/routes/ArchitectureRoute/ArchitectureRoute.test.tsx`, add:

```tsx
test("renders the AI-first section heading", () => {
    renderRoute();
    expect(screen.getByRole("heading", { level: 2, name: "How I built this" })).toBeInTheDocument();
});
```

- [ ] **Step 7: Run the route test, expect PASS**

```bash
npm run test -- src/__tests__/routes/ArchitectureRoute
```

- [ ] **Step 8: Typecheck and commit**

```bash
npm run typecheck
git branch --show-current
npx prettier --write "src/**/*.{ts,tsx}"
git add -A && git commit -m "feat: AI-first build section in the write-up

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: FAQ

**Files:**

- Create: `src/content/faqContent.ts`, `src/components/FaqList/FaqList.tsx`
- Modify: `src/routes/ArchitectureRoute/ArchitectureRoute.tsx`
- Test: `src/__tests__/content/faqContent.test.ts`, `src/__tests__/components/FaqList/FaqList.test.tsx` (extends ArchitectureRoute test)

**Interfaces:**

- Consumes: `FaqEntry` type.
- Produces: `FAQ_ENTRIES: FaqEntry[]`; `function FaqList({ entries }: { entries: FaqEntry[] }): JSX.Element`.

- [ ] **Step 1: Write the failing content test** `src/__tests__/content/faqContent.test.ts`

```ts
import { describe, expect, test } from "vitest";

import { FAQ_ENTRIES } from "../../content/faqContent";

describe("FAQ content", () => {
    test("answers at least five honest questions", () => {
        expect(FAQ_ENTRIES.length).toBeGreaterThanOrEqual(5);
    });

    test("every entry is a real question with a real answer", () => {
        for (const entry of FAQ_ENTRIES) {
            expect(entry.question.endsWith("?")).toBe(true);
            expect(entry.answer.length).toBeGreaterThan(0);
        }
    });

    test("includes the scope and the AI questions", () => {
        const questions = FAQ_ENTRIES.map((entry) => entry.question).join(" ");
        expect(questions).toContain("whiteboard");
        expect(questions.toLowerCase()).toContain("ai");
    });
});
```

- [ ] **Step 2: Run, expect FAIL**

```bash
npm run test -- src/__tests__/content/faqContent.test.ts
```

- [ ] **Step 3: Create `src/content/faqContent.ts`**

```ts
/**
 * FAQ for the Architecture route (spec 6.8). Anticipates the questions a skeptical
 * reader would actually ask, and absorbs the "where I'm probably wrong" honesty. No
 * invented flattering questions. The "can I see the code" entry is added once the repo
 * is confirmed public (spec open question 11.3).
 */
import type { FaqEntry } from "../types/prose";

export const FAQ_ENTRIES: FaqEntry[] = [
    {
        answer: "Mostly because the problem is genuinely fun, and a working demo says more than a cover letter. It's meant as a sign of interest, not a flex.",
        question: "Why build this instead of just applying?",
    },
    {
        answer: "Those two are library-based and similar in shape, so they were a fair test of whether I understand your architecture. The whiteboard is a custom D3/SVG build with its own design problems. Faking it would have told you nothing true, so I left it out and said so.",
        question: "Why only the Gantt and table, not the whiteboard?",
    },
    {
        answer: "No, it's single-user. Real-time is the hard part of your system, so I reasoned about it in the write-up instead of pretending to have built it.",
        question: "Is this actually real-time?",
    },
    {
        answer: "A lot of the typing, yes. The architecture, the scope cuts, and the tradeoffs were mine, and the test suite is what kept the loop honest. There's a section above on exactly how that split worked.",
        question: "Did AI write all of this?",
    },
    {
        answer: "A fair amount. The one-model-many-views shape and the CPM basics are well-grounded; the worker boundary, where the server-side row model fits, and whether collaboration is CRDT or server-authoritative are educated guesses. Those are the first things I'd ask about on day one.",
        question: "How much of your read on Planera's architecture is guessing?",
    },
];
```

- [ ] **Step 4: Run, expect PASS**

```bash
npm run test -- src/__tests__/content/faqContent.test.ts
```

- [ ] **Step 5: Write the failing FaqList test** `src/__tests__/components/FaqList/FaqList.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FaqList } from "../../../components/FaqList/FaqList";
import type { FaqEntry } from "../../../types/prose";

const ENTRIES: FaqEntry[] = [
    { answer: "Because it was fun.", question: "Why build this?" },
    { answer: "No, single-user.", question: "Is it real-time?" },
];

describe("FaqList", () => {
    test("renders each question as a disclosure with its answer", () => {
        render(<FaqList entries={ENTRIES} />);
        expect(screen.getByText("Why build this?")).toBeInTheDocument();
        expect(screen.getByText("Because it was fun.")).toBeInTheDocument();
        expect(screen.getByText("Is it real-time?")).toBeInTheDocument();
    });
});
```

- [ ] **Step 6: Run, expect FAIL**

```bash
npm run test -- src/__tests__/components/FaqList
```

- [ ] **Step 7: Create `src/components/FaqList/FaqList.tsx`**

```tsx
/**
 * Renders the FAQ as native <details>/<summary> disclosures: keyboard-operable and
 * collapsible with no JavaScript, which keeps the accessibility cost at zero. Each
 * question is a <summary>; its answer is the disclosed paragraph.
 */
import type { JSX } from "react";

import { css } from "../../../styled-system/css";
import type { FaqEntry } from "../../types/prose";

interface FaqListProps {
    entries: FaqEntry[];
}

const listClass = css({ display: "flex", flexDirection: "column", gap: "8px" });

const itemClass = css({
    borderBottom: "1px solid token(colors.borderHairline)",
    paddingBottom: "8px",
});

const summaryClass = css({
    _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
    color: "ink",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    paddingBlock: "6px",
});

const answerClass = css({
    color: "inkMuted",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "6px 0 0",
});

export function FaqList({ entries }: FaqListProps): JSX.Element {
    return (
        <div className={listClass}>
            {entries.map((entry) => (
                <details className={itemClass} key={entry.question}>
                    <summary className={summaryClass}>{entry.question}</summary>
                    <p className={answerClass}>{entry.answer}</p>
                </details>
            ))}
        </div>
    );
}
```

- [ ] **Step 8: Run, expect PASS**

```bash
npm run test -- src/__tests__/components/FaqList
```

- [ ] **Step 9: Append the FAQ in `ArchitectureRoute.tsx`.** Add imports `import { FaqList } from "../../components/FaqList/FaqList";` and `import { FAQ_ENTRIES } from "../../content/faqContent";`. After the AI-first `<ProseSection>`, add (still inside `<main>`):

```tsx
<section aria-labelledby="faq-heading" className={css({ margin: "8px 0 0" })}>
    <h2 className={css({ color: "ink", fontSize: "22px", margin: "0 0 12px" })} id="faq-heading">
        FAQ
    </h2>
    <FaqList entries={FAQ_ENTRIES} />
</section>
```

- [ ] **Step 10: Extend the ArchitectureRoute test.** Add:

```tsx
test("renders the FAQ with its questions", () => {
    renderRoute();
    expect(screen.getByRole("heading", { level: 2, name: "FAQ" })).toBeInTheDocument();
    expect(
        screen.getByText("Why only the Gantt and table, not the whiteboard?"),
    ).toBeInTheDocument();
});
```

- [ ] **Step 11: Run the route test, expect PASS**

```bash
npm run test -- src/__tests__/routes/ArchitectureRoute
```

- [ ] **Step 12: Typecheck and commit**

```bash
npm run typecheck
git branch --show-current
npx prettier --write "src/**/*.{ts,tsx}"
git add -A && git commit -m "feat: FAQ section closing the write-up

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Cross-route navigation and accessibility sweep, final verification

**Files:**

- Create: `e2e/portfolioNav.spec.ts`
- Test: the new E2E spec, then the full suite + build

**Interfaces:**

- Consumes: all three routes.
- Produces: an E2E spec proving end-to-end navigation and a11y across the site.

- [ ] **Step 1: Write `e2e/portfolioNav.spec.ts`**

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { LOAD_TIMEOUT_MS, waitForFirstGanttBar } from "./helpers/appReady";

// The DHTMLX and AG-Grid widget subtrees manage their own ARIA and raise known vendor
// findings we do not control; the demo route's a11y scan excludes them, matching
// appShellLayout.spec.ts. The prose routes have no vendor widgets, so they scan whole.
const VENDOR_WIDGET_SELECTORS = [".ag-root-wrapper", ".gantt_container"];

test("navigates Summary to Write-up to Demo through the nav", async ({ page }) => {
    await page.goto("/");
    await expect(
        page.getByRole("heading", { level: 1, name: "I built you a Planera demo" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Write-up" }).click();
    await expect(
        page.getByRole("heading", { level: 1, name: "How I think Planera's frontend is built" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Demo" }).click();
    await expect(page.getByRole("main", { name: "Planera schedule editor" })).toBeVisible({
        timeout: LOAD_TIMEOUT_MS,
    });
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
});

test("Summary route has no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
});

test("Architecture route has no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/architecture");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
});

test("Demo route has no serious or critical a11y violations outside vendor widgets", async ({
    page,
}) => {
    await page.goto("/demo");
    await waitForFirstGanttBar(page, LOAD_TIMEOUT_MS);
    let builder = new AxeBuilder({ page });
    for (const selector of VENDOR_WIDGET_SELECTORS) {
        builder = builder.exclude(selector);
    }
    const results = await builder.analyze();
    const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
});
```

- [ ] **Step 2: Run the new E2E spec, expect PASS**

```bash
npm run e2e -- e2e/portfolioNav.spec.ts
```

Expected: navigation works and all three routes report zero serious/critical violations. If the Summary or Architecture route reports a contrast or heading-order finding, fix the offending token/markup (do not weaken the assertion) and re-run.

- [ ] **Step 3: Run the FULL test suite (unit + E2E) and the build**

```bash
npm run test && npm run e2e && npm run typecheck && npm run lint && npm run build
```

Expected: all green. The build runs `panda codegen`, so every `css()` call is emitted; `serve -s dist` (Railway) already serves `index.html` for unknown deep links, so `/demo` and `/architecture` survive a hard refresh.

- [ ] **Step 4: Manual smoke (optional but recommended).** `npm run dev`, then visit `/`, `/demo`, `/architecture`, tab through the nav and skip link, dismiss the demo caption, and confirm the editor fills the viewport. If the editor does not fill height, confirm `SiteShell`'s content wrapper and `DemoRoute`'s frame are flex columns with `minHeight: 0`.

- [ ] **Step 5: Commit**

```bash
git branch --show-current
npx prettier --write e2e/portfolioNav.spec.ts
git add -A && git commit -m "test: cross-route navigation and accessibility sweep

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- Tone/framing (spec 0 to 2): enforced in Global Constraints and asserted by content tests (Task 2 motive, Task 4 inference markers). Covered.
- Architecture, Vite SPA, shared nav, landmark discipline (spec 3): Tasks 1 (`SiteShell` no `<main>`, `#main-content` skip target), 1 (`SiteNav`). Covered.
- Summary route (spec 4): Task 2. Covered.
- Demo route + dismissible affordance (spec 5): Tasks 1 (mount) + 3 (caption). Covered.
- Architecture sections 6.1 to 6.7 (spec 6): Task 4. FAQ 6.8: Task 6. Covered.
- AI-first section (spec 7): Task 5. Covered.
- Testing + a11y (spec 8): Tasks across (unit + component), Task 3 + 7 (E2E), Task 7 (axe on all three routes), Task 1 (existing suite regression-guarded). Covered.
- Scope in/out (spec 9): no editor changes (Demo mounts `AppShell` unchanged); whiteboard/collaboration named not built. Covered.
- File structure (spec 10): matches the File Structure block. Covered.
- Open questions (spec 11): router pinned to v7 (Task 1), SPA fallback confirmed (Task 7 Step 3), repo-link FAQ entry deferred until 11.3 resolves (noted in `faqContent.ts`). AI-first kept as a section, not its own route (default 11.2). Covered.

**Placeholder scan:** No TBD/TODO. Every code step shows complete code; every content module is final copy.

**Type consistency:** `ProseSection { body; heading; id }` and `FaqEntry { answer; question }` defined in Task 4 (`src/types/prose.ts`) and consumed unchanged in Tasks 4 to 6. `ARCHITECTURE_SECTIONS`, `AI_FIRST_SECTION`, `FAQ_ENTRIES`, `SUMMARY_HEADING`, `SUMMARY_PARAGRAPHS` names match between their content modules, the route components, and the tests. `appRoutes`/`appRouter` names match between Task 1's `appRoutes.tsx`, `App.tsx`, and the routing test. `gotoSchedule` repoint (Task 1) is the single change keeping the existing E2E green.
