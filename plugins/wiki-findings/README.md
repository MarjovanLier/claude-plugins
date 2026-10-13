# wiki-findings

Claude Code plugin (a hooks module) that keeps the wiki checkpoint fed while you work. After each answer in an interactive session, Haiku checks whether the turn produced a durable finding. When it did, a tool-less fork of the session drafts each finding into `~/.claude/wiki-checkpoint/findings/<session-id>.jsonl`. Nothing is written to a wiki or a memory store until the checkpoint runs and verifies the drafts.

The behavioural contract is WC-57 to WC-60 on `pages/dev/wiki-checkpoint-spec-finding-queue.md` in the global wiki. It needs the `wiki-toolkit` plugin, whose checkpoint reads and files away the queue.

## Install

Opt-in per machine:

```
/plugin install wiki-findings@marjo-claude-plugins
```

`/plugin disable wiki-findings` turns it off. Without it, `wiki-toolkit` keeps its byte floor for session-end capture.

## What it does

- Starts `/wiki-toolkit:wiki-checkpoint` for this conversation once per session after four idle minutes, and once more when the context window passes 80 percent with new findings since the first run.
- Starts nothing for a loop, schedule, peer or plugin prompt; in a project with its own `wiki/` (the band asks you to run the checkpoint yourself); or while `ssh-add -l` lists no identity (the band says the checkpoint is due).
- Never checks a `claude -p` run or a checkpoint turn. It still creates the empty queue file in every session, which tells `wiki-toolkit` that a session with nothing queued needs no snapshot at session end.
- `/wiki-findings` prints the queue path, the count and the start status.

Cost: each flagged turn runs one fork that replays the whole session from the prompt cache.

## Develop

```bash
claude --plugin-dir ./plugins/wiki-findings
claude plugin validate ./plugins/wiki-findings
claude plugin test ./plugins/wiki-findings
```
