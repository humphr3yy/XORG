#!/bin/bash
# Build XORG as a Linux Executable using Electron

set -e  # Exit on error

echo "========================================="
echo "Building XORG for Linux x64"
echo "========================================="

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the XORG root directory."
    exit 1
fi

# Step 1: Install dependencies (if not already installed)
echo ""
echo "Step 1: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Dependencies already installed."
fi

# Step 2: Install electron-packager if not already installed
echo ""
echo "Step 2: Installing electron-packager..."
npm install --save-dev electron-packager

# Step 3: Build TypeScript and Vite production bundle
echo ""
echo "Step 3: Building production bundle..."
npm run build

# Step 4: Package with Electron for Linux
echo ""
echo "Step 4: Packaging with Electron..."
OUTPUT_DIR="dist-linux"
APP_NAME="XORG"

npx electron-packager . "$APP_NAME" \
    --platform=linux \
    --arch=x64 \
    --out="$OUTPUT_DIR" \
    --overwrite \
    --icon=public/icon.png \
    --prune=true \
    --ignore="^/(src|build-scripts|src-cpp|src-python|steam|\\.git|\\.vscode|node_modules/\\.cache)" \
    --ignore=".*\\.ts$" \
    --ignore=".*\\.md$" \
    --ignore="tsconfig\\.json$" \
    --asar

# Step 5: Create a run script for convenience
echo ""
echo "Step 5: Creating launcher script..."
RUN_SCRIPT="$OUTPUT_DIR/$APP_NAME-linux-x64/$APP_NAME"
if [ -f "$RUN_SCRIPT" ]; then
    # The executable is already created by electron-packager
    echo "Executable created at: $RUN_SCRIPT"
fi

# Step 6: Create a tarball for distribution
echo ""
echo "Step 6: Creating distribution archive..."
cd "$OUTPUT_DIR"
tar -czf "XORG-linux-x64.tar.gz" "$APP_NAME-linux-x64/"
cd ..

echo ""
echo "========================================="
echo "Build Complete!"
echo "========================================="
echo ""
echo "Executable location: $OUTPUT_DIR/$APP_NAME-linux-x64/$APP_NAME"
echo "Distribution archive: $OUTPUT_DIR/XORG-linux-x64.tar.gz"
echo ""
echo "To run the game:"
echo "  cd $OUTPUT_DIR/$APP_NAME-linux-x64"
echo "  ./$APP_NAME"
echo ""
