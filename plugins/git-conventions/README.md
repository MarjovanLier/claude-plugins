# git-conventions

Claude Code plugin bundling git workflow skills.

## Skills

| Skill | Purpose |
|-------|---------|
| `conventional-commit` | Create, validate, convert, and fix commit messages against the Conventional Commits standard |
| `contribution-description` | Generate a merge request or pull request description (title plus one-paragraph summary) from branch commits and the JIRA ticket |

## Usage

```bash
/conventional-commit create
/conventional-commit validate
/contribution-description [base-branch] [feature-branch]
```

Both skills also trigger automatically when preparing commits or writing MR/PR descriptions.

## Notes

- `contribution-description` looks up JIRA tickets via the Atlassian MCP when available; without it, the description is built from commit messages alone.
- Commit messages follow the repository's own scope rules; check the repo README for defined scopes.
