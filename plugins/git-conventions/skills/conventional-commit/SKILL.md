---
name: conventional-commit
description: Create and validate commit messages following the Conventional Commits standard. Use when committing code, reviewing commit messages, converting existing commits to conventional format, or when someone asks about commit message formatting. Also use proactively when preparing commits to ensure compliance, and when a commit linter (commitlint or a commit-msg hook) rejects a commit message and the last commit needs correcting and amending.
argument-hint: "[create|validate|convert|fix] [optional message, branch, or linter output]"
version: 1.0.1
---

# Conventional Commits

All commit descriptions for commits to work branches must use the [Conventional Commits](https://www.conventionalcommits.org/) standard.

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

Resolve the permitted set in this order; the first that applies wins:

1. **The repository's own policy.** A `commitlint` config (`.commitlintrc*`, `commitlint.config.*`, or a `commitlint` key in `package.json`), a documented type list in `README.md`, or an equivalent declared standard. Follow it exactly.
2. **A declared ADR-1 repository.** Use the core 11 only: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
3. **Otherwise**, the full set below.

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace, semicolons (no code meaning change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `build` | Build system or external dependency changes |
| `ci` | CI configuration files and scripts |
| `chore` | Other changes that do not modify src or test files |
| `revert` | Reverts a previous commit |
| `security` | Security fixes and hardening |
| `deps` | Dependency-only changes |
| `config` | Configuration changes |
| `release` | Release versioning |

Never reject a type the repository itself permits. ADR-1's narrower list is a work-branch discipline, not a universal rule.

**One type per commit.** A commit must contain only one type of change. This is a discipline enforced through code review.

## Scope Rules

- Scopes are **optional** unless the repository mandates them
- Each repository defines its own scopes (documented in `README.md` at repo root)
- Scopes help communicate the **impact area** of the change
- Example scopes: `api`, `service`, `lib`, `cron`
- Format: lowercase, no spaces, e.g. `feat(api): Add invoice export`

## Description Rules

- Short summary of the change
- Sentence case (capitalise first letter)
- No full stop at the end
- Imperative mood ("Add feature" not "Added feature")
- This description is preserved in merge commit messages

## Body and Footer

- A body is **required** on every commit (house rule; the standard itself marks the body optional)
- The body explains **why** the change was made, not what changed
- Footers are optional
- **Important**: Body and footer are lost when merging work branch to main branch
- Use footer for references: `Refs: #123` or `BREAKING CHANGE: description`

## Breaking Changes

- Add `!` after type/scope: `feat(api)!: Remove legacy endpoint`
- Or add `BREAKING CHANGE:` in the footer
- Both methods are valid; the `!` suffix is preferred for visibility

## Merge Commits

Work branch merge commits to main use a **different standard**:
- The conventional commit messages from the work branch become part of the merge commit body
- Individual commit descriptions are preserved as a changelog within the merge message

## Instructions

When `/conventional-commit create` is invoked:
1. Run `git diff --staged --stat`. IF the output is empty, tell the user nothing is staged and STOP.
2. Run `git diff --staged` to understand what changed.
3. Determine the type from the table above. IF the staged changes span more than one type, list the files grouped per type, suggest splitting into separate commits, and STOP unless the user accepts a single type.
4. Check `README.md` at the repository root for defined scopes. IF scopes are defined, use the matching one. IF scope is marked required, never omit it. IF no scopes are defined, include a scope only when the impact area is obvious.
5. Write the description: sentence case, imperative mood, no trailing full stop, 10 to 50 characters.
6. Write the body (required): explain why the change is being made, with every line wrapped at 72 characters.
7. Append any trailers the repository's hooks or rules require (for example `Signed-off-by: Name <email>`).
8. Commit with `git commit -F -`, passing the full message on standard input. Never pass a multi-line message with `-m`. Standard input avoids shell quoting problems, preserves the pre-wrapped body, and leaves no shared temporary file for a concurrent session to clobber. If a file is genuinely needed, use a uniquely named one in the session scratchpad directory and remove it afterwards.
9. Verify with `git show --stat HEAD` that only the intended files were committed.

When `/conventional-commit validate` is invoked:
1. Run `git log --format="%h %s" -20`, or limit to the range named in the provided arguments.
2. Check each message against `<type>[scope]: <description>` using only the permitted types in the table above.
3. Check each description: sentence case, imperative mood, no trailing full stop.
4. Check a body is present (run `git log --format="%h|%b" -20` and flag commits with an empty body).
5. Flag any commit that mixes multiple types of change.
6. Report one line per commit: ✅ when compliant, ❌ with the specific violation named.

When `/conventional-commit convert` is invoked:
1. IF the provided arguments name a branch, run `git log 'main..the-branch' --format="%h %s"`, substituting the real refs as a single quoted argument. Do not write bare angle-bracket placeholders into the command: the shell reads `<base>` as a redirection and fails with `no such file or directory`. Resolve the base as the explicit argument, else the remote default from `git symbolic-ref refs/remotes/origin/HEAD`, else `main`, else `develop`; ask if none resolves. Otherwise run `git log --format="%h %s" -20`.
2. For each non-compliant message, output the original message and a corrected conventional message directly below it.
3. Suggest only; never rewrite history in this mode. Amending is the fix mode's job and applies only to the most recent commit.

When `/conventional-commit fix` is invoked, or a commit linter has rejected a message:

**Step 0 (MANDATORY): decide whether a commit actually exists.**

A `commit-msg` hook rejects *before* the commit object is written. The commit was never created, `HEAD` still points at the previous, unrelated commit, and the changes are still staged. Amending in that state rewrites the wrong commit and folds the staged work into it.

The deciding evidence is WHERE the rejection came from, not the state of the tree. A local `commit-msg` or `pre-commit` hook rejects a commit that was never created (Branch A). A CI commitlint run, a review comment, or the user pointing at a commit all concern a commit that exists (Branch B). Establish that first:

```bash
git rev-parse --verify -q HEAD || echo "UNBORN: no commit exists yet"
git status --porcelain
git log -1 --format='%h %s' 2>/dev/null
```

Then classify:

- `UNBORN` printed: there is no commit to amend under any circumstances. Branch A, always.
- The rejection came from a local hook during a commit you just attempted: Branch A.
- The rejection names an existing commit (CI output, a SHA, "the last commit"): Branch B.
- **You cannot tell:** ASK. Do not guess. Staged files do not settle it, because a developer routinely has unrelated work staged while wanting the previous commit's message fixed, and that state satisfies both branches. Guessing wrong in this direction is the destructive one: it rewrites a good commit and folds unrelated work into it.

One caveat for Branch A: if the rejected attempt used `git commit -a` or a pathspec, the changes may not be in the index at all, so a bare `git commit` would commit nothing. Re-stage exactly what the original attempt covered, or re-run it with the same flags and the corrected message.

**Branch A: the commit was rejected and never created** (a `commit-msg` or `pre-commit` hook failed, and `HEAD` is an older commit unrelated to the staged work). This is the common case.
1. Collect the linter output from the arguments or the conversation.
2. Rewrite the message so every reported violation is corrected. Keep the type and scope accurate to the staged change, wrap body lines at 72 characters, and add any required trailers.
3. Re-run the original commit: `git commit -F -` with the corrected message on standard input. Never amend.
4. The hook re-runs. If it rejects again, read the new output and repeat from step 2.

**Branch B: a commit exists and its message is wrong** (CI commitlint flagged an existing commit, or the user names the `HEAD` commit explicitly).
1. Confirm with the user which commit is being corrected before touching it. Do not infer it from a hook failure.
2. Read the current message with `git log -1 --format=%B` and rewrite it as in Branch A step 2.
3. Publication check before amending: run `git fetch --all --quiet` (skip if offline, and say so), then `git branch -r --contains HEAD` and `git tag --contains HEAD`. If the commit is reachable from any remote ref or tag, STOP: report that amending would require a force-push and show the corrected message instead. If the fetch failed, STOP as well, because a blank result after a failed fetch proves nothing. A branch with no upstream is NOT a reason to stop: never having been pushed is precisely what makes amending safe.
4. Amend the message only: `git commit --amend --only -F -` with the corrected message on standard input. `--only` keeps the current index out of the commit, so unrelated staged work is not swept in. Piping via standard input avoids both shell quoting problems and a shared temporary file.
5. Verify with `git show --stat HEAD` that the message changed and the file list did not.

When invoked without arguments or with just a message:
1. Validate the provided message against the standard
2. Suggest improvements if non-compliant
3. If no message provided, check the most recent commit

