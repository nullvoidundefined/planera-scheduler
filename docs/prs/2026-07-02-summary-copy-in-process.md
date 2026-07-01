# Reframe summary copy for in-process candidacy; drop the FAQ

## Summary

The site copy originally addressed Planera as a cold applicant ("Hi, I'm Ian. I'm
applying... instead of a cover letter"). Ian has since met with the team and is in
process, so the copy is reframed to reflect that relationship, and the Architecture
write-up's FAQ section is removed because it read as litigating a case rather than
explaining the work.

## What changed

Copy:

- **Summary intro** now opens on the team meeting ("I met with some members of your team
  this week...") instead of a fresh self-introduction and the cover-letter-replacement
  framing.
- **Whiteboard/collaboration paragraph** drops the "faking it would have told you nothing
  true" line and reframes real-time from "the genuinely hard part of your system" to
  "real-time collaboration with WebSockets would be coming in part two."
- **Architecture write-up** wording: "those three things are just different ways of
  drawing it" becomes "those three views are just different ways of presenting it."

Structure:

- **FAQ section removed** from the Architecture route. Deleted `faqContent.ts`,
  `FaqList.tsx`, the now-unused `FaqEntry` type, and their tests; stripped the FAQ
  section and imports from `ArchitectureRoute.tsx`.

Tests updated in the same commits to match the new copy (`summaryContent.test.ts`,
`SummaryRoute.test.tsx`) and the removed section (`ArchitectureRoute.test.tsx`).

## Architectural decisions

- **Delete the FAQ rather than soften it.** Alternative was rewording the questions. The
  FAQ duplicated honesty already carried by the prose sections (whiteboard omission,
  single-user scope, AI-first build), so removing it cut redundancy rather than content.
- **Removed the `FaqEntry` type entirely** rather than leaving it orphaned, since no other
  content module used it. `ProseSection` remains the only shared prose shape.

## Accuracy validation

Every factual claim in the copy was checked against the codebase before merge:

- Stack list (React, TypeScript, DHTMLX Gantt, AG-Grid, PandaCSS, Vitest): all present in
  `package.json`.
- "Two views, the Gantt and the table": `GanttView` and `TableView` both exist.
- "Single-user": no websocket/collaboration/realtime code anywhere in `src`.
- Web worker, downstream-cone recompute, DAG-cycle rejection: backed by
  `src/workers/cpmWorker.ts`, `services/cpm/computeDownstreamCone.ts`, `detectCycle.ts`,
  `sortActivitiesTopologically.ts`.
- Planera-internals claims remain explicitly framed as outside inference.

## Testing

`vitest run`: 40 files, 149 tests passing.

## Reflection

Time since the summary copy first landed: ~5 days (`e498871`, 2026-06-27 to 2026-07-02).
What I got wrong first: I updated the two content-adjacent tests but missed the
`SummaryRoute` render test that asserted the old "instead of a cover letter" string; the
full suite caught it. The lesson is the standing one. When a copy constant changes, grep
the whole test tree for the old value before assuming the change is contained.
