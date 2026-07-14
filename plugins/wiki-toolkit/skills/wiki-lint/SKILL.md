---
name: wiki-lint
description: >-
  Lint and re-index a Karpathy-style LLM wiki (second brain). Use this whenever
  the user asks to "lint the wiki", "wiki lint", "check wiki health", "index the
  wiki pages", "refresh the wiki search index", or anything about validating wiki
  structure or making wiki pages searchable. The wiki is sometimes a project-local
  folder and there is always a global one at ~/wiki. This skill detects which wiki
  applies, runs the correct lint script (which also refreshes the qmd search index
  in one pass), and resolves flagged issues. Do NOT use it for ordinary source-code
  linting (eslint, phpstan, markdownlint of non-wiki files) or for the full
  pre-compaction knowledge sweep (that is /wiki-checkpoint).
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
2. **Global wiki**: otherwise `~/wiki/` (synced via its git remote).
   This always exists on a configured machine.

If the user names a wiki explicitly, use that. If only the global wiki exists, use it.

## 2. Choose the lint runner

The lint logic lives in a shell script. Resolve it in this order:

1. **Project's own script**: if `$WIKI_DIR` (or its repo root) has `scripts/lint_wiki.sh`,
   run that. It encodes the project's house rules.
2. **Global script**: otherwise run the global one against the detected wiki. It
   takes the wiki directory as its first argument and auto-detects `pages/` vs
   `concepts/` and the index file, so it works on any Karpathy-style layout:

   ```bash
   ~/wiki/scripts/lint_wiki.sh "$WIKI_DIR"
   ```

   Run with no argument, it lints `~/wiki` itself.

## 3. Run it and read the summary

The script checks: orphan pages (not in index), dead index entries, duplicate index
entries, broken `[[wiki-links]]`, missing/invalid frontmatter, missing `status`,
stale pages (14-day `last_compiled` cutoff), unresolved `CONTRADICTION` markers,
em/en dashes, near-empty pages, oversized pages (>49KB), date-suffixed pages that
should be `snapshot`, and markdownlint via the committed config. It finishes by
running `qmd update` and `qmd embed` to refresh the search index, so the pages
become searchable as part of the same run.

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
- Remaining: <pre-existing items left, with reason> / clean
```

## Conventions

South African English. No em or en dashes in anything you write while fixing pages
(this is also one of the things the linter flags). Never fabricate sources or page
content. If `qmd` is not installed the script skips indexing and says so; the
structural checks still run.
