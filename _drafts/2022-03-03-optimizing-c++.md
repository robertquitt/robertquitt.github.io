## Profiling with callgrind

callgrind_annotate

## Summary

Java is faster than C++?? What??

use -O3, now they're about the same speed.

List of optimizations

Now is like 25x weee

## Background

Grid-based game. Each turn, decrease fuel credits and move in a direction. At each stop, have the option to spend a turn to use a tile resource. Objective is to gain as many points as possible per turn, or to get certain items such as to go to the mall to get a ring, or to propose using the ring, or to make it back home before you run out of fuel. Basically, backtracking algorithm to figure out best order of moves.

The problem, is that the solver is too slow. It was originally implemented in python. This was very slow. It took over an hour for certain problems. Then moved to Java, which was faster, but still too slow. Then moved to C++, but the C++ implementation ended up being slower than Java. How could this be?

By keeping track of how many candidate game states are visited in the backtracking algorithm, we can get a sense for how much work is required to solve a particular problem. For reference, the easiest problem we encountered required visiting ~244K states, and the hardest took 80M states.

As a benchmark, we used the 244k state problem, which we called "fast1". fast1 took 

Java: 1.6 seconds

fast1: takes 14.5 seconds in C++ 

Add -O3 -> 3.5 seconds
Add -march=native -> still 3.5 seconds
Add -flto -> 3.4 seconds
Add -static-libc++ -> still 3.4 seconds

## Reference implementation in java
