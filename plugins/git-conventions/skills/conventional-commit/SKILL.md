---
name: conventional-commit
description: Create and validate commit messages following the Conventional Commits standard. Use when committing code, reviewing commit messages, converting existing commits to conventional format, or when someone asks about commit message formatting. Also use proactively when preparing commits to ensure compliance, and when a commit linter (commitlint or a commit-msg hook) rejects a commit message and the last commit needs correcting and amending.
argument-hint: "[create|validate|convert|fix] [optional message, branch, or linter output]"
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

Only these types are permitted:

| Type | Emoji | Purpose |
|------|-------|---------|
| `feat` | ✨ | New feature |
| `fix` | 🐛 | Bug fix |
| `docs` | 📚 | Documentation only changes |
| `style` | 💎 | Formatting, whitespace, semicolons (no code meaning change) |
| `refactor` | 📦 | Code change that neither fixes a bug nor adds a feature |
| `perf` | 🚀 | Code change that improves performance |
| `test` | 🚨 | Adding missing tests or correcting existing tests |
| `build` | 🛠 | Build system or external dependency changes |
| `ci` | ⚙️ | CI configuration files and scripts |
| `chore` | ♻️ | Other changes that do not modify src or test files |
| `revert` | 🗑 | Reverts a previous commit |

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
8. Write the full message to a temporary file and commit with `git commit -F /tmp/commit-msg.txt`, then remove the file. Never pass a multi-line message with `-m`.
9. Verify with `git show --stat HEAD` that only the intended files were committed.

When `/conventional-commit validate` is invoked:
1. Run `git log --format="%h %s" -20`, or limit to the range named in the provided arguments.
2. Check each message against `<type>[scope]: <description>` using only the permitted types in the table above.
3. Check each description: sentence case, imperative mood, no trailing full stop.
4. Check a body is present (run `git log --format="%h|%b" -20` and flag commits with an empty body).
5. Flag any commit that mixes multiple types of change.
6. Report one line per commit: ✅ when compliant, ❌ with the specific violation named.

When `/conventional-commit convert` is invoked:
1. IF the provided arguments name a branch, run `git log <base>..<branch> --format="%h %s"` (base is `main`, or `develop` when `main` does not exist). Otherwise run `git log --format="%h %s" -20`.
2. For each non-compliant message, output the original message and a corrected conventional message directly below it.
3. Suggest only; never rewrite history in this mode. Amending is the fix mode's job and applies only to the most recent commit.

When `/conventional-commit fix` is invoked, or a commit linter (commitlint or a commit-msg hook) has rejected the last commit message:
1. Collect the linter output: from the provided arguments or from the conversation. If none is available, validate the last commit message against this standard yourself and treat every violation found as the linter output.
2. Read the current message with `git log -1 --format=%B`.
3. Rewrite the message so every reported violation is corrected. Keep the original meaning, keep the type and scope accurate to the actual change, wrap body lines at 72 characters, and preserve trailers such as `Signed-off-by`.
4. Safety check before amending: run `git branch -r --contains HEAD`. If the commit exists on any remote branch, STOP and report that amending would require a force-push; show the corrected message instead.
5. Write the corrected message to a temporary file and amend with `git commit --amend -F /tmp/commit-msg.txt`. The `-F` route avoids shell quoting issues and preserves the pre-wrapped body. Remove the temporary file afterwards.
6. The commit-msg hook re-runs on amend. If it rejects again, read its new output and repeat from step 3.

When invoked without arguments or with just a message:
1. Validate the provided message against the standard
2. Suggest improvements if non-compliant
3. If no message provided, check the most recent commit

## Validation Checklist

- [ ] Type is from the permitted list
- [ ] Scope matches repository-defined scopes (if required)
- [ ] Description is sentence case
- [ ] Description uses imperative mood
- [ ] No trailing full stop in description
- [ ] Commit contains only one type of change
- [ ] Breaking changes marked with `!` or `BREAKING CHANGE:` footer
- [ ] Body present and explains "why" not "what"

## Repository Scope Discovery

Before creating commits, check for repository-specific scopes:
1. Read `README.md` in the repository root
2. Look for a "Scopes" or "Conventional Commits" section
3. If scopes are defined, use them; if scope is mandatory, always include one
4. If no scopes are defined, omit scope unless the change area is obvious
