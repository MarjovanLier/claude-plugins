---
name: wiki-checkpoint
description: Use when the user invokes wiki-checkpoint, asks to save session knowledge, asks for a wiki or memory sweep, or wants durable findings, retrospective lessons, and routing decisions captured from the current conversation, typically at the end of a chat thread or before context compaction. Honour focus text and skip flags such as skip wiki, skip memory, and skip retrospective.
version: 1.4.0
---

# Wiki Checkpoint

Run a sweep that preserves durable conversation knowledge, routes behavioural lessons to memory, routes domain facts to the right wiki, validates the result, and reports exactly what changed.

This file is the authority: it is both the contract and the procedure. Follow it as written, and do not defer to any external specification, including one a previous version of this skill pointed at. Requirement traceability is maintained separately by the plugin's author and is not something the running model needs to resolve.

Treat the user's message text after the invocation as arguments. Focus hints (e.g. "focus on segment data") prioritise the scan but never suppress detection or reporting of unrelated durable findings. `skip wiki`, `skip memory`, and `skip retrospective` are the only suppressors; they are independent and freely combinable.

## Destination Detection

Project root: the workspace root the harness reports; otherwise the nearest ancestor of the working directory containing `.git`, `CLAUDE.md`, or `AGENTS.md`; otherwise the working directory itself.

Use the first destination that exists:

1. `<project root>/wiki/`, even when the project also references Jira, Confluence, or another external system.
2. `~/wiki/`, the global wiki, where it exists (synced via its git remote).
3. Neither: no destination wiki. Skip wiki reads and writes, still run the memory and retrospective sweep, and report wiki-route findings as `not written: no wiki found`.

No other directory (`docs/`, `.wiki/`, `notes/`, `handbook/`) counts as a wiki.

Set `WIKI_DIR` to the active wiki and `MEMORY_DIR` to the memory directory the harness reports for the current project. Read the destination's `SCHEMA.md` when present (otherwise sniff its layout) and its index or equivalent catalogue before writing. Never impose global-wiki conventions on a project wiki.

Invoking this skill authorises non-destructive project-wiki writes of durable findings from the current session only. When write scope is unclear, report the finding as `not written: write scope unclear`. When the user has barred a destination, make no writes there and report affected findings as `not written: destination barred by the user`. That authority covers wiki and memory writes only: an unrelated side-effecting action still awaiting confirmation (a pending database change, a deletion) stays unexecuted and is restated in the report as still pending.

