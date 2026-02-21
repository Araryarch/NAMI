#!/bin/bash

# NAMI Language Installer
# Installs the latest release of NAMI

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REPO="Araryarch/NAMI"  # Update this with your GitHub repo
INSTALL_DIR="/usr/local/bin"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              NAMI Language Installer                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
    linux)
        PLATFORM="linux-x64"
        BINARY="nami-linux-x64"
        ARCHIVE="${BINARY}.tar.gz"
        ;;
    darwin)
        if [[ "$ARCH" == "arm64" ]]; then
            PLATFORM="darwin-arm64"
            BINARY="nami-macos-arm64"
        else
            PLATFORM="darwin-x64"
            BINARY="nami-macos-x64"
        fi
        ARCHIVE="${BINARY}.tar.gz"
        ;;
    mingw*|msys*|cygwin*)
        PLATFORM="win-x64"
        BINARY="nami-windows-x64.exe"
        ARCHIVE="${BINARY}.zip"
        echo -e "${YELLOW}Windows detected. Please download manually from:${NC}"
        echo "https://github.com/${REPO}/releases/latest"
        exit 0
        ;;
    *)
        echo -e "${RED}Unsupported OS: $OS${NC}"
        exit 1
        ;;
esac

echo -e "Detected platform: ${GREEN}${PLATFORM}${NC}"
echo ""

# Get latest release
echo "Fetching latest release..."
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_RELEASE" ]; then
    echo -e "${RED}Failed to fetch latest release${NC}"
    exit 1
fi

echo -e "Latest version: ${GREEN}${LATEST_RELEASE}${NC}"
echo ""

# Download URL
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_RELEASE}/${ARCHIVE}"

echo "Downloading from: $DOWNLOAD_URL"
echo ""

# Create temp directory
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Download
if ! curl -L -o "${TMP_DIR}/${ARCHIVE}" "$DOWNLOAD_URL"; then
    echo -e "${RED}Failed to download${NC}"
    exit 1
fi

# Extract
echo "Extracting..."
cd "$TMP_DIR"
if [[ "$ARCHIVE" == *.tar.gz ]]; then
    tar -xzf "$ARCHIVE"
else
    unzip -q "$ARCHIVE"
fi

# Check if we need sudo
if [ -w "$INSTALL_DIR" ]; then
    SUDO=""
else
    SUDO="sudo"
    echo -e "${YELLOW}Installing to $INSTALL_DIR requires sudo${NC}"
fi

# Install
echo "Installing to $INSTALL_DIR..."
$SUDO mv "$BINARY" "$INSTALL_DIR/nami"
$SUDO chmod +x "$INSTALL_DIR/nami"

# Install runtime
RUNTIME_DIR="/usr/local/share/nami/runtime"
echo "Installing runtime to $RUNTIME_DIR..."
$SUDO mkdir -p "$RUNTIME_DIR"
if [ -d "runtime" ]; then
    $SUDO cp -r runtime/* "$RUNTIME_DIR/"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Installation Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "NAMI has been installed to: $INSTALL_DIR/nami"
echo ""
echo "Test the installation:"
echo "  nami --version"
echo ""
echo "Get started:"
echo "  echo 'println(\"Hello, NAMI!\");' > hello.nm"
echo "  nami run hello.nm"
echo ""
echo "For more information, visit:"
echo "  https://github.com/${REPO}"
echo ""
