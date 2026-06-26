# Planera Collaborative CPM Editor (Sub-project 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax.

**Goal:** Build a single-user CPM schedule editor that renders one directed-acyclic schedule graph as two synchronized views (AG-Grid table, DHTMLX Gantt), edited live with optimistic operation-based edits and web-worker downstream recompute, fast at 5,000 activities.

**Architecture:** A Zustand store holds only stored inputs (activities, the dependency edge list, durations, types, parentId/WBS, collapse state); dates, float, and the critical path are computed outputs from a ported CPM engine that runs in a web worker (full pass on load, downstream-cone delta on edit) and never stored. Both views are uncontrolled imperative widgets mounted once, fed granular batched updates from the computed cache, so React never re-renders into their DOM.

**Tech Stack:** Vite + React + TypeScript, DHTMLX Gantt (GPL `dhtmlx-gantt`), AG-Grid Enterprise (`ag-grid-react` + `ag-grid-community` + `ag-grid-enterprise`), PandaCSS, TanStack Query + MSW, Zustand, a web worker for CPM, Vitest + Playwright.

## Global Constraints

- PandaCSS replaces SCSS modules; all styling via Panda tokens and recipes, no ad-hoc magic values.
- One exported function per module across `services/`, `api/`, `clients/`, and `workers/`; helpers stay unexported in the same file.
- Function names are verb + noun (or `toX` for mappers, `is`/`has` for booleans); the noun names the domain entity.
- Every new source file opens with a file-level header comment (`/** ... */` block); skip only test files, `.d.ts`, and barrels.
- Tests live in `src/__tests__/` mirroring the source path, never beside the source file; fixtures in `src/__fixtures__/`.
- Prettier: 4-space indent, 100-char width, trailing commas (`all`).
- Sort imports, type members, `ALL_CAPS` constants, and object keys alphabetically where order is semantically free; never reorder where position carries meaning.
- NO U+2014 em-dash anywhere in code, comments, or docs.
- Dates are computed from working-day indices, never stored; the schedule graph is always a DAG (cycle-creating edits are rejected before mutation).
- The CPM engine is ported unchanged; only its input is narrowed to the leaf-activity set.
- The Operation union uses exactly these `kind` strings everywhere: `resizeActivity`, `addDependency`, `removeDependency`, `toggleCollapse`.
- `ScheduleGraph` is exactly `{ activities: Activity[]; dependencies: Dependency[] }` in every module (no projects/groups arrays).
- Every commit message ends with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

| Path | Responsibility |
|---|---|
| `package.json` | Scripts and dependencies (Vite/React/Panda/AG-Grid/DHTMLX/Vitest/Playwright). |
| `vite.config.ts` | Vite + React plugin, dev port 3000, worker format. |
| `vitest.config.ts` | jsdom env, globals, setup file, 60% coverage thresholds. |
| `playwright.config.ts` | E2E against the Vite dev server on port 3000. |
| `postcss.config.cjs` | PandaCSS PostCSS plugin. |
| `panda.config.ts` | Panda include globs, tokens, recipes, outdir `styled-system`. |
| `tsconfig.json` / `tsconfig.node.json` | App and node TS configs (bundler mode, strict). |
| `eslint.config.js` | typescript-eslint recommended + member-ordering. |
| `.prettierrc.mjs` | 4-space, 100-width, trailing-comma config. |
| `index.html` | App entry HTML with `#root`. |
| `src/main.tsx` | Mounts `AppShell`, starts MSW in dev, imports `index.css` and library CSS. |
| `src/index.css` | Panda `@layer` cascade entrypoint. |
| `src/constants/api.ts` | API base path + route paths. |
| `src/constants/schedule.ts` | `RELATIONSHIP_TYPES` tuple. |
| `src/constants/generator.ts` | Seeded-generator tuning constants. |
| `src/constants/calendar.ts` | Work-week, epoch, ms-per-day constants. |
| `src/constants/calendarDisplay.ts` | Intl date-format options + locale. |
| `src/constants/ganttScale.ts` | `DEFAULT_DAY_WIDTH_PX`, `TICK_INTERVAL_DAYS`, DHTMLX link-type map. |
| `src/types/schedule.ts` | `ActivityType`, `Activity`, `Dependency`, `RelationshipType`, `ComputedActivity`, `ScheduleGraph`. |
| `src/types/cpm.ts` | `ScheduleResult` union. |
| `src/types/calendar.ts` | `Calendar` interface. |
| `src/types/operation.ts` | `Operation` union + type guards. |
| `src/services/cpm/computeSchedule.ts` | Forward/backward CPM pass (ported). |
| `src/services/cpm/detectCycle.ts` | DFS cycle detection (ported). |
| `src/services/cpm/sortActivitiesTopologically.ts` | Kahn topo sort (ported). |
| `src/services/cpm/selectLeafActivities.ts` | Filter graph to non-group activities. |
| `src/services/cpm/computeSummaries.ts` | Roll up group early/late dates from descendants. |
| `src/services/cpm/selectDownstreamCone.ts` | Successor-reachable id set from a changed activity. |
| `src/services/cpm/computeDownstreamCone.ts` | Recompute + diff vs previous cache into a delta. |
| `src/services/generateSchedule.ts` | Seeded generator emitting the unified node model (adapted). |
| `src/services/createCalendar.ts` | Working-day calendar factory (ported). |
| `src/services/formatScheduleDate.ts` | Index-to-display-date formatter (ported). |
| `src/workers/cpmWorker.ts` | Worker boundary wiring `handleWorkerMessage`. |
| `src/workers/handleWorkerMessage.ts` | Pure worker-message handler. |
| `src/state/scheduleStore.ts` | Zustand: raw graph + computed cache + collapse + `dispatchOperation`. |
| `src/state/useScheduleSelection.ts` | Zustand: selected activity id, shared across views. |
| `src/api/fetchScheduleGraph.ts` | Fetch wrapper for the schedule route (adapted). |
| `src/api/useScheduleQuery.ts` | TanStack Query hook bootstrapping the store. |
| `src/mocks/handlers.ts` | MSW handler serving the generated unified graph. |
| `src/mocks/browser.ts` | MSW browser worker. |
| `src/mocks/server.ts` | MSW node server for tests. |
| `src/components/AppShell/AppShell.tsx` | Split-pane layout + toolbar + load/error states. |
| `src/components/AppShell/appShell.recipe.ts` | Panda recipe for the shell layout. |
| `src/components/GanttView/GanttView.tsx` | DHTMLX container component. |
| `src/components/GanttView/useGanttInit.ts` | DHTMLX lifecycle hook. |
| `src/components/GanttView/toGanttTasks.ts` | Map unified model + computed cache to DHTMLX tasks. |
| `src/components/GanttView/toGanttLinks.ts` | Map dependency edges to DHTMLX links. |
| `src/components/GanttView/resolveCriticalTaskClass.ts` | Critical CSS-class resolver. |
| `src/components/TableView/TableView.tsx` | AG-Grid Tree-Data container. |
| `src/components/TableView/toTableRows.ts` | Map unified model + computed cache to grid rows. |
| `src/components/TableView/registerGridModules.ts` | One-time AG-Grid module registration. |
| `src/__fixtures__/cpmNetworks.ts` | Hand-computed CPM fixtures (adapted to unified model). |
| `src/__tests__/setup.ts` | Vitest setup: jsdom stubs + MSW lifecycle. |
| `src/__tests__/**` | Unit/component tests mirroring source. |
| `e2e/**` | Playwright specs. |

---

## Task 1: Scaffold Vite + React + TS + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `postcss.config.cjs`, `panda.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `.prettierrc.mjs`, `index.html`, `src/main.tsx`, `src/index.css`, `src/components/AppShell/AppShell.tsx`, `src/__tests__/setup.ts`
- Test: `src/__tests__/components/AppShell/AppShell.test.tsx`

**Interfaces:**
- Produces: `AppShell(): JSX.Element` (no props).

**Steps:**

- [ ] 1. Create `package.json`:

```json
{
    "name": "planera-scheduler",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "prepare": "panda codegen",
        "dev": "vite",
        "build": "panda codegen && tsc -p tsconfig.json --noEmit && vite build",
        "typecheck": "tsc -p tsconfig.json --noEmit && tsc -p tsconfig.node.json --noEmit",
        "lint": "eslint .",
        "format": "prettier --write \"src/**/*.{ts,tsx}\"",
        "format:check": "prettier --check \"src/**/*.{ts,tsx}\"",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "smoke": "vitest run src/__tests__/smoke",
        "e2e": "playwright test"
    },
    "dependencies": {
        "@tanstack/react-query": "^5.101.1",
        "ag-grid-community": "^33.3.2",
        "ag-grid-enterprise": "^33.3.2",
        "ag-grid-react": "^33.3.2",
        "dhtmlx-gantt": "^9.0.0",
        "react": "^19.2.0",
        "react-dom": "^19.2.0",
        "zustand": "^5.0.14"
    },
    "devDependencies": {
        "@axe-core/playwright": "^4.12.1",
        "@eslint/js": "^10.0.1",
        "@pandacss/dev": "^0.55.0",
        "@playwright/test": "^1.61.1",
        "@testing-library/jest-dom": "^6.9.1",
        "@testing-library/react": "^16.3.2",
        "@testing-library/user-event": "^14.6.1",
        "@types/react": "^19.2.0",
        "@types/react-dom": "^19.2.0",
        "@vitejs/plugin-react": "^6.0.3",
        "@vitest/coverage-v8": "^4.1.9",
        "eslint": "^10.5.0",
        "jsdom": "^29.1.1",
        "msw": "^2.14.6",
        "postcss": "^8.5.6",
        "prettier": "^3.8.4",
        "typescript": "^5.7.0",
        "typescript-eslint": "^8.62.0",
        "vite": "^8.1.0",
        "vitest": "^4.1.9"
    },
    "msw": { "workerDirectory": ["public"] }
}
```

- [ ] 2. Create `.prettierrc.mjs`:

```js
export default {
    tabWidth: 4,
    trailingComma: "all",
    printWidth: 100,
};
```

- [ ] 3. Create `tsconfig.json`:

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",
        "types": ["vitest/globals", "@testing-library/jest-dom"],
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
    },
    "include": ["src"]
}
```

- [ ] 4. Create `tsconfig.node.json`:

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2023"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "strict": true
    },
    "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts", "panda.config.ts"]
}
```

- [ ] 5. Create `vite.config.ts`:

```ts
/** Vite build configuration: bundles the React app and serves it on the project dev port. */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const DEV_SERVER_PORT = 3000;

export default defineConfig({
    plugins: [react()],
    server: { port: DEV_SERVER_PORT },
    worker: { format: "es" },
});
```

- [ ] 6. Create `vitest.config.ts`:

```ts
/** Vitest configuration: jsdom environment, globals, setup file, and 60% coverage thresholds. */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        coverage: {
            thresholds: { branches: 60, functions: 60, lines: 60, statements: 60 },
        },
        environment: "jsdom",
        environmentOptions: { jsdom: { url: "http://localhost/" } },
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"],
        setupFiles: ["./src/__tests__/setup.ts"],
    },
});
```

- [ ] 7. Create `playwright.config.ts`:

```ts
/** Playwright end-to-end configuration: runs e2e/ specs against the Vite dev server. */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const WEB_SERVER_TIMEOUT_MS = 120000;

export default defineConfig({
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    reporter: "list",
    retries: process.env.CI ? 2 : 0,
    testDir: "./e2e",
    use: { baseURL: BASE_URL, trace: "on-first-retry" },
    webServer: {
        command: "npm run dev",
        reuseExistingServer: !process.env.CI,
        timeout: WEB_SERVER_TIMEOUT_MS,
        url: BASE_URL,
    },
});
```

- [ ] 8. Create `eslint.config.js`:

```js
// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: {
                        memberTypes: ["signature", "field", "constructor", "method"],
                        order: "alphabetically",
                    },
                },
            ],
        },
    },
    { ignores: ["dist/**", "node_modules/**", "coverage/**", "styled-system/**"] },
);
```

- [ ] 9. Create `postcss.config.cjs`:

```js
module.exports = {
    plugins: {
        "@pandacss/dev/postcss": {},
    },
};
```

- [ ] 10. Create `panda.config.ts`:

```ts
/** PandaCSS configuration: include globs, base preset, and the styled-system output directory. */
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
    preflight: true,
    include: ["./src/**/*.{ts,tsx}"],
    exclude: [],
    outdir: "styled-system",
    jsxFramework: "react",
    theme: { extend: {} },
});
```

- [ ] 11. Create `index.html`:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Planera Scheduler</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
    </body>
</html>
```

- [ ] 12. Create `src/index.css`:

```css
@layer reset, base, tokens, recipes, utilities;
```

- [ ] 13. Create `src/components/AppShell/AppShell.tsx`:

```tsx
/**
 * Top-level application shell. For Task 1 it renders a labelled empty frame so
 * the app mounts and the smoke test has a stable root; later tasks fill it with
 * the toolbar and the split-pane Table/Gantt layout.
 */

export function AppShell(): JSX.Element {
    return (
        <main aria-label="Planera schedule editor">
            <h1>Planera Scheduler</h1>
        </main>
    );
}
```

- [ ] 14. Create `src/main.tsx`:

```tsx
/** Application entry point: mounts AppShell and, in development, starts the MSW worker. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppShell } from "./components/AppShell/AppShell";
import "./index.css";

async function startApp(): Promise<void> {
    if (import.meta.env.DEV) {
        const { worker } = await import("./mocks/browser");
        await worker.start({ onUnhandledRequest: "bypass" });
    }

    const rootElement = document.getElementById("root");
    if (rootElement === null) {
        throw new Error("Root element #root is missing from index.html");
    }

    createRoot(rootElement).render(
        <StrictMode>
            <AppShell />
        </StrictMode>,
    );
}

void startApp();
```

- [ ] 15. Create `src/__tests__/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "../mocks/server";

global.ResizeObserver = class ResizeObserver {
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] 16. Run `npm install` and capture the lockfile.

```
npm install
```
Expected: dependencies install with no peer-dependency errors that abort the install.

- [ ] 17. Create the smoke test `src/__tests__/smoke/appShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppShell } from "../../components/AppShell/AppShell";

describe("AppShell", () => {
    test("mounts and exposes the labelled application region", () => {
        render(<AppShell />);
        expect(screen.getByRole("main", { name: "Planera schedule editor" })).toBeInTheDocument();
    });
});
```

- [ ] 18. The MSW modules (`src/mocks/browser.ts`, `src/mocks/server.ts`, `src/mocks/handlers.ts`) do not exist until Task 9; create minimal placeholders so `setup.ts` imports resolve. Create `src/mocks/handlers.ts`:

```ts
/** MSW request handlers. Task 9 replaces this with the schedule-graph handler. */
export const handlers = [];
```

- [ ] 19. Create `src/mocks/server.ts`:

```ts
/** MSW node server for Vitest. */
import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

- [ ] 20. Create `src/mocks/browser.ts`:

```ts
/** MSW browser worker for the Vite dev server. */
import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

- [ ] 21. Run the smoke test, expect PASS.

```
npx panda codegen && npx vitest run src/__tests__/smoke
```
Expected: `1 passed`.

- [ ] 22. Run the typecheck, expect clean.

```
npm run typecheck
```
Expected: exits 0 with no errors.

- [ ] 23. Commit:

```
git add -A && git commit -m "chore: scaffold Vite React TS app with Panda, Vitest, Playwright

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Port and adapt model types and constants to the unified node model

**Files:**
- Create: `src/types/schedule.ts`, `src/types/cpm.ts`, `src/types/calendar.ts`, `src/types/operation.ts`, `src/constants/schedule.ts`, `src/constants/calendar.ts`, `src/constants/calendarDisplay.ts`, `src/constants/api.ts`, `src/constants/generator.ts`, `src/constants/ganttScale.ts`
- Test: `src/__tests__/types/operation.test.ts`

**Interfaces:**
- Produces:
  - `type ActivityType = "task" | "milestone" | "group"`
  - `interface Activity { id: string; name: string; wbs: string; type: ActivityType; parentId: string | null; durationDays: number }`
  - `type RelationshipType = "FS" | "SS" | "FF" | "SF"`
  - `interface Dependency { id: string; predecessorId: string; successorId: string; type: RelationshipType; lagDays: number }`
  - `interface ScheduleGraph { activities: Activity[]; dependencies: Dependency[] }`
  - `interface ComputedActivity { id: string; earlyStart: number; earlyFinish: number; lateStart: number; lateFinish: number; totalFloat: number; isCritical: boolean }`
  - `type ScheduleResult = { activities: Map<string, ComputedActivity>; ok: true } | { cycle: string[]; ok: false }`
  - `type Operation = { kind: "resizeActivity"; activityId: string; durationDays: number } | { kind: "addDependency"; edge: Dependency } | { kind: "removeDependency"; edgeId: string } | { kind: "toggleCollapse"; rowId: string }`
  - `isResizeActivityOperation(op: Operation): op is Extract<Operation, { kind: "resizeActivity" }>` and the three sibling guards.

**Steps:**

- [ ] 1. Create `src/constants/schedule.ts`:

```ts
/** The four CPM relationship types, the single source of truth for RelationshipType. */
export const RELATIONSHIP_TYPES = ["FS", "SS", "FF", "SF"] as const;
```

- [ ] 2. Copy the remaining constants from the old project unchanged, then adjust the generator file:
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/constants/calendar.ts` to `src/constants/calendar.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/constants/calendarDisplay.ts` to `src/constants/calendarDisplay.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/constants/api.ts` to `src/constants/api.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/constants/generator.ts` to `src/constants/generator.ts` (used as-is by the adapted generator in Task 4).

- [ ] 3. Create `src/constants/ganttScale.ts` (merges the old `defaultDayWidthPx.ts` and `tickIntervalDays.ts` plus the DHTMLX link-type map; two-or-more constants justify the folder collapse to a single file per R-223):

```ts
/**
 * Gantt timeline scale constants and the mapping from CPM relationship types to
 * DHTMLX link-type codes ("0" FS, "1" SS, "2" FF, "3" SF).
 */
import type { RelationshipType } from "../types/schedule";

export const DEFAULT_DAY_WIDTH_PX = 24;
export const TICK_INTERVAL_DAYS = 5;

export const RELATIONSHIP_TO_DHTMLX_LINK_TYPE: Record<RelationshipType, string> = {
    FF: "2",
    FS: "0",
    SF: "3",
    SS: "1",
};
```

- [ ] 4. Create `src/types/schedule.ts` (adapted: unified node model, edge gains `id`, no Project/Group):

```ts
/**
 * Domain types for the unified CPM node model. The schedule is a directed acyclic
 * graph: activities are nodes (tasks, milestones, or group rollups), dependencies
 * are a separate edge list. Projects and phases are group-type activities; the WBS
 * encodes the tree path and parentId builds the hierarchy. Dates are never stored;
 * ComputedActivity holds the engine's outputs.
 */
import { RELATIONSHIP_TYPES } from "../constants/schedule";

export type ActivityType = "task" | "milestone" | "group";

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface Activity {
    durationDays: number;
    id: string;
    name: string;
    parentId: string | null;
    type: ActivityType;
    wbs: string;
}

export interface ComputedActivity {
    earlyFinish: number;
    earlyStart: number;
    id: string;
    isCritical: boolean;
    lateFinish: number;
    lateStart: number;
    totalFloat: number;
}

export interface Dependency {
    id: string;
    lagDays: number;
    predecessorId: string;
    successorId: string;
    type: RelationshipType;
}

export interface ScheduleGraph {
    activities: Activity[];
    dependencies: Dependency[];
}

