---
layout: post
title: Optimizing a C++ Backtracking Solver
---

Recently, an acquantance posted on Facebook with a problem.

>  I've never really used C++ and I was wondering if any friends could help guide me on why my C++ program is slower than my Java program.

How could this be? C++ is typically faster than Java. Even a line-by-line rewrite from Java to C++ should be faster, right? I was [nerd sniped][nerd-sniping] so I reached out to help.

[nerd-sniping]: https://xkcd.com/356/

The program in question is a backtracking solver to find optimal solutions to a game. In this game, you can make up to 25 moves around a grid, with 2-5 possible decisions step. The goal is to maximize a score. The solver works by searching through every possible game state until the maximum score is found. The solver was originally implemented in python, which was very slow. It took over an hour for some problem scenarios. The original author reimplemented the solver in Java, which was much faster, but it was still too slow for solving the hardest problems. The original author then reimplemented the solver in C++, but the C++ implementation ended up being slower than the Java implementation.

As a benchmark, we ran the solver against a problem scenario called "`fast1`". `fast1` had the fewest game states to search, at ~244K states. By contrast, the problem with the most states to search was 848M, a difference of ~3,475x. Solving the `fast1` scenario took 1.6 seconds to solve in the Java implementation, while the C++ implementation took 3.5 seconds, a slowdown of ~2x!

The first thing that came to mind is pass-by-value vs. pass-by-reference. Java passes objects by reference, while C++ typically objects by value, meaning that the entire object gets copied rather than just a pointer. This could explain part of the performance loss.

There were many possible approaches to improving performance. In order to focus on impactful optimizations, I used a profiler. I hadn't worked on much C++ performance profiling before, but I used a tool called callgrind in order to gather profiling data.

## Callgrind

To use callgrind, I used `valgrind --tool=callgrind ./solve.sh`

Callgrind adds a high runtime overhead, in order to get instruction count accurate, function-level profiling results.

By default, the results are written in a file called `callgrind.out.$pid`, where `$pid` is the pid of the program that you are profiling.

From these results, I began to optimize the code.

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

Of course, not every attempt at optimization is successful. Here are some of the things I did that *didn't* work.

* const everything to avoid copies
* avoid copying strings by moving them around
* use shared ptrs
* try reimplementing as recursive algorithm to use stack more (was this a win?), 

* Adding compiler flags

One of the the first things I tried was to turn on optimizing compiler flags. After each compiler flag was added, I performed a benchmark by averaging the wall time of three executions of `fast1`.

* Add `-march=native` 3.5s -> 3.5s
* Add `-flto`: 3.5s -> 3.4s
* Add `-static-libc++`: 3.4s -> 3.4s

As the results indicate, the compiler flags did not substantially increase the program's performance.

## Conclusion


C++ has the potential to give you great performance, as long as you know how to optimize it. The golden rule of optimization here is to avoid doing as much work as possible. Get the job done while avoiding as many copies as possible.

Some of these optimizations could have also be applied to the Java implementation.
