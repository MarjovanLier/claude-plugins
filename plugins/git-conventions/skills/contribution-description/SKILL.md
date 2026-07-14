---
name: contribution-description
description: Generate a merge request or pull request contribution description (title plus one-paragraph summary) from branch commits and the JIRA ticket. Use when the user asks to write or prepare an MR/PR description, raise a merge request, or describe a finished work branch. Not for git commit messages (use the conventional-commit skill for those). Pass base and feature branch as arguments when known.
argument-hint: "[base-branch] [feature-branch]"
---

Generate a code contribution description (title and summary paragraph) for: $ARGUMENTS

## Purpose

Produce a Markdown document containing exactly two elements and nothing more:

1. A title line in the format `<ticketId> (<type>) <description>`
2. A `## Summary` section containing one prose paragraph of 3 to 5 sentences

The description must draw on Conventional Commit messages (defined in the `conventional-commit` skill), use Keep a Changelog change types, and use South African English spelling (organisation, behaviour, analyse).

## Procedure

Follow the steps below in order. Do not skip a step. Do not reorder steps. Each step states exactly what to run, what to look at, and what decision to make.

### Step 1: Determine the branches (MANDATORY FIRST STEP)

`$ARGUMENTS` holds the input from the invocation. It may be empty when this skill triggers automatically.

**IF `$ARGUMENTS` contains two branch names:**

- `BASE_BRANCH` = the first name
- `FEATURE_BRANCH` = the second name

**IF `$ARGUMENTS` contains exactly one branch name:**

- `BASE_BRANCH` = that name
- `FEATURE_BRANCH` = the output of `git branch --show-current`

**IF `$ARGUMENTS` is empty or contains no branch name, infer both:**

1. `FEATURE_BRANCH` = the output of `git branch --show-current`
2. `BASE_BRANCH` = `main` if `git show-ref --verify --quiet refs/heads/main` succeeds; otherwise `develop` if `git show-ref --verify --quiet refs/heads/develop` succeeds; otherwise inference fails
3. IF `FEATURE_BRANCH` is empty (detached HEAD), or `FEATURE_BRANCH` equals `BASE_BRANCH`, or inference failed: display the message below (run `git branch -a --format="%(refname:short)"` and insert up to the first 10 branch names), then STOP. Do not run any further git commands. Do not generate a description.

```
Please provide branch arguments.

Usage: /contribution-description [base-branch] [feature-branch]

Examples:
  /contribution-description main
  /contribution-description develop feature/AUTH-123
  /contribution-description main feature/user-auth

Available branches:
[insert the branch names here]

Instructions:
1. Base branch: The branch you want to merge into (typically 'main' or 'develop')
2. Feature branch: The branch containing your changes (defaults to current branch if not specified)

Please re-run the command with the appropriate branch arguments.
```

Before continuing, state which branches are being compared: `Comparing: FEATURE_BRANCH -> BASE_BRANCH`.

### Step 2: Verify both branches exist

Run:

```bash
git show-ref --verify --quiet refs/heads/$BASE_BRANCH || echo "Warning: Base branch $BASE_BRANCH not found locally"
git show-ref --verify --quiet refs/heads/$FEATURE_BRANCH || echo "Warning: Feature branch $FEATURE_BRANCH not found locally"
```

IF either warning prints, tell the user which branch was not found and STOP.

### Step 3: Read every commit title and body

Run:

```bash
git log $BASE_BRANCH..$FEATURE_BRANCH --format="%h|%s|%b|%an|%ae|%ad" --date=short --reverse
```

Field meaning: `%h` short hash, `%s` commit title, `%b` commit body, `%an` author name, `%ae` author email, `%ad` author date.

Commit titles follow the Conventional Commits format `<type>[optional scope]: <description>`. Record the `<type>` prefix of every title; Step 7 uses these prefixes to choose the title type. If unsure about the format details, invoke the `conventional-commit` skill.

Read the title AND the body of every commit. Both feed the Summary. Merge behaviour discards commit bodies when the work branch merges to main, so the contribution description is where their content survives. Commit bodies often contain:

- **Rationale**: why the change was made, not just what changed
- **Technical context**: implementation decisions and trade-offs considered
- **Related issues**: references to tickets, discussions, or documentation
- **Breaking changes**: details about backwards compatibility impacts
- **Testing notes**: what was tested and how

IF the log output is empty, tell the user there are no commits between the branches and STOP.

### Step 4: Inspect the diff (bounded)

Commit titles and bodies are the primary source for the Summary. The diff is only for verifying them and filling gaps.

Run:

```bash
git diff $BASE_BRANCH...$FEATURE_BRANCH --stat
```

