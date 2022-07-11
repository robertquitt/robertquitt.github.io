---
layout: post
title: Optimizing a C++ Backtracking Solver
---

## Summary

I 

## Context

Last year, someone reached out over facebook who was working on a personal programming project in C++.

>  I've never really used C++ and I was wondering if any friends could help guide me on why my C++ program is slower than my Java program.

How could this be? C++ is typically much faster than Java.

### The Backtracking Solver

The program in question is a backtracking solver to find optimal solutions to a game. The solver was originally implemented in python, which was very slow.It took over an hour for certain game setups. The implementation was switched to Java, which was faster, but still too slow to solve the most difficult game setups in reasonable time. So then the solver was reimplemented in C++, but the C++ implementation ended up being slower than the Java implementation.

As a benchmark, we used a game setup called "fast1". fast1 had the smallest backtracking tree size (244K nodes). For comparison, the game setup with the largest backtracking tree size we could find had 848M nodes, which meant that it would take ~3,475x longer to exhaustively search. fast1 takes 1.6 seconds to solve in the Java implementation. However, the C++ implementation took 14.5 seconds, which means that it took ~9x longer than the Java implementation!

## Compiler Flags

Before I even looked at the code, I looked at the build process. It was a typical CMake project. The first thing to do was to turn on optimizing compiler flags. After each compiler flag was added, I performed a benchmark by averaging the wall time of three executions of fast1.

* Add `-O3`: 14.5s -> 3.5s (4x)
* Add `-march=native` 3.5s -> 3.5s
* Add `-flto`: 3.5s -> 3.4s
* Add `-static-libc++`: 3.4s -> 3.4s

The -O3 flag had the most effect, but beyond that, there wasn't much change in runtime. Additionally, the C++ implementation is still slower than the Java implementation by ~2x.


## Profiling with Callgrind

At this point, I began to look into the code. Having been written by a C++ beginner, the code had many problems, but it was unclear where to start, and what had the biggest impact on performance.

In order to understand what the program was spending time on, I used a tool named callgrind.

`valgrind --tool=callgrind `

It adds a high overhead, in order to get accurate, function-level profiling results.

### Avoid set creation and deletion

### Strings to enums
Too many calls to strcmp

### excess memcpy->pass by ref

Excess memcpy

### Remove path from state struct

• excess malloc->remove path from state struct

### fixed size vector -> array

• excess malloc->possiblemoves std::vector to std::array<5>

### Reverse iterators

• use reverse iterators instead of reversing inplace

### Grid as an array of arrays

• hashmap of pairs -> array of arrays

### Add state as bools instead of iterating each time
• pass along has* recursively instead of inspecting path vector each time

### Check only 10 most recent actions
• avoid checking entirety of path, just 10 most recent


### Failed optimzations
* const everything to avoid copies
* avoid copying strings by moving them around
* use shared ptrs
* try reimplementing as recursive algorithm (was this a win?), 

### The Game

There's a grid-based game, with a random arrangement of tiles in a grid. You are operating a car, which travels along the edges of this grid. On each turn, you have the option to use a tile resource to your left or right, or to move forward, left, or right. Some tiles give points (F points, D points, E points), up to a limit, which all contribute to the final score at the end of the game. Some tiles refuel your car to full. Each tile, after being used, takes 10 turns before it can be used again. After 25 turns, the game is over.

One objective to solve for is gaining as many points possible before running out of time (25 turns) or fuel. Another objective is to find a solution interact with certain tiles such the M tile or the J tile. 

A penalty is applied if you run out of time before you make it to the home tile before you run out of fuel.

## Conclusion

C++ has the potential to give you great performance, as long as you know how to optimize it. Some of these optimizations could also be applied to the Java implementation.