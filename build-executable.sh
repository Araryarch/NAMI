#!/bin/bash

# Build standalone NAMI executable using Bun
# Usage: ./build-executable.sh [platform]
# Platforms: linux, macos, macos-arm, windows, all

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           NAMI Executable Builder (Bun)                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Error: Bun is not installed${NC}"
    echo "Install Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Build TypeScript first
echo -e "${BLUE}Building TypeScript...${NC}"
bun run build

# Create dist directory
mkdir -p dist

# Function to build for a platform
build_platform() {
    local platform=$1
    local output=$2
    
    echo -e "${BLUE}Building for ${platform}...${NC}"
    
    # Build executable
    bun build lib/cli.js --compile --outfile "dist/${output}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Built: dist/${output}${NC}"
        
        # Copy runtime
        if [[ "$platform" == "windows" ]]; then
            # Create zip for Windows
            (cd dist && zip -r "${output%.exe}.zip" "${output}" ../runtime/)
            echo -e "${GREEN}✓ Created: dist/${output%.exe}.zip${NC}"
        else
            # Create tarball for Unix
            chmod +x "dist/${output}"
            tar -czf "dist/${output}.tar.gz" -C dist "${output}" -C .. runtime/
            echo -e "${GREEN}✓ Created: dist/${output}.tar.gz${NC}"
        fi
    else
        echo -e "${YELLOW}✗ Failed to build ${platform}${NC}"
    fi
    
    echo ""
}

# Determine what to build
PLATFORM=${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}

case "$PLATFORM" in
    linux)
        build_platform "linux" "nami-linux-x64"
        ;;
    darwin|macos)
        build_platform "macos" "nami-macos-x64"
        ;;
    macos-arm|darwin-arm)
        build_platform "macos-arm" "nami-macos-arm64"
        ;;
    windows|win)
        build_platform "windows" "nami-windows-x64.exe"
        ;;
    all)
        echo -e "${YELLOW}Building for all platforms...${NC}"
        echo ""
        build_platform "linux" "nami-linux-x64"
        build_platform "macos" "nami-macos-x64"
        build_platform "macos-arm" "nami-macos-arm64"
        build_platform "windows" "nami-windows-x64.exe"
        ;;
    *)
        echo -e "${YELLOW}Unknown platform: $PLATFORM${NC}"
        echo ""
        echo "Usage: $0 [platform]"
        echo ""
        echo "Platforms:"
        echo "  linux       - Linux x64"
        echo "  macos       - macOS x64 (Intel)"
        echo "  macos-arm   - macOS ARM64 (Apple Silicon)"
        echo "  windows     - Windows x64"
        echo "  all         - Build for all platforms"
        echo ""
        echo "Default: Current platform"
        exit 1
        ;;
esac

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Executables are in the dist/ directory"
echo ""
echo "To test:"
echo "  ./dist/nami-* --version"
echo ""
