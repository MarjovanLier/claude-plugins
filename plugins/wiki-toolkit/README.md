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

## Notes

- Search-backed skills use the [qmd](https://github.com/tobi/qmd) MCP server where a collection exists and fall back to filesystem search (`rg`) otherwise.
- `wiki-lint` runs the wiki's own `scripts/lint_wiki.sh` (project-local, or the global one at `~/wiki/scripts/`), which also refreshes the qmd index.
