# wiki-toolkit

Claude Code plugin bundling skills for maintaining a Karpathy-style LLM wiki (a plain-markdown second brain, project-local in `<project>/wiki/` or global at `~/wiki/`).

## Skills

| Skill | Purpose |
|-------|---------|
| `wiki-ingest` | Ingest one explicitly identified input (URL, file, pasted text, finding) into the wiki as a single transaction |
| `wiki-lookup` | Read-only lookup of existing wiki knowledge, qmd-backed where a search collection exists |
| `wiki-checkpoint` | End-of-thread or pre-compaction sweep: capture durable findings, retrospective lessons, and memory updates |
| `wiki-lint` | Validate wiki structure and refresh the qmd search index |

## Usage

```bash
/wiki-ingest <url, file, or fact>
/wiki-lookup <topic>
/wiki-checkpoint
/wiki-lint
```

## Hooks

The hooks capture; the checkpoint consumes. Snapshots are project-scoped (`pending/<scope>/<session-id>.jsonl` under `~/.claude/wiki-checkpoint/`, scope = project-root slug plus path checksum) so one project's transcript is never swept into another project's wiki or memory.

- `PreCompact` and `SessionEnd` both run `capture-snapshot.sh`: an atomic, owner-only full transcript copy. PreCompact captures every non-empty unconsumed suffix; SessionEnd creates a new candidate only when the unconsumed delta clears a noise floor (`WIKI_CHECKPOINT_FLOOR`, default 32KB) but refreshes an existing pending snapshot floor-free whenever the transcript grew. Short non-compacting sessions below the floor stay uncovered by design.
- `SessionStart` (matcher `compact`) instructs the model to run `/wiki-checkpoint` at the first natural stopping point, scanning the snapshot (or transcript) rather than only the compacted summary, starting after the session's consumed byte watermark.
- `Stop` keeps the turn open once per snapshot version when this session's own snapshot is still pending, instructing the checkpoint to run now; a refreshed snapshot re-arms it, and it never fires while already continuing from a stop hook.
- `SessionStart` (matcher `startup|resume`) flags this project's unconsumed snapshots older than an hour; blocked, legacy-unscoped, and foreign-project snapshots are reported informationally, never auto-swept.

The checkpoint records a consumed byte watermark per session (`consumed/<scope>/<session-id>`, kept 180 days) and disposes of each snapshot: consumed (deleted), retained pending (transient failure, auto-retried), or moved to `blocked/` (needs user intervention, never auto-run). Snapshots self-clean after 30 days. Consolidation stays gated at episode boundaries (compaction, session end); nothing fires per turn.

## Notes

- Search-backed skills use the [qmd](https://github.com/tobi/qmd) MCP server where a collection exists and fall back to filesystem search (`rg`) otherwise.
- `wiki-lint` runs the wiki's own `scripts/lint_wiki.sh` (project-local, or the global one at `~/wiki/scripts/`), which also refreshes the qmd index.
