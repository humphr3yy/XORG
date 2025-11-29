#!/bin/bash
set -e

echo "=== XORG Setup Script ==="

# 1. Node.js / Electron
echo "[1/3] Setting up Node.js dependencies..."
if command -v npm >/dev/null 2>&1; then
    npm install
else
    echo "Warning: npm not found. Skipping Node.js setup."
fi

# 2. Python
echo "[2/3] Setting up Python environment..."
if command -v python3 >/dev/null 2>&1; then
    cd src-python
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    ./venv/bin/pip install -r requirements.txt
    cd ..
else
    echo "Warning: python3 not found. Skipping Python setup."
fi

# 3. C++
echo "[3/3] Checking C++ build tools..."
if command -v cmake >/dev/null 2>&1 && command -v make >/dev/null 2>&1; then
    echo "CMake and Make found."
    echo "To build C++ version: cd src-cpp && mkdir -p build && cd build && cmake .. && make"
else
    echo "Warning: cmake or make not found. C++ build might fail."
fi

echo "=== Setup Complete ==="
echo "Run 'npm run dev' to start the web/electron version."
echo "Run './src-python/venv/bin/python3 src-python/main.py' to start the Python version."
echo "Run './src-cpp/build/xorg' to start the C++ version (after building)."