export function isRelationshipType(value: string): value is RelationshipType {
    return (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}
```

- [ ] 5. Copy `src/types/cpm.ts` and `src/types/calendar.ts` from the old project unchanged:
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/types/cpm.ts` to `src/types/cpm.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/types/calendar.ts` to `src/types/calendar.ts`.

- [ ] 6. Write the failing test `src/__tests__/types/operation.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
    isAddDependencyOperation,
    isRemoveDependencyOperation,
    isResizeActivityOperation,
    isToggleCollapseOperation,
} from "../../types/operation";
import type { Operation } from "../../types/operation";
import type { Dependency } from "../../types/schedule";

const EDGE: Dependency = {
    id: "e1",
    lagDays: 0,
    predecessorId: "a1",
    successorId: "a2",
    type: "FS",
};

const RESIZE: Operation = { activityId: "a1", durationDays: 5, kind: "resizeActivity" };
const ADD: Operation = { edge: EDGE, kind: "addDependency" };
const REMOVE: Operation = { edgeId: "e1", kind: "removeDependency" };
const TOGGLE: Operation = { kind: "toggleCollapse", rowId: "a1" };

describe("operation type guards", () => {
    test("isResizeActivityOperation narrows only resizeActivity", () => {
        expect(isResizeActivityOperation(RESIZE)).toBe(true);
        expect(isResizeActivityOperation(ADD)).toBe(false);
        if (isResizeActivityOperation(RESIZE)) {
            expect(RESIZE.durationDays).toBe(5);
        }
    });

    test("isAddDependencyOperation narrows only addDependency", () => {
        expect(isAddDependencyOperation(ADD)).toBe(true);
        expect(isAddDependencyOperation(RESIZE)).toBe(false);
        if (isAddDependencyOperation(ADD)) {
            expect(ADD.edge.id).toBe("e1");
        }
    });

    test("isRemoveDependencyOperation narrows only removeDependency", () => {
        expect(isRemoveDependencyOperation(REMOVE)).toBe(true);
        expect(isRemoveDependencyOperation(TOGGLE)).toBe(false);
    });

    test("isToggleCollapseOperation narrows only toggleCollapse", () => {
        expect(isToggleCollapseOperation(TOGGLE)).toBe(true);
        expect(isToggleCollapseOperation(REMOVE)).toBe(false);
    });
});
```

- [ ] 7. Run the test, expect FAIL (module missing).

```
npx vitest run src/__tests__/types/operation.test.ts
```
Expected: fails to resolve `../../types/operation`.

- [ ] 8. Create `src/types/operation.ts`:

```ts
/**
 * The Operation discriminated union: the change-vector unit the store dispatches,
 * the worker recomputes from, and (in Sub-project 2) the transport broadcasts. The
 * four kind strings are stable contract: resizeActivity, addDependency,
 * removeDependency, toggleCollapse. Type guards narrow each variant.
 */
import type { Dependency } from "./schedule";

export type Operation =
    | { activityId: string; durationDays: number; kind: "resizeActivity" }
    | { edge: Dependency; kind: "addDependency" }
    | { edgeId: string; kind: "removeDependency" }
    | { kind: "toggleCollapse"; rowId: string };

export function isAddDependencyOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "addDependency" }> {
    return operation.kind === "addDependency";
}

export function isRemoveDependencyOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "removeDependency" }> {
    return operation.kind === "removeDependency";
}

export function isResizeActivityOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "resizeActivity" }> {
    return operation.kind === "resizeActivity";
}

export function isToggleCollapseOperation(
    operation: Operation,
): operation is Extract<Operation, { kind: "toggleCollapse" }> {
    return operation.kind === "toggleCollapse";
}
```

> Note: `src/types/operation.ts` holds the union type plus its four guards by design; this is the type module for the Operation domain, not a `services/` function module, so co-locating the guards is correct.

- [ ] 9. Run the test, expect PASS.

```
npx vitest run src/__tests__/types/operation.test.ts
```
Expected: `4 passed`.

- [ ] 10. Commit:

```
git add -A && git commit -m "feat: add unified node model types, constants, and Operation union

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Port the CPM engine and adapt input to leaf activities

**Files:**
- Create: `src/services/cpm/computeSchedule.ts`, `src/services/cpm/detectCycle.ts`, `src/services/cpm/sortActivitiesTopologically.ts`, `src/services/cpm/selectLeafActivities.ts`, `src/services/cpm/computeSummaries.ts`, `src/services/createCalendar.ts`, `src/services/formatScheduleDate.ts`, `src/__fixtures__/cpmNetworks.ts`
- Test: `src/__tests__/services/cpm/computeSchedule.test.ts`, `src/__tests__/services/cpm/detectCycle.test.ts`, `src/__tests__/services/cpm/sortActivitiesTopologically.test.ts`, `src/__tests__/services/cpm/selectLeafActivities.test.ts`, `src/__tests__/services/cpm/computeSummaries.test.ts`, `src/__tests__/services/createCalendar.test.ts`, `src/__tests__/services/formatScheduleDate.test.ts`

**Interfaces:**
- Consumes: `ScheduleGraph`, `Activity`, `ComputedActivity` (Task 2), `ScheduleResult` (Task 2).
- Produces:
  - `computeSchedule(graph: ScheduleGraph): ScheduleResult` (ported unchanged).
  - `detectCycle(graph: ScheduleGraph): string[] | null` (ported unchanged).
  - `sortActivitiesTopologically(graph: ScheduleGraph): Activity[]` (ported unchanged).
  - `selectLeafActivities(graph: ScheduleGraph): ScheduleGraph` returning `{ activities: leaves, dependencies }` where leaves have `type !== "group"`.
  - `computeSummaries(graph: ScheduleGraph, computed: Map<string, ComputedActivity>): Map<string, ComputedActivity>` giving each group node min-descendant-earlyStart / max-descendant-earlyFinish (and matching late bounds), `totalFloat` from those, `isCritical` if any descendant is critical.
  - `createCalendar(options?): Calendar` (ported).
  - `formatScheduleDate(index: number, calendar: Calendar): string` (ported).

**Steps:**

- [ ] 1. Copy the three CPM engine modules from the old project unchanged (they read only `id`, `durationDays`, `predecessorId`, `successorId`, `type`, `lagDays`, which the unified model still provides):
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/services/cpm/computeSchedule.ts` to `src/services/cpm/computeSchedule.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/services/cpm/detectCycle.ts` to `src/services/cpm/detectCycle.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/services/cpm/sortActivitiesTopologically.ts` to `src/services/cpm/sortActivitiesTopologically.ts`.

- [ ] 2. Copy the calendar and formatter services unchanged:
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/services/createCalendar.ts` to `src/services/createCalendar.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/services/formatScheduleDate.ts` to `src/services/formatScheduleDate.ts`.

- [ ] 3. Copy the calendar and formatter tests unchanged, then copy the three CPM engine tests:
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__tests__/services/createCalendar.test.ts` to `src/__tests__/services/createCalendar.test.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__tests__/services/formatScheduleDate.test.ts` to `src/__tests__/services/formatScheduleDate.test.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__tests__/services/cpm/computeSchedule.test.ts` to `src/__tests__/services/cpm/computeSchedule.test.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__tests__/services/cpm/detectCycle.test.ts` to `src/__tests__/services/cpm/detectCycle.test.ts`.
  - Copy `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__tests__/services/cpm/sortActivitiesTopologically.test.ts` to `src/__tests__/services/cpm/sortActivitiesTopologically.test.ts`.

- [ ] 4. Create the adapted fixture `src/__fixtures__/cpmNetworks.ts`. Port from `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__fixtures__/cpmNetworks.ts` but change `makeActivity` to emit unified leaf nodes, add edge ids, and drop the Project/Group scaffolding and `makeGraph`'s `projects`/`groups`. Replace the helpers and graph factory with:

```ts
/**
 * Hand-computed CPM network fixtures for the schedule engine, expressed in the
 * unified node model. Each acyclic fixture pairs a ScheduleGraph of leaf
 * activities with the ComputedActivity map derived by hand from the forward and
 * backward pass equations. Values are integer working-day indices: an activity
 * occupies [earlyStart, earlyStart + duration).
 */

import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../types/schedule";

interface CpmFixture {
    expected: Record<string, ComputedActivity>;
    graph: ScheduleGraph;
    name: string;
}

interface CyclicFixture {
    graph: ScheduleGraph;
    name: string;
}

function makeActivity(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: null, type: "task", wbs: "1" };
}

function makeEdge(
    predecessorId: string,
    successorId: string,
    type: Dependency["type"],
    lagDays: number,
): Dependency {
    return { id: `${predecessorId}->${successorId}`, lagDays, predecessorId, successorId, type };
}

function makeGraph(activities: Activity[], dependencies: Dependency[]): ScheduleGraph {
    return { activities, dependencies };
}
```

  Keep every fixture's `expected` map byte-for-byte from the old file (the engine math is unchanged), but rewrite each `graph` to call `makeGraph(activities, edges)` where edges use `makeEdge(...)` instead of inline `{ predecessorId, successorId, type, lagDays }` objects. Keep `FS_WITH_LAG`, `SS_WITH_LAG`, `FF_WITH_LAG`, `SF_WITH_LAG`, `NEGATIVE_LAG`, `MILESTONE_ON_PATH`, `PARALLEL_PATHS`, `CYCLIC`, and the `ACYCLIC_FIXTURES` array exactly as in the source. For `MILESTONE_ON_PATH`, set `M`'s activity via `{ ...makeActivity("M", 0), type: "milestone" }` so the milestone type is explicit.

- [ ] 5. Run the ported engine, calendar, and formatter tests, expect PASS (the copied tests import the copied fixtures and services).

```
npx vitest run src/__tests__/services/cpm src/__tests__/services/createCalendar.test.ts src/__tests__/services/formatScheduleDate.test.ts
```
Expected: all suites pass (the same counts as the old project).

- [ ] 6. Write the failing test `src/__tests__/services/cpm/selectLeafActivities.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { selectLeafActivities } from "../../../services/cpm/selectLeafActivities";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";

function leaf(id: string, parentId: string | null): Activity {
    return { durationDays: 1, id, name: id, parentId, type: "task", wbs: "1" };
}

function group(id: string, parentId: string | null): Activity {
    return { durationDays: 0, id, name: id, parentId, type: "group", wbs: "1" };
}

const EDGE: Dependency = { id: "e1", lagDays: 0, predecessorId: "t1", successorId: "t2", type: "FS" };

const GRAPH: ScheduleGraph = {
    activities: [group("p", null), group("ph", "p"), leaf("t1", "ph"), leaf("t2", "ph")],
    dependencies: [EDGE],
};

describe("selectLeafActivities", () => {
    test("keeps only non-group activities and preserves the edge list", () => {
        const result = selectLeafActivities(GRAPH);
        expect(result.activities.map((activity) => activity.id)).toEqual(["t1", "t2"]);
        expect(result.dependencies).toEqual([EDGE]);
    });

    test("includes milestone activities as leaves", () => {
        const milestone: Activity = {
            durationDays: 0,
            id: "m1",
            name: "m1",
            parentId: "ph",
            type: "milestone",
            wbs: "1",
        };
        const result = selectLeafActivities({ activities: [group("p", null), milestone], dependencies: [] });
        expect(result.activities.map((activity) => activity.id)).toEqual(["m1"]);
    });
});
```

- [ ] 7. Run it, expect FAIL (module missing).

```
npx vitest run src/__tests__/services/cpm/selectLeafActivities.test.ts
```
Expected: fails to resolve the module.

- [ ] 8. Create `src/services/cpm/selectLeafActivities.ts`:

```ts
/**
 * Narrows a schedule graph to the activities the CPM engine operates on: the
 * leaf nodes (tasks and milestones), excluding group rollups. The dependency
 * edge list is preserved unchanged because edges only ever connect leaves.
 */
import type { ScheduleGraph } from "../../types/schedule";

export function selectLeafActivities(graph: ScheduleGraph): ScheduleGraph {
    const activities = graph.activities.filter((activity) => activity.type !== "group");
    return { activities, dependencies: graph.dependencies };
}
```

- [ ] 9. Run it, expect PASS.

```
npx vitest run src/__tests__/services/cpm/selectLeafActivities.test.ts
```
Expected: `2 passed`.

- [ ] 10. Write the failing test `src/__tests__/services/cpm/computeSummaries.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { computeSummaries } from "../../../services/cpm/computeSummaries";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function group(id: string, parentId: string | null): Activity {
    return { durationDays: 0, id, name: id, parentId, type: "group", wbs: "1" };
}

function leaf(id: string, parentId: string | null): Activity {
    return { durationDays: 1, id, name: id, parentId, type: "task", wbs: "1" };
}

function computed(
    id: string,
    earlyStart: number,
    earlyFinish: number,
    lateStart: number,
    lateFinish: number,
    isCritical: boolean,
): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical,
        lateFinish,
        lateStart,
        totalFloat: lateStart - earlyStart,
    };
}

const GRAPH: ScheduleGraph = {
    activities: [group("p", null), group("ph", "p"), leaf("t1", "ph"), leaf("t2", "ph")],
    dependencies: [],
};

const LEAF_COMPUTED = new Map<string, ComputedActivity>([
    ["t1", computed("t1", 0, 5, 0, 5, true)],
    ["t2", computed("t2", 5, 8, 7, 10, false)],
]);

describe("computeSummaries", () => {
    test("rolls a group up to min-descendant-earlyStart and max-descendant-earlyFinish", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        const phase = summaries.get("ph");
        expect(phase?.earlyStart).toBe(0);
        expect(phase?.earlyFinish).toBe(8);
    });

    test("rolls late bounds to max-descendant-lateFinish and min-descendant-lateStart", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        const phase = summaries.get("ph");
        expect(phase?.lateStart).toBe(0);
        expect(phase?.lateFinish).toBe(10);
    });

    test("marks a group critical when any descendant leaf is critical", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        expect(summaries.get("ph")?.isCritical).toBe(true);
        expect(summaries.get("p")?.isCritical).toBe(true);
    });

    test("nests grandparent rollup over the whole subtree", () => {
        const summaries = computeSummaries(GRAPH, LEAF_COMPUTED);
        const project = summaries.get("p");
        expect(project?.earlyStart).toBe(0);
        expect(project?.earlyFinish).toBe(8);
    });
});
```

- [ ] 11. Run it, expect FAIL.

```
npx vitest run src/__tests__/services/cpm/computeSummaries.test.ts
```
Expected: fails to resolve the module.

- [ ] 12. Create `src/services/cpm/computeSummaries.ts`:

```ts
/**
 * Computes group rollup bounds. Each group activity spans its descendant leaves:
 * earlyStart is the minimum descendant earlyStart, earlyFinish the maximum
 * descendant earlyFinish, lateStart the minimum descendant lateStart, lateFinish
 * the maximum descendant lateFinish. A group is critical when any descendant leaf
 * is critical. Groups with no computed descendants are omitted from the result.
 */
import type { Activity, ComputedActivity, ScheduleGraph } from "../../types/schedule";

export function computeSummaries(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
): Map<string, ComputedActivity> {
    const childrenByParent = groupActivitiesByParent(graph.activities);
    const summaries = new Map<string, ComputedActivity>();

    for (const activity of graph.activities) {
        if (activity.type === "group") {
            const leaves = collectDescendantComputed(activity.id, childrenByParent, computed);
            const summary = summarizeLeaves(activity.id, leaves);
            if (summary !== null) {
                summaries.set(activity.id, summary);
            }
        }
    }

    return summaries;
}

function groupActivitiesByParent(activities: Activity[]): Map<string, Activity[]> {
    const childrenByParent = new Map<string, Activity[]>();
    for (const activity of activities) {
        if (activity.parentId !== null) {
            const siblings = childrenByParent.get(activity.parentId) ?? [];
            siblings.push(activity);
            childrenByParent.set(activity.parentId, siblings);
        }
    }
    return childrenByParent;
}

function collectDescendantComputed(
    groupId: string,
    childrenByParent: Map<string, Activity[]>,
    computed: Map<string, ComputedActivity>,
): ComputedActivity[] {
    const leaves: ComputedActivity[] = [];
    const stack = [...(childrenByParent.get(groupId) ?? [])];

    while (stack.length > 0) {
        const child = stack.pop()!;
        if (child.type === "group") {
            stack.push(...(childrenByParent.get(child.id) ?? []));
        } else {
            const leafComputed = computed.get(child.id);
            if (leafComputed !== undefined) {
                leaves.push(leafComputed);
            }
        }
    }

    return leaves;
}

function summarizeLeaves(groupId: string, leaves: ComputedActivity[]): ComputedActivity | null {
    if (leaves.length === 0) {
        return null;
    }

    let earlyStart = Infinity;
    let earlyFinish = -Infinity;
    let lateStart = Infinity;
    let lateFinish = -Infinity;
    let isCritical = false;

    for (const leaf of leaves) {
        earlyStart = Math.min(earlyStart, leaf.earlyStart);
        earlyFinish = Math.max(earlyFinish, leaf.earlyFinish);
        lateStart = Math.min(lateStart, leaf.lateStart);
        lateFinish = Math.max(lateFinish, leaf.lateFinish);
        isCritical = isCritical || leaf.isCritical;
    }

    return {
        earlyFinish,
        earlyStart,
        id: groupId,
        isCritical,
        lateFinish,
        lateStart,
        totalFloat: lateStart - earlyStart,
    };
}
```

- [ ] 13. Run it, expect PASS.

```
npx vitest run src/__tests__/services/cpm/computeSummaries.test.ts
```
Expected: `4 passed`.

- [ ] 14. Add the hand-built known-critical-path fixture test `src/__tests__/services/cpm/criticalPath.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { computeSchedule } from "../../../services/cpm/computeSchedule";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";

function task(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: "1" };
}

function edge(predecessorId: string, successorId: string): Dependency {
    return {
        id: `${predecessorId}->${successorId}`,
        lagDays: 0,
        predecessorId,
        successorId,
        type: "FS",
    };
}

// Start -> {A(4), B(2)} -> ... two chains to End.
//   critical chain: Start(0) -> A(4) -> C(5) -> End(0)  length 9
//   slack   chain: Start(0) -> B(2) -> D(3) -> End(0)  length 5, total float 4
const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "Start", name: "Start", parentId: "ph", type: "milestone", wbs: "1" },
        task("A", 4),
        task("B", 2),
        task("C", 5),
        task("D", 3),
        { durationDays: 0, id: "End", name: "End", parentId: "ph", type: "milestone", wbs: "1" },
    ],
    dependencies: [
        edge("Start", "A"),
        edge("Start", "B"),
        edge("A", "C"),
        edge("B", "D"),
        edge("C", "End"),
        edge("D", "End"),
    ],
};

describe("computeSchedule critical path", () => {
    test("the longest chain Start->A->C->End is critical and the slack chain is not", () => {
        const result = computeSchedule(GRAPH);
        expect(result.ok).toBe(true);
        if (!result.ok) {
            return;
        }
        const criticalIds = [...result.activities.values()]
            .filter((activity) => activity.isCritical)
            .map((activity) => activity.id)
            .sort();
        expect(criticalIds).toEqual(["A", "C", "End", "Start"]);
        expect(result.activities.get("B")?.totalFloat).toBe(4);
        expect(result.activities.get("D")?.totalFloat).toBe(4);
        expect(result.activities.get("End")?.earlyFinish).toBe(9);
    });
});
```

- [ ] 15. Run it, expect PASS.

```
npx vitest run src/__tests__/services/cpm/criticalPath.test.ts
```
Expected: `1 passed`.

- [ ] 16. Commit:

```
git add -A && git commit -m "feat: port CPM engine and add leaf-selection and group-summary services

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Port and adapt the seeded generator to emit unified nodes

**Files:**
- Create: `src/services/generateSchedule.ts`
- Test: `src/__tests__/services/generateSchedule.test.ts`

**Interfaces:**
- Consumes: generator constants (Task 2), `Activity`, `Dependency`, `ScheduleGraph` (Task 2), `detectCycle` (Task 3).
- Produces: `generateSchedule(options?: { activityCount?: number; seed?: number }): ScheduleGraph` where activities are projects (group, `parentId: null`), phases (group, parent = project id), and leaves (task/milestone, parent = phase id); dependencies connect leaves only and each carries a unique `id`.

**Steps:**

- [ ] 1. Write the adapted failing test `src/__tests__/services/generateSchedule.test.ts`. Port the invariant tests from `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/__tests__/services/generateSchedule.test.ts`, replacing `groupId`/`groups`/`projects` assertions with the unified model:

```ts
import { describe, expect, test } from "vitest";

import { detectCycle } from "../../services/cpm/detectCycle";
import { generateSchedule } from "../../services/generateSchedule";

const GROUPS_PER_PROJECT = 5;

describe("generateSchedule", () => {
    test("is deterministic per seed", () => {
        expect(generateSchedule({ activityCount: 200, seed: 7 })).toEqual(
            generateSchedule({ activityCount: 200, seed: 7 }),
        );
    });

    test("produces different output for different seeds", () => {
        expect(generateSchedule({ activityCount: 200, seed: 7 })).not.toEqual(
            generateSchedule({ activityCount: 200, seed: 8 }),
        );
    });

    test("produces an acyclic graph with the requested leaf count", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 1 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        expect(leaves).toHaveLength(500);
        expect(detectCycle(graph)).toBeNull();
    });

    test("emits project and phase group nodes", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const projects = graph.activities.filter(
            (activity) => activity.type === "group" && activity.parentId === null,
        );
        const phases = graph.activities.filter(
            (activity) => activity.type === "group" && activity.parentId !== null,
        );
        expect(projects.length).toBeGreaterThanOrEqual(1);
        expect(phases.length).toBeGreaterThanOrEqual(GROUPS_PER_PROJECT);
    });

    test("every leaf parentId refers to an existing phase group", () => {
        const graph = generateSchedule({ activityCount: 100, seed: 1 });
        const phaseIds = new Set(
            graph.activities
                .filter((activity) => activity.type === "group" && activity.parentId !== null)
                .map((activity) => activity.id),
        );
        for (const leaf of graph.activities.filter((activity) => activity.type !== "group")) {
            expect(phaseIds.has(leaf.parentId ?? "")).toBe(true);
        }
    });

    test("every phase parentId refers to an existing project group", () => {
        const graph = generateSchedule({ activityCount: 100, seed: 1 });
        const projectIds = new Set(
            graph.activities
                .filter((activity) => activity.type === "group" && activity.parentId === null)
                .map((activity) => activity.id),
        );
        for (const phase of graph.activities.filter(
            (activity) => activity.type === "group" && activity.parentId !== null,
        )) {
            expect(projectIds.has(phase.parentId ?? "")).toBe(true);
        }
    });

    test("assigns leaves to phases in contiguous blocks, not interleaved", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 1 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const seenParents = new Set<string>();
        let previousParent = "";
        for (const leaf of leaves) {
            const parent = leaf.parentId ?? "";
            if (parent !== previousParent) {
                expect(seenParents.has(parent)).toBe(false);
                seenParents.add(parent);
                previousParent = parent;
            }
        }
    });

    test("every dependency is finish-to-start with non-negative lag", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 3 });
        for (const dependency of graph.dependencies) {
            expect(dependency.type).toBe("FS");
            expect(dependency.lagDays).toBeGreaterThanOrEqual(0);
        }
    });

    test("every dependency connects two leaf activities", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 3 });
        const leafIds = new Set(
            graph.activities.filter((activity) => activity.type !== "group").map((activity) => activity.id),
        );
        for (const dependency of graph.dependencies) {
            expect(leafIds.has(dependency.predecessorId)).toBe(true);
            expect(leafIds.has(dependency.successorId)).toBe(true);
        }
    });

    test("every dependency points strictly forward", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 3 });
        for (const dependency of graph.dependencies) {
            const predecessorIndex = Number(dependency.predecessorId.slice(1));
            const successorIndex = Number(dependency.successorId.slice(1));
            expect(predecessorIndex).toBeLessThan(successorIndex);
        }
    });

    test("most leaves chain to their immediate predecessor (sequential staircase)", () => {
        const graph = generateSchedule({ activityCount: 1000, seed: 3 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const predecessorsBySuccessor = new Map<number, number[]>();
        for (const dependency of graph.dependencies) {
            const predecessorIndex = Number(dependency.predecessorId.slice(1));
            const successorIndex = Number(dependency.successorId.slice(1));
            const existing = predecessorsBySuccessor.get(successorIndex) ?? [];
            existing.push(predecessorIndex);
            predecessorsBySuccessor.set(successorIndex, existing);
        }
        let sequentialCount = 0;
        for (let index = 1; index < leaves.length; index++) {
            if ((predecessorsBySuccessor.get(index) ?? []).includes(index - 1)) {
                sequentialCount++;
            }
        }
        expect(sequentialCount / (leaves.length - 1)).toBeGreaterThan(0.7);
    });

    test("every dependency id is unique", () => {
        const graph = generateSchedule({ activityCount: 500, seed: 1 });
        const ids = graph.dependencies.map((dependency) => dependency.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test("all WBS codes are unique across leaves", () => {
        const graph = generateSchedule({ activityCount: 200, seed: 1 });
        const wbs = graph.activities
            .filter((activity) => activity.type !== "group")
            .map((activity) => activity.wbs);
        expect(new Set(wbs).size).toBe(wbs.length);
    });
});
```

- [ ] 2. Run the test, expect FAIL (module missing).

```
npx vitest run src/__tests__/services/generateSchedule.test.ts
```
Expected: fails to resolve `../../services/generateSchedule`.

- [ ] 3. Create `src/services/generateSchedule.ts` by adapting `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/services/generateSchedule.ts`. Keep `buildPrng`, `selectPredecessorIndices`, `selectPrimaryPredecessorIndex`, `selectMergePredecessorIndex`, `buildWbs`, and the id-builder helpers unchanged. Replace the node-building so projects and phases become group activities, leaves carry `type`/`parentId`, edges carry an `id`, and the return is `{ activities, dependencies }`:

```ts
/**
 * Seeded deterministic schedule generator emitting the unified node model.
 * Projects and phases are group-type activities; leaves are task or milestone
 * activities parented to a phase. Every dependency is finish-to-start with
 * non-negative lag and points strictly forward, so the graph is a DAG by
 * construction. Reproducible per seed for stable tests and demos.
 */
import {
    DEFAULT_ACTIVITY_COUNT,
    DEFAULT_SEED,
    GROUPS_PER_PROJECT,
    MAX_DURATION_DAYS,
    MAX_LAG_DAYS,
    MERGE_PREDECESSOR_CHANCE,
    MERGE_PREDECESSOR_LOOKBACK,
    MILESTONE_CHANCE,
    PARALLEL_BRANCH_CHANCE,
    PARALLEL_BRANCH_LOOKBACK,
} from "../constants/generator";
import type { Activity, ActivityType, Dependency, ScheduleGraph } from "../types/schedule";

const PROJECT_NAMES = ["Site Preparation", "Structural Works", "MEP Installation", "Finishing Works"];
const PHASE_NAMES = ["Planning", "Procurement", "Execution", "Inspection", "Closeout"];
const SEQUENTIAL_RELATIONSHIP_TYPE: Dependency["type"] = "FS";

export function generateSchedule(options?: { activityCount?: number; seed?: number }): ScheduleGraph {
    const seed = options?.seed ?? DEFAULT_SEED;
    const activityCount = options?.activityCount ?? DEFAULT_ACTIVITY_COUNT;
    const rand = buildPrng(seed);

    const projects = buildProjectNodes();
    const phases = buildPhaseNodes(projects);
    const leaves = buildLeafActivities(activityCount, phases, rand);
    const dependencies = buildDependencies(leaves, rand);

    return { activities: [...projects, ...phases, ...leaves], dependencies };
}

function buildPrng(seed: number): () => number {
    let state = seed;
    return function prng(): number {
        state = (state + 0x6d2b79f5) | 0;
        let z = Math.imul(state ^ (state >>> 15), 1 | state);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) | 0;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

function buildProjectNodes(): Activity[] {
    return PROJECT_NAMES.map((name, index) => ({
        durationDays: 0,
        id: buildProjectId(index),
        name,
        parentId: null,
        type: "group" as ActivityType,
        wbs: `${index + 1}`,
    }));
}

function buildPhaseNodes(projects: Activity[]): Activity[] {
    const phases: Activity[] = [];
    for (let projectIndex = 0; projectIndex < projects.length; projectIndex++) {
        for (let phaseIndex = 0; phaseIndex < GROUPS_PER_PROJECT; phaseIndex++) {
            phases.push({
                durationDays: 0,
                id: buildPhaseId(projects[projectIndex].id, phaseIndex),
                name: PHASE_NAMES[phaseIndex],
                parentId: projects[projectIndex].id,
                type: "group",
                wbs: `${projectIndex + 1}.${phaseIndex + 1}`,
            });
        }
    }
    return phases;
}

function buildLeafActivities(
    activityCount: number,
    phases: Activity[],
    rand: () => number,
): Activity[] {
    const leaves: Activity[] = [];
    const positionWithinPhase = new Array<number>(phases.length).fill(0);
    const activitiesPerPhase = Math.ceil(activityCount / phases.length);

    for (let index = 0; index < activityCount; index++) {
        const phaseIndex = Math.min(Math.floor(index / activitiesPerPhase), phases.length - 1);
        const phase = phases[phaseIndex];
        const position = positionWithinPhase[phaseIndex];
        positionWithinPhase[phaseIndex]++;

        const projectIndex = Math.floor(phaseIndex / GROUPS_PER_PROJECT);
        const phaseOrdinal = phaseIndex % GROUPS_PER_PROJECT;
        const isMilestone = rand() < MILESTONE_CHANCE;

        leaves.push({
            durationDays: isMilestone ? 0 : 1 + Math.floor(rand() * MAX_DURATION_DAYS),
            id: buildActivityId(index),
            name: `Activity ${index + 1}`,
            parentId: phase.id,
            type: isMilestone ? "milestone" : "task",
            wbs: buildWbs(projectIndex, phaseOrdinal, position),
        });
    }

    return leaves;
}

function buildDependencies(leaves: Activity[], rand: () => number): Dependency[] {
    const dependencies: Dependency[] = [];
    for (let index = 1; index < leaves.length; index++) {
        const predecessorIndices = selectPredecessorIndices(index, rand);
        for (const predecessorIndex of predecessorIndices) {
            dependencies.push(
                buildDependency(
                    leaves[predecessorIndex].id,
                    leaves[index].id,
                    dependencies.length,
                    rand,
                ),
            );
        }
    }
    return dependencies;
}

function selectPredecessorIndices(activityIndex: number, rand: () => number): number[] {
    const primaryIndex = selectPrimaryPredecessorIndex(activityIndex, rand);
    const predecessorIndices = [primaryIndex];
    const mergeIndex = selectMergePredecessorIndex(activityIndex, primaryIndex, rand);
    if (mergeIndex !== null) {
        predecessorIndices.push(mergeIndex);
    }
    return predecessorIndices;
}

function selectPrimaryPredecessorIndex(activityIndex: number, rand: () => number): number {
    if (activityIndex >= 2 && rand() < PARALLEL_BRANCH_CHANCE) {
        const branchStart = Math.max(0, activityIndex - PARALLEL_BRANCH_LOOKBACK);
        const branchPoolSize = activityIndex - 1 - branchStart;
        if (branchPoolSize > 0) {
            return branchStart + Math.floor(rand() * branchPoolSize);
        }
    }
    return activityIndex - 1;
}

function selectMergePredecessorIndex(
    activityIndex: number,
    primaryIndex: number,
    rand: () => number,
): number | null {
    if (rand() >= MERGE_PREDECESSOR_CHANCE || primaryIndex <= 0) {
        return null;
    }
    const mergeStart = Math.max(0, activityIndex - MERGE_PREDECESSOR_LOOKBACK);
    const mergePoolSize = primaryIndex - mergeStart;
    if (mergePoolSize <= 0) {
        return null;
    }
    return mergeStart + Math.floor(rand() * mergePoolSize);
}

function buildDependency(
    predecessorId: string,
    successorId: string,
    edgeIndex: number,
    rand: () => number,
): Dependency {
    return {
        id: `e${edgeIndex}`,
        lagDays: Math.floor(rand() * (MAX_LAG_DAYS + 1)),
        predecessorId,
        successorId,
        type: SEQUENTIAL_RELATIONSHIP_TYPE,
    };
}

function buildActivityId(activityIndex: number): string {
    return `a${activityIndex}`;
}

function buildPhaseId(projectId: string, phaseIndex: number): string {
    return `${projectId}-g${phaseIndex}`;
}

function buildProjectId(projectIndex: number): string {
    return `p${projectIndex}`;
}

function buildWbs(projectIndex: number, phaseOrdinal: number, positionWithinPhase: number): string {
    return `${projectIndex + 1}.${phaseOrdinal + 1}.${positionWithinPhase + 1}`;
}
```

> Note: leaf ids are `a0..a{n-1}` so the "strictly forward" test that parses `Number(id.slice(1))` continues to hold; the merge/branch selection is unchanged, preserving the staircase ratio and determinism.

- [ ] 4. Run the test, expect PASS.

```
npx vitest run src/__tests__/services/generateSchedule.test.ts
```
Expected: all suites pass.

- [ ] 5. Run the full unit suite to confirm no regressions.

```
npx vitest run
```
Expected: all suites pass; coverage not yet enforced on this command.

- [ ] 6. Commit:

```
git add -A && git commit -m "feat: adapt seeded generator to the unified node model with edge ids

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Incremental downstream-cone recompute

The recompute is optimistic and two-phase, matching section 6 of the spec ("early dates flow downstream; global float and the critical path are refreshed a beat later"). Phase 1 (`computeConeEarlyDates`) is the local, immediate, main-thread step the store runs synchronously on every timing edit: it recomputes only the downstream cone's EARLY dates so the drag or edit feels live. Phase 2 (`computeDownstreamCone`) is the authoritative global pass the worker runs a beat later: a full `computeSchedule` plus diff-vs-cache that returns the whole changed delta, including the corrected `lateStart`/`lateFinish`/`totalFloat`/`isCritical`. This task builds both halves plus the `selectDownstreamCone` traversal they share.

**Files:**
- Create: `src/services/cpm/selectDownstreamCone.ts`, `src/services/cpm/computeConeEarlyDates.ts`, `src/services/cpm/computeDownstreamCone.ts`
- Modify: `src/services/cpm/computeSchedule.ts` (export the existing `earlyStartFromDependency` helper; visibility-only, no algorithm change)
- Test: `src/__tests__/services/cpm/selectDownstreamCone.test.ts`, `src/__tests__/services/cpm/computeConeEarlyDates.test.ts`, `src/__tests__/services/cpm/computeDownstreamCone.test.ts`

**Interfaces:**
- Consumes: `computeSchedule` and its exported `earlyStartFromDependency` helper (Task 3, this task exports the helper), `selectLeafActivities` (Task 3), `sortActivitiesTopologically` (Task 3), `ScheduleGraph`, `Dependency`, `ComputedActivity` (Task 2).
- Produces:
  - `selectDownstreamCone(graph: ScheduleGraph, activityId: string): Set<string>` returning `activityId` plus every transitively reachable successor (leaf adjacency). Unchanged single-id signature; `computeConeEarlyDates` unions it across the changed-id list.
  - `computeConeEarlyDates(leafGraph: ScheduleGraph, changedActivityIds: string[], previousComputed: Map<string, ComputedActivity>): ComputedActivity[]` (phase 1): returns one `ComputedActivity` per cone member carrying UPDATED `earlyStart`/`earlyFinish` and the STALE `lateStart`/`lateFinish`/`totalFloat`/`isCritical` copied verbatim from `previousComputed`. Predecessors outside the cone are read from `previousComputed`; predecessors inside the cone use the freshly recomputed early dates. Throws if a cone member is absent from `previousComputed`.
  - `computeDownstreamCone(graph: ScheduleGraph, previousComputed: Map<string, ComputedActivity>): { computed: Map<string, ComputedActivity>; delta: ComputedActivity[] }` (phase 2) where `computed` is the full new leaf computation and `delta` is the subset whose `ComputedActivity` differs from `previousComputed`. Merging `delta` into `previousComputed` equals `computed`.

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/services/cpm/selectDownstreamCone.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { selectDownstreamCone } from "../../../services/cpm/selectDownstreamCone";
import type { Activity, Dependency, ScheduleGraph } from "../../../types/schedule";

function task(id: string): Activity {
    return { durationDays: 1, id, name: id, parentId: "ph", type: "task", wbs: "1" };
}

function edge(predecessorId: string, successorId: string): Dependency {
    return {
        id: `${predecessorId}->${successorId}`,
        lagDays: 0,
        predecessorId,
        successorId,
        type: "FS",
    };
}

// a -> b -> d ; a -> c -> d ; e is isolated
const GRAPH: ScheduleGraph = {
    activities: [task("a"), task("b"), task("c"), task("d"), task("e")],
    dependencies: [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")],
};

describe("selectDownstreamCone", () => {
    test("includes the activity and all transitive successors", () => {
        expect([...selectDownstreamCone(GRAPH, "a")].sort()).toEqual(["a", "b", "c", "d"]);
    });

    test("a leaf with no successors cones to itself", () => {
        expect([...selectDownstreamCone(GRAPH, "d")]).toEqual(["d"]);
    });

    test("an isolated activity cones to itself", () => {
        expect([...selectDownstreamCone(GRAPH, "e")]).toEqual(["e"]);
    });
});
```

- [ ] 2. Run it, expect FAIL.

```
npx vitest run src/__tests__/services/cpm/selectDownstreamCone.test.ts
```
Expected: fails to resolve the module.

- [ ] 3. Create `src/services/cpm/selectDownstreamCone.ts`:

```ts
/**
 * Collects the downstream cone of a changed activity: the activity itself plus
 * every successor reachable by following dependency edges forward. Early dates
 * flow downstream, so a duration or edge change can only alter the cone's early
 * bounds; the cone scopes which rows a view must refresh.
 */
import type { ScheduleGraph } from "../../types/schedule";

export function selectDownstreamCone(graph: ScheduleGraph, activityId: string): Set<string> {
    const successorsByPredecessor = groupSuccessorsByPredecessor(graph);
    const cone = new Set<string>([activityId]);
    const stack = [activityId];

    while (stack.length > 0) {
        const current = stack.pop()!;
        for (const successor of successorsByPredecessor.get(current) ?? []) {
            if (!cone.has(successor)) {
                cone.add(successor);
                stack.push(successor);
            }
        }
    }

    return cone;
}

function groupSuccessorsByPredecessor(graph: ScheduleGraph): Map<string, string[]> {
    const successorsByPredecessor = new Map<string, string[]>();
    for (const dependency of graph.dependencies) {
        const successors = successorsByPredecessor.get(dependency.predecessorId) ?? [];
        successors.push(dependency.successorId);
        successorsByPredecessor.set(dependency.predecessorId, successors);
    }
    return successorsByPredecessor;
}
```

- [ ] 4. Run it, expect PASS.

```
npx vitest run src/__tests__/services/cpm/selectDownstreamCone.test.ts
```
Expected: `3 passed`.

- [ ] 5. Write the failing property test `src/__tests__/services/cpm/computeDownstreamCone.test.ts`. It applies a random sequence of operations and asserts the folded delta equals a full recompute:

```ts
import { describe, expect, test } from "vitest";

import { computeDownstreamCone } from "../../../services/cpm/computeDownstreamCone";
import { computeSchedule } from "../../../services/cpm/computeSchedule";
import { selectLeafActivities } from "../../../services/cpm/selectLeafActivities";
import { generateSchedule } from "../../../services/generateSchedule";
import type { ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function fullCompute(graph: ScheduleGraph): Map<string, ComputedActivity> {
    const result = computeSchedule(selectLeafActivities(graph));
    if (!result.ok) {
        throw new Error("fixture unexpectedly cyclic");
    }
    return result.activities;
}

function makePrng(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let z = Math.imul(state ^ (state >>> 15), 1 | state);
        z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) | 0;
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

describe("computeDownstreamCone", () => {
    test("the delta merged into the previous cache equals a full recompute", () => {
        const graph = generateSchedule({ activityCount: 120, seed: 4 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        let cache = fullCompute(graph);
        const rand = makePrng(99);

        for (let step = 0; step < 40; step++) {
            const target = leaves[Math.floor(rand() * leaves.length)];
            target.durationDays = 1 + Math.floor(rand() * 15);

            const { computed, delta } = computeDownstreamCone(selectLeafActivities(graph), cache);
            const merged = new Map(cache);
            for (const entry of delta) {
                merged.set(entry.id, entry);
            }

            expect(merged).toEqual(computed);
            expect(merged).toEqual(fullCompute(graph));
            cache = merged;
        }
    });

    test("delta is empty when nothing changed", () => {
        const graph = generateSchedule({ activityCount: 60, seed: 2 });
        const cache = fullCompute(graph);
        const { delta } = computeDownstreamCone(selectLeafActivities(graph), cache);
        expect(delta).toEqual([]);
    });
});
```

- [ ] 6. Run it, expect FAIL.

```
npx vitest run src/__tests__/services/cpm/computeDownstreamCone.test.ts
```
Expected: fails to resolve the module.

- [ ] 7. Create `src/services/cpm/computeDownstreamCone.ts`:

```ts
/**
 * Recomputes the schedule and returns the delta against a previous computed
 * cache. The worker runs the full pass off the main thread; this function
 * narrows the result to only the activities whose computed values changed (for a
 * resize, exactly the downstream cone), so each view batch-updates the minimum
 * set of rows and bars. Callers pass a leaf-only graph; a cyclic graph throws.
 */
import type { ComputedActivity, ScheduleGraph } from "../../types/schedule";

import { computeSchedule } from "./computeSchedule";

export function computeDownstreamCone(
    graph: ScheduleGraph,
    previousComputed: Map<string, ComputedActivity>,
): { computed: Map<string, ComputedActivity>; delta: ComputedActivity[] } {
    const result = computeSchedule(graph);
    if (!result.ok) {
        throw new Error("computeDownstreamCone: graph is cyclic; gate with detectCycle first");
    }

    const computed = result.activities;
    const delta: ComputedActivity[] = [];
    for (const [id, current] of computed) {
        if (!isSameComputedActivity(previousComputed.get(id), current)) {
            delta.push(current);
        }
    }

    return { computed, delta };
}

function isSameComputedActivity(
    previous: ComputedActivity | undefined,
    current: ComputedActivity,
): boolean {
    return (
        previous !== undefined &&
        previous.earlyFinish === current.earlyFinish &&
        previous.earlyStart === current.earlyStart &&
        previous.isCritical === current.isCritical &&
        previous.lateFinish === current.lateFinish &&
        previous.lateStart === current.lateStart &&
        previous.totalFloat === current.totalFloat
    );
}
```

- [ ] 8. Run it, expect PASS.

```
npx vitest run src/__tests__/services/cpm/computeDownstreamCone.test.ts
```
Expected: `2 passed`.

- [ ] 9. Phase 1 needs the engine's per-dependency early-start formula, and it must not be duplicated. Export the existing pure helper `earlyStartFromDependency` from `src/services/cpm/computeSchedule.ts` so `computeSchedule` and `computeConeEarlyDates` share one implementation of the FS/SS/FF/SF switch. This is a visibility-only change: add the `export` keyword to the existing declaration and change nothing else, so the "engine ported unchanged" constraint holds (the helper stays in `computeSchedule.ts`, its home, rather than moving). It is now a helper shared by two public functions, which is the shared-implementation case R-235 calls for; flag it for the reviewer as a visibility change, not an engine modification. Change the declaration:

```ts
function earlyStartFromDependency(
```

to:

```ts
export function earlyStartFromDependency(
```

- [ ] 10. Write the failing test `src/__tests__/services/cpm/computeConeEarlyDates.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { computeConeEarlyDates } from "../../../services/cpm/computeConeEarlyDates";
import { computeSchedule } from "../../../services/cpm/computeSchedule";
import { selectLeafActivities } from "../../../services/cpm/selectLeafActivities";
import { generateSchedule } from "../../../services/generateSchedule";
import type { ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function fullCompute(graph: ScheduleGraph): Map<string, ComputedActivity> {
    const result = computeSchedule(selectLeafActivities(graph));
    if (!result.ok) {
        throw new Error("fixture unexpectedly cyclic");
    }
    return result.activities;
}

function stale(
    id: string,
    earlyStart: number,
    earlyFinish: number,
    lateStart: number,
    lateFinish: number,
    isCritical: boolean,
): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical,
        lateFinish,
        lateStart,
        totalFloat: lateStart - earlyStart,
    };
}

describe("computeConeEarlyDates", () => {
    test("phase-1 early dates match a full computeSchedule for every cone member", () => {
        const graph = generateSchedule({ activityCount: 120, seed: 4 });
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const previousComputed = fullCompute(graph);

        const target = leaves[10];
        target.durationDays += 7;

        const coneDelta = computeConeEarlyDates(
            selectLeafActivities(graph),
            [target.id],
            previousComputed,
        );
        const authoritative = fullCompute(graph);

        expect(coneDelta.length).toBeGreaterThan(0);
        for (const entry of coneDelta) {
            expect(entry.earlyStart).toBe(authoritative.get(entry.id)?.earlyStart);
            expect(entry.earlyFinish).toBe(authoritative.get(entry.id)?.earlyFinish);
        }
    });

    test("a predecessor outside the cone is read from previousComputed, not recomputed", () => {
        // a -> b -> c, all leaves. Changing b cones to {b, c}; a is upstream and outside.
        const graph: ScheduleGraph = {
            activities: [
                { durationDays: 5, id: "a", name: "a", parentId: "ph", type: "task", wbs: "1" },
                { durationDays: 4, id: "b", name: "b", parentId: "ph", type: "task", wbs: "2" },
                { durationDays: 2, id: "c", name: "c", parentId: "ph", type: "task", wbs: "3" },
            ],
            dependencies: [
                { id: "a->b", lagDays: 0, predecessorId: "a", successorId: "b", type: "FS" },
                { id: "b->c", lagDays: 0, predecessorId: "b", successorId: "c", type: "FS" },
            ],
        };

        // Tamper a's cached early finish to a sentinel so the assertion proves the cone
        // reads it verbatim from previousComputed instead of recomputing activity "a".
        const previousComputed = new Map<string, ComputedActivity>([
            ["a", stale("a", 0, 100, 0, 100, false)],
            ["b", stale("b", 5, 8, 5, 8, true)],
            ["c", stale("c", 8, 10, 8, 10, false)],
        ]);

        const coneDelta = computeConeEarlyDates(graph, ["b"], previousComputed);
        const byId = new Map(coneDelta.map((entry) => [entry.id, entry]));

        expect(byId.has("a")).toBe(false);
        expect(byId.get("b")?.earlyStart).toBe(100);
        expect(byId.get("b")?.earlyFinish).toBe(104);
        expect(byId.get("c")?.earlyStart).toBe(104);
        // Stale late/float/critical are carried verbatim for phase 2 to correct.
        expect(byId.get("b")?.lateStart).toBe(5);
        expect(byId.get("b")?.isCritical).toBe(true);
    });
});
```

- [ ] 11. Run it, expect FAIL.

```
npx vitest run src/__tests__/services/cpm/computeConeEarlyDates.test.ts
```
Expected: fails to resolve the module.

- [ ] 12. Create `src/services/cpm/computeConeEarlyDates.ts`:

```ts
/**
 * Phase 1 of the two-phase recompute: the local, immediate, main-thread step.
 * When an operation changes timing, this recomputes only the downstream cone's
 * EARLY dates (earlyStart/earlyFinish) and returns them at once so a drag or edit
 * feels live. Late dates, total float, and the critical flag are global
 * properties; they are NOT recomputed here. Each returned ComputedActivity
 * carries its updated early dates and the stale lateStart/lateFinish/totalFloat/
 * isCritical copied verbatim from previousComputed, which phase 2 (the worker's
 * full computeDownstreamCone pass) corrects a beat later.
 */
import type { ComputedActivity, Dependency, ScheduleGraph } from "../../types/schedule";

import { earlyStartFromDependency } from "./computeSchedule";
import { selectDownstreamCone } from "./selectDownstreamCone";
import { sortActivitiesTopologically } from "./sortActivitiesTopologically";

export function computeConeEarlyDates(
    leafGraph: ScheduleGraph,
    changedActivityIds: string[],
    previousComputed: Map<string, ComputedActivity>,
): ComputedActivity[] {
    const cone = collectChangedCone(leafGraph, changedActivityIds);
    const dependenciesBySuccessor = groupDependenciesBySuccessor(leafGraph.dependencies);
    const durations = buildDurationMap(leafGraph);
    const orderedConeActivities = sortActivitiesTopologically(leafGraph).filter((activity) =>
        cone.has(activity.id),
    );

    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();
    const delta: ComputedActivity[] = [];

    for (const activity of orderedConeActivities) {
        const stale = previousComputed.get(activity.id);
        if (stale === undefined) {
            throw new Error(
                `computeConeEarlyDates: cone activity ${activity.id} is missing from previousComputed`,
            );
        }

        const activityDuration = durations.get(activity.id) ?? 0;
        const predecessors = dependenciesBySuccessor.get(activity.id) ?? [];

        let start = 0;
        for (const dependency of predecessors) {
            const candidate = earlyStartFromDependency(
                dependency,
                readEarlyStart(dependency.predecessorId, cone, earlyStart, previousComputed),
                readEarlyFinish(dependency.predecessorId, cone, earlyFinish, previousComputed),
                activityDuration,
            );
            start = Math.max(start, candidate);
        }

        earlyStart.set(activity.id, start);
        earlyFinish.set(activity.id, start + activityDuration);
        delta.push({ ...stale, earlyFinish: start + activityDuration, earlyStart: start });
    }

    return delta;
}

function collectChangedCone(leafGraph: ScheduleGraph, changedActivityIds: string[]): Set<string> {
    const cone = new Set<string>();
    for (const activityId of changedActivityIds) {
        for (const member of selectDownstreamCone(leafGraph, activityId)) {
            cone.add(member);
        }
    }
    return cone;
}

function groupDependenciesBySuccessor(dependencies: Dependency[]): Map<string, Dependency[]> {
    const grouped = new Map<string, Dependency[]>();
    for (const dependency of dependencies) {
        const existing = grouped.get(dependency.successorId) ?? [];
        existing.push(dependency);
        grouped.set(dependency.successorId, existing);
    }
    return grouped;
}

function buildDurationMap(graph: ScheduleGraph): Map<string, number> {
    const durations = new Map<string, number>();
    for (const activity of graph.activities) {
        durations.set(activity.id, activity.durationDays);
    }
    return durations;
}

function readEarlyStart(
    predecessorId: string,
    cone: Set<string>,
    freshEarlyStart: Map<string, number>,
    previousComputed: Map<string, ComputedActivity>,
): number {
    if (cone.has(predecessorId)) {
        return freshEarlyStart.get(predecessorId) ?? 0;
    }
    return previousComputed.get(predecessorId)?.earlyStart ?? 0;
}

function readEarlyFinish(
    predecessorId: string,
    cone: Set<string>,
    freshEarlyFinish: Map<string, number>,
    previousComputed: Map<string, ComputedActivity>,
): number {
    if (cone.has(predecessorId)) {
        return freshEarlyFinish.get(predecessorId) ?? 0;
    }
    return previousComputed.get(predecessorId)?.earlyFinish ?? 0;
}
```

- [ ] 13. Run it, expect PASS.

```
npx vitest run src/__tests__/services/cpm/computeConeEarlyDates.test.ts
```
Expected: `2 passed`.

- [ ] 14. Commit:

```
git add -A && git commit -m "feat: add downstream-cone selection with phase-1 early-date and phase-2 full recompute

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Pure worker-message handler

This handler is the PHASE 2 path of the two-phase recompute: the authoritative global pass. Phase 1 (the cone's early dates, Task 5's `computeConeEarlyDates`) runs synchronously in the store (Task 7) the instant an edit lands so the drag feels live; phase 2 runs here, off the main thread in the worker, a beat later. An `operation` message therefore returns the authoritative global delta (early dates plus the corrected `lateStart`/`lateFinish`/`totalFloat`/`isCritical`), which the store merges to fix any value phase 1 left stale. No new worker function is needed for the split; phase 1 lives entirely in the store.

**Files:**
- Create: `src/workers/handleWorkerMessage.ts`, `src/workers/cpmWorker.ts`
- Test: `src/__tests__/workers/handleWorkerMessage.test.ts`

**Interfaces:**
- Consumes: `computeSchedule`, `selectLeafActivities` (Task 3), `computeDownstreamCone` (Task 5), `ScheduleGraph`, `ComputedActivity` (Task 2), `Operation` (Task 2).
- Produces:
  - `type WorkerMessage = { graph: ScheduleGraph; kind: "full" } | { graph: ScheduleGraph; kind: "operation"; operation: Operation }`
  - `type WorkerResult = { computed: Map<string, ComputedActivity>; delta: ComputedActivity[] }`
  - `handleWorkerMessage(message: WorkerMessage, previousComputed: Map<string, ComputedActivity>): WorkerResult`. `full` returns every leaf ComputedActivity as the delta and the new map as `computed`; `operation` runs the phase-2 full recompute and returns the authoritative global delta (the changed subset, float and critical-path corrected) plus the new map; a `toggleCollapse` operation returns an empty delta with `computed` echoing `previousComputed` (no recompute).

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/workers/handleWorkerMessage.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { generateSchedule } from "../../services/generateSchedule";
import type { ComputedActivity } from "../../types/schedule";
import { handleWorkerMessage } from "../../workers/handleWorkerMessage";

const EMPTY = new Map<string, ComputedActivity>();

describe("handleWorkerMessage", () => {
    test("full returns every leaf computation as both delta and computed", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const leafCount = graph.activities.filter((activity) => activity.type !== "group").length;
        const result = handleWorkerMessage({ graph, kind: "full" }, EMPTY);
        expect(result.delta).toHaveLength(leafCount);
        expect(result.computed.size).toBe(leafCount);
    });

    test("operation resize returns only the changed downstream entries", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const baseline = handleWorkerMessage({ graph, kind: "full" }, EMPTY);
        const leaves = graph.activities.filter((activity) => activity.type !== "group");
        const target = leaves[0];
        target.durationDays += 10;

        const result = handleWorkerMessage(
            {
                graph,
                kind: "operation",
                operation: { activityId: target.id, durationDays: target.durationDays, kind: "resizeActivity" },
            },
            baseline.computed,
        );

        expect(result.delta.length).toBeGreaterThan(0);
        expect(result.delta.length).toBeLessThan(leaves.length);
        const merged = new Map(baseline.computed);
        for (const entry of result.delta) {
            merged.set(entry.id, entry);
        }
        expect(merged).toEqual(result.computed);
    });

    test("toggleCollapse recomputes nothing and returns an empty delta", () => {
        const graph = generateSchedule({ activityCount: 50, seed: 1 });
        const baseline = handleWorkerMessage({ graph, kind: "full" }, EMPTY);
        const result = handleWorkerMessage(
            { graph, kind: "operation", operation: { kind: "toggleCollapse", rowId: "p0" } },
            baseline.computed,
        );
        expect(result.delta).toEqual([]);
        expect(result.computed).toBe(baseline.computed);
    });
});
```

- [ ] 2. Run it, expect FAIL.

```
npx vitest run src/__tests__/workers/handleWorkerMessage.test.ts
```
Expected: fails to resolve `../../workers/handleWorkerMessage`.

- [ ] 3. Create `src/workers/handleWorkerMessage.ts`:

```ts
/**
 * Pure handler for CPM worker messages. A "full" message recomputes the whole
 * schedule; an "operation" message recomputes and returns only the changed
 * delta, except toggleCollapse which is view-only and triggers no recompute.
 * Kept pure and free of the worker global so it is unit-testable in isolation.
 */
import { computeDownstreamCone } from "../services/cpm/computeDownstreamCone";
import { computeSchedule } from "../services/cpm/computeSchedule";
import { selectLeafActivities } from "../services/cpm/selectLeafActivities";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

export type WorkerMessage =
    | { graph: ScheduleGraph; kind: "full" }
    | { graph: ScheduleGraph; kind: "operation"; operation: Operation };

export interface WorkerResult {
    computed: Map<string, ComputedActivity>;
    delta: ComputedActivity[];
}

export function handleWorkerMessage(
    message: WorkerMessage,
    previousComputed: Map<string, ComputedActivity>,
): WorkerResult {
    const leafGraph = selectLeafActivities(message.graph);

    if (message.kind === "operation" && message.operation.kind === "toggleCollapse") {
        return { computed: previousComputed, delta: [] };
    }

    if (message.kind === "full") {
        const result = computeSchedule(leafGraph);
        if (!result.ok) {
            throw new Error("handleWorkerMessage: full graph is cyclic");
        }
        return { computed: result.activities, delta: [...result.activities.values()] };
    }

    return computeDownstreamCone(leafGraph, previousComputed);
}
```

- [ ] 4. Run it, expect PASS.

```
npx vitest run src/__tests__/workers/handleWorkerMessage.test.ts
```
Expected: `3 passed`.

- [ ] 5. Create the worker entry `src/workers/cpmWorker.ts` (thin shell wiring the pure handler to `postMessage`; not unit-tested directly because it is the global glue):

```ts
/**
 * Web-worker entry for CPM recompute. Holds the last computed cache as worker
 * state and delegates every message to the pure handleWorkerMessage, posting
 * back only the changed delta so the main thread batch-updates the minimum set
 * of rows and bars. The store falls back to synchronous compute if this worker
 * fails to initialize.
 */
import type { ComputedActivity } from "../types/schedule";

import { handleWorkerMessage } from "./handleWorkerMessage";
import type { WorkerMessage } from "./handleWorkerMessage";

let previousComputed = new Map<string, ComputedActivity>();

self.onmessage = (event: MessageEvent<WorkerMessage>): void => {
    const { computed, delta } = handleWorkerMessage(event.data, previousComputed);
    previousComputed = computed;
    self.postMessage(delta);
};
```

- [ ] 6. Run the full suite, expect PASS.

```
npx vitest run
```
Expected: all suites pass.

- [ ] 7. Commit:

```
git add -A && git commit -m "feat: add pure CPM worker-message handler and worker entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Zustand schedule store and selection store

**Files:**
- Create: `src/state/scheduleStore.ts`, `src/state/useScheduleSelection.ts`
- Test: `src/__tests__/state/scheduleStore.test.ts`, `src/__tests__/state/useScheduleSelection.test.ts`

**Interfaces:**
- Consumes: `computeConeEarlyDates` (Task 5), `selectLeafActivities` (Task 3), `handleWorkerMessage` (Task 6), `Operation` + guards (Task 2), `ScheduleGraph`, `Activity`, `Dependency`, `ComputedActivity` (Task 2).
- Produces:
  - `useScheduleStore` Zustand store with state `{ graph: ScheduleGraph; computed: Map<string, ComputedActivity>; collapsed: Set<string> }` and actions `loadGraph(graph: ScheduleGraph): void`, `dispatchOperation(operation: Operation): { ok: boolean }`.
  - `useScheduleSelection` Zustand store with `{ selectedActivityId: string | null; selectActivity(id: string | null): void }`.
- Note: `dispatchOperation` is two-phase. Phase 1 runs synchronously on the main thread via `computeConeEarlyDates` (the cone's early dates, applied at once so the edit feels live). Phase 2 is the authoritative global pass via `handleWorkerMessage`; Task 7 runs it synchronously on the main thread, and Task 11 swaps in the actual worker with this same synchronous call as the worker-unavailable fallback. The cycle-rejection branch is added in Task 8.

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/state/scheduleStore.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, Dependency, ScheduleGraph } from "../../types/schedule";

function task(id: string, durationDays: number, parentId: string): Activity {
    return { durationDays, id, name: id, parentId, type: "task", wbs: id };
}

function edge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        task("a", 5, "ph"),
        task("b", 3, "ph"),
    ],
    dependencies: [edge("e1", "a", "b")],
};

const FLOAT_GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        task("S", 0, "ph"),
        task("A", 4, "ph"),
        task("B", 2, "ph"),
        task("C", 5, "ph"),
        task("D", 3, "ph"),
        task("E", 0, "ph"),
    ],
    dependencies: [
        edge("S->A", "S", "A"),
        edge("S->B", "S", "B"),
        edge("A->C", "A", "C"),
        edge("B->D", "B", "D"),
        edge("C->E", "C", "E"),
        edge("D->E", "D", "E"),
    ],
};

describe("useScheduleStore", () => {
    beforeEach(() => {
        useScheduleStore.getState().loadGraph(structuredClone(GRAPH));
    });

    test("loadGraph computes the full schedule into the cache", () => {
        const { computed } = useScheduleStore.getState();
        expect(computed.get("a")?.earlyStart).toBe(0);
        expect(computed.get("b")?.earlyStart).toBe(5);
    });

    test("resizeActivity updates the duration and shifts the downstream successor", () => {
        useScheduleStore.getState().dispatchOperation({
            activityId: "a",
            durationDays: 8,
            kind: "resizeActivity",
        });
        const { computed, graph } = useScheduleStore.getState();
        expect(graph.activities.find((activity) => activity.id === "a")?.durationDays).toBe(8);
        expect(computed.get("b")?.earlyStart).toBe(8);
    });

    test("addDependency inserts the edge and recomputes", () => {
        useScheduleStore.getState().loadGraph({
            activities: [task("a", 5, "ph"), task("b", 3, "ph"), task("c", 2, "ph")],
            dependencies: [],
        });
        const result = useScheduleStore.getState().dispatchOperation({
            edge: edge("e9", "b", "c"),
            kind: "addDependency",
        });
        expect(result.ok).toBe(true);
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(1);
        expect(useScheduleStore.getState().computed.get("c")?.earlyStart).toBe(3);
    });

    test("removeDependency drops the edge and recomputes", () => {
        useScheduleStore.getState().dispatchOperation({ edgeId: "e1", kind: "removeDependency" });
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(0);
        expect(useScheduleStore.getState().computed.get("b")?.earlyStart).toBe(0);
    });

    test("toggleCollapse flips collapse membership without recompute", () => {
        useScheduleStore.getState().dispatchOperation({ kind: "toggleCollapse", rowId: "ph" });
        expect(useScheduleStore.getState().collapsed.has("ph")).toBe(true);
        useScheduleStore.getState().dispatchOperation({ kind: "toggleCollapse", rowId: "ph" });
        expect(useScheduleStore.getState().collapsed.has("ph")).toBe(false);
    });

    test("resize recomputes downstream early dates (phase 1) and corrects global float and critical (phase 2)", () => {
        useScheduleStore.getState().loadGraph(structuredClone(FLOAT_GRAPH));

        // Before: S->A(4)->C(5)->E is the critical chain (length 9); S->B(2)->D(3)->E carries float 4.
        expect(useScheduleStore.getState().computed.get("A")?.isCritical).toBe(true);
        expect(useScheduleStore.getState().computed.get("B")?.totalFloat).toBe(4);

        useScheduleStore.getState().dispatchOperation({
            activityId: "B",
            durationDays: 8,
            kind: "resizeActivity",
        });
        const { computed } = useScheduleStore.getState();

        // Phase 1 (local, synchronous): the downstream cone of B (B, D, E) has fresh early dates.
        expect(computed.get("B")?.earlyFinish).toBe(8);
        expect(computed.get("D")?.earlyStart).toBe(8);
        expect(computed.get("E")?.earlyStart).toBe(11);

        // Phase 2 (global): B->D->E is now critical (length 11); A and C sit OUTSIDE B's cone
        // yet their float and critical flag are corrected by the full pass.
        expect(computed.get("B")?.isCritical).toBe(true);
        expect(computed.get("D")?.isCritical).toBe(true);
        expect(computed.get("A")?.isCritical).toBe(false);
        expect(computed.get("A")?.totalFloat).toBe(2);
        expect(computed.get("C")?.totalFloat).toBe(2);
    });
});
```

- [ ] 2. Run it, expect FAIL.

```
npx vitest run src/__tests__/state/scheduleStore.test.ts
```
Expected: fails to resolve `../../state/scheduleStore`.

- [ ] 3. Create `src/state/scheduleStore.ts`:

```ts
/**
 * Zustand store holding the single source of truth: the raw schedule graph
 * (stored inputs only), the computed cache (engine outputs, never persisted),
 * and the shared collapse set. dispatchOperation is two-phase: it applies the
 * operation to the raw graph, then PHASE 1 recomputes the downstream cone's early
 * dates synchronously (computeConeEarlyDates) and merges them at once so the edit
 * feels live, then PHASE 2 runs the authoritative global pass (handleWorkerMessage)
 * and merges its delta to correct float and the critical path. Task 8 adds cycle
 * rejection for addDependency; Task 11 routes phase 2 through the web worker with
 * this synchronous path as the fallback.
 */
import { create } from "zustand";

import { computeConeEarlyDates } from "../services/cpm/computeConeEarlyDates";
import { selectLeafActivities } from "../services/cpm/selectLeafActivities";
import { handleWorkerMessage } from "../workers/handleWorkerMessage";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

interface ScheduleState {
    collapsed: Set<string>;
    computed: Map<string, ComputedActivity>;
    dispatchOperation(operation: Operation): { ok: boolean };
    graph: ScheduleGraph;
    loadGraph(graph: ScheduleGraph): void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
    collapsed: new Set<string>(),
    computed: new Map<string, ComputedActivity>(),
    dispatchOperation(operation: Operation): { ok: boolean } {
        if (operation.kind === "toggleCollapse") {
            set((state) => ({ collapsed: toggleMembership(state.collapsed, operation.rowId) }));
            return { ok: true };
        }

        const changedActivityIds = selectChangedActivityIds(get().graph, operation);
        const graph = applyOperationToGraph(get().graph, operation);

        // Phase 1 (local, immediate, main thread): recompute only the downstream cone's
        // early dates and merge them at once so the edit feels live.
        const earlyDelta = computeConeEarlyDates(
            selectLeafActivities(graph),
            changedActivityIds,
            get().computed,
        );
        set({ computed: mergeComputedDelta(get().computed, earlyDelta), graph });

        // Phase 2 (global, a beat later): the authoritative full pass that corrects float
        // and the critical flag. Task 7 runs it synchronously; Task 11 posts it to the
        // worker and keeps this synchronous call as the worker-unavailable fallback.
        const { delta } = handleWorkerMessage({ graph, kind: "operation", operation }, get().computed);
        set({ computed: mergeComputedDelta(get().computed, delta) });
        return { ok: true };
    },
    graph: { activities: [], dependencies: [] },
    loadGraph(graph: ScheduleGraph): void {
        const { computed } = handleWorkerMessage({ graph, kind: "full" }, new Map());
        set({ collapsed: new Set<string>(), computed, graph });
    },
}));

function applyOperationToGraph(graph: ScheduleGraph, operation: Operation): ScheduleGraph {
    switch (operation.kind) {
        case "addDependency":
            return { activities: graph.activities, dependencies: [...graph.dependencies, operation.edge] };
        case "removeDependency":
            return {
                activities: graph.activities,
                dependencies: graph.dependencies.filter((edge) => edge.id !== operation.edgeId),
            };
        case "resizeActivity":
            return {
                activities: graph.activities.map((activity) =>
                    activity.id === operation.activityId
                        ? { ...activity, durationDays: operation.durationDays }
                        : activity,
                ),
                dependencies: graph.dependencies,
            };
        case "toggleCollapse":
            return graph;
    }
}

function mergeComputedDelta(
    computed: Map<string, ComputedActivity>,
    delta: ComputedActivity[],
): Map<string, ComputedActivity> {
    const next = new Map(computed);
    for (const entry of delta) {
        next.set(entry.id, entry);
    }
    return next;
}

function selectChangedActivityIds(graph: ScheduleGraph, operation: Operation): string[] {
    switch (operation.kind) {
        case "addDependency":
            return [operation.edge.successorId];
        case "removeDependency": {
            const removed = graph.dependencies.find((edge) => edge.id === operation.edgeId);
            return removed === undefined ? [] : [removed.successorId];
        }
        case "resizeActivity":
            return [operation.activityId];
        case "toggleCollapse":
            return [];
    }
}

function toggleMembership(members: Set<string>, id: string): Set<string> {
    const next = new Set(members);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    return next;
}
```

> Note: Phase 1 merges only the cone's early-date delta, so the cache is correct-but-incomplete for a beat (float and critical may be stale on the just-edited cone). Phase 2's `handleWorkerMessage` recomputes the full leaf schedule against the post-phase-1 cache and returns a delta that is exactly the activities still differing (the float and critical corrections, plus any global float shift outside the cone); merging it yields the authoritative cache. The merge path is kept because Task 11's worker posts back only `delta`, and the store merges it into its existing cache.

- [ ] 4. Run it, expect PASS.

```
npx vitest run src/__tests__/state/scheduleStore.test.ts
```
Expected: `6 passed`.

- [ ] 5. Write the failing test `src/__tests__/state/useScheduleSelection.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { useScheduleSelection } from "../../state/useScheduleSelection";

describe("useScheduleSelection", () => {
    test("starts with no selection and records a selected id", () => {
        expect(useScheduleSelection.getState().selectedActivityId).toBeNull();
        useScheduleSelection.getState().selectActivity("a3");
        expect(useScheduleSelection.getState().selectedActivityId).toBe("a3");
    });

    test("clears the selection when passed null", () => {
        useScheduleSelection.getState().selectActivity("a3");
        useScheduleSelection.getState().selectActivity(null);
        expect(useScheduleSelection.getState().selectedActivityId).toBeNull();
    });
});
```

- [ ] 6. Run it, expect FAIL.

```
npx vitest run src/__tests__/state/useScheduleSelection.test.ts
```
Expected: fails to resolve the module.

- [ ] 7. Create `src/state/useScheduleSelection.ts`:

```ts
/**
 * Shared selection store: the currently selected activity id. Selecting a row in
 * the grid highlights its bar in the Gantt and vice versa, so both imperative
 * views read and write this single store.
 */
import { create } from "zustand";

interface SelectionState {
    selectActivity(id: string | null): void;
    selectedActivityId: string | null;
}

export const useScheduleSelection = create<SelectionState>((set) => ({
    selectActivity(id: string | null): void {
        set({ selectedActivityId: id });
    },
    selectedActivityId: null,
}));
```

- [ ] 8. Run it, expect PASS.

```
npx vitest run src/__tests__/state/useScheduleSelection.test.ts
```
Expected: `2 passed`.

- [ ] 9. Commit:

```
git add -A && git commit -m "feat: add Zustand schedule store and shared selection store

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Cycle-rejection validity gate on addDependency

**Files:**
- Modify: `src/state/scheduleStore.ts`
- Test: `src/__tests__/state/scheduleStoreValidity.test.ts`

**Interfaces:**
- Consumes: `detectCycle` (Task 3), the existing store (Task 7).
- Produces: `dispatchOperation` returns `{ ok: false; cycle: string[] }` for an `addDependency` that would create a cycle and makes no mutation; the success shape stays `{ ok: true }`. The return type widens to `{ ok: true } | { ok: false; cycle: string[] }`.

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/state/scheduleStoreValidity.test.ts`:

```ts
import { beforeEach, describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, Dependency, ScheduleGraph } from "../../types/schedule";

function task(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: id };
}

