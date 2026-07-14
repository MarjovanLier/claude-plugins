---
name: wiki-lookup
description: Read-only lookup of existing knowledge in the user's Karpathy-style wikis, qmd-backed where a collection exists. Use whenever the user asks what the wiki knows or says about something, whether a topic was researched or decided before, says "look this up in the wiki", "check the wiki", "have we covered this", or asks "what do we know about X" in the sense of accumulated past project, personal, case, setup, or cross-project knowledge. Do not use for ordinary questions about the current codebase, repository documentation, live system state, or general knowledge. Not for adding knowledge (wiki-ingest), end-of-thread sweeps (wiki-checkpoint), or wiki health, sync, and index maintenance (wiki-lint).
---

# Wiki Lookup

Answer a question from the wikis: pick the destination, query the map, read only the pages that matter, answer with citations.

Authority: the selected wiki's `SCHEMA.md` when present; otherwise inspect its catalogue and layout. The destination's status, freshness, contradiction, and evidence conventions govern the answer. One deliberate override: this skill never performs the write half of the schema's Query operation (filing answers back, query log entries, commits). Persistence is a separate `/wiki-ingest` transaction. When the same user request asks to both look up and save, finish the lookup, then hand the result to wiki-ingest as its own transaction; otherwise mention wiki-ingest only when filing the answer back would clearly pay.

Never author or edit wiki pages, catalogues, or logs, and never create commits. The sole permitted mutations are in the stale-state recovery below: a fast-forward synchronisation of a clean `~/wiki` checkout, followed by a qmd index refresh when it pulled anything. Never pull a containing project repository as part of a lookup.

## Pick the destination, then the collection

Project root: the workspace root the harness reports; otherwise the nearest ancestor of the working directory containing `.git`, `CLAUDE.md`, or `AGENTS.md`; otherwise the working directory itself.

- A question specific to the current or an explicitly named project: that project's `<project root>/wiki/` when it exists.
- Project-scoped question, no project wiki: `~/wiki/`, including its `pages/<project>/` routing-exception area.
- Cross-project knowledge, reusable tooling, personal setup, personal facts: `~/wiki/`.
- Scope genuinely spans both: search both destinations.

Map each selected wiki to a qmd collection by absolute path via `mcp__qmd__status`, never by name-guessing. A destination with no matching collection is searched on the filesystem instead: read its `SCHEMA.md` or sniff the layout first, and do not assume `pages/` or `index.md` exist (project layouts vary, e.g. `concepts/`, `entities/`, `sources/`).

## Search: map first, bodies last

1. Skim the destination's `index.md` or equivalent catalogue to spot canonical pages and disambiguate terms.
2. For destinations with a qmd collection: one `mcp__qmd__query` call, explicitly scoped via `collections` to the selected collection names (omitting it searches every collection) and always with `intent`. Sub-queries: `lex` for exact terms from the question and known aliases (names, IDs, error strings), `vec` for the question's meaning, `hyde` (a short hypothetical answer passage, roughly 50 to 100 words) when the vocabulary or likely answer is unclear.
3. `rg -n -i` over the destination's page directories for concrete identifiers qmd may rank poorly (dates, codes, file paths), and as the recovery when a page written earlier this session is not yet indexed.
4. Destinations without a collection: add a separate synonym/paraphrase text search; exact terms alone miss reworded overlap.

Never answer from search snippets. Retrieve each shortlisted page in full and follow `related:` links and `[[wikilinks]]` one hop when a page points at a more specific one. Retrieval: `mcp__qmd__get` with `#docid` for individual results; `mcp__qmd__multi_get` only with globs or fully qualified `qmd://<collection>/<path>` values, never unqualified relative paths across collections (same-named files like `index.md` and `SCHEMA.md` collide).

## Answer discipline

- Cite each supporting page as a clickable absolute path resolved from its own wiki root; never an unqualified qmd-relative path.
- Preserve every qualifier the destination's schema defines: page status, freshness, contradiction markers, evidence strength. For the global wiki specifically: flag `ruled-out` and `snapshot` pages as such, and treat `[source: conversation, weak]` as a claim with no retained evidence. Do not transfer global-wiki meanings to a project wiki unless its own conventions define them.
- Report `last_compiled` when freshness materially affects the answer; do not invent a staleness threshold the destination does not define.
- A `<!-- CONTRADICTION -->` marker (or the destination's equivalent) near a cited claim is reported, never silently resolved into one side.
- Distinguish what the wiki states from what you infer across pages; keep the hedge the pages support.
- The wiki not answering is a valid result: say so and name the nearest pages found.
- Never quote secrets or unrelated personal data from pages beyond what the question needs.

## Stale-state recovery

When the selected destination is `~/wiki/` and the complete initial search finds no answer, run this once before concluding absence:

1. `git -C ~/wiki status --porcelain` must be empty; then `git -c core.hooksPath=/dev/null -C ~/wiki pull --ff-only` (hook suppression keeps the recovery deterministic; the post-merge hook would otherwise run a full lint).
2. Dirty checkout, no usable upstream, diverged history, or a failed pull: do not stash, merge, rebase, or reset. State that remote freshness could not be verified and answer from the unchanged local state.
3. If the pull advanced `HEAD`: run `qmd update && qmd embed` (`update` has no working collection filter in qmd 2.5.3, so this refreshes every configured collection), then search again through qmd and `rg` before concluding absence.
