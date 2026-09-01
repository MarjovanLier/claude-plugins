#!/bin/sh
# SessionStart (compact): stdout reaches the model's context. Instruct an
# auto-triggered wiki checkpoint sourced from the pre-compaction record.
input=$(cat)
. "$(dirname "$0")/lib.sh"
tp=$(json_field transcript_path)
sid=$(json_field session_id)
cwd=$(json_field cwd)
scope=$(scope_for "$cwd")
snap="$BASE/pending/$scope/${sid:-unknown}.jsonl"
mark="$BASE/consumed/$scope/${sid:-unknown}"

src="the session transcript at ${tp:-an unknown path}"
[ -f "$snap" ] && src="the pre-compaction snapshot at $snap (fallback: the session transcript at ${tp:-an unknown path})"

offset=""
[ -f "$mark" ] && offset=$(cat "$mark" 2>/dev/null)
case "$offset" in '' | *[!0-9]*) offset="" ;; esac
tail_msg=""
[ -n "$offset" ] && tail_msg=" Bytes up to $offset were consumed by an earlier checkpoint of this session; scan only the remainder (tail -c +$((offset + 1)))."

echo "Context was just compacted. Auto-trigger: run the wiki-checkpoint skill at the first natural stopping point (immediately if no task is in flight), unless a checkpoint already covered this conversation or the user said not to. Scan $src for durable findings; the compacted summary alone is not the evidence base.$tail_msg Apply the skill's snapshot consumption rules when the sweep completes."
exit 0