function edge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

// a -> b -> c chain; adding c -> a would close a cycle.
const GRAPH: ScheduleGraph = {
    activities: [task("a", 2), task("b", 2), task("c", 2)],
    dependencies: [edge("e1", "a", "b"), edge("e2", "b", "c")],
};

describe("useScheduleStore cycle rejection", () => {
    beforeEach(() => {
        useScheduleStore.getState().loadGraph(structuredClone(GRAPH));
    });

    test("rejects a cycle-creating addDependency without mutating the graph", () => {
        const result = useScheduleStore.getState().dispatchOperation({
            edge: edge("e3", "c", "a"),
            kind: "addDependency",
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.cycle.length).toBeGreaterThan(0);
        }
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(2);
    });

    test("leaves the computed cache untouched after a rejected edge", () => {
        const before = useScheduleStore.getState().computed.get("c")?.earlyStart;
        useScheduleStore.getState().dispatchOperation({ edge: edge("e3", "c", "a"), kind: "addDependency" });
        expect(useScheduleStore.getState().computed.get("c")?.earlyStart).toBe(before);
    });

    test("still accepts a valid addDependency", () => {
        const result = useScheduleStore.getState().dispatchOperation({
            edge: edge("e4", "a", "c"),
            kind: "addDependency",
        });
        expect(result.ok).toBe(true);
        expect(useScheduleStore.getState().graph.dependencies).toHaveLength(3);
    });
});
```

- [ ] 2. Run it, expect FAIL (current store returns `{ ok: true }` and mutates).

```
npx vitest run src/__tests__/state/scheduleStoreValidity.test.ts
```
Expected: assertions on `result.ok === false` and length 2 fail.

- [ ] 3. Edit `src/state/scheduleStore.ts`. Widen the action signature and add the gate. Change the interface line:

```ts
    dispatchOperation(operation: Operation): { ok: true } | { cycle: string[]; ok: false };
