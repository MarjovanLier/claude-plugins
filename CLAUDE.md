# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a Claude Code plugin collection repository. Plugins extend Claude Code CLI with custom commands, skills, agents, and hooks.

## Testing Plugins

```bash
# Load a plugin for testing
claude --plugin-dir ./plugins/plugin-name

# Verify commands registered
/help

# Install from marketplace
/plugin install plugin-name@MarjovanLier/claude-plugins
```

## Architecture

### Plugin Registry

`.claude-plugin/marketplace.json` at the root registers all plugins with metadata (name, description, version, source path, category).

### Plugin Components

Each plugin in `plugins/` contains:

| Component | Location | Purpose |
|-----------|----------|---------|
| Manifest | `.claude-plugin/plugin.json` | Required metadata |
| Commands | `commands/*.md` | User-invoked `/command-name` |
| Skills | `skills/*/SKILL.md` | Model-invoked contextual capabilities |
| Agents | `agents/*.md` | Autonomous workers via Task tool |
| Hooks | `hooks/hooks.json` | Event-driven automation |

### Component Formats

**Commands** use YAML frontmatter:
```yaml
---
description: Brief for /help
argument-hint: [args]
allowed-tools: [Read, Glob]
---
Instructions using $ARGUMENTS, $1, $2...
```

**Skills** trigger on description phrases:
```yaml
---
name: skill-name
description: This skill should be used when the user asks to "trigger phrase"...
version: 1.0.0
---
```

**Agents** include examples for invocation:
```yaml
---
name: agent-name
description: Use when...
<example>Context/user/assistant/commentary</example>
model: sonnet
color: cyan
tools: ["Read"]
---
```

## Adding a New Plugin

1. Create `plugins/new-plugin/.claude-plugin/plugin.json`
2. Add components (commands, skills, agents, hooks)
3. Update root `.claude-plugin/marketplace.json`
4. Test with `claude --plugin-dir ./plugins/new-plugin`
