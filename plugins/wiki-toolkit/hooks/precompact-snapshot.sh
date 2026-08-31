#!/bin/sh
# PreCompact: snapshot the session transcript so the wiki checkpoint can
# scan the full pre-compaction record after the context is compacted.
# ponytail: sed-based JSON field extraction; switch to jq if transcript
# paths ever contain escaped quotes.
input=$(cat)
tp=$(printf '%s' "$input" | sed -n 's/.*"transcript_path":"\([^"]*\)".*/\1/p')
sid=$(printf '%s' "$input" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p')
[ -n "$tp" ] && [ -f "$tp" ] || exit 0
dir="$HOME/.claude/wiki-checkpoint/pending"
mkdir -p "$dir"
# One snapshot per session, overwritten on each compaction of that session.
cp "$tp" "$dir/${sid:-unknown}.jsonl" 2>/dev/null || true
# Self-clean snapshots older than 30 days.
find "$dir" -name '*.jsonl' -mtime +30 -delete 2>/dev/null || true
exit 0
