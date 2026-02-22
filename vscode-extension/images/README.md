# NAMI Extension Icons

## Extension Icon (icon.png)

The extension icon should be a 128x128 PNG file.

### Creating the Icon

You can use the provided `icon.svg` as a base and convert it to PNG using:

**Option 1: Using ImageMagick**
```bash
convert -background none -resize 128x128 icon.svg icon.png
```

**Option 2: Using Inkscape**
```bash
inkscape icon.svg --export-type=png --export-filename=icon.png --export-width=128 --export-height=128
```

**Option 3: Using Node.js (sharp)**
```bash
npm install sharp
node -e "require('sharp')('icon.svg').resize(128, 128).png().toFile('icon.png')"
```

**Option 4: Online Converter**
- Go to https://cloudconvert.com/svg-to-png
- Upload `icon.svg`
- Set dimensions to 128x128
- Download as `icon.png`

### Design

The current design features:
- Purple gradient background (#667eea to #764ba2)
- White "N" letter (representing NAMI)
- Small wave decoration at the bottom
- Rounded corners (24px radius)

## File Icon (file-icon.svg)

The file icon is already provided as an SVG and will be used for `.nm` files in the VS Code file explorer.
