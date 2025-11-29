#!/bin/bash
set -e

VERSION="1.0.0"
ARCH="amd64"
PKG_NAME="xorg"
PKG_DIR="dist/deb/${PKG_NAME}_${VERSION}_${ARCH}"

echo "Building .deb package..."

# Create directory structure
mkdir -p $PKG_DIR/usr/local/bin
mkdir -p $PKG_DIR/DEBIAN

# Copy executable (assume it's already built)
if [ ! -f "src-cpp/build/xorg" ]; then
    echo "Error: Linux executable not found. Please run 'make' in src-cpp/build first."
    exit 1
fi
cp src-cpp/build/xorg $PKG_DIR/usr/local/bin/xorg

# Create control file
cat > $PKG_DIR/DEBIAN/control <<EOF
Package: $PKG_NAME
Version: $VERSION
Section: games
Priority: optional
Architecture: $ARCH
Maintainer: Kaiden <kaiden@example.com>
Description: XORG - Minimalist 2D Arena Dueling Game
 A fast-paced 2D arena shooter with pong-like physics.
EOF

# Build package
dpkg-deb --build $PKG_DIR

echo "Debian package built: dist/deb/${PKG_NAME}_${VERSION}_${ARCH}.deb"
