#!/bin/sh
# Stop: when this session's own snapshot is still pending at turn end, keep
# the turn open once so the checkpoint actually runs (WC-52). Measured
# 2026-09-01: the SessionStart:compact instruction alone was followed by a
# checkpoint in 5 of 30 compactions.
# ponytail: one nudge per snapshot version via a marker file; a refreshed
# snapshot (newer than the marker) re-arms it. Never nudge while already
# continuing from a stop hook.
input=$(cat)
. "$(dirname "$0")/lib.sh"
printf '%s' "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && exit 0
sid=$(json_field session_id)
cwd=$(json_field cwd)
scope=$(scope_for "$cwd")
snap="$BASE/pending/$scope/${sid:-unknown}.jsonl"
[ -f "$snap" ] || exit 0
nudge="$BASE/nudged/$scope/${sid:-unknown}"
if [ -f "$nudge" ] && [ ! "$snap" -nt "$nudge" ]; then exit 0; fi
mkdir -p "$(dirname "$nudge")" && touch "$nudge"
printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"Unconsumed wiki-checkpoint snapshot for this session at %s. Run the wiki-checkpoint skill now, scanning only bytes after the consumed watermark, and apply its snapshot disposition before ending the turn."}}\n' "$snap"
exit 0
