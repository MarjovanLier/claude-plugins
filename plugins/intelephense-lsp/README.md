# intelephense-lsp

Claude Code plugin providing Intelephense PHP language server for code intelligence, completion, and diagnostics.

## Description

[Intelephense](https://intelephense.com/) is a high-performance PHP language server offering comprehensive code intelligence. This plugin integrates Intelephense with Claude Code.

## Features

- Code completion with automatic imports
- Go to definition / Find references
- Hover information with documentation
- Signature help
- Diagnostics and error detection
- Code formatting
- Workspace symbol search

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

- Intelephense installed at `/opt/homebrew/bin/intelephense`
- (Optional) Intelephense licence key for premium features

### Installation

```bash
npm install -g intelephense
```

## Configuration

The LSP server is configured with:

```json
{
  "php": {
    "command": "/opt/homebrew/bin/intelephense",
    "args": ["--stdio"],
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

### Licence Key

To enable premium features, set the `INTELEPHENSE_LICENCE_KEY` environment variable:

```bash
export INTELEPHENSE_LICENCE_KEY="your-licence-key"
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
