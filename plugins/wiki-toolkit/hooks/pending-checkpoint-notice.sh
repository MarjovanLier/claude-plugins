#!/bin/sh
# SessionStart (startup|resume): flag unconsumed wiki-checkpoint snapshots.
# A snapshot left in pending/ means a previous session compacted but its
# checkpoint never ran, so that session's durable findings were not ingested.
# ponytail: 60-minute age floor keeps a concurrent session's fresh snapshot
# out of this session's sweep; tighten to session-id ownership if that ever
# proves too coarse.
dir="$HOME/.claude/wiki-checkpoint/pending"
[ -d "$dir" ] || exit 0
stale=$(find "$dir" -name '*.jsonl' -mmin +60 2>/dev/null)
[ -n "$stale" ] || exit 0
printf 'Unconsumed wiki-checkpoint snapshot(s) from a previous session:\n%s\nThat session compacted but its wiki checkpoint never ran, so its durable findings were not ingested. Tell the user, and run the wiki-checkpoint skill scanning those snapshots at the first natural stopping point (immediately if no task is in flight), unless the user says not to. Delete each consumed snapshot once its sweep completes.\n' "$stale"
exit 0
