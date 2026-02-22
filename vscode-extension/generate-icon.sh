#!/bin/bash

# Generate icon.png from icon.svg
# This script tries multiple methods to convert SVG to PNG

cd "$(dirname "$0")/images"

echo "Generating icon.png from icon.svg..."

# Try ImageMagick
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    convert -background none -resize 128x128 icon.svg icon.png
    echo "✓ Icon generated successfully!"
    exit 0
fi

# Try Inkscape
if command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    inkscape icon.svg --export-type=png --export-filename=icon.png --export-width=128 --export-height=128
    echo "✓ Icon generated successfully!"
    exit 0
fi

# Try rsvg-convert
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    rsvg-convert -w 128 -h 128 icon.svg -o icon.png
    echo "✓ Icon generated successfully!"
    exit 0
fi

echo "❌ No SVG converter found!"
echo ""
echo "Please install one of the following:"
echo "  - ImageMagick: sudo apt install imagemagick (Linux) or brew install imagemagick (Mac)"
echo "  - Inkscape: sudo apt install inkscape (Linux) or brew install inkscape (Mac)"
echo "  - librsvg: sudo apt install librsvg2-bin (Linux) or brew install librsvg (Mac)"
echo ""
echo "Or convert manually using an online tool:"
echo "  https://cloudconvert.com/svg-to-png"
exit 1
