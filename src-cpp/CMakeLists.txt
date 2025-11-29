cmake_minimum_required(VERSION 3.10)
project(XORG)

set(CMAKE_CXX_STANDARD 17)

find_package(SDL2 REQUIRED)

add_executable(xorg main.cpp)
target_link_libraries(xorg SDL2::SDL2)
