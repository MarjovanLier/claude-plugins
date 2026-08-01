# php-lspx

Claude Code plugin providing PHP language support by multiplexing four language servers behind a single LSP: [intelephense](https://intelephense.com/) for completion and diagnostics, [phpactor](https://phpactor.readthedocs.io/) for refactoring and code actions, phpantom-lsp, and phpforge for ported PHP Hammer and EA Extended inspections.

## Description

Claude Code accepts only one language server per file type. To run them together, this plugin points Claude Code at [lspx](https://github.com/thefrontside/lspx), a language server multiplexer that starts every configured server, fans each request out to all of them, and merges their responses.

Intelephense handles completion and diagnostics; phpactor adds refactorings and code actions that intelephense does not provide.

## Features

- Intelligent code completion and diagnostics (intelephense)
- Refactoring: extract method, rename, move class (phpactor)
- Code generation: implement interface, override methods (phpactor)
- Go to definition / find references (both, merged)
- Class generation and transformation (phpactor)
- Import management (phpactor, phpantom-lsp)
- PHP Hammer and EA Extended inspections with a fix-all code action (phpforge)

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

All five executables must be on your `PATH`:

- `lspx` (the multiplexer)
- `intelephense`
- `phpactor`
- `phpantom_lsp`
- `phpforge`

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

# phpantom-lsp
brew install phpantom-lsp

# phpforge (local crate)
cargo install --path /path/to/phpforge
```

## Configuration

`.lsp.json` launches lspx, which starts all four servers and merges their responses:

```json
{
  "php": {
    "command": "lspx",
    "args": [
      "--lsp", "phpantom_lsp --stdio",
      "--lsp", "phpforge lsp",
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

Server order matters. lspx merges diagnostics from every backend, but for
request/response methods (completion, hover) it does not always merge: with
phpantom listed last, its reply replaces intelephense's and phpactor's.
Listing phpantom first keeps intelephense authoritative for completion and
hover while phpantom still contributes diagnostics and code actions.

> Note: phpactor refuses to start when the client sends a null root URI, and lspx exits if a backend dies. Claude Code provides a workspace root, so this only bites if you launch the server outside a project.
>
> Note: lspx does not restart a failed backend, so the unsupported `maxRestarts` and `restartOnCrash` fields buy nothing. An error response from a backend takes the whole multiplexer down (exit 1). phpactor's outsourced code-action process does this on `textDocument/codeAction` when its php-cs-fixer or phpcs provider cannot parse the tool output.

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
| `initializationOptions` | No | LSP initialisation options |
| `settings` | No | LSP workspace settings |
| `workspaceFolder` | No | Override workspace folder |
| `startupTimeout` | No | Timeout for server startup (ms) |
| `shutdownTimeout` | No | Timeout for server shutdown (ms) |
| `restartOnCrash` | No | Auto-restart on crash |
| `maxRestarts` | No | Maximum restart attempts |

## Author

Marjo van Lier <marjo.vanlier@gmail.com>
