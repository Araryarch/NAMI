# VSCode Extension Development Guide

## Setup

```bash
cd vscode-extension
npm install
```

## Development

### Testing Locally

1. Open this folder in VSCode
2. Press F5 to launch Extension Development Host
3. Create a `.nm` file to test syntax highlighting
4. Make changes to grammar/snippets
5. Reload window (Ctrl+R) to see changes

### File Structure

```
vscode-extension/
├── package.json              # Extension manifest
├── language-configuration.json  # Language config
├── syntaxes/
│   └── nami.tmLanguage.json # Syntax grammar
├── snippets/
│   └── nami.json            # Code snippets
├── themes/
│   └── nami-dark.json       # Color theme
├── images/
│   ├── icon.png             # Extension icon
│   └── file-icon.svg        # File icon
└── README.md                # Extension docs
```

## Building

### Package Extension

```bash
# Install vsce if not installed
npm install -g @vscode/vsce

# Package
npm run package
# or
./build.sh
```

This creates a `.vsix` file that can be installed.

### Install Locally

```bash
code --install-extension nami-language-*.vsix
```

## Publishing

### Prerequisites

1. Create a [Visual Studio Marketplace](https://marketplace.visualstudio.com/) account
2. Create a [Personal Access Token](https://dev.azure.com/)
3. Create a publisher: `vsce create-publisher <name>`
4. Login: `vsce login <publisher>`

### Publish

```bash
# Publish to marketplace
npm run publish
# or
vsce publish
```

### Version Bump

```bash
# Patch (0.1.0 -> 0.1.1)
vsce publish patch

# Minor (0.1.0 -> 0.2.0)
vsce publish minor

# Major (0.1.0 -> 1.0.0)
vsce publish major
```

## Testing

### Manual Testing

1. Create test files in `test-files/`
2. Test all language features:
   - Keywords highlighting
   - String highlighting
   - Number highlighting
   - Comment highlighting
   - Function highlighting
   - Operator highlighting
3. Test snippets (type prefix + Tab)
4. Test auto-closing pairs
5. Test bracket matching
6. Test code folding

### Test Files

Create these test files:

```nami
// test-files/syntax.nm
// Test all syntax features

// Keywords
let x = 10;
const PI = 3.14;
function test() {}
if (true) {}
for (let i = 0; i < 10; i++) {}
while (false) {}

// Strings
let str1 = "double quotes";
let str2 = 'single quotes';
let str3 = `template ${x}`;

// Numbers
let dec = 42;
let hex = 0xFF;
let bin = 0b1010;
let oct = 0o77;
let float = 3.14;

// Comments
// Line comment
/* Block comment */

// Functions
println("test");
Math.floor(3.7);
array.map(x => x * 2);

// Operators
x + y;
x == y;
x && y;
x ? y : z;
```

## Customization

### Adding Keywords

Edit `syntaxes/nami.tmLanguage.json`:

```json
{
  "name": "keyword.control.nami",
  "match": "\\b(if|else|new_keyword)\\b"
}
```

### Adding Snippets

Edit `snippets/nami.json`:

```json
{
  "Snippet Name": {
    "prefix": "trigger",
    "body": [
      "line 1",
      "line 2"
    ],
    "description": "Description"
  }
}
```

### Modifying Theme

Edit `themes/nami-dark.json`:

```json
{
  "scope": ["keyword"],
  "settings": {
    "foreground": "#C586C0"
  }
}
```

## Debugging

### Enable Logging

1. Help → Toggle Developer Tools
2. Console tab shows extension logs

### Common Issues

**Syntax not highlighting:**
- Check file extension is `.nm`
- Reload window (Ctrl+R)
- Check grammar syntax in tmLanguage.json

**Snippets not working:**
- Check prefix doesn't conflict
- Verify JSON syntax
- Reload window

**Theme not applying:**
- Select theme: Ctrl+K Ctrl+T
- Check theme JSON syntax

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [TextMate Grammar](https://macromates.com/manual/en/language_grammars)
- [Scope Naming](https://www.sublimetext.com/docs/scope_naming.html)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Checklist Before Publishing

- [ ] Test all syntax highlighting
- [ ] Test all snippets
- [ ] Test on different themes
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Update README.md
- [ ] Create icon.png (128x128)
- [ ] Test installation from .vsix
- [ ] Check marketplace listing preview