```

  Add the import:

```ts
import { detectCycle } from "../services/cpm/detectCycle";
```

  Replace the `dispatchOperation` body's recompute section so an `addDependency` is validated against the prospective graph before any mutation:

```ts
    dispatchOperation(operation: Operation): { ok: true } | { cycle: string[]; ok: false } {
        if (operation.kind === "toggleCollapse") {
            set((state) => ({ collapsed: toggleMembership(state.collapsed, operation.rowId) }));
            return { ok: true };
        }

        const graph = applyOperationToGraph(get().graph, operation);

        if (operation.kind === "addDependency") {
            const cycle = detectCycle(graph);
            if (cycle !== null) {
                return { cycle, ok: false };
            }
        }

        const { computed, delta } = handleWorkerMessage(
            { graph, kind: "operation", operation },
            get().computed,
        );
        set({ computed: mergeComputedDelta(computed, delta), graph });
        return { ok: true };
    },
```

- [ ] 4. Run it, expect PASS.

```
npx vitest run src/__tests__/state/scheduleStoreValidity.test.ts
```
Expected: `3 passed`.

- [ ] 5. Run the prior store test plus the full suite to confirm no regression in the success path.

```
npx vitest run
```
Expected: all suites pass.

- [ ] 6. Commit:

```
git add -A && git commit -m "feat: reject cycle-creating dependencies before mutating the graph

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Data layer (MSW handler, fetch wrapper, query hook, bootstrap)

