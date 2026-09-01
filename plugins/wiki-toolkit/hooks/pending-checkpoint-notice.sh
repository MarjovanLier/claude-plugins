#!/bin/sh
# SessionStart (startup|resume): flag unconsumed wiki-checkpoint snapshots
# belonging to THIS project (WC-48). A pending snapshot means an earlier
# session captured knowledge whose checkpoint never ran. Foreign-project and
# legacy unscoped snapshots are counted informationally, never auto-routed.
# ponytail: 60-minute age floor keeps a concurrent session's fresh snapshot
# out of this session's sweep; tighten to session-id ownership if that ever
# proves too coarse.
input=$(cat)
. "$(dirname "$0")/lib.sh"
cwd=$(json_field cwd)
scope=$(scope_for "$cwd")

stale=""
[ -d "$BASE/pending/$scope" ] && stale=$(find "$BASE/pending/$scope" -name '*.jsonl' -mmin +60 2>/dev/null)
if [ -n "$stale" ]; then
  printf 'Unconsumed wiki-checkpoint snapshot(s) for this project:\n%s\nAn earlier session captured these but its wiki checkpoint never ran, so their durable findings were not ingested. Tell the user, and run the wiki-checkpoint skill scanning those snapshots at the first natural stopping point (immediately if no task is in flight), unless the user says not to. Apply the skill'\''s snapshot consumption rules per snapshot: scan only bytes after each session'\''s consumed watermark.\n' "$stale"
fi

blocked=$(find "$BASE/blocked/$scope" -name '*.jsonl' 2>/dev/null | wc -l | tr -d ' ')
[ "${blocked:-0}" -gt 0 ] && printf '%s checkpoint snapshot(s) for this project are blocked awaiting user intervention (see %s); mention this once, do not auto-run them.\n' "$blocked" "$BASE/blocked/$scope"

legacy=$(find "$BASE/pending" -maxdepth 1 -name '*.jsonl' 2>/dev/null | wc -l | tr -d ' ')
[ "${legacy:-0}" -gt 0 ] && printf '%s legacy unscoped snapshot(s) sit in %s; their project cannot be inferred from the filename, so they need manual review, never an automatic sweep into this project.\n' "$legacy" "$BASE/pending"

foreign=$(find "$BASE/pending" -mindepth 2 -name '*.jsonl' -not -path "$BASE/pending/$scope/*" 2>/dev/null | wc -l | tr -d ' ')
[ "${foreign:-0}" -gt 0 ] && printf 'Informational: %s pending snapshot(s) belong to other projects and will be offered there.\n' "$foreign"
exit 0
