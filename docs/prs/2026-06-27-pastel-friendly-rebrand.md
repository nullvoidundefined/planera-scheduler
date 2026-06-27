# Pastel phase colors, gold critical path, and friendly rebrand

**Date:** 2026-06-27
**Branch:** `feat/pastel-friendly-rebrand`
**Spec:** `docs/superpowers/specs/2026-06-27-pastel-friendly-rebrand-design.md`
**Time since implementation:** written immediately after the work landed (first feature
commit ~17:43, this document ~18:25 the same day, roughly 40 minutes of implementation).

## Summary

Reskins the two-view CPM editor from the cool "drafting table" palette to a friendly,
rounded, pastel system, with no change to scheduling logic, CPM math, or data shape. Three
threads: each schedule phase gets its own pastel hue carried into both Gantt bars and Table
rows; the red critical path becomes a gold signature (a star beside each critical bar, a gold
dependency thread, a gold table tick and "CP" tag); and the app chrome moves to a soft indigo
primary with warmer surfaces, generous rounding, and soft shadows.

## What changed

Presentation layer only. All color, radius, and shadow values are Panda tokens in
`panda.config.ts` (the single source of truth); `index.css`, the recipes, and the components
reference tokens by name, with zero raw hex outside the config (guard-enforced).

- **Tokens (`panda.config.ts`):** 8 pastel hues x 3 tones (`surface`/`bar`/`border`) = 24
  phase tokens; a `gold` critical token; indigo primary tokens (`indigo`, `indigoStrong`,
  `indigoStrongHover`, `indigoTint`); `radii` and `shadows` scales; a warmer canvas and
  lighter gridlines. The retired red `critical` and the old `steel*` tokens are removed.
- **Phase color source of truth:** `getPhaseColorIndex` (new service) maps each phase to a
  0-based palette index that cycles every 8, derived from the full activity list so a phase
  keeps its color whether collapsed or not. `PHASE_PALETTE_SIZE` is its one constant.
- **Gantt:** `resolveGroupColorClass` (new helper) resolves a bar to its phase tone class;
  `useGanttInit` composes it into `task_class` and adds a `leftside_text` gold star for
  critical leaves; the grid "CP" tag becomes "star CP".
- **Table:** `resolveTableRowClass` (new helper, extracted from the inline `getRowClass` so
  it is unit-testable and mirrors the Gantt side) tints phase group rows and composes the
  critical class; the Critical column renders a gold "star CP"; the AG-Grid theme moves to
  indigo accent/selection with a rounded wrapper.
- **`index.css`:** phase bar and summary fills, rounded bars, phase row tints with a left
  stripe, and the gold critical signature (bars keep their phase color; the star and gold
  thread carry criticality, so the path never relies on hue alone).
- **Chrome:** indigo pill controls, view panels lifted with rounding and a soft shadow on a
  warm-canvas gutter, gold legend star.
- **Guards:** a no-raw-hex test over `index.css`/recipes/components and a token-contract test
  over `panda.config.ts`.

## Architectural decisions

- **One phase-color map, two views (chosen) vs. per-view color logic (rejected).** Both views
  resolve a phase id to a hue through the same `getPhaseColorIndex` map. Rejected duplicating
  the index logic per view because the two would drift; the shared map guarantees the Gantt
  bar and the Table row for the same phase always match.
- **Map-based class resolution (chosen) vs. type-string checks (rejected).** The color map
  already contains only phase ids (projects and leaves excluded), so `resolveGroupColorClass`
  resolves own-id then parent-id without testing the DHTMLX `"project"` type string, removing
  a magic string and a cross-file literal.
- **Extracted `resolveTableRowClass` (chosen) vs. inline `getRowClass` (spec's wording).** The
  spec located the logic inline in `TableView`; extracting it to a sibling file makes it a
  pure, unit-tested function symmetric with the Gantt-side helper. Same behavior, testable.
- **Critical bars keep their phase color (chosen) vs. recoloring them (the old red).** The
  gold star plus the gold thread and table tick carry the non-color cue (WCAG), so the bar can
  stay its phase hue. This keeps phase grouping legible even along the critical path.
- **Indigo `primaryStrong` for the interactive surface (chosen) vs. the `#6366E0` accent on
  buttons (rejected).** White text on `#6366E0` is 4.66:1; the deeper `indigoStrong #4F46C7`
  is 6.92:1, comfortably AA, while the brighter accent serves focus rings and selection.
- **Palette generated and contrast-checked by script (chosen) vs. hand-picked hexes
  (rejected).** Every pastel bar tone clears >= 8.7:1 under dark ink, gold is 4.51:1 on white,
  and the primary surface is 6.92:1 with white text, all verified before committing.

## Testing

- Unit (Vitest): **155 passing**, including three new TDD suites (`getPhaseColorIndex`,
  `resolveGroupColorClass`, `resolveTableRowClass`) and two guard suites (no-raw-hex,
  token-contract).
- Typecheck, lint, and production build: clean.
- E2E + axe (Playwright): **22 passing**, including the accessibility sweeps on the Summary,
  Architecture, and Demo routes, which confirm the rebrand tokens (now inherited by those
  routes) introduce no serious or critical a11y violations.

## Reflection

What I understand now that I did not at the start: the branch had been cut from a `main` that
predated the portfolio-site restructure (the three-route shell and `/demo` move). My first
instinct was to open the PR straight from the worktree; the diff against `origin/main` showed
~3,200 deletions, which would have reverted the portfolio work. Rebasing onto `origin/main`
with `--onto` (dropping a redundant `.worktrees` ignore commit it already had) was the fix; it
applied cleanly because the portfolio work wrapped routing around the editor without touching
any file this change edits. A pleasant side effect: `origin/main` already carried the
`.cjs` CommonJS-globals lint fix, so a pre-existing lint error I had flagged resolved itself in
the rebase. The lesson reinforced: verify the branch base against `origin/main` before trusting
a local diff, and grep the current remote tree (not the stale base) before removing shared
tokens.
