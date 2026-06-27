# Pastel Group Colors, Gold Critical Path, and Friendly Rebrand - Design

**Date:** 2026-06-27
**Repo:** planera-scheduler (Panda CSS + DHTMLX Gantt + AG-Grid)
**Branch:** feat/pastel-friendly-rebrand (worktree `.worktrees/pastel-rebrand`, off main)
**Scope:** Presentation layer. No changes to CPM/scheduling logic, schedule generation, or data shape.

## Goal

Make the demo modern, rounded, pastel, friendly, and approachable (not 80s/90s enterprise).
Three threads:
1. Each schedule phase (group) gets its own pastel color, carried into Gantt bars and Table rows.
2. Replace the red critical-path styling with a gold star marker plus a gold, thicker dependency thread.
3. A friendly rebrand of the app chrome: soft indigo/violet primary, warmer surfaces, soft shadows, generous rounding, lighter gridlines.

## Hard constraints (every task)

- **Everything tokenized.** All new colors, radii, shadows, and spacing are defined once as Panda tokens in `panda.config.ts` (the single source of truth, per its own file charter). `src/index.css`, recipes, and components reference tokens only (`var(--colors-...)`, `token(...)`, recipe params) - zero raw hex literals outside `panda.config.ts`. Enforced by a guard test (section 8).
- No em dash (U+2014) anywhere.
- WCAG 2.1 AA, 100% Lighthouse accessibility. Preserve `prefers-reduced-motion` handling.
- Panda emits every token as a CSS custom property (`var(--colors-<kebab-name>)`) available inside the DHTMLX/AG-Grid overrides in `index.css`.

## 1. Pastel phase palette (8 hues, tokenized)

Add to `panda.config.ts` `tokens.colors`: 8 hues x 3 tones = 24 tokens, named
`phase1Surface` / `phase1Bar` / `phase1Border` through `phase8*`.

| Tone | Lightness | Used for |
| --- | --- | --- |
| `surface` | ~96% | Table phase-row tint; Gantt phase-rollup bar fill |
| `bar` | ~80% | Gantt leaf activity bar fill |
| `border` | ~55% | bar outline, table row left stripe |

Final hex tuned in implementation to read as clean, friendly pastels consistent with the
reference, all AA-safe under dark ink text. Tones auto-emit as `var(--colors-phase1-surface)` etc.

## 2. Phase color index service

New pure service `src/services/getPhaseColorIndex.ts` (one exported function):

```
getPhaseColorIndex(activities: Activity[]): Map<string, number>
```

Enumerates phase nodes (`type === "group"` with a non-null `parentId`) in their natural
schedule order and assigns each a 0-based index `position % 8` (sequential rainbow; cycles
after 8). Returns `phaseId -> colorIndex`. Collapse-independent (derived from the full
activity list). A constant `PHASE_PALETTE_SIZE = 8` lives in `src/constants/`.

Both views resolve a phase id to its color index through this one map:
- Gantt: a leaf task's phase id is its `parentId`; a phase rollup's phase id is its own `id`.
- Table: every row exposes its phase id at `row.path[1]`.

## 3. Gantt (DHTMLX)

- **Leaf activity bars:** the existing `gantt.templates.task_class` (`useGanttInit.ts`) is
  extended to also return a `phase-N` class (N = colorIndex). `index.css` paints
  `.gantt_task_line.phase-N` with `var(--colors-phaseN-bar)` fill + `var(--colors-phaseN-border)`.
- **Phase rollup bars:** return `phase-summary-N`; painted with the paler `surface` tone.
  Top-level project rollups (parentId null) stay neutral.
- **Rounded corners:** `.gantt_task_line { border-radius: var(--radii-...) }` (tokenized).
- The class-resolution lives in a new helper `src/components/GanttView/resolveGroupColorClass.ts`
  consuming the phase color map; `task_class` composes it with `resolveCriticalTaskClass`.

## 4. Table (AG-Grid)

- `resolveRowClass` (the `getRowClass` hook in `TableView.tsx`) is extended to return a
  `phase-N` class from `row.path[1]`, composed with the existing critical class.
- `index.css` tints `.ag-row.phase-N` group rows with `var(--colors-phaseN-surface)` plus a
  left stripe (`inset box-shadow`) in `var(--colors-phaseN-border)`. Leaf activity rows stay
  white. Phase-row tint applies to `type === "group"` rows only; leaf rows get no fill (a
  `leaf` discriminator is added to the row class logic, since `path[1]` exists on leaves too).

## 5. Gold critical path (replaces red)

- Add a tokenized `gold` color (deep bronze-gold, distinct from the existing orange `hiviz`
  today-marker) to `panda.config.ts`. Tune for >= 3:1 on white and on every pastel.
- **Gantt bars** keep their phase color; a gold star renders beside critical leaf bars via a
  new `gantt.templates.leftside_text` returning `<span class="cp-star">★</span>` for critical
  tasks; `.cp-star { color: var(--colors-gold) }`.
- **Gantt CP grid tag** (`ganttGridColumns.ts` `CRITICAL_TAG_HTML`): "CP" becomes "★ CP";
  `.gantt-critical-tag` recolored to gold.
