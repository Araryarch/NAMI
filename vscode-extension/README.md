# NAMI Language Support for Visual Studio Code

Official Visual Studio Code extension for the NAMI programming language.

## Features

### Syntax Highlighting

Full syntax highlighting support for NAMI language including:

- Keywords: `let`, `const`, `function`, `if`, `else`, `for`, `while`, `do`, `switch`, `case`, `try`, `catch`, `finally`, `return`, `break`, `continue`, `class`, `async`, `await`, `import`, `export`
- Built-in functions: `println`, `print`, `input`, `parseInt`, `parseFloat`
- String literals (single, double, and template strings)
- Numbers (decimal, hex, binary, octal)
- Comments (line and block)
- Operators and punctuation
- Array and object methods

### Code Snippets

Comprehensive snippets for common NAMI patterns:

- `func` - Function declaration
- `arrow` - Arrow function
- `if` / `ifelse` - Conditional statements
- `for` / `forof` / `while` / `dowhile` - Loops
- `try` / `tryf` - Error handling
- `switch` - Switch statement
- `class` - Class declaration
- `log` / `print` - Console output
- `printf` / `printlnf` - Formatted output
- `let` / `const` - Variable declarations
- `arr` / `obj` - Data structures
- `map` / `filter` / `reduce` - Array methods
- `async` / `await` - Async operations
- `import` / `export` - Module system
- `main` - Main function template

### File Icon

Custom file icon for `.nm` files in the VS Code file explorer.

## Installation

### From VSIX

1. Download `nami-language-0.1.0.vsix`
2. Open VS Code
3. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac) to open Extensions
4. Click the `...` menu → `Install from VSIX...`
5. Select the downloaded `.vsix` file

### From Command Line

```bash
code --install-extension nami-language-0.1.0.vsix
```

## Usage

Once installed, the extension will automatically:

- Recognize `.nm` files as NAMI language files
- Apply syntax highlighting
- Provide code snippets (type the prefix and press Tab)
- Show custom file icons

## Examples

### Using Snippets

Type `func` and press Tab:
```nami
function name(params) {
    // body
    return value;
}
```

Type `printlnf` and press Tab:
```nami
println(f, value);
```

### Syntax Highlighting

The extension provides rich syntax highlighting for all NAMI language features:

```nami
// Variables and constants
let count = 0;
const MAX = 100;

// Functions
function greet(name) {
    return `Hello, ${name}!`;
}

// Arrow functions
const add = (a, b) => a + b;

// Control flow
if (count < MAX) {
    println("Still counting...");
} else {
    println("Done!");
}

// Loops
for (let i = 0; i < 10; i++) {
    println(i);
}

// Arrays and objects
let numbers = [1, 2, 3, 4, 5];
let person = {name: "Alice", age: 30};

// Format printing
println(numbers);        // [1,2,3,4,5]
println(f, numbers);     // 1 2 3 4 5
```

## Building from Source

```bash
cd vscode-extension
./build.sh
```

This will create `nami-language-0.1.0.vsix` in the current directory.

## Development

### Prerequisites

- Node.js 16+
- Bun (optional, for faster builds)
- @vscode/vsce (for packaging)

### Project Structure

```
vscode-extension/
├── images/              # Extension and file icons
├── snippets/            # Code snippets
├── syntaxes/            # TextMate grammar
├── package.json         # Extension manifest
└── language-configuration.json  # Language configuration
```

### Testing

Open a `.nm` file in VS Code to test syntax highlighting and snippets.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see LICENSE file for details

## Links

- [NAMI Language Repository](https://github.com/Araryarch/NAMI)
- [Report Issues](https://github.com/Araryarch/NAMI/issues)

## Changelog

### 0.1.0

- Initial release
- Syntax highlighting for NAMI language
- Comprehensive code snippets
- File icon for `.nm` files
- Support for format printing (`println(f, value)`)