**Files:**
- Create: `src/api/useScheduleQuery.ts`
- Modify: `src/api/fetchScheduleGraph.ts` (copy then adapt), `src/mocks/handlers.ts`, `src/components/AppShell/AppShell.tsx`, `src/main.tsx`
- Test: `src/__tests__/api/fetchScheduleGraph.test.ts`, `src/__tests__/api/useScheduleQuery.test.tsx`

**Interfaces:**
- Consumes: `generateSchedule` (Task 4), `API_ROUTES` (Task 2), `useScheduleStore.loadGraph` (Task 7), `ScheduleGraph` (Task 2).
- Produces:
  - `fetchScheduleGraph(): Promise<ScheduleGraph>` (adapted; returns `{ activities, dependencies }`).
  - `useScheduleQuery(): { isError: boolean; isPending: boolean; refetch(): void }` that loads the graph into the store on success.

**Steps:**

- [ ] 1. Copy and adapt `src/api/fetchScheduleGraph.ts` from `/Users/iangreenough/Desktop/code/personal/production/gantt-chart/src/api/fetchScheduleGraph.ts`. The body is unchanged; the return type is already `Promise<ScheduleGraph>` which now resolves to the two-array shape. Keep it verbatim.

- [ ] 2. Replace `src/mocks/handlers.ts` with the schedule-graph handler (adapted: single unified graph, no projects route):

```ts
/**
 * MSW request handlers for the mock API. Generates the unified schedule graph
 * once at module scope so every request within a run returns the same stable
 * dataset of projects, phases, activities, and dependencies.
 */
import { http, HttpResponse } from "msw";

import { API_ROUTES } from "../constants/api";
import { generateSchedule } from "../services/generateSchedule";

const scheduleGraph = generateSchedule();

export const handlers = [
    http.get(API_ROUTES.schedule, () => {
        return HttpResponse.json(scheduleGraph);
    }),
];
```

- [ ] 3. Write the failing test `src/__tests__/api/fetchScheduleGraph.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { fetchScheduleGraph } from "../../api/fetchScheduleGraph";

describe("fetchScheduleGraph", () => {
    test("resolves the unified graph with activities and dependencies", async () => {
        const graph = await fetchScheduleGraph();
        expect(graph.activities.length).toBeGreaterThan(0);
        expect(graph.dependencies.length).toBeGreaterThan(0);
        expect(graph.activities.some((activity) => activity.type === "group")).toBe(true);
        expect(graph).not.toHaveProperty("projects");
    });
});
```

- [ ] 4. Run it, expect PASS (handler and fetch wrapper now serve the graph through MSW configured in `setup.ts`).

```
npx vitest run src/__tests__/api/fetchScheduleGraph.test.ts
```
Expected: `1 passed`.

- [ ] 5. Write the failing test `src/__tests__/api/useScheduleQuery.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";

import { useScheduleQuery } from "../../api/useScheduleQuery";
import { useScheduleStore } from "../../state/scheduleStore";

function wrapper({ children }: { children: ReactNode }): JSX.Element {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useScheduleQuery", () => {
    test("loads the fetched graph into the schedule store", async () => {
        const { result } = renderHook(() => useScheduleQuery(), { wrapper });
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.isError).toBe(false);
        expect(useScheduleStore.getState().graph.activities.length).toBeGreaterThan(0);
        expect(useScheduleStore.getState().computed.size).toBeGreaterThan(0);
    });
});
```

- [ ] 6. Run it, expect FAIL.

