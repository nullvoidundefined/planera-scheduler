# Write-up source-repo link and humility/accuracy copy pass

## Summary

Adds a public source-repo link near the top of the Architecture write-up under its
own "The source" heading, then runs a critical pass over the site copy so it reads
humble yet accurate for Planera's engineers: it defers to their mature product,
frames the write-up as an outside read rather than an authoritative account, and
corrects two overclaims (one introduced by the link itself).

## What changed

Write-up (`ArchitectureRoute.tsx`):

- **New "The source" section** near the top links the public repo
  (`github.com/nullvoidundefined/planera-scheduler`) with `target="_blank"` +
  `rel="noopener noreferrer"` and a visible focus outline.
- **H1 reframed** "How I think Planera's frontend is built" -> "My outside read of
  how Planera's frontend is built" so the humility is visible before the content.
- **Intro** gains a sentence deferring to the mature product ("a few-days sketch of
  two of its views, not a claim to match it") and hedges the whiteboard-stack guess
  ("looks like a custom build").
- **Repo lead** no longer claims the analysis itself is code: "The demo this write-up
  accompanies is real, running code."

Summary (`summaryContent.ts`):

- Adds the deference line ("You've spent years hardening the real thing... the
  distance between the two is most of the actual engineering"), cuts "Not a flex",
  hedges the whiteboard as "looks like a custom D3/SVG build", and reframes real-time
  from a promised "part two" to "the obvious next step, not something I've built".

Tests updated in the same commit for the changed H1 and summary assertions
(`ArchitectureRoute.test.tsx`, `appRoutes.test.tsx`, `summaryContent.test.ts`).

## Architectural decisions

- **Link the demo, not the write-up.** The repo lead was first written as "Everything
  below is real, running code," but the sections below are outside inference about
  Planera's architecture, not the demo's source. Chosen wording scopes the "real,
  running code" claim to the demo the write-up accompanies.
- **Reframe rather than delete the H1.** Alternative was dropping the "how it's built"
  framing entirely; keeping it as an explicit outside read preserves the content's
  value while removing the "outsider lecturing them on their own system" risk.
- **Kept the casual register, cut only "Not a flex."** The phrase drew attention to
  the possibility it was a flex; the rest of the human register is an asset for this
  audience.

## Testing

`vitest run`: 40 files, 150 tests passing.

## Reflection

Time since the summary copy last landed: same day (`45e3bcb`, 2026-07-02). What I got
wrong first: the repo-link commit shipped "Everything below is real, running code,"
which the follow-up copy audit flagged as conflating the analysis with the codebase;
the fix scopes the claim to the demo. Lesson reinforced: a link's supporting sentence
is a factual claim too, and belongs in the same accuracy pass as the prose.
