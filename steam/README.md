# XORG - Steam Edition

This version includes integration with Steamworks for Matchmaking and Friends.

## Setup
1. Download the Steamworks SDK.
2. Place `steam_api.dll` / `libsteam_api.so` in the build directory.
3. Update `CMakeLists.txt` to point to the SDK headers and libraries.

## Features
- **Skill-Based Matchmaking (SBMM)**: Uses Steam Matchmaking API.
- **Friends**: Invite friends via Steam Overlay.
- **Cloud Saves**: Sync progress across devices.
