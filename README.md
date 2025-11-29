# XORG

**XORG** is a minimalist 2D arena dueling game inspired by Pong and Jezzball.
This game is completely free to remake, demake, remix, or port to any system,
as long as it's non-profit and you credit Humphr3yy or Kaiden Kricak as the
original creator.

## Lore
In the distant future, the galaxy is under the iron grip of the Red Authority, a shadow government enforcing order with ruthless precision. To maintain their control, they created the Xorgs: sentient, glowing law-enforcement orbs capable of hunting and vaporizing any life deemed insubordinate.

But hope remains. In the year 314183, the Resistance captured a prototype Xorg and duplicated it, creating their own fleet of liberated orbs. These Blue Xorgs now roam the cosmic arenas, freeing worlds from authoritarian oppression.

As a pilot of an Authority Xorg, your mission is simple: outmaneuver the Blue Xorgs, survive the deadly arena, and ensure the Galaxy remembers that no being shall, denounce the Red's reign and run away in one piece. Every hit counts, every maneuver matters, and only the last orb standing can claim victory.

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

