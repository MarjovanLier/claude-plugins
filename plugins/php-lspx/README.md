# php-lspx

Claude Code plugin providing PHP language support by fanning one LSP connection out to four language servers: [intelephense](https://intelephense.com/) for completion and typed hover, [phpactor](https://phpactor.readthedocs.io/) for refactoring and code actions, phpantom-lsp for navigation, semantic tokens and external analysers, and phpforge for ported PHP Hammer and EA Extended inspections.

## Description

Claude Code accepts only one language server per file type. To run several together, this plugin points Claude Code at `bin/lspfan`, a small multiplexer that starts every configured server, forwards each request to all of them, and merges the replies.

It replaces [lspx](https://github.com/thefrontside/lspx), which the plugin used until version 2.0.0. lspx hangs Claude Code indefinitely on `textDocument/hover` and `textDocument/documentSymbol`: it forwards server-to-client requests such as `workspace/configuration` and `client/registerCapability` to a client that never answers them, then waits forever for a merge that cannot complete, with no timeout. Claude Code's side of that is tracked in [issue #32595](https://github.com/anthropics/claude-code/issues/32595) and [issue #16360](https://github.com/anthropics/claude-code/issues/16360), both still unresolved.

## What lspfan does differently

- **Answers server-to-client requests itself.** A proxy sits in the middle, so it replies to `workspace/configuration` with one empty object per requested item and to `client/registerCapability` with `null`, rather than forwarding them to a client that ignores them.
- **Puts a deadline on every fan-out.** 5 seconds per request, 20 seconds for the handshake, both overridable with `LSPFAN_TIMEOUT` and `LSPFAN_INIT_TIMEOUT`. A slow or silent backend degrades the answer instead of hanging the editor.
- **Treats a failing backend as an abstention.** An error response, a crash, or a missed handshake drops that server from the fan-out. It never takes the process down.
- **Merges diagnostics per URI.** `publishDiagnostics` replaces the whole list for a file, so without merging the last server to publish would erase every other server's findings.

Merge rules: list results concatenate and deduplicate, completion items merge into one list, hover blocks stack separated by a rule, anything else takes the first non-null answer.

Set `LSPFAN_LOG=/path/to/file` to trace dispatch decisions.

## Features

- Code completion merged across servers (intelephense, phpantom-lsp)
- Typed hover, showing each server's view of the symbol
- Go to definition, find references, go to implementation, document symbols
- Refactoring: extract method, rename, move class (phpactor)
- Code generation: implement interface, override methods (phpactor)
- Import management (phpactor, phpantom-lsp)
- PHP Hammer and EA Extended inspections with a fix-all code action (phpforge)
- Diagnostics merged from intelephense, phpantom-lsp, phpforge, phpactor, phpstan, mago and mago-lint

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

`lspfan` needs only Python 3, which macOS and most Linux distributions already provide. Install it and the four servers onto your `PATH`:

```bash
# the multiplexer, shipped with this plugin
install -m 755 bin/lspfan ~/.local/bin/lspfan

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

```json
{
  "php": {
    "command": "lspfan",
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

Server order no longer matters, unlike under lspx where the last-listed server's reply could replace the others on completion and hover.

> Note: phpactor's phpcs provider defaults `php_code_sniffer.bin` to `%project_root%/vendor/bin/phpcs`. In a project without that binary it returns output phpactor cannot parse and exits 255, costing you every phpactor code action for that request. lspfan treats it as an abstention and keeps serving the other servers; lspx died on it, taking the whole chain down. Fix it by pointing `php_code_sniffer.bin` at a phpcs that exists, or disable the provider with `"php_code_sniffer.enabled": false`. Note that phpcs ships no PER ruleset, so on a PER-CS codebase php-cs-fixer with `@PER-CS3x0` is the better style checker. Either way the setting belongs in `~/.config/phpactor/phpactor.json`: phpactor reads only that global file, and a project-level `.phpactor.json` is ignored.

> Note: results appear once per answering server, so a class shows up in `documentSymbol` as many times as there are servers that implement it. That is inherent to fanning out.

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
