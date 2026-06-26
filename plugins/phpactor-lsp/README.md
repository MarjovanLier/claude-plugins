# phpactor-lsp

Claude Code plugin providing PHP language support by multiplexing two language servers behind a single LSP: [intelephense](https://intelephense.com/) for completion and diagnostics, and [phpactor](https://phpactor.readthedocs.io/) for refactoring and code actions.

## Description

Claude Code accepts only one language server per file type. To run intelephense and phpactor together, this plugin points Claude Code at [lspx](https://github.com/thefrontside/lspx), a language server multiplexer that starts both servers, fans each request out to both, and merges their responses.

Intelephense handles completion and diagnostics; phpactor adds refactorings and code actions that intelephense does not provide.

## Features

- Intelligent code completion and diagnostics (intelephense)
- Refactoring: extract method, rename, move class (phpactor)
- Code generation: implement interface, override methods (phpactor)
- Go to definition / find references (both, merged)
- Class generation and transformation (phpactor)
- Import management (phpactor)

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

All three executables must be on your `PATH`:

- `lspx` (the multiplexer)
- `intelephense`
- `phpactor`

### Installing lspx

lspx is a Deno CLI with no published binary, so compile it once. Deno >= 2.0 is needed only for the build; the result is a self-contained binary.

```bash
# Install Deno if needed: brew install deno
git clone --depth 1 https://github.com/thefrontside/lspx
cd lspx
deno task compile            # produces dist/lspx
mv dist/lspx ~/.local/bin/   # any directory on your PATH

lspx --help                  # verify
```

### Installing the language servers

```bash
# intelephense
npm install -g intelephense

# phpactor: standalone phar
curl -Lo phpactor.phar https://github.com/phpactor/phpactor/releases/latest/download/phpactor.phar
chmod +x phpactor.phar
mv phpactor.phar ~/.local/bin/phpactor

# phpactor alternatives
composer global require phpactor/phpactor   # via Composer
brew install phpactor                       # via Homebrew
```

## Configuration

`.lsp.json` launches lspx, which starts both servers and merges their responses:

```json
{
  "php": {
    "command": "lspx",
    "args": [
      "--lsp", "intelephense --stdio",
      "--lsp", "phpactor language-server"
    ],
    "extensionToLanguage": {
      ".php": "php",
      ".phtml": "php",
      ".php3": "php",
      ".php4": "php",
      ".php5": "php",
      ".phps": "php"
    },
    "transport": "stdio",
    "initializationOptions": {},
    "settings": {}
  }
}
```

lspx supervises both backends and restarts either if it crashes, so the unsupported `maxRestarts` and `restartOnCrash` fields are not used.

> Note: phpactor refuses to start when the client sends a null root URI, and lspx exits if a backend dies. Claude Code provides a workspace root, so this only bites if you launch the server outside a project.

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
