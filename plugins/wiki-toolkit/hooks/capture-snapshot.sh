#!/bin/sh
# Capture the session transcript into the project-scoped pending queue so a
# later checkpoint can scan the full record (WC-48, WC-50).
# Usage: capture-snapshot.sh precompact|session-end   (hook JSON on stdin)
event="${1:-precompact}"
input=$(cat)
. "$(dirname "$0")/lib.sh"
tp=$(json_field transcript_path)
sid=$(json_field session_id)
cwd=$(json_field cwd)

# Bounded retention runs on every invocation, not only successful captures
# (WC-50): transcripts 30 days, stale temp files 1 day, watermarks 180 days.
find "$BASE/pending" "$BASE/blocked" -name '*.jsonl' -mtime +30 -delete 2>/dev/null
find "$BASE/pending" -name '.*.tmp' -mtime +1 -delete 2>/dev/null
find "$BASE/consumed" -type f -mtime +180 -delete 2>/dev/null

[ -n "$tp" ] && [ -f "$tp" ] || exit 0

scope=$(scope_for "$cwd")
pend="$BASE/pending/$scope"
snap="$pend/${sid:-unknown}.jsonl"
mark="$BASE/consumed/$scope/${sid:-unknown}"

size=$(wc -c < "$tp" | tr -d ' ')
consumed=0
[ -f "$mark" ] && consumed=$(cat "$mark" 2>/dev/null)
case "$consumed" in '' | *[!0-9]*) consumed=0 ;; esac

# Truncation (WC-50): a transcript SMALLER than its watermark means the
# recorded byte offset no longer maps onto this file. Leave any existing
# snapshot intact, surface the error, never treat it as consumed.
if [ "$size" -lt "$consumed" ]; then
  echo "wiki-checkpoint: transcript $tp ($size bytes) is smaller than its consumed watermark ($consumed); session ${sid:-unknown} needs manual recovery before offset-based consumption resumes." >&2
  exit 1
fi
# Fully consumed, nothing new to capture.
[ "$size" -eq "$consumed" ] && exit 0

if [ -f "$snap" ]; then
  # Refresh only when the transcript grew past the existing snapshot;
  # refresh is floor-free (WC-50).
  old=$(wc -c < "$snap" | tr -d ' ')
  [ "$size" -le "$old" ] && exit 0
elif [ "$event" = "session-end" ]; then
  # New session-end candidates must clear a noise floor on the UNCONSUMED
  # delta; PreCompact captures every non-empty suffix, floor-free.
  floor="${WIKI_CHECKPOINT_FLOOR:-32768}"
  case "$floor" in '' | *[!0-9]*) floor=32768 ;; esac
  [ $((size - consumed)) -lt "$floor" ] && exit 0
fi

umask 077
tmp="$pend/.${sid:-unknown}.tmp"
trap 'rm -f "$tmp"' EXIT HUP INT TERM
if ! mkdir -p "$pend" || ! cp "$tp" "$tmp" || ! mv -f "$tmp" "$snap"; then
  echo "wiki-checkpoint: failed to snapshot $tp to $snap" >&2
  exit 1
fi
exit 0
