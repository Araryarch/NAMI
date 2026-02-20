# NAMI Programming Language

NAMI is a programming language designed for competitive programming and general-purpose development. It features JavaScript-like syntax while compiling to efficient C code.

## Project Status

🚧 **Under Development** - Core infrastructure is being built.

## Features (Planned)

- JavaScript-like syntax with familiar control flow
- Compiles to efficient C code
- Automatic memory management with garbage collection
- Built-in data structures for competitive programming (graphs, trees)
- Rich standard library with sorting algorithms
- Async/await support
- VSCode extension with LSP support

## Installation

```bash
# Install dependencies
npm install

# Build the compiler
npm run build

# Run tests
npm test
```

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
├── lib/              # Compiled JavaScript output
└── runtime/          # C runtime library (future)
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

The project uses a dual testing approach:

- **Unit Tests**: Specific examples and edge cases using Jest
- **Property-Based Tests**: Universal properties using fast-check (minimum 100 iterations)

Run tests:
```bash
npm test
```

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
