# Planera Scheduler: project conventions

This project **explicitly follows the root-level Claude configuration** at `~/.claude/CLAUDE.md`
(the global rules R-001 through R-518, the session-lifecycle and cost rules, and the convention
files referenced there) and the shared tree conventions at
`/Users/iangreenough/Desktop/code/personal/.claude/CLAUDE.md`. Those documents govern naming,
architecture, testing discipline, commit hygiene, accessibility, and the PR workflow. This file
adds only project-specific context and records deliberate overrides.

## What this project is

A hiring artifact for Planera's Frontend Software Developer role: a working proof of the
"collaborative CPM schedule editor" system design. One schedule graph, shown as two synchronized
views (Table and Gantt), edited live, rendered fast at thousands of activities.

- Product doc: `PDD.md`
- Governing technical spec: `docs/superpowers/specs/2026-06-26-planera-collaborative-editor-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-26-planera-collaborative-editor.md`

## Stack (matches the employer's stack on purpose)

React, TypeScript, DHTMLX Gantt, AG-Grid Enterprise, PandaCSS, TanStack Query, Zustand, a web
worker for CPM recompute, Vitest, Playwright.

## Deliberate overrides of the global / shared conventions

These override the referenced configuration for this project only, and only as stated:

- **PandaCSS replaces SCSS modules.** The shared conventions specify SCSS modules with design
  tokens; this project uses PandaCSS instead, to match the employer's stack. The intent of the
  convention (token-driven styling, no ad-hoc magic values) still holds, expressed through
  PandaCSS tokens and recipes.
- **Two views, not three.** The original PDD described a third Whiteboard view; it is dropped (see
  the spec). This is a product-scope decision, not a rules override, recorded here for clarity.

Everything not listed here follows the global and shared configuration unchanged.