- **Critical links** (`.gantt_task_link.critical-link` in `index.css`): repaint gold and
  thicken to 3px (the gold thread). `resolveCriticalLinkClass` unchanged.
- **Table Critical column** (`TableView.tsx`): `valueFormatter` "▲ CP" becomes "★ CP";
  `cellStyle` color goes to `var(--colors-gold)`. The `.ag-row-critical` left tick
  (`index.css`) goes gold.
- **Legend** (`GanttControls.tsx`): swatch token becomes `gold`, glyph becomes ★.
- Repoint every remaining `var(--colors-critical)` visual usage to gold and remove the now
  unused red `critical` token (grep to confirm zero references before removal).

### Accessibility of the star

Screen-reader context for critical is already conveyed by the Critical column text ("★ CP")
and the legend; the star is an additional visual cue. The gold star sits on white (table) and
on pastel bars (Gantt); give `.cp-star` a thin dark text-shadow outline so it holds >= 3:1 on
any background.

## 6. Friendly rebrand (chrome + palette, tokenized)

All values are Panda tokens; recipes and `index.css` reference them by name.

- **Primary accent:** soft indigo/violet. Identity target `#6366E0`. Constraint: white text on
  the primary button surface must meet AA (>= 4.5:1), so the interactive primary surface uses a
  slightly deeper indigo token (`primaryStrong`, tuned to pass) while `#6366E0` serves accents,
  focus rings, and selection. Update `semanticTokens.colors.primary` / `primaryHover` and the
  raw indigo tokens; `selectionBg` shifts to a pale indigo tint.
- **Surfaces:** warm the canvas slightly (cool `paper` -> a gentler neutral) and lift panels
  with soft shadows instead of hard 1px borders.
- **Rounding:** add a tokenized `radii` scale and apply generously - toolbar buttons, panels,
  the Gantt/Grid containers, bars. Recipes: `toolbar.recipe.ts`, `appShell.recipe.ts`.
- **Shadows:** add a tokenized `shadows` scale; replace hard borders on raised surfaces.
- **Gridlines and spacing:** lighter AG-Grid gridlines (theme params) and DHTMLX gridlines
  (`index.css`); slightly airier row height/padding where it does not break virtualization.
- **AG-Grid theme** (`TableView.tsx` `themeQuartz.withParams`): every param stays a
  `var(--colors-...)` reference; add rounding/shadow params from the new tokens.
- Keep IBM Plex Sans/Mono.

The aesthetic polish (exact pastel hex, indigo shade, radius/shadow values) is developed with
the frontend-design skill during implementation, within these token slots.

## 7. Files touched

| File | Change |
| --- | --- |
| `panda.config.ts` | +8 phase hues x3 tones, `gold`, indigo primary tokens, `radii` + `shadows` scales, warmer canvas; remove red `critical` token |
| `src/index.css` | phase bar/row paint rules, rounded bars, gold critical bars/links/tick, lighter gridlines, soft surfaces; all via `var(--colors-...)` |
| `src/constants/phasePaletteSize.ts` (new) | `PHASE_PALETTE_SIZE = 8` |
| `src/services/getPhaseColorIndex.ts` (new) | `phaseId -> colorIndex` map |
| `src/components/GanttView/resolveGroupColorClass.ts` (new) | task -> phase class |
| `src/components/GanttView/useGanttInit.ts` | compose phase class into `task_class`; add `leftside_text` star; rounded bars config if needed |
| `src/components/GanttView/ganttGridColumns.ts` | CP tag -> "★ CP" |
| `src/components/TableView/TableView.tsx` | `resolveRowClass` phase class + leaf discriminator; Critical column gold + "★ CP"; theme rounding/shadow params |
| `src/components/AppShell/GanttControls.tsx` | legend swatch -> gold, glyph ★ |
| `src/components/AppShell/toolbar.recipe.ts`, `appShell.recipe.ts` | indigo primary, rounding, soft shadows |
| tests | new unit + guard tests (section 8); update any asserting red critical |

## 8. Testing

- Unit: `getPhaseColorIndex` - sequential assignment, cycling at 8, phase-only (ignores leaves
  and projects), empty input.
- Unit: `resolveGroupColorClass` - leaf uses parent phase, phase rollup uses own id, project
  rollup neutral, critical composes with phase class.
- Guard test: no raw hex color literal (`#rrggbb`/`#rgb`) appears in `src/index.css` or any
  `*.recipe.ts` or component file; hex lives only in `panda.config.ts`.
- Token presence test: the 24 phase tokens, `gold`, and indigo primary tokens exist in
  `panda.config.ts`; the red `critical` token is gone.
- Contrast test (or documented manual check): white text on the primary interactive surface
  >= 4.5:1; gold and pastel tones meet their stated thresholds.
- Existing Playwright/axe suite stays green.
- Update any test asserting the old red critical tokens/classes (grep first).

## 9. Out of scope

- CPM math, scheduling, float, schedule generation, data shape.
- DHTMLX/AG-Grid version changes or new dependencies.
- Dark mode wiring (tokens may reserve dark values but no toggle work).
