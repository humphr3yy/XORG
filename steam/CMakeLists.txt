cmake_minimum_required(VERSION 3.10)
project(XORG_Steam)

set(CMAKE_CXX_STANDARD 17)

find_package(SDL2 REQUIRED)

# In a real scenario, you would link against libsteam_api.so / steam_api.dll
# target_link_libraries(xorg_steam SDL2::SDL2 ${STEAM_LIBRARY})

add_executable(xorg_steam src/main.cpp)
target_link_libraries(xorg_steam SDL2::SDL2)
