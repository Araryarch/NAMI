# Nami Developer Tooling

This directory contains the developer tooling components for the Nami programming language:

## Components

- **cli/**: Enhanced CLI interface with debugging and development tools
- **lsp/**: Language Server Protocol implementation
- **token-provider/**: Token provider service for lexical analysis
- **diagnostic/**: Diagnostic engine for error reporting and analysis
- **syntax-highlighting/**: Syntax highlighting grammars (TextMate and Tree-sitter)
- **vscode-extension/**: VS Code extension for Nami language support
- **shared/**: Shared interfaces, types, and utilities

## Architecture

The tooling follows a modular architecture where:
- Core services (Token Provider, Diagnostic Engine) expose functionality
- Higher-level tools (CLI, LSP Server) consume these services
- Editor integrations (VS Code extension) communicate with LSP server
- All components share common error types and configuration models