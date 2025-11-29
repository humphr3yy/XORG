#!/bin/bash
set -e

VERSION="1.0.0"
PKG_NAME="xorg"
TAR_DIR="dist/tar/${PKG_NAME}-${VERSION}"
OUTPUT_TAR="dist/${PKG_NAME}-${VERSION}-linux.tar.gz"

echo "Building tarball..."

mkdir -p $TAR_DIR

# Copy executable
if [ ! -f "src-cpp/build/xorg" ]; then
    echo "Error: Linux executable not found. Please run 'make' in src-cpp/build first."
    exit 1
fi
cp src-cpp/build/xorg $TAR_DIR/

# Copy README
cp README.md $TAR_DIR/

# Create tarball
cd dist/tar
tar -czf ../../${PKG_NAME}-${VERSION}-linux.tar.gz ${PKG_NAME}-${VERSION}
cd ../..

echo "Tarball built: $OUTPUT_TAR"
