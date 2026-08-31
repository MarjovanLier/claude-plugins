#!/bin/sh
# SessionStart (compact): stdout reaches the model's context. Instruct an
# auto-triggered wiki checkpoint sourced from the pre-compaction record.
input=$(cat)
tp=$(printf '%s' "$input" | sed -n 's/.*"transcript_path":"\([^"]*\)".*/\1/p')
sid=$(printf '%s' "$input" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p')
snap="$HOME/.claude/wiki-checkpoint/pending/${sid:-unknown}.jsonl"
src="the session transcript at ${tp:-an unknown path}"
tail=""
if [ -f "$snap" ]; then
  src="the pre-compaction snapshot at $snap (fallback: the session transcript at ${tp:-an unknown path})"
  tail=" Delete the consumed snapshot after the checkpoint completes."
fi
echo "Context was just compacted. Auto-trigger: run the wiki-checkpoint skill at the first natural stopping point (immediately if no task is in flight), unless a checkpoint already covered this conversation or the user said not to. Scan $src for durable findings; the compacted summary alone is not the evidence base.$tail"
exit 0
