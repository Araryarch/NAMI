# Changelog

All notable changes to NAMI Language will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflows for multi-platform builds
- Standalone executable distribution using Bun
- Automated testing on Linux, macOS, and Windows
- Nightly builds
- Installation script for easy setup

## [0.1.0] - 2024-01-XX

### Added
- Initial release
- JavaScript-like syntax
- Compilation to C code
- Basic language features:
  - Variables (let, const)
  - Functions with parameters and return values
  - Arrays with methods (map, filter, push, pop)
  - Control flow (if/else, for, while)
  - Operators (arithmetic, comparison, logical)
  - String literals and operations
- CLI commands:
  - `nami run` - Compile and execute
  - `nami build` - Generate C code
  - `nami compile` - Create executable
  - `nami check` - Syntax checking
  - `nami ast` - View AST
- C runtime library
- Example programs
- Unit tests with Jest
- Example test suite
- Feature status checker

### Known Issues
- Infinite loop detection may trigger on valid nested loops
- String concatenation with + operator not fully supported
- Object literals not fully implemented
- Error handling (try/catch) not tested
- Async/await not implemented

## Release Types

- **Major** (x.0.0): Breaking changes
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

## Links

- [Releases](https://github.com/Araryarch/NAMI/releases)
- [Issues](https://github.com/Araryarch/NAMI/issues)
- [Pull Requests](https://github.com/Araryarch/NAMI/pulls)
