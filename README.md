# Claude Code Plugins

A collection of plugins for Claude Code CLI.

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [git-conventions](./plugins/git-conventions) | Git workflow skills: Conventional Commit messages and MR/PR contribution descriptions |
| [wiki-toolkit](./plugins/wiki-toolkit) | Skills for maintaining a Karpathy-style LLM wiki: ingest, lookup, checkpoint, lint |
| [funzies](./plugins/funzies) | Fun thinking-style skills: first-principles breakdowns and What Would Elon Do analysis |
| [intelephense-lsp](./plugins/intelephense-lsp) | PHP language server for code intelligence, completion, and diagnostics |
| [php-lspx](./plugins/php-lspx) | PHP language server: intelephense and phpactor multiplexed via lspx |
| [php-code-simplifier](./plugins/php-code-simplifier) | Agent that simplifies and refines PHP code for clarity and maintainability |

## Installation

### Add as Marketplace (Recommended)

Add this repository as a marketplace to browse and install plugins:

```bash
# From GitHub
/plugin marketplace add MarjovanLier/claude-plugins

# Or from local clone
/plugin marketplace add /path/to/claude-plugins
```

Then install plugins:

```bash
/plugin install plugin-name@marjo-claude-plugins
```

### Direct Plugin Load

Load a specific plugin directly:

```bash
claude --plugin-dir /path/to/plugins/plugin-name
```

## Plugin Structure

Each plugin follows this structure:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── README.md                # Plugin documentation
├── commands/                # Slash commands (/command-name)
│   └── command-name.md
├── skills/                  # Model-invoked capabilities
│   └── skill-name/
│       └── SKILL.md
├── agents/                  # Autonomous workers
│   └── agent-name.md
└── hooks/                   # Event-driven automation
    └── hooks.json
```

## Creating a New Plugin

1. Create a directory under `plugins/`
2. Add `.claude-plugin/plugin.json` with plugin metadata
3. Add components as needed (commands, skills, agents, hooks)
4. Update `marketplace.json` in the root `.claude-plugin/` directory
5. Test with `claude --plugin-dir /path/to/your/plugin`

## Testing Plugins Locally

```bash
# Load a specific plugin
claude --plugin-dir ./plugins/php-code-simplifier

# Verify commands are registered
/help

# Test agent availability
# The agent should appear in Task tool options
```

## Licence

MIT
