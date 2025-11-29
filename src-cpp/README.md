# XORG - Native C++ Edition

A high-performance C++/SDL2 port of XORG.

## Requirements
- CMake
- SDL2 Development Libraries

To install dependencies on Ubuntu/Debian:
```bash
sudo apt install cmake libsdl2-dev
```

## Building (Linux/Mac)
```bash
mkdir build
cd build
cmake ..
make
./xorg
```

## Building (Windows)
Use CMake GUI to generate Visual Studio solution or use MinGW.
