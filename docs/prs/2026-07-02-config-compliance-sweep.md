# Config-compliance sweep: align the codebase with the global conventions

## Summary

A six-layer engineering audit against the global Claude config (architecture,
intra-file ordering, naming, constants, function shape, testing) surfaced ~55
findings. This branch verifies each against the code and rectifies the real ones,
grouped into per-subsystem commits so each file is touched once. Six audit findings
turned out to be false positives or rule conflicts and are documented rather than
applied.

## What changed (by commit)

1. **structure spine** (R-222/223/224/240): extract `GanttTask`/`GanttLink`,
   `TableRow`, `CpmWorkerRequest` into sibling `types.ts` modules; unexport in-file
   `WorkerMessage`/`WorkerResult`; move `useScheduleQuery` `api/ -> state/` (fixing an
   upward import); flatten single-file route folders and `router/` into flat modules;
   rename `content/ -> data/`; add shared `ACTIVITY_TYPE_GROUP` and `ROUTE_*` constants.
2. **cpm** (R-227/233/219): extract the cone forward-pass into `runConeForwardPass`
   so `computeConeEarlyDates` is a pure orchestrator; `sorted -> sortedActivities`;
   raw `"group"` -> `ACTIVITY_TYPE_GROUP`.
3. **services** (R-227/228/233/232/219): split `wireLaneActivity` and
   `appendMergeGate` into orchestrators plus helpers, preserving exact PRNG call order
   so generated output stays deterministic; destructure options; rename
   `prng`/`earlyFinish`/booleans/`current`.
4. **gantt** (R-218/228/232/233/219): alphabetize constant groups; extract scrollbar
   height, `.grid_cell` selector, DHTMLX `"project"`; `on* -> handle*`;
   `suppressCollapseEcho -> shouldSuppressCollapseEcho`; destructure the subscriber.
5. **table + state** (R-231/228/233/219): destructure AG-Grid callbacks; rename
   `workerInitialized`/`registered`/`next`/`removed`; shared group constant.
6. **routes/mocks** (R-218/219/217): `ROUTE_*` constants in router/nav/CTAs; sort the
   `REPO_*` group; rename generic filenames (`constants/schedule.ts`,
   `mocks/{handlers,server,browser}.ts`).
7. **tests** (R-239/200/208/232): merge the criticalPath scenario into
   `computeSchedule.test`; move the hex/token contract guards to `__tests__/integration/`;
   add negative-input tests (cyclic full graph throws; non-2xx fetch throws); strengthen
   two loose `>0` assertions into behavioral invariants; rename builder helpers.
8. **member-ordering fix**: revert the interface reordering from commit 5 (see below).

## Architectural decisions (findings NOT applied, with reasons)

Verifying findings against the code (the audit output is a hypothesis list, not a
patch) caught six that were wrong or in rule conflict:

- **`useGanttInit` stays in `components/GanttView/`.** Moving it to `state/` (strict
  R-240) would force `state -> components` imports, violating R-224 (dependency
  direction), which is a harder rule than a placement preference. R-224 wins.
- **Interface members stay fields-before-methods** (reverted F-04/F-05). The audit
  asked for pure-alphabetical, but the project's `@typescript-eslint/member-ordering`
  requires fields before methods and overrides the general alphabetical convention;
  the original order was already correct. Caught by the full `eslint .` sweep, which
  the per-file pre-commit lint does not run.
- **`computeDownstreamCone` equality stays dot-notation.** Applying the destructuring
  finding pushed the function past the R-227 size ceiling and made a flat field
  comparison less readable.
- **`smoke/appShell.test.tsx` stays put.** `smoke/` is referenced by the `npm run
  smoke` script; it is a deliberate suite, not an R-239 violation.
- **`scheduleStore` scenario tests stay split.** `scheduleStoreSequencing` needs a
  file-scoped `vi.mock` of the worker that would contaminate the base store tests, so
  the module legitimately needs multiple test files.

## Testing

`tsc --noEmit` (both tsconfigs) clean; `eslint .` clean; `vitest run`: 39 files, 152
tests passing (baseline 150; +2 negative-input tests, criticalPath merged).

## Reflection

Time since the audited code last changed: same day (branched off the copy-pass work,
2026-07-02). What I got wrong first: the interface-member reorder (commit 5) looked
right against R-231 but violated the project's member-ordering lint, which the
per-file pre-commit hook (prettier only, no eslint) never surfaced; the full-sweep
`eslint .` before finishing caught it. Lesson: run the full lint, not just the staged
subset, before declaring a rule-compliance change done, and treat every audit finding
as a hypothesis to verify against the actual governing rule.
