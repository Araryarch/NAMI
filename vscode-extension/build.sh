#!/bin/bash

# Build VSCode Extension using Bun

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         NAMI VSCode Extension Builder                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if vsce is installed
VSCE_CMD=""
if command -v vsce &> /dev/null; then
    VSCE_CMD="vsce"
elif [ -f "$HOME/.bun/bin/vsce" ]; then
    VSCE_CMD="$HOME/.bun/bin/vsce"
else
    echo -e "${YELLOW}Installing @vscode/vsce...${NC}"
    bun install -g @vscode/vsce
    VSCE_CMD="$HOME/.bun/bin/vsce"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    bun install
fi

# Clean old builds
rm -f *.vsix

# Package extension
echo -e "${BLUE}Packaging extension...${NC}"
$VSCE_CMD package --no-dependencies

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Build Complete!                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Find the .vsix file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -n "$VSIX_FILE" ]; then
    SIZE=$(ls -lh "$VSIX_FILE" | awk '{print $5}')
    echo -e "Extension package: ${GREEN}${VSIX_FILE}${NC} (${SIZE})"
    echo ""
    echo "To install:"
    echo -e "  ${BLUE}code --install-extension ${VSIX_FILE}${NC}"
    echo ""
    echo "Or in VSCode:"
    echo "  1. Press Ctrl+Shift+X (Extensions)"
    echo "  2. Click '...' menu → 'Install from VSIX...'"
    echo "  3. Select ${VSIX_FILE}"
    echo ""
    echo "To test syntax highlighting:"
    echo "  1. Open any .nm file"
    echo "  2. Syntax highlighting should work automatically"
    echo ""
else
    echo -e "${YELLOW}No .vsix file found${NC}"
    exit 1
fi