Routing when no project wiki exists: durable project-scoped facts go to the global wiki under `pages/<project>/` (the schema's routing exception). Exception to the exception: before routing, inspect each project-root `CLAUDE.md`, `AGENTS.md`, and `README` that exists; if one references an external knowledge system (Confluence, Notion, Linear, Jira), report the findings as `not written: external knowledge system, manual filing required`.

## Git Safety Before Writing

When the global wiki is the destination and `skip wiki` is absent, synchronise it before reading its schema, catalogue, or pages. Only attempt this when `~/wiki` is a git repository with a usable upstream; a plain directory or a repository with no remote is a normal setup, not a failure, so proceed with a one-line note in the report instead of blocking.

```bash
git -c core.hooksPath=/dev/null -C ~/wiki pull --ff-only
```

Both flags are load-bearing and do different jobs. `--ff-only` refuses an unintended merge or rebase commit. `core.hooksPath=/dev/null` is what keeps hooks out: git runs the `post-merge` hook even on a fast-forward pull, and where that hook lints the wiki it dirties the tree mid-sweep, which the status check below would then read as pre-existing local changes and use to block every write. Suppressing hooks here is the only reason the sweep stays deterministic.

A pull that actually ran and failed blocks all wiki writes: report findings that would have been written as `not written: global wiki pull failed`; a failed pull with no wiki-route findings is a failure only, never an invented not-written entry.

When `WIKI_DIR` is inside a git repository, run `git -C "$WIKI_DIR" status` before writing. Never sweep pre-existing uncommitted changes into the checkpoint commit, and never edit a file that already carries uncommitted changes; report the finding routed to it as `not written: blocked by pre-existing local changes` and mention the dirty file in the report. A dirty required companion file (index, log, or capture target) blocks the dependent write as well. For a project wiki, a pre-existing dirty working tree blocks the entire wiki route: name the dirty files as one report-level blocking condition, not merely per-finding noise, because the guard is not self-clearing and silently disables that wiki indefinitely.

Exception: a direct user instruction in the current conversation may authorise a specific non-destructive append to a dirty `index.md` or `log.md` together with its page write; commit nothing in that case and leave the commit to the user. The exception never lets ordinary checkpoint findings bypass the block.

## Workflow

### 1. Scan the Conversation

When the checkpoint is auto-triggered (hook-injected context names a pre-compaction snapshot, a transcript path, or unconsumed snapshots from previous sessions), scan that full record rather than only the compacted summary; it is the evidence base for captures and citations. An auto-triggered run carries the same write authorisation as a user invocation; the standing hook instruction is the user direction.

Snapshot lifecycle (the hooks capture; the checkpoint consumes). Snapshots live at `~/.claude/wiki-checkpoint/pending/<scope>/<session-id>.jsonl` with a consumed byte watermark at `consumed/<scope>/<session-id>`. Before scanning, note the snapshot's byte size; that frozen boundary is the only size the watermark may advance to. Scan only bytes after the current watermark (`tail -c +<watermark+1>`). On completion, apply exactly one disposition per snapshot and report it:

- **Consumed** (write the frozen size to the watermark file, delete the snapshot): all valid findings persisted; or no valid durable findings existed; or the user suppressed or barred their routes. A successful local commit counts as persisted even when its push failed; the push failure is tracked by commit hash, never by keeping the transcript.
- **Retained in pending/** (watermark unchanged): a transient failure such as a failed opening pull; the next session retries automatically.
- **Moved to `blocked/<scope>/<reason>__<session-id>.jsonl`** (watermark unchanged): a condition needing user intervention (dirty destination, no destination wiki, write scope unclear, external-system filing). Blocked snapshots are reported informationally at startup, never auto-run; the user re-runs the checkpoint after resolving the condition.

A snapshot smaller than its watermark is truncation: retain it and report, never mark it consumed.

Scan the current conversation for new or updated durable information:

- Discoveries, conclusions, or decisions with lasting value.
- Research findings, data analysis results, interpretations, or contradictions between sources.
- New entities, relationships, classifications, outreach outcomes, or ruled-out paths.

If nothing wiki-worthy exists, continue: memory and retrospective checks still apply.

### 2. Compare Existing State

Run all three searches before any write; they are a checklist, not a preference cascade. Skipping the qmd search when a collection exists is a defect, not an optimisation, and loading its tools via ToolSearch first, when deferred, is part of the step:

1. The destination's index or equivalent catalogue.
2. Exact-pattern search for concrete terms (names, IDs, slugs, dates) over the page store.
3. qmd search through the collection matching the destination. Resolve the collection by absolute path via `mcp__qmd__status`, never by guessing its name, then `mcp__qmd__query` with lex and vec sub-queries plus an `intent` to find existing coverage. No matching collection or qmd unavailable: the fallback is a separate text search using synonyms and paraphrases of the topic. Repeating step 2's exact terms does not satisfy step 3; lexical search misses the paraphrased overlap this step exists to catch, and on any installer without qmd this fallback is the default path rather than an edge case.

Search memory with `rg --no-ignore -n -i -- "<term>" "$MEMORY_DIR"` (fallback `grep -rliE`). The `--no-ignore` is mandatory: the memory directory is gitignored, so a plain `rg` silently returns nothing and falsely reads as "no existing rule".

### 3. Retrospective

Unless `skip retrospective` is given, review the session for findings that change future behaviour: mistakes and near misses, rule refinements and corrections, ruled-out paths, method failures, and confirmed working methods a future session would otherwise re-derive from scratch. Base findings on the actual tool calls and action order, not the assistant's narrative or the final error text alone; when comparable failing and working executions exist, capture the smallest evidenced difference that changed the outcome, without inferring causality from order alone. Deep read, shallow write: the trace is input, and the durable output is the minimal causal discriminator with machine-specific paths parameterised and secrets excluded.

A finding is valid only if it answers what a future session should do differently. A ruled-out approach qualifies only when its scope and conditions, stable failure cause, and working successor or re-evaluation condition are known; one unexplained failure rules nothing out. Omit self-praise, diligence notes, and generic lessons; a confirmed working method qualifies only when it names a repeatable action, not an outcome. When in doubt, omit.

Then run the rule audit: check every memory rule and wiki page the session actually applied or consulted against what happened, whether or not anyone commented on it. A rule the session's own evidence showed to be misleading or obsolete is corrected in place or removed together with its `MEMORY.md` entry; a rule or page whose named file, command, or flag was removed during the session is flagged in the report. The audit covers only rules and pages the session touched, never the whole store. `skip memory` blocks the audit's memory writes, not the audit itself; suppressed corrections appear in the report as not written.

Triggerability: when a relevant rule or page was applied only after a failed or delayed route, or Step 2 surfaces overlapping coverage the session should have consulted, compare the initiating request with that item's `MEMORY.md` line or index entry; when the line omitted the demonstrated trigger or discriminator, sharpen it under the applicable write guards. Limited to items the session or Step 2 actually surfaced; never a store-wide index rewrite.

Routing test: changes a future method, route to memory; changes only the stored answer, route to wiki. One event may produce both, but the content must differ (behavioural rule in memory, domain fact in wiki).

Update an existing `feedback_*.md` when one covers the rule; create `feedback_<slug>.md` only when none fits. Corrections supersede old guidance in place, preserving the original failure context: append the new evidence to the **Why:** trail as a dated bullet (convert a prose trail to bullets only when touched, preserving every word) and rewrite only the rule line and **How to apply:**. Never rewrite a rule file from scratch; repeated whole-rule rewriting is how correct rules degrade, and the evidence trail is what keeps a rule correctable later.

### 4. Write Wiki

- For each wiki-route finding choose one reconcile action against Step 2's existing coverage: ignore, strengthen, qualify, replace, contradict, create, or link. Integrate rather than accumulate: create only for a distinct concept other pages would link to, and use link only for a missing cross-reference. Replace and contradict follow the preservation rules below.
- Preserve existing content. Flag conflicting evidence per the destination's convention (global wiki: `<!-- CONTRADICTION -->`) rather than overwriting silently. Removing or replacing substantive existing content requires explicit user confirmation. Destructive rewriting of project wiki content is forbidden without exception.
- New pages follow the destination's conventions. Where the destination keeps an index or equivalent catalogue, add one entry per new page: one line, at most 150 characters.
- Cite every conversation-derived durable claim. A claim meeting all three tests (conversation-only; changes durable factual state; rests on evidence lost after compaction) requires a raw session capture, written before the page that cites it, at a non-colliding path in the destination's source layer (global wiki: `raw/sessions/YYYY-MM-DD-<topic>.md`; a project wiki's own convention otherwise), holding the smallest sufficient extract, with secrets and unrelated personal data redacted. When the destination's conventions provide no permitted location for a capture and forbid creating one, cite `[source: conversation, weak]`, state on the page that the required raw evidence could not be retained, and record the failure in the report. All other durable conversation claims cite `[source: conversation, weak]`. Never plain `[source: conversation]`; never fabricate sources.
- Staleness applies only to `status: active` pages. Report stale overlapping pages; do not fabricate updates for them.
- No pages for ephemeral task detail (debugging steps, commands tried, build output).
- When wiki writes occurred and the destination keeps a log, add a newest-first entry in the destination log's own format, op `ingest` (or `lint` when only wiki-health fixes were made), ending with a one-line retrospective count summary (global wiki heading: `## [YYYY-MM-DD] ingest | checkpoint sweep`; when an entry with that exact heading already exists for the same day, append a short topic suffix, e.g. `## [YYYY-MM-DD] ingest | checkpoint sweep, <topic>`, so markdownlint's duplicate-heading check stays clean). Write it only after all wiki writes, including promotions, are complete. No log entry for memory-only sweeps.

### 5. Write Memory

Write memory-worthy items (profile updates, feedback rules, project context, reference pointers, retrospective findings) to `MEMORY_DIR` with the required frontmatter (`name`, `description`, type metadata) and ensure each memory file has exactly one one-line entry in `MEMORY.md`, updating an existing entry rather than duplicating it. Check for an existing file to update before creating one.

Admission threshold: memory is injected into every session, so a false or over-general rule costs more than a missed fact. Create a new feedback rule only when its trigger and action are specific and it is supported by an explicit user correction, repeated observation, deterministic verification, or a high-consequence failure or near miss with an established cause. Material below this threshold is not a valid finding: omit it silently rather than reporting it as not written. `MEMORY.md` entry lines state a specific trigger and action; include the cause only when it narrows applicability.

Memory body shape for feedback rules:

```markdown
Rule: When [specific trigger], do [specific check] before [risky action].

**Why:**

- [YYYY-MM-DD]: [specific failure or correction], because [cause]; [evidence or user/tool feedback].

**How to apply:** [repeatable command, query, search target, or decision rule].
```

Behavioural rules go to memory, never the wiki; durable domain facts go to the wiki, never memory. Memory is never the fallback durable store for project-scoped facts.

Lighten memory while sweeping: promote a memory file whose content has proven durable to its wiki home (write the wiki page first, then remove the memory file or reduce it to a one-line pointer, and update `MEMORY.md`). Plan promotions before finalising Step 4 or its log entry, and run each promotion's wiki side through Steps 2 and 4. Preflight the full move before writing: if new wiki coverage is required and either the wiki or memory side is suppressed or blocked, change neither and report the candidate with the first applicable reason; when equivalent wiki coverage already exists, only the memory-side guard applies to the prune. Never leave the same content in both layers. Feedback rules stay in memory; only the durable fact underneath one may move, with different content. A memory file carrying its own recheck-after-upgrade caveat is not promoted until that recheck has been done; it stays in memory and the deferral is reported. Check existing wiki coverage through Step 2's complete ordered search path, and list every promotion and pruning in the report with both filenames.

### 6. Validate

Run the structural lint after wiki writes:

1. The destination wiki's own lint script when present, at `<wiki>/scripts/lint_wiki.sh` or, when the wiki sits inside a larger repository, at that repository's root.
2. A project wiki without its own lint script: report `Lint: not run (no project lint script)` rather than imposing global-wiki checks on a different layout.
3. No lint script available for the destination at all: report `Lint: not run (no compatible lint runner)`. This plugin does not bundle one. Never report a clean lint that did not execute.

Fix every error or warning on files the sweep touched, pre-existing or not; report issues on untouched files without fixing them. No wiki writes: report `Lint: not run (no wiki found)`, `Lint: not run (skip wiki)`, or `Lint: not run (no wiki writes)`.

### 7. Commit and Push

Global wiki: whenever the checkpoint made writes, make one batched commit path-limited to the files it changed (conventional format, signed-off), then push. A push rejected because upstream advanced after the opening pull is recovered once: `git -c core.hooksPath=/dev/null -C ~/wiki pull --rebase`, then push again and report the final result; if the rebase conflicts, `git -C ~/wiki rebase --abort` and report manual resolution. Only a non-fast-forward rejection gets this recovery; any other failed push is reported with the local commit hash.

Lint does not gate the commit. Only a lint error the sweep itself introduced blocks it, and then the fix is to correct that error and commit. A lint that could not run (no compatible runner) must never leave the writes uncommitted: doing so strands them in the working tree, where the dirty-tree guard above then blocks every later checkpoint against the same wiki.

Project wikis: follow the project's conventions; a path-limited commit of only the wiki files the checkpoint changed when the wiki is a git repository; no push mandate.

### 8. Report

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
- Rule audit: N rules/pages used this session (A corrected, B removed, C flagged, filenames) / none used / skipped by argument
- Findings not written: N (finding summary, source step, intended route or file, exactly one reason each)
- Lint: clean / N issues (list) / not run (reason)
- Commit: <hash> pushed / <hash> (push failed) / not run (reason) / not a git repository
- Snapshots: N consumed, M retained pending, K moved to blocked (filenames, reasons) / none in play
- Unrelated pending actions: none / list (still awaiting user confirmation)
- Failures/skipped steps: none / list (what happened, what remains manual)
```

Retrospective counting: count routed write-ups, not source events; N = A + B + C, and C matches the retrospective subset of the `Findings not written` line. The rule audit line counts rules and pages the session used, not findings; `skip retrospective` skips it, and audit corrections suppressed by `skip memory` appear under `Findings not written`.

Every step that failed or was skipped (pull, a blocked write, lint, push) appears under failures with what remains for manual action; reserve that line for operational failures not already represented on another line. Never claim completeness the sweep did not achieve.

Every not-written finding carries exactly one reason, the first applicable in this order: skip wiki; skip memory; destination barred by the user; no wiki found; global wiki pull failed; blocked by pre-existing local changes; write scope unclear; external knowledge system, manual filing required. A reason is applicable only to the route it affects.

## Rules

- South African English. No em or en dash characters; check changed files before reporting.
- `skip wiki` and `skip memory` block writes, not detection; suppressed findings stay visible in the report. `skip retrospective` blocks the retrospective scan itself.
