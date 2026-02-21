# Installation Guide

## Quick Install

### Method 1: From VSIX File

1. **Build the extension** (if not already built):
   ```bash
   cd vscode-extension
   ./build.sh
   ```

2. **Install in VSCode**:
   ```bash
   code --install-extension nami-language-0.1.0.vsix
   ```

3. **Reload VSCode**:
   - Press `Ctrl+Shift+P`
   - Type "Reload Window"
   - Press Enter

### Method 2: Manual Install via UI

1. **Build the extension**:
   ```bash
   cd vscode-extension
   ./build.sh
   ```

2. **Open VSCode**

3. **Go to Extensions**:
   - Press `Ctrl+Shift+X`
   - Or click Extensions icon in sidebar

4. **Install from VSIX**:
   - Click the `...` menu (top right of Extensions panel)
   - Select "Install from VSIX..."
   - Navigate to `vscode-extension/nami-language-0.1.0.vsix`
   - Click "Install"

5. **Reload VSCode** when prompted

## Verify Installation

1. **Create a test file**:
   ```bash
   echo 'function test() { println("Hello"); }' > test.nm
   ```

2. **Open in VSCode**:
   ```bash
   code test.nm
   ```

3. **Check syntax highlighting**:
   - Keywords should be purple/pink
   - Strings should be orange
   - Functions should be yellow
   - Comments should be green

## Using the Extension

### Syntax Highlighting

Open any `.nm` file and syntax highlighting will automatically apply.

### Code Snippets

Type these prefixes and press `Tab`:

| Prefix | Description |
|--------|-------------|
| `func` | Function declaration |
| `arrow` | Arrow function |
| `if` | If statement |
| `for` | For loop |
| `log` | println() |
| `let` | Variable declaration |

### Theme

To use NAMI Dark theme:
1. Press `Ctrl+K Ctrl+T`
2. Select "NAMI Dark"

## Troubleshooting

### Extension not showing up

1. Check if installed:
   ```bash
   code --list-extensions | grep nami
   ```

2. If not listed, try reinstalling:
   ```bash
   code --uninstall-extension Araryarch.nami-language
   code --install-extension nami-language-0.1.0.vsix
   ```

### Syntax highlighting not working

1. Check file extension is `.nm`
2. Reload window: `Ctrl+Shift+P` → "Reload Window"
3. Check VSCode version (requires 1.80.0+)

### Snippets not working

1. Make sure you're in a `.nm` file
2. Type the prefix exactly
3. Press `Tab` (not Enter)
4. Check if another extension conflicts

## Uninstall

```bash
code --uninstall-extension Araryarch.nami-language
```

Or via UI:
1. Go to Extensions (`Ctrl+Shift+X`)
2. Find "NAMI Language Support"
3. Click gear icon → "Uninstall"

## Building from Source

```bash
# Clone repository
git clone https://github.com/Araryarch/NAMI.git
cd NAMI/vscode-extension

# Install dependencies
bun install

# Build extension
./build.sh

# Install
code --install-extension nami-language-0.1.0.vsix
```

## Requirements

- Visual Studio Code 1.80.0 or higher
- Bun (for building from source)

## Support

- [Report Issues](https://github.com/Araryarch/NAMI/issues)
- [Documentation](https://github.com/Araryarch/NAMI)
