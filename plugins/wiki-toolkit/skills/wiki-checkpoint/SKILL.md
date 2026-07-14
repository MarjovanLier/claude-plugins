---
name: wiki-checkpoint
description: Run a wiki and memory checkpoint at the end of a chat thread or before context compaction. Use when the user invokes wiki-checkpoint, asks to save session knowledge, asks for a wiki or memory sweep, or wants durable findings, retrospective lessons, and routing decisions captured from the current conversation. Honour focus text and skip flags such as skip wiki, skip memory, and skip retrospective.
---

# Wiki Checkpoint

Run a sweep that preserves durable conversation knowledge, routes behavioural lessons to memory, routes domain facts to the right wiki, validates the result, and reports exactly what changed.

Authority: the behavioural contract at `~/wiki/pages/dev/wiki-checkpoint-spec.md` (WC-01 to WC-38). This file is the procedure; on any conflict the spec wins.

Treat the user's message text after the invocation as arguments. Focus hints (e.g. "focus on segment data") prioritise the scan but never suppress detection or reporting of unrelated durable findings. `skip wiki`, `skip memory`, and `skip retrospective` are the only suppressors; they are independent and freely combinable.

## Destination Detection (WC-01 to WC-06)

Project root: the workspace root the harness reports; otherwise the nearest ancestor of the working directory containing `.git`, `CLAUDE.md`, or `AGENTS.md`; otherwise the working directory itself.

Use the first destination that exists:

1. `<project root>/wiki/`, even when the project also references Jira, Confluence, or another external system.
2. `~/wiki/`, the global wiki, constant on every machine and synced via its private remote.
3. Neither: no destination wiki. Skip wiki reads and writes, still run the memory and retrospective sweep, and report wiki-route findings as `not written: no wiki found`.

No other directory (`docs/`, `.wiki/`, `notes/`, `handbook/`) counts as a wiki.

Set `WIKI_DIR` to the active wiki and `MEMORY_DIR` to the memory directory the harness reports for the current project. Read the destination's `SCHEMA.md` when present (otherwise sniff its layout) and its index or equivalent catalogue before writing. Never impose global-wiki conventions on a project wiki.

Invoking this skill authorises non-destructive project-wiki writes of durable findings from the current session only. When write scope is unclear, report the finding as `not written: write scope unclear`.

Routing when no project wiki exists: durable project-scoped facts go to the global wiki under `pages/<project>/` (the schema's routing exception). Exception to the exception: before routing, inspect each project-root `CLAUDE.md`, `AGENTS.md`, and `README` that exists; if one references an external knowledge system (Confluence, Notion, Linear, Jira), report the findings as `not written: external knowledge system, manual filing required`.

## Git Safety Before Writing (WC-24, WC-25)

When the global wiki is the destination and `skip wiki` is absent, run `git -C ~/wiki pull` before reading its schema, catalogue, or pages. A failed pull blocks all wiki writes: report findings that would have been written as `not written: global wiki pull failed`; a failed pull with no wiki-route findings is a failure only, never an invented not-written entry.

When `WIKI_DIR` is inside a git repository, run `git -C "$WIKI_DIR" status` before writing. Never sweep pre-existing uncommitted changes into the checkpoint commit, and never edit a file that already carries uncommitted changes; report the finding routed to it as `not written: blocked by pre-existing local changes` and mention the dirty file in the report. A dirty required companion file (index, log, or capture target) blocks the dependent write as well.

## Workflow

### 1. Scan the Conversation (WC-07, WC-08)

Scan the current conversation for new or updated durable information:

- Discoveries, conclusions, or decisions with lasting value.
- Research findings, data analysis results, interpretations, or contradictions between sources.
- New entities, relationships, classifications, outreach outcomes, or ruled-out paths.

If nothing wiki-worthy exists, continue: memory and retrospective checks still apply.

### 2. Compare Existing State (WC-09, WC-10)

Search for overlap before writing, in this order:

1. The destination's index or equivalent catalogue.
2. Exact-pattern search for concrete terms (names, IDs, slugs, dates) over the page store.
3. Semantic search only through the collection matching the destination (`mcp__qmd__query` collection `global-wiki` for `~/wiki/`). No matching collection or tool: text search over the page store is the fallback.

Search memory with `rg --no-ignore -n -i -- "<term>" "$MEMORY_DIR"` (fallback `grep -rliE`). The `--no-ignore` is mandatory: the memory directory is gitignored, so a plain `rg` silently returns nothing and falsely reads as "no existing rule".

### 3. Retrospective (WC-11 to WC-14)

Unless `skip retrospective` is given, review the session for findings that change future behaviour: mistakes and near misses, rule refinements and corrections, ruled-out paths, and method failures.

A finding is valid only if it answers what a future session should do differently. Omit self-praise, diligence notes, and generic lessons; when in doubt, omit.

Routing test: changes a future method, route to memory; changes only the stored answer, route to wiki. One event may produce both, but the content must differ (behavioural rule in memory, domain fact in wiki).

Update an existing `feedback_*.md` when one covers the rule; create `feedback_<slug>.md` only when none fits. Corrections supersede old guidance in place, preserving the original failure context.

### 4. Write Wiki (WC-15 to WC-20)

- Preserve existing content. Flag conflicting evidence per the destination's convention (global wiki: `<!-- CONTRADICTION -->`) rather than overwriting silently. Removing or replacing substantive existing content requires explicit user confirmation. Destructive rewriting of project wiki content is forbidden without exception.
- New pages follow the destination's conventions. Where the destination keeps an index or equivalent catalogue, add one entry per new page: one line, at most 150 characters.
- Cite every conversation-derived durable claim. A claim meeting all three tests (conversation-only; changes durable factual state; rests on evidence lost after compaction) requires a raw session capture, written before the page that cites it, at a non-colliding path in the destination's source layer (global wiki: `raw/sessions/YYYY-MM-DD-<topic>.md`; a project wiki's own convention otherwise), holding the smallest sufficient extract, with secrets and unrelated personal data redacted. When the destination's conventions provide no permitted location for a capture and forbid creating one, cite `[source: conversation, weak]`, state on the page that the required raw evidence could not be retained, and record the failure in the report. All other durable conversation claims cite `[source: conversation, weak]`. Never plain `[source: conversation]`; never fabricate sources.
- Staleness applies only to `status: active` pages. Report stale overlapping pages; do not fabricate updates for them.
- No pages for ephemeral task detail (debugging steps, commands tried, build output).
- When wiki writes occurred and the destination keeps a log, add a newest-first entry in the destination log's own format, op `ingest` (or `lint` when only wiki-health fixes were made), ending with a one-line retrospective count summary (global wiki heading: `## [YYYY-MM-DD] ingest | checkpoint sweep`). Write it only after all wiki writes, including promotions, are complete. No log entry for memory-only sweeps.

