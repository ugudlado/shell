#!/bin/bash

# Configuration
SOURCE="src/assets/branding/logo.svg"
OUTPUT_DIR="src/assets/branding"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

echo "🎨 Generating branding assets from $SOURCE..."

# 1. Master PNGs (High Res)
magick -background none "$SOURCE" -resize 1024x1024 "$OUTPUT_DIR/icon-1024.png"
magick -background none "$SOURCE" -resize 512x512 "$OUTPUT_DIR/icon-512.png"

# 2. Apple Touch Icon (iOS)
magick -background none "$SOURCE" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon.png"

# 3. Android / Web Manifest Icons
magick -background none "$SOURCE" -resize 192x192 "$OUTPUT_DIR/android-chrome-192.png"
magick -background none "$SOURCE" -resize 512x512 "$OUTPUT_DIR/android-chrome-512.png"

# 4. Favicons (PNG)
magick -background none "$SOURCE" -resize 16x16 "$OUTPUT_DIR/favicon-16.png"
magick -background none "$SOURCE" -resize 32x32 "$OUTPUT_DIR/favicon-32.png"
magick -background none "$SOURCE" -resize 48x48 "$OUTPUT_DIR/favicon-48.png"

# 5. Favicon (ICO) - bundling multiple sizes
magick -background none "$SOURCE" -define icon:auto-resize=16,32,48,64 "$OUTPUT_DIR/favicon.ico"

echo "✅ Asset generation complete. Files located in $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"