```
npx vitest run src/__tests__/api/useScheduleQuery.test.tsx
```
Expected: fails to resolve `../../api/useScheduleQuery`.

- [ ] 7. Create `src/api/useScheduleQuery.ts`:

```ts
/**
 * TanStack Query hook that loads the initial schedule once and seeds the Zustand
 * store. The store owns the graph after this; the query is only the initial-load
 * transport. Exposes pending/error/refetch so the app shell can render load and
 * error states with retry.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchScheduleGraph } from "./fetchScheduleGraph";
import { useScheduleStore } from "../state/scheduleStore";

const SCHEDULE_QUERY_KEY = ["schedule"] as const;

export function useScheduleQuery(): { isError: boolean; isPending: boolean; refetch(): void } {
    const loadGraph = useScheduleStore((state) => state.loadGraph);
    const query = useQuery({ queryFn: fetchScheduleGraph, queryKey: SCHEDULE_QUERY_KEY });

    useEffect(() => {
        if (query.data !== undefined) {
            loadGraph(query.data);
        }
    }, [loadGraph, query.data]);

    return {
        isError: query.isError,
        isPending: query.isPending,
        refetch: () => void query.refetch(),
    };
}
```

- [ ] 8. Run it, expect PASS.

```
npx vitest run src/__tests__/api/useScheduleQuery.test.tsx
```
Expected: `1 passed`.

- [ ] 9. Wrap the app in a `QueryClientProvider`. Edit `src/main.tsx` to construct a `QueryClient` and wrap `AppShell`:

```tsx
    const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
    const queryClient = new QueryClient();

    createRoot(rootElement).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <AppShell />
            </QueryClientProvider>
        </StrictMode>,
    );
```

  (Replace the existing `createRoot(...).render(...)` block; keep the MSW start above it.)

- [ ] 10. Edit `src/components/AppShell/AppShell.tsx` to call `useScheduleQuery` and render load/error states (the split-pane body stays a placeholder until Task 14):

```tsx
/**
 * Top-level application shell. Drives the initial schedule load through
 * useScheduleQuery and renders pending and error states with retry. The
 * split-pane Table/Gantt body is filled in Task 14.
 */
import { useScheduleQuery } from "../../api/useScheduleQuery";

export function AppShell(): JSX.Element {
    const { isError, isPending, refetch } = useScheduleQuery();

    return (
        <main aria-label="Planera schedule editor">
            <h1>Planera Scheduler</h1>
            {isPending ? <p role="status">Loading schedule</p> : null}
            {isError ? (
                <div role="alert">
                    <p>Could not load the schedule.</p>
                    <button type="button" onClick={refetch}>
                        Retry
                    </button>
                </div>
            ) : null}
        </main>
    );
}
```

- [ ] 11. Update the smoke test `src/__tests__/smoke/appShell.test.tsx` to wrap in a `QueryClientProvider` (the shell now uses a query):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppShell } from "../../components/AppShell/AppShell";

describe("AppShell", () => {
    test("mounts and exposes the labelled application region", () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={client}>
                <AppShell />
            </QueryClientProvider>,
        );
        expect(screen.getByRole("main", { name: "Planera schedule editor" })).toBeInTheDocument();
    });
});
```

- [ ] 12. Run the smoke and api suites, expect PASS.

```
npx vitest run src/__tests__/smoke src/__tests__/api
```
Expected: all pass.

- [ ] 13. Commit:

```
git add -A && git commit -m "feat: serve the unified graph via MSW and bootstrap the store on load

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: DHTMLX adapters

**Files:**
- Create: `src/components/GanttView/toGanttTasks.ts`, `src/components/GanttView/toGanttLinks.ts`, `src/components/GanttView/resolveCriticalTaskClass.ts`
- Test: `src/__tests__/components/GanttView/toGanttTasks.test.ts`, `src/__tests__/components/GanttView/toGanttLinks.test.ts`, `src/__tests__/components/GanttView/resolveCriticalTaskClass.test.ts`

**Interfaces:**
- Consumes: `Activity`, `Dependency`, `ScheduleGraph`, `ComputedActivity` (Task 2), `Calendar` (Task 3), `computeSummaries` (Task 3), `RELATIONSHIP_TO_DHTMLX_LINK_TYPE` (Task 2).
- Produces:
  - `interface GanttTask { duration: number; id: string; open: boolean; parent: string; start_date: Date; text: string; type: string }` and `toGanttTasks(graph: ScheduleGraph, computed: Map<string, ComputedActivity>, calendar: Calendar): GanttTask[]`.
  - `interface GanttLink { id: string; lag: number; source: string; target: string; type: string }` and `toGanttLinks(dependencies: Dependency[]): GanttLink[]`.
  - `resolveCriticalTaskClass(computed: ComputedActivity | undefined): string` returning `"critical"` when `isCritical`, else `""`.

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/components/GanttView/toGanttTasks.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { toGanttTasks } from "../../../components/GanttView/toGanttTasks";
import { createCalendar } from "../../../services/createCalendar";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function computed(id: string, earlyStart: number, earlyFinish: number): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical: false,
        lateFinish: earlyFinish,
        lateStart: earlyStart,
        totalFloat: 0,
    };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        { durationDays: 5, id: "a", name: "A", parentId: "ph", type: "task", wbs: "1.1" },
        { durationDays: 0, id: "m", name: "M", parentId: "ph", type: "milestone", wbs: "1.2" },
    ],
    dependencies: [],
};

const COMPUTED = new Map<string, ComputedActivity>([
    ["a", computed("a", 0, 5)],
    ["m", computed("m", 5, 5)],
]);

describe("toGanttTasks", () => {
    test("maps a leaf task with computed start date and duration", () => {
        const tasks = toGanttTasks(GRAPH, COMPUTED, createCalendar());
        const taskRow = tasks.find((row) => row.id === "a");
        expect(taskRow?.type).toBe("task");
        expect(taskRow?.duration).toBe(5);
        expect(taskRow?.parent).toBe("ph");
        expect(taskRow?.start_date).toBeInstanceOf(Date);
    });

    test("maps a group node to a DHTMLX project row rolled up from descendants", () => {
        const tasks = toGanttTasks(GRAPH, COMPUTED, createCalendar());
        const groupRow = tasks.find((row) => row.id === "ph");
        expect(groupRow?.type).toBe("project");
        expect(groupRow?.parent).toBe("0");
    });

    test("maps a milestone to a DHTMLX milestone row", () => {
        const tasks = toGanttTasks(GRAPH, COMPUTED, createCalendar());
        expect(tasks.find((row) => row.id === "m")?.type).toBe("milestone");
    });
});
```

- [ ] 2. Run it, expect FAIL.

```
npx vitest run src/__tests__/components/GanttView/toGanttTasks.test.ts
```
Expected: fails to resolve the module.

- [ ] 3. Create `src/components/GanttView/toGanttTasks.ts`:

```ts
/**
 * Maps the unified schedule model and the computed cache to DHTMLX task rows.
 * Group activities become DHTMLX "project" rows positioned by the rolled-up
 * summary; tasks and milestones become their respective row types positioned by
 * the computed early start. Dates are derived from working-day indices through
 * the calendar, never read from stored fields.
 */
import { computeSummaries } from "../../services/cpm/computeSummaries";
import type { Calendar } from "../../types/calendar";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../types/schedule";

const ROOT_PARENT = "0";

export interface GanttTask {
    duration: number;
    id: string;
    open: boolean;
    parent: string;
    start_date: Date;
    text: string;
    type: string;
}

export function toGanttTasks(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
    calendar: Calendar,
): GanttTask[] {
    const summaries = computeSummaries(graph, computed);
    return graph.activities.map((activity) =>
        toGanttTask(activity, resolveBounds(activity, computed, summaries), calendar),
    );
}

function resolveBounds(
    activity: Activity,
    computed: Map<string, ComputedActivity>,
    summaries: Map<string, ComputedActivity>,
): { earlyFinish: number; earlyStart: number } {
    const bounds = activity.type === "group" ? summaries.get(activity.id) : computed.get(activity.id);
    return { earlyFinish: bounds?.earlyFinish ?? 0, earlyStart: bounds?.earlyStart ?? 0 };
}

function toGanttTask(
    activity: Activity,
    bounds: { earlyFinish: number; earlyStart: number },
    calendar: Calendar,
): GanttTask {
    return {
        duration: Math.max(bounds.earlyFinish - bounds.earlyStart, activity.type === "milestone" ? 0 : 1),
        id: activity.id,
        open: true,
        parent: activity.parentId ?? ROOT_PARENT,
        start_date: calendar.dateFromIndex(bounds.earlyStart),
        text: activity.name,
        type: toGanttTaskType(activity.type),
    };
}

function toGanttTaskType(type: Activity["type"]): string {
    switch (type) {
        case "group":
            return "project";
        case "milestone":
            return "milestone";
        case "task":
            return "task";
    }
}
```

- [ ] 4. Run it, expect PASS.

```
npx vitest run src/__tests__/components/GanttView/toGanttTasks.test.ts
```
Expected: `3 passed`.

- [ ] 5. Write the failing test `src/__tests__/components/GanttView/toGanttLinks.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { toGanttLinks } from "../../../components/GanttView/toGanttLinks";
import type { Dependency } from "../../../types/schedule";

const DEPENDENCIES: Dependency[] = [
    { id: "e1", lagDays: 2, predecessorId: "a", successorId: "b", type: "FS" },
    { id: "e2", lagDays: 0, predecessorId: "b", successorId: "c", type: "SS" },
];

describe("toGanttLinks", () => {
    test("maps each dependency to a DHTMLX link with the mapped type code", () => {
        const links = toGanttLinks(DEPENDENCIES);
        expect(links[0]).toEqual({ id: "e1", lag: 2, source: "a", target: "b", type: "0" });
        expect(links[1].type).toBe("1");
    });
});
```

- [ ] 6. Run it, expect FAIL.

```
npx vitest run src/__tests__/components/GanttView/toGanttLinks.test.ts
```
Expected: fails to resolve the module.

- [ ] 7. Create `src/components/GanttView/toGanttLinks.ts`:

```ts
/**
 * Maps dependency edges to DHTMLX link rows. The predecessor is the link source,
 * the successor the target, and the relationship type maps to DHTMLX's numeric
 * link-type code.
 */
import { RELATIONSHIP_TO_DHTMLX_LINK_TYPE } from "../../constants/ganttScale";
import type { Dependency } from "../../types/schedule";

export interface GanttLink {
    id: string;
    lag: number;
    source: string;
    target: string;
    type: string;
}

export function toGanttLinks(dependencies: Dependency[]): GanttLink[] {
    return dependencies.map((dependency) => ({
        id: dependency.id,
        lag: dependency.lagDays,
        source: dependency.predecessorId,
        target: dependency.successorId,
        type: RELATIONSHIP_TO_DHTMLX_LINK_TYPE[dependency.type],
    }));
}
```

- [ ] 8. Run it, expect PASS.

```
npx vitest run src/__tests__/components/GanttView/toGanttLinks.test.ts
```
Expected: `1 passed`.

- [ ] 9. Write the failing test `src/__tests__/components/GanttView/resolveCriticalTaskClass.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { resolveCriticalTaskClass } from "../../../components/GanttView/resolveCriticalTaskClass";
import type { ComputedActivity } from "../../../types/schedule";

function computed(isCritical: boolean): ComputedActivity {
    return {
        earlyFinish: 1,
        earlyStart: 0,
        id: "a",
        isCritical,
        lateFinish: 1,
        lateStart: 0,
        totalFloat: 0,
    };
}

describe("resolveCriticalTaskClass", () => {
    test("returns critical for a critical activity", () => {
        expect(resolveCriticalTaskClass(computed(true))).toBe("critical");
    });

    test("returns an empty class for a non-critical or unknown activity", () => {
        expect(resolveCriticalTaskClass(computed(false))).toBe("");
        expect(resolveCriticalTaskClass(undefined)).toBe("");
    });
});
```

- [ ] 10. Run it, expect FAIL.

```
npx vitest run src/__tests__/components/GanttView/resolveCriticalTaskClass.test.ts
```
Expected: fails to resolve the module.

- [ ] 11. Create `src/components/GanttView/resolveCriticalTaskClass.ts`:

```ts
/**
 * Resolves the CSS class DHTMLX applies to a task bar from our computed critical
 * flag. Wired into gantt.templates.task_class so the critical path is drawn from
 * our CPM engine, not DHTMLX's Pro critical-path feature.
 */
import type { ComputedActivity } from "../../types/schedule";

const CRITICAL_CLASS = "critical";

export function resolveCriticalTaskClass(computed: ComputedActivity | undefined): string {
    return computed?.isCritical === true ? CRITICAL_CLASS : "";
}
```

- [ ] 12. Run it, expect PASS.

```
npx vitest run src/__tests__/components/GanttView/resolveCriticalTaskClass.test.ts
```
Expected: `2 passed`.

- [ ] 13. Commit:

```
git add -A && git commit -m "feat: add DHTMLX task, link, and critical-class adapters

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: DHTMLX Gantt view and worker-backed two-phase recompute

**Files:**
- Create: `src/components/GanttView/useGanttInit.ts`, `src/components/GanttView/GanttView.tsx`
- Modify: `src/state/scheduleStore.ts` (restore the two-phase recompute and route phase 2 through the worker with a synchronous fallback), `src/workers/cpmWorker.ts` (carry the previous computed cache in the request, drop the worker-held cache), `src/components/AppShell/AppShell.tsx` (render the Gantt)
- Test: `src/__tests__/state/scheduleStoreTwoPhase.test.ts`, `e2e/ganttRender.spec.ts`

**Interfaces:**
- Consumes: `computeConeEarlyDates` (Task 5), `selectLeafActivities` (Task 3), `detectCycle` (Task 3), `handleWorkerMessage` (Task 6), `toGanttTasks`, `toGanttLinks`, `resolveCriticalTaskClass` (Task 10), `createCalendar` (Task 3), `useScheduleStore` (Task 7), `Operation` (Task 2), scale constants (Task 2).
- Produces:
  - A genuinely two-phase `dispatchOperation`: PHASE 1 merges the downstream cone's early dates synchronously on the main thread (the instant optimistic update the user sees), PHASE 2 posts to the real CPM worker and merges its authoritative global delta a beat later, falling back to a synchronous `handleWorkerMessage` pass when no Worker exists. The cycle gate and the return type `{ ok: true } | { cycle: string[]; ok: false }` are unchanged.
  - `reconcileGlobalPass(graph: ScheduleGraph, operation: Operation): void` store action running phase 2 (the worker when available, the synchronous fallback otherwise).
  - `CpmWorkerRequest` wire type (exported from `cpmWorker.ts`) carrying `graph`, `operation`, and the serialized `previousComputed` entries so the worker can diff. `handleWorkerMessage` keeps its pure `(message, previousComputed)` signature and its `full` | `operation` message kinds unchanged.
  - `useGanttInit(containerRef: RefObject<HTMLDivElement | null>): void` initializing DHTMLX once, parsing tasks/links, subscribing to the store for batched updates, and translating drag/resize to a `resizeActivity` operation.
  - `GanttView(): JSX.Element` rendering the stable container.

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/state/scheduleStoreTwoPhase.test.ts`. The on-disk store after Task 8 is single-phase (one `set` per `dispatchOperation`; phase 1 is not wired in), so this asserts the restored two-phase behavior: phase 1 lands as its own `set` with the cone's early dates before phase 2 corrects the global float and critical flag. Each computed snapshot is captured through a store subscription, a real behavioral assertion rather than a mock-call count.

```ts
import { beforeEach, describe, expect, test } from "vitest";

import { useScheduleStore } from "../../state/scheduleStore";
import type { Activity, ComputedActivity, Dependency, ScheduleGraph } from "../../types/schedule";

function task(id: string, durationDays: number): Activity {
    return { durationDays, id, name: id, parentId: "ph", type: "task", wbs: id };
}

function edge(id: string, predecessorId: string, successorId: string): Dependency {
    return { id, lagDays: 0, predecessorId, successorId, type: "FS" };
}

// Two paths from S to E: S->A(4)->C(5)->E (the critical chain, length 9) and
// S->B(2)->D(3)->E (float 4). Resizing B to 8 makes B->D->E critical (length 11)
// and corrects A and C, which sit OUTSIDE B's downstream cone.
const FLOAT_GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "ph", name: "Phase", parentId: null, type: "group", wbs: "1" },
        task("S", 0),
        task("A", 4),
        task("B", 2),
        task("C", 5),
        task("D", 3),
        task("E", 0),
    ],
    dependencies: [
        edge("S->A", "S", "A"),
        edge("S->B", "S", "B"),
        edge("A->C", "A", "C"),
        edge("B->D", "B", "D"),
        edge("C->E", "C", "E"),
        edge("D->E", "D", "E"),
    ],
};

describe("useScheduleStore two-phase recompute", () => {
    beforeEach(() => {
        useScheduleStore.getState().loadGraph(structuredClone(FLOAT_GRAPH));
    });

    test("phase 1 updates the cone's early dates before phase 2 corrects global float and critical", () => {
        const snapshots: Map<string, ComputedActivity>[] = [];
        const unsubscribe = useScheduleStore.subscribe((state, previous) => {
            if (state.computed !== previous.computed) {
                snapshots.push(state.computed);
            }
        });

        useScheduleStore.getState().dispatchOperation({
            activityId: "B",
            durationDays: 8,
            kind: "resizeActivity",
        });
        unsubscribe();

        // Phase 1 then phase 2 each merge once, so two distinct snapshots land.
        expect(snapshots.length).toBeGreaterThanOrEqual(2);

        // Phase 1 (first snapshot): the downstream cone of B (B, D, E) has fresh EARLY
        // dates, but global critical/float are still the pre-edit values. B is not yet
        // flagged critical and A (outside the cone) still carries its pre-edit flag.
        const afterPhaseOne = snapshots[0];
        expect(afterPhaseOne.get("B")?.earlyFinish).toBe(8);
        expect(afterPhaseOne.get("D")?.earlyStart).toBe(8);
        expect(afterPhaseOne.get("E")?.earlyStart).toBe(11);
        expect(afterPhaseOne.get("B")?.isCritical).toBe(false);
        expect(afterPhaseOne.get("A")?.isCritical).toBe(true);

        // Phase 2 (last snapshot): the authoritative global pass corrects critical and
        // float across the whole schedule, including out-of-cone A and C.
        const afterPhaseTwo = snapshots[snapshots.length - 1];
        expect(afterPhaseTwo.get("B")?.isCritical).toBe(true);
        expect(afterPhaseTwo.get("D")?.isCritical).toBe(true);
        expect(afterPhaseTwo.get("A")?.isCritical).toBe(false);
        expect(afterPhaseTwo.get("A")?.totalFloat).toBe(2);
        expect(afterPhaseTwo.get("C")?.totalFloat).toBe(2);
    });
});
```

- [ ] 2. Run it, expect FAIL.

```
npx vitest run src/__tests__/state/scheduleStoreTwoPhase.test.ts
```
Expected: fails on `expect(snapshots.length).toBeGreaterThanOrEqual(2)` (the single-phase store merges once) and on the phase-1 critical-flag separation.

- [ ] 3. Restore the two-phase recompute and route phase 2 through the worker. Replace `src/state/scheduleStore.ts` in full:

```ts
/**
 * Zustand store holding the single source of truth: the raw schedule graph
 * (stored inputs only), the computed cache (engine outputs, never persisted), and
 * the shared collapse set. dispatchOperation is two-phase. PHASE 1 recomputes the
 * downstream cone's early dates synchronously on the main thread
 * (computeConeEarlyDates) and merges them at once, so the edit is visible before
 * the worker responds. PHASE 2 runs the authoritative global pass that corrects
 * float and the critical path: it posts to the CPM web worker when one exists and
 * merges the worker's delta a beat later, falling back to a synchronous
 * handleWorkerMessage pass when no Worker is available (jsdom, SSR). addDependency
 * is gated by detectCycle against the prospective graph and rejected without
 * mutation. The net final cache equals a full recompute on either phase-2 path.
 */
