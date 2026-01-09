# ast-grep-lsp

Claude Code plugin providing ast-grep language server for structural code search and analysis.

## Description

[ast-grep](https://ast-grep.github.io/) is a fast and polyglot tool for code structural search, lint, and rewriting. This plugin integrates the ast-grep language server with Claude Code for PHP files.

## Features

- Structural code search using AST patterns
- Code linting based on custom rules
- Real-time diagnostics

## Supported File Extensions

| Extension | Language |
|-----------|----------|
| `.php`    | PHP      |
| `.phtml`  | PHP      |
| `.inc`    | PHP      |

## Requirements

- ast-grep (`sg`) installed at `/opt/homebrew/bin/sg`
- Configuration file at `~/.ast-grep/sgconfig.yml`

### Installation

```bash
brew install ast-grep
```

## Configuration

The LSP server is configured with:

```json
{
  "ast-grep": {
    "command": "/opt/homebrew/bin/sg",
    "args": ["lsp", "-c", "~/.ast-grep/sgconfig.yml"],
    "extensionToLanguage": {
      ".php": "php",
      ".phtml": "php",
      ".inc": "php"
    },
    "maxRestarts": 3,
    "restartOnCrash": true
  }
}
```

## Schema Reference

The `.lsp.json` schema was extracted from Claude Code binary version 2.0.55.

To verify or update the schema for newer versions:

```bash
strings ~/.local/share/claude/versions/2.0.55/claude | grep -A 50 'extensionToLanguage'
```

### Available Fields

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Path to LSP server executable |
| `args` | No | Command line arguments |
| `extensionToLanguage` | Yes | Map of file extensions to language IDs (min 1) |
| `transport` | No | `"stdio"` (default) or `"socket"` |
| `env` | No | Environment variables |
| `initializationOptions` | No | LSP initialization options |
| `settings` | No | LSP workspace settings |
| `workspaceFolder` | No | Override workspace folder |
| `startupTimeout` | No | Timeout for server startup (ms) |
| `shutdownTimeout` | No | Timeout for server shutdown (ms) |
| `restartOnCrash` | No | Auto-restart on crash |
| `maxRestarts` | No | Maximum restart attempts |

## Author

Marjo van Lier <marjo.vanlier@gmail.com>
