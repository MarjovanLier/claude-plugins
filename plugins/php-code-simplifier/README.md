# PHP Code Simplifier

An agent that simplifies and refines PHP code for clarity, consistency, and maintainability while preserving all functionality.

## Features

- Follows PSR-12 coding standards
- Enforces PHP 8.x best practices
- Applies SOLID principles
- Respects Laravel conventions where applicable
- Maintains PHPDoc standards
- Focuses on recently modified code
- Preserves functionality while improving clarity

## Usage

Load the plugin:

```bash
claude --plugin-dir /path/to/plugins/php-code-simplifier
```

The agent will be available for use when Claude identifies opportunities to simplify PHP code. It focuses on recently modified code unless explicitly instructed otherwise.

## What It Does

The agent analyses PHP code and applies refinements that:

1. **Preserve Functionality** - Never changes what the code does, only how it does it
2. **Apply Project Standards** - Follows PSR-12 and project-specific conventions
3. **Enhance Clarity** - Simplifies structure, removes redundancy, improves naming
4. **Maintain Balance** - Avoids over-simplification that reduces clarity

## PHP-Specific Standards

- **Type Declarations**: Strict parameter, return, and property types
- **Constructor Promotion**: Uses PHP 8.0+ constructor property promotion
- **Match Expressions**: Prefers `match` over `switch` where appropriate
- **Named Arguments**: Uses named arguments for clarity
- **Null Coalescing**: Uses `??` and `??=` operators
- **Enumerations**: Uses PHP 8.1+ enums where applicable
- **Readonly Properties**: Uses `readonly` for immutable properties
