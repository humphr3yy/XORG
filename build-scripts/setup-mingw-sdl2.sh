#!/bin/bash
set -e

mkdir -p build-scripts/deps
cd build-scripts/deps

if [ ! -d "SDL2-2.30.0" ]; then
    echo "Downloading SDL2 MinGW development libraries..."
    wget https://github.com/libsdl-org/SDL/releases/download/release-2.30.0/SDL2-devel-2.30.0-mingw.tar.gz
    tar -xzf SDL2-devel-2.30.0-mingw.tar.gz
    rm SDL2-devel-2.30.0-mingw.tar.gz
    echo "SDL2 MinGW libraries extracted."
else
    echo "SDL2 MinGW libraries already exist."
fi