### 5. Write Memory (WC-21 to WC-23, WC-36 to WC-38)

Write memory-worthy items (profile updates, feedback rules, project context, reference pointers, retrospective findings) to `MEMORY_DIR` with the required frontmatter (`name`, `description`, type metadata) and ensure each memory file has exactly one one-line entry in `MEMORY.md`, updating an existing entry rather than duplicating it. Check for an existing file to update before creating one.

Memory body shape for feedback rules:

```markdown
Rule: When [specific trigger], do [specific check] before [risky action].

**Why:** This session almost or actually [specific failure] because [cause]. The correction was [evidence or user/tool feedback].

**How to apply:** [repeatable command, query, search target, or decision rule].
```

Behavioural rules go to memory, never the wiki; durable domain facts go to the wiki, never memory. Memory is never the fallback durable store for project-scoped facts.

Lighten memory while sweeping: promote a memory file whose content has proven durable to its wiki home (write the wiki page first, then remove the memory file or reduce it to a one-line pointer, and update `MEMORY.md`). Plan promotions before finalising Step 4 or its log entry, and run each promotion's wiki side through Steps 2 and 4. Preflight the full move before writing: if new wiki coverage is required and either the wiki or memory side is suppressed or blocked, change neither and report the candidate with the first applicable reason; when equivalent wiki coverage already exists, only the memory-side guard applies to the prune. Never leave the same content in both layers. Feedback rules stay in memory; only the durable fact underneath one may move, with different content. Check existing wiki coverage through Step 2's complete ordered search path, and list every promotion and pruning in the report with both filenames.

### 6. Validate (WC-27, WC-28)

Run the structural lint after wiki writes:

1. For a project-wiki destination, that wiki's own lint script when present.
2. For the global wiki: `~/wiki/scripts/lint_wiki.sh`.
3. A project wiki without its own lint script: report `Lint: not run (no project lint script)` rather than imposing global-wiki checks on a different layout.

Fix errors the sweep introduced; report pre-existing warnings without fixing unrelated content. No wiki writes: report `Lint: not run (no wiki found)`, `Lint: not run (skip wiki)`, or `Lint: not run (no wiki writes)`.

### 7. Commit and Push (WC-25, WC-26)

Global wiki: after lint passes, make one batched commit path-limited to the files the checkpoint changed (conventional format, signed-off), then push. A failed push is reported with the local commit hash.

Project wikis: follow the project's conventions; a path-limited commit of only the wiki files the checkpoint changed when the wiki is a git repository; no push mandate.

### 8. Report (WC-32 to WC-35)

The report always prints, whatever directives were given. End with this shape:

```text
Wiki checkpoint complete.
- Pages created: N (list filenames)
- Pages updated: N (list filenames)
- Memory files created/updated: N (list filenames)
- Memory lightened: N promoted to wiki, M memory files removed or reduced to pointers (memory file and wiki page names)
- Stale pages found but not updated: N (list filenames, reason)
- Contradictions introduced (intentional): N (list filenames)
- Retrospective: N findings (A written to memory, B written to wiki, C not written) / none / skipped by argument
- Findings not written: N (finding summary, source step, intended route or file, exactly one reason each)
- Lint: clean / N issues (list) / not run (reason)
- Failures/skipped steps: none / list (what happened, what remains manual)
```

Retrospective counting: count routed write-ups, not source events; N = A + B + C, and C matches the retrospective subset of the `Findings not written` line.

Every step that failed or was skipped (pull, a blocked write, lint, push) appears under failures with what remains for manual action; reserve that line for operational failures not already represented on another line. Never claim completeness the sweep did not achieve.

Every not-written finding carries exactly one reason, the first applicable in this order: skip wiki; skip memory; no wiki found; global wiki pull failed; blocked by pre-existing local changes; write scope unclear; external knowledge system, manual filing required. A reason is applicable only to the route it affects.

## Rules

- South African English. No em or en dash characters; check changed files before reporting.
- `skip wiki` and `skip memory` block writes, not detection; suppressed findings stay visible in the report. `skip retrospective` blocks the retrospective scan itself.