import { create } from "zustand";

import { computeConeEarlyDates } from "../services/cpm/computeConeEarlyDates";
import { detectCycle } from "../services/cpm/detectCycle";
import { selectLeafActivities } from "../services/cpm/selectLeafActivities";
import { handleWorkerMessage } from "../workers/handleWorkerMessage";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";
import type { CpmWorkerRequest } from "../workers/cpmWorker";

interface ScheduleState {
    collapsed: Set<string>;
    computed: Map<string, ComputedActivity>;
    dispatchOperation(operation: Operation): { ok: true } | { cycle: string[]; ok: false };
    graph: ScheduleGraph;
    loadGraph(graph: ScheduleGraph): void;
    reconcileGlobalPass(graph: ScheduleGraph, operation: Operation): void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
    collapsed: new Set<string>(),
    computed: new Map<string, ComputedActivity>(),
    dispatchOperation(operation: Operation): { ok: true } | { cycle: string[]; ok: false } {
        if (operation.kind === "toggleCollapse") {
            set((state) => ({ collapsed: toggleMembership(state.collapsed, operation.rowId) }));
            return { ok: true };
        }

        const changedActivityIds = selectChangedActivityIds(get().graph, operation);
        const graph = applyOperationToGraph(get().graph, operation);

        if (operation.kind === "addDependency") {
            const cycle = detectCycle(graph);
            if (cycle !== null) {
                return { cycle, ok: false };
            }
        }

        // Phase 1 (synchronous, main thread): recompute only the downstream cone's
        // early dates and merge them at once so the edit is visible before the worker
        // responds. Float and the critical flag stay stale on the cone for a beat.
        const earlyDelta = computeConeEarlyDates(
            selectLeafActivities(graph),
            changedActivityIds,
            get().computed,
        );
        set({ computed: mergeComputedDelta(get().computed, earlyDelta), graph });

        // Phase 2 (asynchronous worker, or synchronous fallback): the authoritative
        // global pass that corrects float and the critical flag across the whole
        // schedule, including activities outside the cone.
        get().reconcileGlobalPass(graph, operation);
        return { ok: true };
    },
    graph: { activities: [], dependencies: [] },
    loadGraph(graph: ScheduleGraph): void {
        const { computed } = handleWorkerMessage({ graph, kind: "full" }, new Map());
        set({ collapsed: new Set<string>(), computed, graph });
    },
    reconcileGlobalPass(graph: ScheduleGraph, operation: Operation): void {
        const worker = getCpmWorker();
        if (worker === null) {
            const { delta } = handleWorkerMessage(
                { graph, kind: "operation", operation },
                get().computed,
            );
            set({ computed: mergeComputedDelta(get().computed, delta) });
            return;
        }

        worker.onmessage = (event: MessageEvent<ComputedActivity[]>): void => {
            set((state) => ({ computed: mergeComputedDelta(state.computed, event.data) }));
        };
        const request: CpmWorkerRequest = {
            graph,
            operation,
            previousComputed: [...get().computed.entries()],
        };
        worker.postMessage(request);
    },
}));

let cpmWorker: Worker | null = null;
let workerInitialized = false;

function applyOperationToGraph(graph: ScheduleGraph, operation: Operation): ScheduleGraph {
    switch (operation.kind) {
        case "addDependency":
            return { activities: graph.activities, dependencies: [...graph.dependencies, operation.edge] };
        case "removeDependency":
            return {
                activities: graph.activities,
                dependencies: graph.dependencies.filter((edge) => edge.id !== operation.edgeId),
            };
        case "resizeActivity":
            return {
                activities: graph.activities.map((activity) =>
                    activity.id === operation.activityId
                        ? { ...activity, durationDays: operation.durationDays }
                        : activity,
                ),
                dependencies: graph.dependencies,
            };
        case "toggleCollapse":
            return graph;
    }
}

function getCpmWorker(): Worker | null {
    if (!workerInitialized) {
        cpmWorker = createCpmWorker();
        workerInitialized = true;
    }
    return cpmWorker;
}

function createCpmWorker(): Worker | null {
    try {
        return new Worker(new URL("../workers/cpmWorker.ts", import.meta.url), { type: "module" });
    } catch {
        return null;
    }
}

function mergeComputedDelta(
    computed: Map<string, ComputedActivity>,
    delta: ComputedActivity[],
): Map<string, ComputedActivity> {
    const next = new Map(computed);
    for (const entry of delta) {
        next.set(entry.id, entry);
    }
    return next;
}

function selectChangedActivityIds(graph: ScheduleGraph, operation: Operation): string[] {
    switch (operation.kind) {
        case "addDependency":
            return [operation.edge.successorId];
        case "removeDependency": {
            const removed = graph.dependencies.find((edge) => edge.id === operation.edgeId);
            return removed === undefined ? [] : [removed.successorId];
        }
        case "resizeActivity":
            return [operation.activityId];
        case "toggleCollapse":
            return [];
    }
}

function toggleMembership(members: Set<string>, id: string): Set<string> {
    const next = new Set(members);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    return next;
}
```

> Note: Phase 1 merges only the cone's early-date delta, so the cache is correct-but-incomplete for a beat (float and critical stay stale on the cone). Phase 2 runs `computeDownstreamCone` over the full leaf graph against the post-phase-1 cache and returns the activities still differing (the float and critical corrections, plus any global float shift outside the cone). Under jsdom the Worker constructor throws and `getCpmWorker` returns null, so phase 2 runs synchronously and the final cache is authoritative; in the browser the worker posts the same delta back and the store merges it a beat later. The net final state equals a full recompute either way. `computeConeEarlyDates`, `selectLeafActivities`, `selectChangedActivityIds`, and `detectCycle` are all re-consumed here, un-orphaning `computeConeEarlyDates`.

- [ ] 4. Update the worker entry so the store owns the cache and passes it on each request. Replace `src/workers/cpmWorker.ts` in full:

```ts
/**
 * Web-worker entry for CPM recompute. Receives an operation request carrying the
 * graph, the operation, and the serialized previous computed cache (as Map
 * entries), reconstructs the Map, delegates to the pure handleWorkerMessage, and
 * posts back only the changed delta so the main thread batch-updates the minimum
 * set of rows and bars. Holds no cross-message state: the store owns the
 * authoritative cache and passes it on every request. The store falls back to a
 * synchronous handleWorkerMessage call when this worker fails to initialize.
 */
import { handleWorkerMessage } from "./handleWorkerMessage";
import type { Operation } from "../types/operation";
import type { ComputedActivity, ScheduleGraph } from "../types/schedule";

export interface CpmWorkerRequest {
    graph: ScheduleGraph;
    operation: Operation;
    previousComputed: [string, ComputedActivity][];
}

self.onmessage = (event: MessageEvent<CpmWorkerRequest>): void => {
    const { graph, operation, previousComputed } = event.data;
    const { delta } = handleWorkerMessage(
        { graph, kind: "operation", operation },
        new Map(previousComputed),
    );
    self.postMessage(delta);
};
```

> Note: the request serializes `previousComputed` as Map entries (a structured-clone-safe array) and the worker reconstructs the Map before calling the pure `handleWorkerMessage`, whose `(message, previousComputed)` signature stays unchanged. The store imports `CpmWorkerRequest` as a type only, so the worker's `self.onmessage` side effect is never pulled into the main bundle. An end-to-end assertion of the real worker path (phase 2 arriving asynchronously in the browser) is deferred to Task 13/15; this task verifies the worker contract and the synchronous fallback.

- [ ] 5. Run the two-phase test plus the full state suite, expect PASS (the existing store tests pass through the synchronous fallback).

```
npx vitest run src/__tests__/state
```
Expected: all state suites pass (`scheduleStoreTwoPhase`, `scheduleStore`, `scheduleStoreValidity`, `useScheduleSelection`). Worker construction is guarded and returns null under jsdom, so phase 2 takes the synchronous fallback.

- [ ] 6. Create `src/components/GanttView/useGanttInit.ts`:

```ts
/**
 * DHTMLX Gantt lifecycle hook. Initializes the imperative widget once against a
 * stable container, parses the computed schedule, configures zoom, the today
 * marker, and the critical-path template, and subscribes to the store to
 * batch-update only changed bars. Drag and resize translate to a resizeActivity
 * operation. React never re-renders into the widget's DOM.
 */
import { gantt } from "dhtmlx-gantt";
import { useEffect } from "react";
import type { RefObject } from "react";

import { resolveCriticalTaskClass } from "./resolveCriticalTaskClass";
import { toGanttLinks } from "./toGanttLinks";
import { toGanttTasks } from "./toGanttTasks";
import { DEFAULT_DAY_WIDTH_PX } from "../../constants/ganttScale";
import { createCalendar } from "../../services/createCalendar";
import { useScheduleStore } from "../../state/scheduleStore";
import type { ComputedActivity } from "../../types/schedule";

const ZOOM_LEVELS = {
    current: "day",
    levels: [
        { min_column_width: DEFAULT_DAY_WIDTH_PX, name: "day", scale_height: 27, scales: [{ format: "%d %M", step: 1, unit: "day" }] },
        { min_column_width: 80, name: "week", scale_height: 50, scales: [{ format: "Week #%W", step: 1, unit: "week" }, { format: "%D", step: 1, unit: "day" }] },
        { min_column_width: 120, name: "month", scale_height: 50, scales: [{ format: "%F, %Y", step: 1, unit: "month" }, { format: "Week #%W", step: 1, unit: "week" }] },
    ],
};

export function useGanttInit(containerRef: RefObject<HTMLDivElement | null>): void {
    useEffect(() => {
        const container = containerRef.current;
        if (container === null) {
            return;
        }

        const calendar = createCalendar();
        configureGantt(calendar);
        gantt.init(container);

        const { computed, graph } = useScheduleStore.getState();
        gantt.parse({ links: toGanttLinks(graph.dependencies), tasks: toGanttTasks(graph, computed, calendar) });

        const detachDrag = attachDragHandler();
        const unsubscribe = subscribeComputed(calendar);

        return () => {
            detachDrag();
            unsubscribe();
            gantt.destructor();
            container.innerHTML = "";
        };
    }, [containerRef]);
}

function configureGantt(calendar: ReturnType<typeof createCalendar>): void {
    gantt.plugins({ marker: true });
    gantt.config.date_format = "%Y-%m-%d %H:%i";
    gantt.templates.task_class = (_start, _end, task) =>
        resolveCriticalTaskClass(useScheduleStore.getState().computed.get(String(task.id)));
    gantt.ext.zoom.init(ZOOM_LEVELS);
    gantt.ext.zoom.setLevel("day");
    gantt.addMarker({ css: "today", start_date: new Date(), text: "Today" });
    void calendar;
}

function attachDragHandler(): () => void {
    const id = gantt.attachEvent("onAfterTaskDrag", (taskId) => {
        const task = gantt.getTask(taskId);
        useScheduleStore.getState().dispatchOperation({
            activityId: String(taskId),
            durationDays: Number(task.duration),
            kind: "resizeActivity",
        });
    });
    return () => gantt.detachEvent(id);
}

function subscribeComputed(calendar: ReturnType<typeof createCalendar>): () => void {
    return useScheduleStore.subscribe((state, previous) => {
        if (state.computed === previous.computed && state.graph === previous.graph) {
            return;
        }
        applyComputedToGantt(state.computed, calendar);
    });
}

function applyComputedToGantt(
    computed: Map<string, ComputedActivity>,
    calendar: ReturnType<typeof createCalendar>,
): void {
    gantt.batchUpdate(() => {
        for (const [id, entry] of computed) {
            if (gantt.isTaskExists(id)) {
                const task = gantt.getTask(id);
                task.start_date = calendar.dateFromIndex(entry.earlyStart);
                task.duration = Math.max(entry.earlyFinish - entry.earlyStart, 1);
                gantt.updateTask(id);
            }
        }
    });
}
```

> Note: the `task_class` template reads the store live, so a critical-flag change re-applies on the next render; `applyComputedToGantt` triggers DHTMLX rendering inside `batchUpdate`. The drag handler uses `onAfterTaskDrag`; resize is the same drag mode in DHTMLX and fires the same event, so a single handler covers both bar-move-derived duration changes and resize.

- [ ] 7. Create `src/components/GanttView/GanttView.tsx`:

```tsx
/**
 * DHTMLX Gantt view: renders a single stable container that the lifecycle hook
 * owns. Wrapped in React.memo so parent re-renders never reach into the widget's
 * DOM.
 */
import { memo, useRef } from "react";

import { useGanttInit } from "./useGanttInit";

function GanttViewComponent(): JSX.Element {
    const containerRef = useRef<HTMLDivElement | null>(null);
    useGanttInit(containerRef);

    return (
        <section aria-label="Gantt timeline" style={{ height: "100%", width: "100%" }}>
            <div ref={containerRef} data-testid="gantt-container" style={{ height: "100%", width: "100%" }} />
        </section>
    );
}

export const GanttView = memo(GanttViewComponent);
```

- [ ] 8. Render the Gantt in the shell once loaded. Edit `src/components/AppShell/AppShell.tsx` to import `GanttView` and the DHTMLX CSS, and render it when not pending/error:

```tsx
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

import { GanttView } from "../GanttView/GanttView";
import { useScheduleQuery } from "../../api/useScheduleQuery";
```

  Add below the load/error blocks, inside `<main>`:

```tsx
            {!isPending && !isError ? (
                <div style={{ height: "80vh" }}>
                    <GanttView />
                </div>
            ) : null}
```

- [ ] 9. Write the Playwright smoke spec `e2e/ganttRender.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("renders Gantt bars for the seeded 5000-activity schedule", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("gantt-container")).toBeVisible();
    await expect(page.locator(".gantt_task_line").first()).toBeVisible({ timeout: 30000 });
    const barCount = await page.locator(".gantt_task_line").count();
    expect(barCount).toBeGreaterThan(0);
});
```

- [ ] 10. Run the Playwright spec, expect PASS.

```
npx playwright test e2e/ganttRender.spec.ts
```
Expected: `1 passed` (DHTMLX smart-rendering paints the visible bar window).

- [ ] 11. Run the full unit suite to confirm no regression.

```
npx vitest run
```
Expected: all suites pass.

- [ ] 12. Commit:

```
git add -A && git commit -m "feat: render the schedule in DHTMLX Gantt with two-phase worker-backed recompute

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: AG-Grid Enterprise Tree-Data table view

**Files:**
- Create: `src/components/TableView/registerGridModules.ts`, `src/components/TableView/toTableRows.ts`, `src/components/TableView/TableView.tsx`
- Modify: `src/components/AppShell/AppShell.tsx` (render the table)
- Test: `src/__tests__/components/TableView/toTableRows.test.ts`, `e2e/tableRender.spec.ts`

**Interfaces:**
- Consumes: `Activity`, `ComputedActivity`, `ScheduleGraph` (Task 2), `computeSummaries` (Task 3), `formatScheduleDate` + `createCalendar` (Task 3), `useScheduleStore`, `useScheduleSelection` (Task 7).
- Produces:
  - `interface TableRow { critical: boolean; duration: number; earlyFinish: number; earlyStart: number; id: string; name: string; path: string[]; totalFloat: number; type: ActivityType; wbs: string }` and `toTableRows(graph: ScheduleGraph, computed: Map<string, ComputedActivity>): TableRow[]`.
  - `registerGridModules(): void` registering AG-Grid Community + Enterprise modules once.
  - `TableView(): JSX.Element`.

**Steps:**

- [ ] 1. Write the failing test `src/__tests__/components/TableView/toTableRows.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { toTableRows } from "../../../components/TableView/toTableRows";
import type { Activity, ComputedActivity, ScheduleGraph } from "../../../types/schedule";

function computed(id: string, earlyStart: number, earlyFinish: number, isCritical: boolean): ComputedActivity {
    return {
        earlyFinish,
        earlyStart,
        id,
        isCritical,
        lateFinish: earlyFinish,
        lateStart: earlyStart,
        totalFloat: 0,
    };
}

const GRAPH: ScheduleGraph = {
    activities: [
        { durationDays: 0, id: "p", name: "Project", parentId: null, type: "group", wbs: "1" },
        { durationDays: 0, id: "ph", name: "Phase", parentId: "p", type: "group", wbs: "1.1" },
        { durationDays: 5, id: "a", name: "A", parentId: "ph", type: "task", wbs: "1.1.1" },
    ],
    dependencies: [],
};

const COMPUTED = new Map<string, ComputedActivity>([["a", computed("a", 0, 5, true)]]);

describe("toTableRows", () => {
    test("builds the ancestry path from root to node for tree data", () => {
        const rows = toTableRows(GRAPH, COMPUTED);
        expect(rows.find((row) => row.id === "a")?.path).toEqual(["p", "ph", "a"]);
        expect(rows.find((row) => row.id === "ph")?.path).toEqual(["p", "ph"]);
    });

    test("exposes computed dates, float, and critical flag on leaf rows", () => {
        const leaf = toTableRows(GRAPH, COMPUTED).find((row) => row.id === "a");
        expect(leaf?.earlyStart).toBe(0);
        expect(leaf?.earlyFinish).toBe(5);
        expect(leaf?.critical).toBe(true);
        expect(leaf?.duration).toBe(5);
    });

    test("rolls group rows up from descendant summaries", () => {
        const group = toTableRows(GRAPH, COMPUTED).find((row) => row.id === "ph");
        expect(group?.earlyStart).toBe(0);
        expect(group?.earlyFinish).toBe(5);
        expect(group?.critical).toBe(true);
    });
});
```

- [ ] 2. Run it, expect FAIL.

```
npx vitest run src/__tests__/components/TableView/toTableRows.test.ts
```
Expected: fails to resolve the module.

- [ ] 3. Create `src/components/TableView/toTableRows.ts`:

```ts
/**
 * Maps the unified schedule model and the computed cache to AG-Grid tree-data
 * rows. The path is the ancestry chain of ids from root to node, which
 * getDataPath returns so AG-Grid builds the project to phase to activity
 * hierarchy. Group rows are rolled up from descendant summaries; leaf rows carry
 * the engine's computed dates, float, and critical flag.
 */
import { computeSummaries } from "../../services/cpm/computeSummaries";
import type { Activity, ActivityType, ComputedActivity, ScheduleGraph } from "../../types/schedule";

export interface TableRow {
    critical: boolean;
    duration: number;
    earlyFinish: number;
    earlyStart: number;
    id: string;
    name: string;
    path: string[];
    totalFloat: number;
    type: ActivityType;
    wbs: string;
}

export function toTableRows(
    graph: ScheduleGraph,
    computed: Map<string, ComputedActivity>,
): TableRow[] {
    const activitiesById = new Map(graph.activities.map((activity) => [activity.id, activity]));
    const summaries = computeSummaries(graph, computed);
    return graph.activities.map((activity) =>
        toTableRow(activity, activitiesById, resolveComputed(activity, computed, summaries)),
    );
}

function resolveComputed(
    activity: Activity,
    computed: Map<string, ComputedActivity>,
    summaries: Map<string, ComputedActivity>,
): ComputedActivity | undefined {
    return activity.type === "group" ? summaries.get(activity.id) : computed.get(activity.id);
}

function toTableRow(
    activity: Activity,
    activitiesById: Map<string, Activity>,
    computed: ComputedActivity | undefined,
): TableRow {
    return {
        critical: computed?.isCritical ?? false,
        duration: activity.durationDays,
        earlyFinish: computed?.earlyFinish ?? 0,
        earlyStart: computed?.earlyStart ?? 0,
        id: activity.id,
        name: activity.name,
        path: buildAncestryPath(activity, activitiesById),
        totalFloat: computed?.totalFloat ?? 0,
        type: activity.type,
        wbs: activity.wbs,
    };
}

function buildAncestryPath(activity: Activity, activitiesById: Map<string, Activity>): string[] {
    const path: string[] = [activity.id];
    let parentId = activity.parentId;
    while (parentId !== null) {
        path.unshift(parentId);
        parentId = activitiesById.get(parentId)?.parentId ?? null;
    }
    return path;
}
```

