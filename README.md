# XORG

**XORG** is a minimalist 2D arena dueling game inspired by Pong and Jezzball.

## Project Structure

- **`src/`**: Core Game Engine (TypeScript/HTML5). The primary version.
- **`src-python/`**: Pygame Version (Educational/Retro).
- **`src-cpp/`**: Native C++ Version (High Performance/Homebrew).
- **`steam/`**: Steam Integration Branch.
- **`build-scripts/`**: Scripts for packaging and cross-compilation.

## Setup

Run the master setup script to install dependencies for all versions:

```bash
chmod +x setup.sh
./setup.sh
```

## Building & Running

### 1. Web / Desktop (Electron)
The core game is built with Vite + TypeScript.
```bash
npm run dev
```
To build for Desktop (Electron):
```bash
npm run build
npx electron electron-main.js
```

### 2. Python Version
```bash
cd src-python
source venv/bin/activate
python main.py
```

### 3. Native C++ Version
```bash
cd src-cpp
mkdir -p build && cd build
cmake ..
make
./xorg
```

### 4. Packaging
Use the scripts in `build-scripts/` to create packages:
- `build-scripts/build-deb.sh`: Create Debian package.
- `build-scripts/build-tarball.sh`: Create Linux tarball.
- `build-scripts/build-windows.sh`: Cross-compile for Windows (requires MinGW).

## Platforms

- **Linux**: Use the `build-scripts/build-appimage.sh` or run via Python/Native.
- **Windows**: Use Electron builder or compile the C++ version with MSVC/MinGW.
- **Mac**: Use Electron builder or compile C++ with Xcode/Clang.
- **Consoles (Homebrew)**: Use the `src-cpp` source with DevkitPro toolchains (3DS, Wii, Switch).

