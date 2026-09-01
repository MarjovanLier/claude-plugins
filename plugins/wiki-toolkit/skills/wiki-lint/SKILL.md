---
name: wiki-lint
description: >-
  Lint and re-index a Karpathy-style LLM wiki (second brain). Use this whenever
  the user asks to "lint the wiki", "wiki lint", "check wiki health", "index the
  wiki pages", "refresh the wiki search index", or anything about validating wiki
  structure or making wiki pages searchable. The wiki is sometimes a project-local
  folder and there is sometimes a global one at ~/wiki. This skill detects which wiki
  applies, runs the correct lint script (which also refreshes the qmd search index
  in one pass), and resolves flagged issues. Do NOT use it for ordinary source-code
  linting (eslint, phpstan, markdownlint of non-wiki files) or for the full
  pre-compaction knowledge sweep (that is /wiki-checkpoint).
version: 1.0.1
---

# Wiki Lint

Validate a Karpathy-style LLM wiki and refresh its search index in one pass. The
lint script does both jobs: structural checks AND a qmd index rebuild, so "lint"
and "index the pages" are the same operation here. Run the script, then resolve
what it flags.

## 1. Detect the wiki directory

A wiki lives in one of two places, checked in this order. Set `$WIKI_DIR` to the
first that exists:

1. **Project-local wiki**: a `wiki/` folder in the current project root. The
   directory is always named `wiki`, never `docs/`, `.wiki/`, `notes/`, or anything
   else. Confirm it is genuinely a wiki (contains `SCHEMA.md`, `index.md`, `log.md`,
   or a `pages/` layout) rather than an unrelated folder that happens to be named
   `wiki`.
2. **Global wiki**: otherwise `~/wiki/`, where it exists (synced via its git remote).

If the user names a wiki explicitly, use that. If neither location exists, report
`No wiki found` and stop: there is nothing to lint, and no directory should be created
to satisfy the request.

## 2. Choose the lint runner

The lint logic lives in a shell script. Resolve it in this order:

1. **The wiki's own script**: resolve these two paths in order and run the first that is
   executable. It encodes that wiki's house rules.

   ```bash
   "$WIKI_DIR/scripts/lint_wiki.sh" "$WIKI_DIR"
   # or, when the wiki sits inside a larger repository:
   "$(git -C "$WIKI_DIR" rev-parse --show-toplevel)/scripts/lint_wiki.sh" "$WIKI_DIR"
   ```

   Report the checks a foreign script actually performs, not the ones listed below. Those
   describe the global script specifically. Another wiki's script may use different exit
   codes and may not index at all, in which case the Index line reports
   `not applicable (script does not index)` rather than an invented count.

2. **A project wiki with no script of its own**: report
   `Lint: not run (no project lint script)` and stop. Do NOT fall back to the global
   script. Its checks encode global-wiki conventions (frontmatter fields, status
   values, citation format) that a different layout does not share, so running it
   there produces false errors and invites destructive "fixes". This matches the rule
   the checkpoint and ingest skills already follow.

3. **The global wiki with no script present**: the script is not bundled with this
   plugin. Report `Lint: not run (no compatible lint runner)` and stop. Never report a
   clean lint that did not execute, and never hand-roll a substitute set of structural
   checks against a wiki whose conventions you have not read.

## 3. Run it and read the summary

The script checks: orphan pages (not in index), dead index entries, duplicate index
entries, broken `[[wiki-links]]`, missing/invalid frontmatter, missing `status`,
stale pages (14-day `last_compiled` cutoff), unresolved `CONTRADICTION` markers,
em/en dashes, near-empty pages, oversized pages (>49KB), date-suffixed pages that
should be `snapshot`, and markdownlint via the committed config. It finishes by
running `qmd update` and `qmd embed` to refresh the search index, so the pages
become searchable as part of the same run.

If the qmd output warns about orphaned embedding chunks (qmd hints when they
exceed 10% of vectors), run `qmd cleanup` and record the result in the report.
Do not run cleanup when no hint appears; it vacuums the whole index.

Exit codes: `0` clean, `1` warnings present, `2` errors present. The qmd index is
stored under `~/.config/qmd/`, not in the repo, so re-indexing never produces git
changes.

## 4. Resolve what it flags

The script's own policy is that flagged items are not background noise: fix them.
How aggressively depends on whose wiki it is.

- **Global wiki (`~/wiki`)**: this is the user's own. Fix all flagged errors and
  warnings, then re-run until clean. Read `$WIKI_DIR/SCHEMA.md` first if a fix
  touches conventions (frontmatter fields, status values, citation format). Common
  fixes: replace em/en dashes with the right substitute, add missing frontmatter or
  `status`, register an orphan page in `index.md` (one line, ~150 char cap), correct
  a dead index path, set `status: snapshot` or refresh `last_compiled` on a stale
  page.
- **Project-local wiki**: treat as read-only by default. Report the issues and fix
  only under explicit user direction, or only what the current session introduced.
  Never destructively rewrite a project wiki, and match its existing conventions
  rather than imposing the global ones.

Pre-existing warnings you choose not to fix (for a project wiki, or because they
need a judgement call) should be reported honestly, not silently passed over.

## 5. Report

Keep it short:

```
Wiki lint: <WIKI_DIR>
- Pages: N | Errors: N | Warnings: N
- Fixed: <list, or "nothing to fix">
- Index: refreshed (qmd: N new, N updated) / not run (qmd not installed)
- Cleanup: N orphaned chunks removed (only when the qmd hint fired)
- Remaining: <pre-existing items left, with reason> / clean
```

## Conventions

South African English. No em or en dashes in anything you write while fixing pages
(this is also one of the things the linter flags). Never fabricate sources or page
content. If `qmd` is not installed the script skips indexing and says so; the
structural checks still run.