- [ ] 4. Run it, expect PASS.

```
npx vitest run src/__tests__/components/TableView/toTableRows.test.ts
```
Expected: `3 passed`.

- [ ] 5. Create `src/components/TableView/registerGridModules.ts`:

```ts
/**
 * Registers the AG-Grid modules the table needs exactly once: the Community
 * client-side row model plus the Enterprise Tree Data module. The Enterprise
 * evaluation watermark is accepted for this hiring artifact.
 */
import { ClientSideRowModelModule, ModuleRegistry } from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

let registered = false;

export function registerGridModules(): void {
    if (registered) {
        return;
    }
    ModuleRegistry.registerModules([ClientSideRowModelModule, TreeDataModule]);
    registered = true;
}
```

- [ ] 6. Create `src/components/TableView/TableView.tsx`:

```tsx
/**
 * AG-Grid Enterprise Tree-Data table view. Renders the schedule hierarchy via
 * getDataPath over the ancestry path, with computed read-only columns and an
 * editable duration that emits a resizeActivity operation. Row selection and
 * group expand/collapse write the shared stores so both views stay aligned.
 */
import type { CellValueChangedEvent, ColDef, GetDataPath, RowClickedEvent, ValueSetterParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";

import { registerGridModules } from "./registerGridModules";
import { toTableRows } from "./toTableRows";
import type { TableRow } from "./toTableRows";
import { createCalendar } from "../../services/createCalendar";
import { formatScheduleDate } from "../../services/formatScheduleDate";
import { useScheduleSelection } from "../../state/useScheduleSelection";
import { useScheduleStore } from "../../state/scheduleStore";

registerGridModules();

const CALENDAR = createCalendar();

export function TableView(): JSX.Element {
    const computed = useScheduleStore((state) => state.computed);
    const dispatchOperation = useScheduleStore((state) => state.dispatchOperation);
    const graph = useScheduleStore((state) => state.graph);
    const selectActivity = useScheduleSelection((state) => state.selectActivity);

    const rowData = useMemo(() => toTableRows(graph, computed), [computed, graph]);
    const getDataPath = useCallback<GetDataPath>((row) => (row as TableRow).path, []);
    const getRowId = useCallback((params: { data: TableRow }) => params.data.id, []);

    const onCellValueChanged = useCallback(
        (event: CellValueChangedEvent<TableRow>) => {
            if (event.colDef.field === "duration") {
                dispatchOperation({
                    activityId: event.data.id,
                    durationDays: Number(event.newValue),
                    kind: "resizeActivity",
                });
            }
        },
        [dispatchOperation],
    );

    const onRowClicked = useCallback(
        (event: RowClickedEvent<TableRow>) => selectActivity(event.data?.id ?? null),
        [selectActivity],
    );

    return (
        <section aria-label="Schedule table" style={{ height: "100%", width: "100%" }}>
            <AgGridReact<TableRow>
                autoGroupColumnDef={AUTO_GROUP_COLUMN_DEF}
                columnDefs={COLUMN_DEFS}
                getDataPath={getDataPath}
                getRowId={getRowId}
                groupDefaultExpanded={-1}
                onCellValueChanged={onCellValueChanged}
                onRowClicked={onRowClicked}
                rowData={rowData}
                treeData
            />
        </section>
    );
}

const AUTO_GROUP_COLUMN_DEF: ColDef<TableRow> = {
    field: "name",
    headerName: "Activity",
    minWidth: 280,
};

const COLUMN_DEFS: ColDef<TableRow>[] = [
    { field: "wbs", headerName: "WBS", width: 120 },
    {
        editable: (params) => params.data?.type !== "group",
        field: "duration",
        headerName: "Duration (d)",
        valueSetter: (params: ValueSetterParams<TableRow>) => {
            const next = Number(params.newValue);
            return Number.isFinite(next) && next >= 0;
        },
        width: 130,
    },
    {
        field: "earlyStart",
        headerName: "Start",
        valueFormatter: (params) => formatScheduleDate(Number(params.value), CALENDAR),
        width: 130,
    },
    {
        field: "earlyFinish",
        headerName: "Finish",
        valueFormatter: (params) => formatScheduleDate(Number(params.value), CALENDAR),
        width: 130,
    },
    { field: "totalFloat", headerName: "Float", width: 100 },
    {
        cellStyle: (params) => (params.data?.critical ? { color: "var(--critical-text, #b42318)" } : null),
        field: "critical",
        headerName: "Critical",
        width: 110,
    },
];
```

> Note: `valueSetter` returning a boolean validates the edit and lets AG-Grid apply the new value to `data.duration`; `onCellValueChanged` then dispatches the operation. Selecting a row writes the shared selection; Task 13 reads that selection in the Gantt.

- [ ] 7. Render the table beside the Gantt. Edit `src/components/AppShell/AppShell.tsx` to import `TableView` and place it left of `GanttView` in a temporary two-column flex (the polished split-pane is Task 14):

```tsx
import { TableView } from "../TableView/TableView";
```

  Replace the single-Gantt block with a two-column row:

```tsx
            {!isPending && !isError ? (
                <div style={{ display: "flex", height: "80vh" }}>
                    <div style={{ flex: 1 }}>
                        <TableView />
                    </div>
                    <div style={{ flex: 1 }}>
                        <GanttView />
                    </div>
                </div>
            ) : null}
```

- [ ] 8. Write the Playwright smoke spec `e2e/tableRender.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("renders the tree-data grid with grouped rows", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("treegrid")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Site Preparation").first()).toBeVisible();
    await expect(page.locator(".ag-row").first()).toBeVisible();
});
```

- [ ] 9. Run the table spec, expect PASS.

```
npx playwright test e2e/tableRender.spec.ts
```
Expected: `1 passed`.

- [ ] 10. Run the full unit suite.

```
npx vitest run
```
Expected: all suites pass.

- [ ] 11. Commit:

```
git add -A && git commit -m "feat: add AG-Grid tree-data table view with editable duration

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Two-way editing with a feedback-loop guard

**Files:**
- Modify: `src/state/scheduleStore.ts` (add an `origin` marker for store-originated updates), `src/components/GanttView/useGanttInit.ts` (skip echoing store-originated updates and read shared selection/collapse), `src/components/TableView/TableView.tsx` (bind collapse to shared state)
- Test: `e2e/twoWayEditing.spec.ts`

**Interfaces:**
- Consumes: the existing stores and views.
- Produces: a `lastOperationOrigin` field on the store set to `"gantt"` | `"table"` | `null`; views check it so an update originating in one view does not re-emit as a spurious operation in the other.

**Steps:**

- [ ] 1. Add the origin marker to the store. Edit `src/state/scheduleStore.ts`:
  - Add `lastOperationOrigin: "gantt" | "table" | null` to the `ScheduleState` interface and initialize it to `null`.
  - Widen `dispatchOperation` to accept an origin: `dispatchOperation(operation: Operation, origin?: "gantt" | "table"): { ok: true } | { cycle: string[]; ok: false }`.
  - In `dispatchOperation`, set `lastOperationOrigin: origin ?? null` in the same `set` call that updates `computed`/`graph` (and in the collapse branch).

- [ ] 2. Guard the Gantt drag handler so it does not re-dispatch when the update came from the table, and apply selection. Edit `src/components/GanttView/useGanttInit.ts`:
  - In `attachDragHandler`, pass the origin: `dispatchOperation({ ... }, "gantt")`.
  - In `subscribeComputed`, when `state.lastOperationOrigin === "gantt"` skip nothing (the Gantt already shows the drag); when it is `"table"` apply the batched update. Replace the early-return condition with a check that ignores echo from the Gantt's own drag:

```ts
    return useScheduleStore.subscribe((state, previous) => {
        if (state.computed === previous.computed) {
            return;
        }
        if (state.lastOperationOrigin === "gantt") {
            return;
        }
        applyComputedToGantt(state.computed, calendar);
    });
```

  - Add a selection subscription that highlights the dragged/selected bar by reading `useScheduleSelection`, and write selection on Gantt row click via `gantt.attachEvent("onTaskSelected", (id) => useScheduleSelection.getState().selectActivity(String(id)))`; detach it in the cleanup. Import `useScheduleSelection`.

- [ ] 3. Bind table duration edits to carry the table origin. Edit `src/components/TableView/TableView.tsx` so `onCellValueChanged` calls `dispatchOperation({ ... }, "table")`.

- [ ] 4. Write the Playwright E2E `e2e/twoWayEditing.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("two-way editing", () => {
    test("editing a grid duration resizes the matching Gantt bar", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("treegrid")).toBeVisible({ timeout: 30000 });

        const firstDurationCell = page.locator(".ag-row[row-index='0'] [col-id='duration']").first();
        await firstDurationCell.dblclick();
        await page.keyboard.type("40");
        await page.keyboard.press("Enter");

        await expect(page.locator(".gantt_task_line").first()).toBeVisible();
        // The downstream successor's start shifts; the schedule end date column updates.
        await expect(firstDurationCell).toContainText("40");
    });

    test("a cycle-creating edit is rejected and the graph is unchanged", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("treegrid")).toBeVisible({ timeout: 30000 });
        // Cycle creation is driven through the store API exposed for the demo harness.
        const rejected = await page.evaluate(() => {
            const store = (window as unknown as { __scheduleStore?: { getState(): { graph: { dependencies: { id: string; predecessorId: string; successorId: string }[] }; dispatchOperation(op: unknown, origin?: string): { ok: boolean } } } }).__scheduleStore;
            if (store === undefined) {
                return null;
            }
            const { dependencies } = store.getState().graph;
            const sample = dependencies[0];
            const result = store.getState().dispatchOperation(
                { edge: { id: "cycle-test", lagDays: 0, predecessorId: sample.successorId, successorId: sample.predecessorId, type: "FS" }, kind: "addDependency" },
                "table",
            );
            return result.ok;
        });
        expect(rejected === false || rejected === null).toBe(true);
    });
});
```

- [ ] 5. Expose the store on `window` in development so the cycle-rejection E2E can drive it. Edit `src/main.tsx` to attach the store in dev after import:

```tsx
    if (import.meta.env.DEV) {
        const { useScheduleStore } = await import("./state/scheduleStore");
        (window as unknown as { __scheduleStore: typeof useScheduleStore }).__scheduleStore = useScheduleStore;
    }
```

- [ ] 6. Run the E2E, expect PASS.

```
npx playwright test e2e/twoWayEditing.spec.ts
```
Expected: `2 passed`.

- [ ] 7. Run the full unit suite to confirm the store widening did not break existing tests.

```
npx vitest run
```
Expected: all suites pass (the optional `origin` parameter keeps prior call sites valid).

- [ ] 8. Commit:

```
git add -A && git commit -m "feat: synchronize both views with an origin guard and reject cycles live

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: App shell, split-pane, toolbar, and PandaCSS visual system

> Execute this task WITH the `frontend-design` skill to set the visual system: type scale, color, spacing, density, and the DHTMLX and AG-Grid theme overrides, so the artifact reads as production-grade rather than merely functional.

**Files:**
- Create: `src/components/AppShell/appShell.recipe.ts`, `src/components/AppShell/Toolbar.tsx`
- Modify: `panda.config.ts` (tokens + recipes), `src/components/AppShell/AppShell.tsx` (split-pane + toolbar), `src/index.css` (DHTMLX/AG-Grid theme overrides under a Panda layer)
- Test: `e2e/appShellLayout.spec.ts`

**Interfaces:**
- Consumes: `GanttView`, `TableView`, `useScheduleQuery`.
- Produces: `Toolbar(): JSX.Element` (zoom + critical-only affordances wired to the Gantt/store), `appShellRecipe` Panda recipe for the split layout, and a draggable splitter between the panes.

**Steps:**

- [ ] 1. Define Panda tokens and the shell recipe. Edit `panda.config.ts` `theme.extend` to add `tokens` (colors for surface, border, critical, text; spacing; a type scale) and a `recipes.appShell`/`recipes.splitPane` entry. Use the `frontend-design` skill to choose values; encode them as semantic tokens (light values now, `_dark` variants reserved). Run `npx panda codegen` after editing so `styled-system` regenerates.

- [ ] 2. Create `src/components/AppShell/appShell.recipe.ts` exporting a Panda recipe for the shell grid (toolbar row + split body) using `cva` from `styled-system/css`. File header comment required.

- [ ] 3. Create `src/components/AppShell/Toolbar.tsx`: a semantic `<div role="toolbar" aria-label="Schedule controls">` with day/week/month zoom buttons calling `gantt.ext.zoom.setLevel(...)` and a "Critical only" toggle. Use native `<button>` elements (accessibility bar). File header comment required.

- [ ] 4. Rewrite `src/components/AppShell/AppShell.tsx` to use the recipe classes, render `Toolbar` above a split-pane with `TableView` left and `GanttView` right, separated by a keyboard-operable draggable splitter (`role="separator"`, `aria-orientation="vertical"`, `tabIndex={0}`, arrow-key resize). Keep the pending/error states. File header comment required.

- [ ] 5. Add DHTMLX and AG-Grid theme overrides. Edit `src/index.css` to add a layer after the Panda layers that styles `.gantt_task_line.critical` (critical color token) and applies the AG-Grid Theming API or `ag-theme-quartz` variables to match the token palette. Reference tokens via the CSS custom properties Panda emits.

- [ ] 6. Write the visual-smoke E2E `e2e/appShellLayout.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("renders the toolbar and both split panes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("toolbar", { name: "Schedule controls" })).toBeVisible();
    await expect(page.getByRole("treegrid")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("gantt-container")).toBeVisible();
    await expect(page.getByRole("separator")).toBeVisible();
});
```

- [ ] 7. Run the layout E2E, expect PASS.

```
npx playwright test e2e/appShellLayout.spec.ts
```
Expected: `1 passed`.

- [ ] 8. Run an axe accessibility check as part of this spec by extending it with `@axe-core/playwright` and asserting no critical violations on the shell. Add to the spec:

```ts
import AxeBuilder from "@axe-core/playwright";

test("the shell has no critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("toolbar", { name: "Schedule controls" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === "critical");
    expect(critical).toEqual([]);
});
```

- [ ] 9. Run the extended spec, expect PASS.

```
npx playwright test e2e/appShellLayout.spec.ts
```
Expected: `2 passed`.

- [ ] 10. Commit:

```
git add -A && git commit -m "feat: build the split-pane shell and PandaCSS visual system

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 15: Full E2E suite consolidation, 5000-activity perf assertion, README

**Files:**
- Create: `e2e/performance.spec.ts`, `README.md`
- Test: the full `e2e/` suite plus the new perf spec.

**Interfaces:**
- Consumes: the running app at 5,000 activities (the generator default).
- Produces: a perf E2E asserting drag responsiveness and downstream-only recompute, and a README documenting the stack and the AG-Grid Enterprise evaluation watermark.

**Steps:**

- [ ] 1. Write `e2e/performance.spec.ts` asserting initial render and a responsive drag at the default 5,000 activities, and that a local edit recomputes without a full-suite stall:

```ts
import { expect, test } from "@playwright/test";

const MAX_INITIAL_RENDER_MS = 8000;
const MAX_EDIT_RESPONSE_MS = 1500;

test("renders 5000 activities and stays responsive on a local edit", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await expect(page.locator(".gantt_task_line").first()).toBeVisible({ timeout: MAX_INITIAL_RENDER_MS });
    expect(Date.now() - start).toBeLessThan(MAX_INITIAL_RENDER_MS);

    await expect(page.getByRole("treegrid")).toBeVisible();
    const durationCell = page.locator(".ag-row[row-index='0'] [col-id='duration']").first();

    const editStart = Date.now();
    await durationCell.dblclick();
    await page.keyboard.type("60");
    await page.keyboard.press("Enter");
    await expect(durationCell).toContainText("60");
    expect(Date.now() - editStart).toBeLessThan(MAX_EDIT_RESPONSE_MS);
});

test("a local edit does not block the main thread (worker-driven recompute)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".gantt_task_line").first()).toBeVisible({ timeout: MAX_INITIAL_RENDER_MS });
    const responsive = await page.evaluate(async () => {
        const before = performance.now();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return performance.now() - before;
    });
    expect(responsive).toBeLessThan(200);
});
```

- [ ] 2. Run the perf spec, expect PASS.

```
npx playwright test e2e/performance.spec.ts
```
Expected: `2 passed`. If the initial-render budget is exceeded, treat it as a real signal per Risk 17 (do not relax the threshold without diagnosing); investigate DHTMLX smart-rendering config before adjusting.

- [ ] 3. Run the entire E2E suite to confirm the surfaces compose.

```
npx playwright test
```
Expected: all specs pass (`ganttRender`, `tableRender`, `twoWayEditing`, `appShellLayout`, `performance`).

- [ ] 4. Run the full unit suite with coverage to confirm the 60% floor.

```
npx vitest run --coverage
```
Expected: all suites pass and coverage meets the 60% thresholds.

- [ ] 5. Create `README.md` documenting: the purpose (hiring artifact), the stack (React, TypeScript, DHTMLX Gantt GPL, AG-Grid Enterprise, PandaCSS, TanStack Query, Zustand, web worker, Vitest, Playwright), the architecture spine (one store, derived compute, two uncontrolled views, worker recompute), the scripts (`dev`, `build`, `test`, `e2e`, `smoke`), and an explicit note that the AG-Grid Enterprise evaluation watermark is visible by design and why (native Tree Data matching the employer stack). Keep it concise and accurate; no marketing language.

- [ ] 6. Run the typecheck and lint as a final gate.

```
npm run typecheck && npm run lint
```
Expected: both exit 0.

- [ ] 7. Commit:

```
git add -A && git commit -m "test: consolidate E2E suite, add 5000-activity perf gate, and document the stack

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Spec coverage map

| Spec section | Task(s) |
|---|---|
| 3 Stack | 1 |
| 4 Architecture spine (store, derived compute, uncontrolled views) | 7, 11, 12, 13 |
| 5 Data model (Activity, Dependency edge list, computed vs stored) | 2, 3 |
| 5 Operations union | 2, 7 |
| 6 CPM engine + worker boundary (phase 1 cone early dates, phase 2 global float) | 3, 5, 6, 7, 11 |
| 7 State (scheduleStore, useScheduleSelection) | 7, 13 |
| 8 View layer (DHTMLX + AG-Grid boundaries) | 10, 11, 12 |
| 9 Editing flow (optimistic, operation-based) | 11, 12, 13 |
| 10 Validity + error handling (cycle reject, worker fallback, load error) | 8, 9, 11 |
| 11 Performance targets | 11, 15 |
| 12 Accessibility | 12, 14 |
| 13 Module/file structure | File Structure section, all tasks |
| 14 Testing strategy | every task (TDD), 3, 5, 13, 15 |
| 15 Delivery phases | Task ordering (1 to 15) |
| 17 Risks (DHTMLX at scale, watermark, feedback loop) | 11, 13, 15 |
