# PR: ignore the `.worktrees/` directory

**Branch:** `chore/ignore-worktrees` -> `main`
**Date:** 2026-06-27

## Summary

Adds `.worktrees/` to `.gitignore` so the local git worktrees this repo uses for
per-feature isolation never show up as untracked noise or get committed by accident.

## What changed

- `.gitignore`: one line, `.worktrees/`.

## Why this is its own PR

The change existed as a single unpushed commit sitting directly on local `main` (it
predated the portfolio-site work). The project workflow disallows direct pushes to
`main`, so rather than push it inline it was lifted onto this branch and routed through a
PR like everything else.

## Testing

None required: a `.gitignore` entry has no runtime behavior. Verified only that `git
status` on a branch carrying a `.worktrees/` directory no longer lists it as untracked.

## Reflection

Small, but it closes a real gap: without this entry, any worktree created under
`.worktrees/` (the convention this repo already follows) reads as untracked on every
`git status`, which is exactly the kind of noise that hides a real change. Catching it as
a divergence during the PR #4 merge cleanup, rather than silently discarding the local
commit, is what surfaced it.