Decision rule: IF, after Step 3, you can clearly state what every significant change does, do NOT read any file diffs; proceed to Step 5. IF a change remains unclear, read the diff of at most the 5 most-changed files, one file at a time:

```bash
git diff $BASE_BRANCH...$FEATURE_BRANCH -- <file-path>
```

Never read the full diff of a large branch; the Summary does not need it.

### Step 5: Detect the JIRA ticket ID

A JIRA ticket ID matches the pattern `[A-Z]+-[0-9]+`, for example `AUTH-123`.

Check these sources in order; the FIRST match wins:

1. The feature branch name: `echo "$FEATURE_BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1`
2. The commit titles: `git log $BASE_BRANCH..$FEATURE_BRANCH --format="%s" | grep -oE '[A-Z]+-[0-9]+' | head -1`

IF no ticket ID is found in either source: skip Step 6, use the title format `(<type>) <description>` without a ticket ID, and mention in your chat response (not in the description document) that no ticket was detected.

### Step 6: Look up the JIRA ticket via the Atlassian MCP

1. IF the Atlassian tools are deferred, load them with ONE ToolSearch call: query `select:mcp__claude_ai_Atlassian__getJiraIssue,mcp__claude_ai_Atlassian__getAccessibleAtlassianResources`
2. Call `mcp__claude_ai_Atlassian__getAccessibleAtlassianResources` and take the `cloudId` from the result.
3. Call `mcp__claude_ai_Atlassian__getJiraIssue` with that `cloudId` and the ticket ID from Step 5 as `issueIdOrKey`.
4. From the result, note three things: the ticket's summary, its description (this supplies the problem or motivation for the Summary paragraph), and its issue type (this informs the title type in Step 7).

IF the MCP server is unavailable or the ticket is not found: continue with commit information alone, and mention in your chat response (not in the description document) that the ticket lookup failed.

### Step 7: Choose the title type

Pick exactly ONE type from: Added | Changed | Deprecated | Removed | Fixed | Security.

First, count the Conventional Commit type prefixes recorded in Step 3. `feat` commits signal added functionality; `fix` and `revert` commits signal corrections; all other types (`refactor`, `perf`, `style`, `docs`, `test`, `build`, `ci`, `chore`) signal changes to existing code. The dominant signal is the one with the most commits.

Then apply these rules in order; the first rule that matches wins:

1. Any commit fixes a security vulnerability (judge from titles and bodies; the commit standard has no `security` type, so these arrive as `fix` commits): use `Security`
2. The dominant signal is `fix` or `revert`: use `Fixed`
3. The changes remove functionality (breaking commits marked `!` that delete features, or removal described in commit bodies): use `Removed`
4. The changes mark functionality as deprecated: use `Deprecated`
5. The dominant signal is `feat`: use `Added`
6. Anything else (refactors, dependency updates, mixed work with no dominant signal): use `Changed`

### Step 8: Compose the title

Format: `<ticketId> (<type>) <description>` (or `(<type>) <description>` when Step 5 found no ticket).

Rules:

- Capitalise the first letter of the description
- No trailing full stop
- Keep the description under 50 characters
- Describe what the branch achieves as a whole, not a single commit

### Step 9: Write the Summary paragraph

Write ONE paragraph of 3 to 5 sentences, as prose. Rules:

1. No bullet lists, no sub-headings, no code blocks inside the Summary.
2. Sentence 1: the problem or motivation. Take this from the JIRA ticket description (Step 6); if there is no ticket, take it from the commit bodies.
3. Middle sentences: what changed. Take this from the commit titles and bodies (Step 3).
4. Final sentence: the user-visible impact. For pure refactors, state explicitly that there is no behavioural change.
5. Do NOT open with "This PR introduces", "This contribution", or similar filler.
6. Do NOT restate the title; every sentence must add information the title does not already carry.
7. Use South African English spelling.

### Step 10: Output the description

Output exactly this document and nothing else inside it (no extra sections, no statistics, no commentary):

```markdown
# <ticketId> (<type>) <description>

## Summary
<the paragraph from Step 9>
```

## Final checklist

Before responding, verify every item:

- [ ] Branches were determined (from arguments or inferred defaults) and stated before any analysis ran
- [ ] Every commit title and body between the branches was read
- [ ] The JIRA ticket was looked up via the Atlassian MCP (or its absence was reported in chat)
- [ ] The title type is one of: Added, Changed, Deprecated, Removed, Fixed, Security
- [ ] The title description is under 50 characters, capitalised, with no trailing full stop
- [ ] The Summary is one prose paragraph of 3 to 5 sentences with no bullets
- [ ] The Summary ends with user-visible impact or an explicit statement of no behavioural change
- [ ] The document contains only the title and the Summary section
