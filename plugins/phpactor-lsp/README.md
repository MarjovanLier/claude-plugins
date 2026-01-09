# phpactor-lsp

Claude Code plugin providing phpactor language server for refactoring and code actions.

## Description

[Phpactor](https://phpactor.readthedocs.io/) is a PHP completion, refactoring, and introspection tool. This plugin integrates the phpactor language server with Claude Code.

## Features

- Intelligent code completion
- Refactoring (extract method, rename, move class, etc.)
- Code generation (implement interface, override methods)
- Go to definition / Find references
- Class generation and transformation
- Import management

## Supported File Extensions

| Extension | Language |
|-----------|----------|
| `.php`    | PHP      |
| `.phtml`  | PHP      |
| `.php3`   | PHP      |
| `.php4`   | PHP      |
| `.php5`   | PHP      |
| `.phps`   | PHP      |

## Requirements

- phpactor installed and available in PATH

### Installation

```bash
# Via Composer (global)
composer global require phpactor/phpactor

# Via Homebrew
brew install phpactor
```

## Configuration

The LSP server is configured with:

```json
{
  "php": {
    "command": "phpactor",
    "args": ["language-server"],
    "extensionToLanguage": {
      ".php": "php",
      ".phtml": "php",
      ".php3": "php",
      ".php4": "php",
      ".php5": "php",
      ".phps": "php"
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
