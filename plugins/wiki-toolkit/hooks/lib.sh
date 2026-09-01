#!/bin/sh
# Shared helpers for wiki-checkpoint hooks. Source it; do not execute it.
# ponytail: sed-based JSON field extraction; switch to jq if hook JSON ever
# carries escaped quotes or backslashes in these fields.

BASE="$HOME/.claude/wiki-checkpoint"

# json_field <name>: extract a top-level string field from hook JSON in $input.
json_field() {
  printf '%s' "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
}

# scope_for <cwd>: collision-safe project scope for the queue (WC-48).
# Canonical root: git toplevel, else the nearest ancestor carrying a project
# marker (matches the spec's project-root definition), else the directory
# itself. Readable slug for manual inspection, truncated to stay under
# NAME_MAX, plus a path checksum because slash-to-hyphen slugs are not
# injective (/x/a-b/c and /x/a/b-c collide).
scope_for() {
  root=$(git -C "${1:-.}" rev-parse --show-toplevel 2>/dev/null)
  if [ -z "$root" ]; then
    d="${1:-$PWD}"
    root="$d"
    while [ -n "$d" ] && [ "$d" != "/" ]; do
      if [ -e "$d/.git" ] || [ -e "$d/CLAUDE.md" ] || [ -e "$d/AGENTS.md" ]; then
        root="$d"
        break
      fi
      d=$(dirname "$d")
    done
  fi
  root=$(cd "$root" 2>/dev/null && pwd -P || printf '%s' "$root")
  fp=$(printf '%s' "$root" | cksum | cut -d' ' -f1)
  slug=$(printf '%s' "$root" | tr '/' '-' | tail -c 180)
  printf '%s--%s' "$slug" "$fp"
}
