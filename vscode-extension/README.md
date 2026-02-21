# NAMI Language Support for Visual Studio Code

Syntax highlighting and language support for the NAMI programming language.

## Features

- **Syntax Highlighting** - Full syntax highlighting for NAMI code
- **Code Snippets** - Quick snippets for common patterns
- **Auto-closing** - Automatic closing of brackets, quotes, etc.
- **Comment Toggling** - Easy comment/uncomment with keyboard shortcuts
- **Bracket Matching** - Matching bracket highlighting
- **Code Folding** - Fold/unfold code blocks
- **Custom Theme** - NAMI Dark theme optimized for NAMI code

## Installation

### From VSIX (Recommended)

1. Download the latest `.vsix` file from [releases](https://github.com/Araryarch/NAMI/releases)
2. Open VSCode
3. Go to Extensions (Ctrl+Shift+X)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

### From Source

```bash
cd vscode-extension
npm install
npm run package
code --install-extension nami-language-*.vsix
```

## Usage

Once installed, `.nm` files will automatically use NAMI syntax highlighting.

### Snippets

Type these prefixes and press Tab:

| Prefix | Description |
|--------|-------------|
| `func` | Function declaration |
| `arrow` | Arrow function |
| `if` | If statement |
| `ifelse` | If-else statement |
| `for` | For loop |
| `forof` | For-of loop |
| `while` | While loop |
| `try` | Try-catch block |
| `class` | Class declaration |
| `log` | println() |
| `let` | Variable declaration |
| `const` | Constant declaration |
| `arr` | Array declaration |
| `obj` | Object declaration |
| `map` | Array map |
| `filter` | Array filter |
| `main` | Main function template |

### Theme

To use the NAMI Dark theme:
1. Press Ctrl+K Ctrl+T
2. Select "NAMI Dark"

## Syntax Highlighting

The extension provides highlighting for:

- Keywords (if, else, for, while, function, etc.)
- Operators (arithmetic, comparison, logical)
- Strings (single, double, template)
- Numbers (decimal, hex, binary, octal)
- Comments (line and block)
- Functions (built-in and user-defined)
- Constants (true, false, null, undefined)
- Built-in functions (println, print, input, etc.)

## Example

```nami
// Function with syntax highlighting
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
const evens = numbers.filter(x => x % 2 == 0);

// Output
println(doubled);
println(evens);
```

## Requirements

- Visual Studio Code 1.80.0 or higher

## Known Issues

None currently. Please report issues at [GitHub Issues](https://github.com/Araryarch/NAMI/issues).

## Release Notes

### 0.1.0

- Initial release
- Syntax highlighting for NAMI language
- Code snippets
- NAMI Dark theme
- Auto-closing pairs
- Bracket matching
- Code folding

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/Araryarch/NAMI/blob/main/CONTRIBUTING.md).

## License

MIT License - see [LICENSE](https://github.com/Araryarch/NAMI/blob/main/LICENSE) for details.

## Links

- [NAMI Language](https://github.com/Araryarch/NAMI)
- [Documentation](https://github.com/Araryarch/NAMI#readme)
- [Report Issues](https://github.com/Araryarch/NAMI/issues)
