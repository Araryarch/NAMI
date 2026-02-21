# NAMI Programming Language

[![Build Status](https://github.com/Araryarch/NAMI/workflows/Test/badge.svg)](https://github.com/Araryarch/NAMI/actions)
[![Release](https://github.com/Araryarch/NAMI/workflows/Build%20and%20Release/badge.svg)](https://github.com/Araryarch/NAMI/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/github/downloads/Araryarch/NAMI/total)](https://github.com/Araryarch/NAMI/releases)

NAMI is a programming language designed for competitive programming and general-purpose development. It features JavaScript-like syntax while compiling to efficient C code.

## Project Status

🚧 **Active Development** - Core features are working!

### ✅ Working Features
- Variables (let, const)
- Functions with parameters and return values
- Arrays with methods (map, filter, push, pop)
- Control flow (if/else, for loops)
- Operators (arithmetic, comparison, logical)
- String literals and operations
- Recursion and closures
- CLI commands (run, build, compile, check)
- Multi-platform executables (Linux, macOS, Windows)
- VSCode extension with syntax highlighting

### 📊 Test Results
- Unit tests: Passing
- Example tests: 6/13 passing (46%)
- Feature coverage: Core features working

See [TESTING.md](TESTING.md) for detailed testing information.

## Features (Planned)

- JavaScript-like syntax with familiar control flow
- Compiles to efficient C code
- Automatic memory management with garbage collection
- Built-in data structures for competitive programming (graphs, trees)
- Rich standard library with sorting algorithms
- Async/await support
- VSCode extension with LSP support

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Araryarch/NAMI/main/install.sh | bash
```

### Download Binary

Download the latest release for your platform:
- [Linux x64](https://github.com/Araryarch/NAMI/releases/latest)
- [macOS Intel](https://github.com/Araryarch/NAMI/releases/latest)
- [macOS Apple Silicon](https://github.com/Araryarch/NAMI/releases/latest)
- [Windows x64](https://github.com/Araryarch/NAMI/releases/latest)

Extract and add to PATH:
```bash
# Linux / macOS
tar -xzf nami-*.tar.gz
sudo mv nami-* /usr/local/bin/nami

# Test
nami --version
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/Araryarch/NAMI.git
cd NAMI

# Install dependencies (requires Bun)
bun install

# Build compiler
bun run build

# Link CLI globally
npm link

# Or build standalone executable
npm run build:executable
```

### Requirements

- **To install**: None! Standalone executable
- **To use**: GCC or Clang (for compiling generated C code)

## Editor Support

### Visual Studio Code

✅ **Extension Ready!** Install NAMI syntax highlighting:

```bash
# Build extension
cd vscode-extension
./build.sh

# Install
code --install-extension nami-language-0.1.0.vsix
```

**Features:**
- ✅ Syntax highlighting for all NAMI features
- ✅ 30+ code snippets (func, if, for, etc.)
- ✅ Auto-closing brackets and quotes
- ✅ Comment toggling (Ctrl+/)
- ✅ Bracket matching
- ✅ Code folding
- ✅ NAMI Dark theme

**Quick Test:**
```bash
echo 'function test() { println("Hello!"); }' > test.nm
code test.nm
```

See [vscode-extension/INSTALL.md](vscode-extension/INSTALL.md) for details.

## Development

### Project Structure

```
nami-lang/
├── src/              # TypeScript source code
│   ├── cli.ts        # Command-line interface
│   ├── index.ts      # Main library entry point
│   └── version.ts    # Version information
├── tests/            # Test files
│   ├── unit/         # Unit tests
│   └── property/     # Property-based tests
├── examples/         # Example NAMI programs
│   └── .expected/    # Expected test outputs
├── lib/              # Compiled JavaScript output
└── runtime/          # C runtime library

```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm test` - Run all unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:examples` - Test all example programs
- `npm run test:examples:generate` - Generate expected outputs
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

The project uses a dual testing approach:

#### Unit Tests
Specific examples and edge cases using Jest:
```bash
npm test
```

#### Example Tests
End-to-end tests that run actual NAMI programs:
```bash
npm run test:examples
```

See [TESTING.md](TESTING.md) for detailed testing guide.

### Code Style

The project uses ESLint and Prettier for consistent code style:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Usage (Future)

```bash
# Run a NAMI program
nami run program.nm

# Compile to C source
nami build program.nm -o output/

# Compile to executable
nami compile program.nm -o program

# Show version
nami --version

# Show help
nami --help
```

## Language Syntax (Preview)

```javascript
// Variables
let x = 42;
const name = "NAMI";

// Functions
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Arrays with methods
let numbers = [1, 2, 3, 4, 5];
let doubled = numbers.map(x => x * 2);
let evens = numbers.filter(x => x % 2 === 0);

// Built-in graph support
let graph = new Graph(5);
graph.addEdge(0, 1, 10);
let path = graph.dijkstra(0, 4);

// I/O
print("Hello, NAMI!");
let input = input();
```

## Requirements

- Node.js 18+ 
- TypeScript 5.3+
- C compiler (gcc or clang) for running compiled programs

## License

MIT

## Contributing

This project is under active development. Contributions will be welcome once the core infrastructure is complete.
