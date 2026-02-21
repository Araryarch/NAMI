#!/bin/bash

# Test script to verify NAMI VSCode extension syntax highlighting

set -e

echo "🧪 Testing NAMI VSCode Extension..."
echo ""

# Check if extension is built
if [ ! -f "nami-language-0.1.0.vsix" ]; then
    echo "❌ Extension not built. Run ./build.sh first"
    exit 1
fi

echo "✅ Extension package found"

# Check if VSCode is installed
if ! command -v code &> /dev/null; then
    echo "❌ VSCode 'code' command not found"
    echo "   Install VSCode and add it to PATH"
    exit 1
fi

echo "✅ VSCode found"

# Check if extension is installed
if code --list-extensions | grep -q "Araryarch.nami-language"; then
    echo "✅ Extension is installed"
else
    echo "⚠️  Extension not installed"
    echo "   Installing now..."
    code --install-extension nami-language-0.1.0.vsix
    echo "✅ Extension installed"
fi

# Create test file
TEST_FILE="test-syntax.nm"
cat > "$TEST_FILE" << 'EOF'
// NAMI Syntax Highlighting Test
// This file tests all syntax elements

// 1. Comments
/* Block comment
   Multiple lines */

// 2. Keywords
let x = 10;
const y = 20;
function test() {
  if (x > 5) {
    return true;
  } else {
    return false;
  }
}

// 3. Strings
let str1 = "double quotes";
let str2 = 'single quotes';
let str3 = `template ${x}`;

// 4. Numbers
let decimal = 42;
let float = 3.14;
let hex = 0xFF;
let binary = 0b1010;

// 5. Booleans and null
let bool1 = true;
let bool2 = false;
let nothing = null;

// 6. Functions
function add(a, b) {
  return a + b;
}

let arrow = (x) => x * 2;

// 7. Built-in functions
println("Hello");
print("World");

// 8. Control flow
for (let i = 0; i < 10; i++) {
  if (i % 2 == 0) {
    continue;
  }
  break;
}

while (x > 0) {
  x--;
}

// 9. Operators
let sum = x + y;
let diff = x - y;
let prod = x * y;
let quot = x / y;
let mod = x % y;
let eq = x == y;
let neq = x != y;
let and = x && y;
let or = x || y;

// 10. Arrays and Objects
let arr = [1, 2, 3];
let obj = { name: "test", value: 42 };
EOF

echo "✅ Test file created: $TEST_FILE"
echo ""
echo "📋 Expected syntax highlighting:"
echo "   - Purple/Pink: let, const, function, if, else, return, for, while"
echo "   - Orange: All strings (\"...\", '...', \`...\`)"
echo "   - Yellow: Function names (test, add, arrow, println, print)"
echo "   - Light Green: Numbers (10, 20, 42, 3.14, 0xFF, 0b1010)"
echo "   - Green Italic: Comments (// and /* */)"
echo "   - Blue: true, false, null"
echo ""
echo "🚀 Opening test file in VSCode..."
code "$TEST_FILE"

echo ""
echo "📝 Manual verification steps:"
echo "   1. Check bottom right corner shows 'NAMI' (not 'Plain Text')"
echo "   2. If it says 'Plain Text', click it and select 'NAMI'"
echo "   3. Press Ctrl+Shift+P → 'Developer: Reload Window'"
echo "   4. Verify colors match the expected list above"
echo "   5. Optional: Press Ctrl+K Ctrl+T → Select 'NAMI Dark' theme"
echo ""
echo "✨ If you see colors, syntax highlighting is working!"
echo "❌ If you see black/white, read TROUBLESHOOTING.md"
