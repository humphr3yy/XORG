#!/bin/bash
set -e

# Setup paths
SDL2_DIR="$(pwd)/build-scripts/deps/SDL2-2.30.0/x86_64-w64-mingw32"
OUTPUT_DIR="dist/windows"

mkdir -p $OUTPUT_DIR

echo "Building for Windows..."

x86_64-w64-mingw32-g++ src-cpp/main.cpp -o $OUTPUT_DIR/xorg.exe \
    -I$SDL2_DIR/include \
    -L$SDL2_DIR/lib \
    -lmingw32 -lSDL2main -lSDL2 -mwindows -static-libgcc -static-libstdc++

echo "Copying SDL2.dll..."
cp $SDL2_DIR/bin/SDL2.dll $OUTPUT_DIR/

echo "Windows build complete: $OUTPUT_DIR/xorg.exe"
