---
layout: post
title: Improving Performance of a C++ Backtracking Solver
---

Recently, an acquaintance posted on Facebook with a problem.

>  I've never really used C++ and I was wondering if any friends could help guide me on why my C++ program is slower than my Java program.

How could this be? C++ is typically faster than Java. Instinctively I assumed that a line-by-line rewrite from Java to C++ should be faster. I was [nerd sniped][nerd-sniping] so I reached out to help.

[nerd-sniping]: https://xkcd.com/356/

The program in question is a backtracking solver to find optimal solutions to a game. In this game, you can make up to 24 moves around a grid, with 1-5 valid decisions per step. The goal is to maximize a score by gathering items and visiting locations in the grid. The solver works by searching through every possible state until the maximum score is found. The solver was originally implemented in python, which was very slow. It took over an hour for some problem scenarios. The original author reimplemented the solver in Java, which was much faster, but it was still too slow for solving the hardest problems. The original author then reimplemented the solver in C++, but the C++ implementation ended up being slower than the Java implementation.

As a benchmark, we ran the solver against a problem scenario called "`fast1`". `fast1` had the fewest game states to search, at ~274K states. By contrast, the problem with the most states to search was 848M, about ~3,000x more states. Solving the `fast1` scenario took 1.6 seconds to solve in the Java implementation, while the C++ implementation took 3.5 seconds, a slowdown of ~2x!

The first thing that came to mind is pass-by-value vs. pass-by-reference. Java passes objects by reference, while C++ typically objects by value, meaning that the entire object gets copied rather than just a pointer. This could explain part of the performance loss.

There were many possible approaches to improving performance. In order to focus on impactful optimizations, I used a profiler. I hadn't worked on much C++ performance profiling before. Over the course of this project, I learned how to use a profiling tool called callgrind.

## Callgrind

To use callgrind, I ran `valgrind --tool=callgrind ./build/solve_game ...`.

Callgrind adds a very high runtime overhead (~70x slowdown in my case) in order to get instruction count accurate, function-level profiling results. One of the benefits of callgrind is that running the same code with the same parameters gives you the same results. This makes callgrind a reliable tool for gathering performance data.

By default, the callgrind write the results into a file called `callgrind.out.$pid`, where `$pid` is the pid of the program being profiled. In order to read these files, you need to use `callgrind_annotate`. This is what the output looks like.

```
--------------------------------------------------------------------------------
Profile data file 'benchmarks/callgrind.out.d0ae7d49' (creator: callgrind-3.12.0.SVN)
--------------------------------------------------------------------------------
I1 cache: 
D1 cache: 
LL cache: 
Timerange: Basic block 0 - 3664876514
Trigger: Program termination
Profiled target:  ./build/solve_game 14 5 west 100 50 50 75 100 fast1 (PID 1253, part 1)
Events recorded:  Ir
Events shown:     Ir
Event sort order: Ir
Thresholds:       99
Include dirs:     
User annotated:   
Auto-annotation:  off

--------------------------------------------------------------------------------
            Ir 
--------------------------------------------------------------------------------
13,674,402,496  PROGRAM TOTALS

--------------------------------------------------------------------------------
           Ir  file:function
--------------------------------------------------------------------------------
2,408,589,654  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:_int_malloc [/lib/x86_64-linux-gnu/libc-2.24.so]
1,334,917,570  /build/glibc-77giwP/glibc-2.24/string/../sysdeps/x86_64/multiarch/memmove-vec-unaligned-erms.S:__memcpy_avx_unaligned_erms [/lib/x86_64-linux-gnu/libc-2.24.so]
1,265,816,595  ???:playGame(Position, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, int, int, int, int, int, std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >) [/home/robertq/hacks/game_solver_c/build/solve_game]
1,241,899,008  ???:void std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::_M_construct<char*>(char*, char*, std::forward_iterator_tag) [clone .isra.90] [clone .lto_priv.26] [/home/robertq/hacks/game_solver_c/build/solve_game]
1,088,565,569  ???:std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >::vector(std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > > const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
1,083,047,479  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:_int_free [/lib/x86_64-linux-gnu/libc-2.24.so]
  675,187,234  /build/glibc-77giwP/glibc-2.24/string/../sysdeps/x86_64/multiarch/memcmp-sse4.S:__memcmp_sse4_1 [/lib/x86_64-linux-gnu/libc-2.24.so]
  596,269,631  ???:void std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >::_M_emplace_back_aux<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > const&>(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
  576,482,684  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:malloc [/lib/x86_64-linux-gnu/libc-2.24.so]
  471,797,742  ???:std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::_M_assign(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > const&) [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
  439,099,883  ???:getPossibleMovesOrActions(Position, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >) [/home/robertq/hacks/game_solver_c/build/solve_game]
  317,614,661  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:malloc_consolidate [/lib/x86_64-linux-gnu/libc-2.24.so]
  211,160,381  ???:std::_Rb_tree_insert_and_rebalance(bool, std::_Rb_tree_node_base*, std::_Rb_tree_node_base*, std::_Rb_tree_node_base&) [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
  202,964,535  ???:BestGameState::updateBestPaths(GameState) [/home/robertq/hacks/game_solver_c/build/solve_game]
  196,843,999  ???:GameState::getAP() [/home/robertq/hacks/game_solver_c/build/solve_game]
  187,983,450  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:free [/lib/x86_64-linux-gnu/libc-2.24.so]
  159,608,016  ???:std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::compare(char const*) const [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
  151,967,442  ???:indexOf(std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >) [/home/robertq/hacks/game_solver_c/build/solve_game]
  150,386,736  ???:operator new(unsigned long) [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
  146,212,423  ???:std::_Rb_tree<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::_Identity<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::less<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >::_M_erase(std::_Rb_tree_node<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >*) [/home/robertq/hacks/game_solver_c/build/solve_game]
  134,832,328  ???:std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >::operator=(std::vector<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > > const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
  105,585,539  ???:std::_Rb_tree<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::_Identity<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::less<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >::_M_get_insert_unique_pos(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
   91,717,039  ???:std::_Rb_tree<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::_Identity<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::less<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::allocator<std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >::find(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
   90,454,910  /build/glibc-77giwP/glibc-2.24/string/../sysdeps/x86_64/strlen.S:strlen [/lib/x86_64-linux-gnu/ld-2.24.so]
   80,324,946  ???:std::__detail::_Map_base<Position const, std::pair<Position const, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::allocator<std::pair<Position const, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >, std::__detail::_Select1st, std::equal_to<Position const>, Position::HashFunction, std::__detail::_Mod_range_hashing, std::__detail::_Default_ranged_hash, std::__detail::_Prime_rehash_policy, std::__detail::_Hashtable_traits<true, false, true>, true>::operator[](Position const&) [clone .constprop.4] [/home/robertq/hacks/game_solver_c/build/solve_game]
   70,410,543  ???:std::_Hashtable<Position const, std::pair<Position const, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > >, std::allocator<std::pair<Position const, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > > >, std::__detail::_Select1st, std::equal_to<Position const>, Position::HashFunction, std::__detail::_Mod_range_hashing, std::__detail::_Default_ranged_hash, std::__detail::_Prime_rehash_policy, std::__detail::_Hashtable_traits<true, false, true> >::find(Position const&) [clone .constprop.9] [/home/robertq/hacks/game_solver_c/build/solve_game]
   64,814,932  ???:std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >::swap(std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> >&) [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
```

What callgrind has done is give us per-function profiling data. `Ir` is short for "instruction." 
So the following line means that the program took a total of 13.6B instructions to execute. 

```
13,674,402,496  PROGRAM TOTALS
```

Each line after that is a count of how many instructions were spent in each function. They are ordered in descending order, so functions near the top of the list contribute more to runtime. I'll go through the different optimizations that I made, based on what I saw in the profiling data.

## Act 1: Death of `string`

The first line indicates that the single function that spent the most time was `malloc`.

```
2,408,589,654  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:_int_malloc [/lib/x86_64-linux-gnu/libc-2.24.so]
```

The second line shows that `memcpy` was used on strings a lot.

```
1,334,917,570  /build/glibc-77giwP/glibc-2.24/string/../sysdeps/x86_64/multiarch/memmove-vec-unaligned-erms.S:__memcpy_avx_unaligned_erms [/lib/x86_64-linux-gnu/libc-2.24.so]
```

And a few lines down, you can also see `free`.

```
1,083,047,479  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:_int_free [/lib/x86_64-linux-gnu/libc-2.24.so]
```

So, the profiling data suggests that most of the time is spent allocating, copying, and freeing memory. If we can avoid unnecessary memory allocations, then runtime will improve.

In the code, strings are used extensively to represent moves or actions taken within the game. This is useful for debugging and development, but a performance killer. Every time a string is passed by value, it must be allocated and copied. So, I began to optimize the use of strings throughout the codebase.

### 1.1: Avoiding copies: `vector::push_back` -> `vector::emplace_back`

When adding `GameState` structs to the search stack, we were using `std::vector::push_back`. This is inefficient because this copies all the struct members when adding to `stateStack`. This includes copying a `vector<string>` called `path`. That means, for every state visited, every string gets allocated and copied.

```cpp
        GameState newGameState = GameState{newPosition, newDirection, newPath /* ... */};
        // This copies!
        stateStack.push_back(newGameState);
```

The alternative is to use `std::vector::emplace_back`, which constructs the object in-place within the vector, avoiding the need to copy the struct members. To change this, I first needed to add a constructor, so that the object could be constructed in-place. I added `std::move` to the `path` initializer which is needed to avoid copying it.

```cpp
struct GameState {
  GameState() {};
  GameState(Position position, std::string direction, std::vector<std::string> path /* ... */):
    position(position), direction(std::move(direction)), path(std::move(path)) /* ... */ {};
  // ...
}
```

The change afterward is simply

```diff
-        GameState newGameState = GameState{newPosition, newDirection /* ... */};
-        stateStack.push_back(newGameState);
+        stateStack.emplace_back(newPosition, newDirection, std::move(newPath) /* ... */);
```

### 1.2: Avoiding all string and vector copies

Many strings and vectors were being passed around by value, resulting in unnecessary copies. I littered the code with `std::move` and replaced all uses of `push_back` with `emplace_back` in order to move around these objects rather than copy them.

By avoiding copies of strings and vectors in 1.1 and 1.2, the program gained a speedup of 3x.

### 1.3: Replacing strings with an enum

By now I realized that strings were the root of the problems, so I decided to replace them all with an enum. This means that the pass-by-value semantics aren't an issue anymore, since enums are small and don't require dynamic memory allocation. An additional benefit of an enum is that typos become compiler errors instead of silent errors!

Here's an example of what the changes looked like.

```diff
- std::vector<std::string> getPossibleMoves(GameState gs) {
+ std::vector<MoveOrAction> getPossibleMoves(GameState gs) {
-  vector<std::string> possibleMoves;
+  vector<MoveOrAction> possibleMoves;
-   if (gs.direction == "north") {
+   if (gs.direction == MoveOrAction.north) {
     Position goingWest = Position{gs.position.row - 1, gs.position.col - 1};
     if (board.find(goingWest) != board.end() &&
-         board[goingWest] == "road") {
+         board[goingWest] == MoveOrAction.road) {
-       possibleMoves.emplace_back("west");
+       possibleMoves.emplace_back(MoveOrAction.west);
     }
     // ...
   }
   // ...
 }
```

This change led to an additional 3.3x speedup. The total speedup at this point was ~10x.

## Act 2: Death of `malloc`

The profiling data now looked like this:

```
--------------------------------------------------------------------------------
Profile data file 'benchmarks/callgrind.out.f90716fb' (creator: callgrind-3.12.0.SVN)
--------------------------------------------------------------------------------
I1 cache: 
D1 cache: 
LL cache: 
Timerange: Basic block 0 - 337119950
Trigger: Program termination
Profiled target:  ./build/solve_game 14 5 west 100 50 50 75 100 fast1 (PID 715, part 1)
Events recorded:  Ir
Events shown:     Ir
Event sort order: Ir
Thresholds:       99
Include dirs:     
User annotated:   
Auto-annotation:  off

--------------------------------------------------------------------------------
           Ir 
--------------------------------------------------------------------------------
1,339,440,908  PROGRAM TOTALS

--------------------------------------------------------------------------------
         Ir  file:function
--------------------------------------------------------------------------------
317,287,894  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:_int_malloc [/lib/x86_64-linux-gnu/libc-2.24.so]
253,607,084  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:_int_free [/lib/x86_64-linux-gnu/libc-2.24.so]
176,550,120  ???:getPossibleMovesOrActions(Position const&, Direction const&, std::vector<MoveOrAction, std::allocator<MoveOrAction> > const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
141,298,580  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:malloc [/lib/x86_64-linux-gnu/libc-2.24.so]
123,258,948  ???:void std::vector<MoveOrAction, std::allocator<MoveOrAction> >::_M_emplace_back_aux<MoveOrAction>(MoveOrAction&&) [/home/robertq/hacks/game_solver_c/build/solve_game]
111,334,996  ???:playGame(Position, Direction, int, int, int, int, int, std::vector<MoveOrAction, std::allocator<MoveOrAction> >) [/home/robertq/hacks/game_solver_c/build/solve_game]
 64,800,036  ???:int indexOf<MoveOrAction>(std::vector<MoveOrAction, std::allocator<MoveOrAction> > const&, MoveOrAction const&) [/home/robertq/hacks/game_solver_c/build/solve_game]
 46,075,590  /build/glibc-77giwP/glibc-2.24/malloc/malloc.c:free [/lib/x86_64-linux-gnu/libc-2.24.so]
 44,286,035  /build/glibc-77giwP/glibc-2.24/string/../sysdeps/x86_64/multiarch/memmove-vec-unaligned-erms.S:__memcpy_avx_unaligned_erms [/lib/x86_64-linux-gnu/libc-2.24.so]
 36,860,448  ???:operator new(unsigned long) [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
  6,143,412  ???:operator delete(void*) [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
  4,664,851  /build/glibc-77giwP/glibc-2.24/rt/../sysdeps/unix/clock_gettime.c:clock_gettime [/lib/x86_64-linux-gnu/libc-2.24.so]
```

As the profile suggests, `malloc` and `free` still make up a majority of the runtime.

### 2.1: Recursion

The core DFS search was implemented as traversing a stack of `GameState` structs. I reimplemented it as a recursive algorithm. I mainly made this change because it was easier for me to reason about recursion compared to the iterative approach, but I ended up with a 6% performance increase.

The speedup likely was due to data locality, since now most of the data that used to be in a separate vector is now stored in the stack frame instead.

### 2.2: Optimizing `getPossibleMoves`

#### 2.2.1: `vector` -> `array`

There is a function, `getPossibleMoves`, which takes in a `GameState` and returns a `vector` of possible moves from that state. This gets called for every `GameState`. Since it returns a `vector`, it always makes an allocation. I replaced it with a `std::array` which doesn't make a heap allocation.

```diff
- std::vector<MoveOrAction> getPossibleMoves(GameState gs) {
+ void getPossibleMoves(GameState gs, array<MoveOrAction, 5>& possibleMoves,
+                       array<MoveOrAction, 5>::iterator& possibleMovesEnd) {
-  vector<MoveOrAction> possibleMoves;
   if (gs.direction == MoveOrAction.north) {
     Position goingWest = Position{gs.position.row - 1, gs.position.col - 1};
     if (board.find(goingWest) != board.end() &&
         board[goingWest] == MoveOrAction.road) {
-      possibleMoves.push_back(MoveOrAction.west);
+      *possibleMovesEnd++ = MoveOrAction.west;
     }
     // ...
   }
   // ...
 }
```

This change resulted in a 33% speedup.

#### 2.2.2: `board`: `unordered_map` -> `array<array>`

After performing the speedup, the profiling data suggested that the function was still taking too long. The culprit was that the items on the game board were stored using a `std::unordered_map<Position, MoveOrAction>`. Since the board is a rectangular grid of fixed size, I replaced the `unordered_map` with a 2d array, to improve access speed and data locality.

This change resulted in a further 14% speedup.

### 2.3: Remove `path` from `GameState` struct

In the program, we use `GameState` structs to represent the sequence of states that lead to the current state. The original author used a `vector<MoveOrAction>` called `path` to represent the moves that lead to a given state. This vector was stored as a struct member in `GameState`. This adds a significant overhead since it gets reallocated and copied for every new game state. This was the culprit behind many memory allocations.

The optimization I came up with is to maintain a seperate `path` variable, and keep it updated to match the stack of `GameState` structs.

#### 2.3.1: Cache some `path` checks

The first step to removing the `path` field was to avoid traversing it. In the game, once certain actions are performed, the game's state is affected for the rest of the decision path. To check for these states, the entirety of `path` was scanned for these special actions. To optimize this, I added some booleans to the `GameState` struct that kept track of whether those special actions had been performed yet.

This change caused a 5% speedup. Though small, it made way for totally removing `path` from `GameState`

#### 2.3.2: Yeet `path`

```diff
 struct GameState {
   Position position;
   MoveOrAction direction;
-  std::vector<MoveOrAction> path;
   int remaningMoves;
   int score;
   // ...
 }
```

By deleting the `path` struct member and replacing it with a global `path` that stayed in sync with the current `GameState`, I was able to get a 5.5x speedup.

## Act 3: Avoiding memory access excess

At this point, I had removed all dynamic memory allocations from the hot path, resulting in an epic speedup of 108x. This was ready to ship but I wanted to see how much further I could get. There were still some extra memory accesses that could be optimized.

### 3.1: Smaller stack frames

Each recursive call allocates space on the program's stack for variables. By reducing the size of the stack frame, performance is increased due to less copying and better CPU cache usage.

#### 3.1.1: Avoiding extra copies to stack

In the recursive calls, there were some `int` values being copied from the previous `GameState` into the local stack frame before being copied again into the current `GameState`. I avoided this by accessing the previous `GameState` members by reference rather than copying them to the new stack.

This led to a 6% speedup.

#### 3.1.2: Shortening `int` -> `int{8,16}_t`

Each member of the `GameState` struct represents integer values that are bounded within small values. I replaced all these 4-byte wide `int` types with 1- and 2-byte wide integer types (`int8_t`/`int16_t`) based on the minimum/maximum values they could take on.

This resulted in a 5% spedup.

### 3.2: `path`: `vector` -> `array`

Since the search depth could never exceed 30, I switched out `path` to be an `array<MoveOrAction, 30>` instead of a `vector<MoveOrAction>`.

This led to a 2% speedup.

## 4: Gotta go `-Ofast`

I tried many different compiler flags but the only one that made any difference was `-Ofast` which gave a 2% additional speedup.

## Final Profile

```
--------------------------------------------------------------------------------
         Ir
--------------------------------------------------------------------------------
109,048,789  PROGRAM TOTALS

--------------------------------------------------------------------------------
         Ir  file:function
--------------------------------------------------------------------------------
105,184,998  ???:playGame(GameState const&)'2 [/home/robertq/hacks/game_solver_c/build/solve_game]
    971,531  /build/glibc-77giwP/glibc-2.24/elf/dl-lookup.c:_dl_lookup_symbol_x [/lib/x86_64-linux-gnu/ld-2.24.so]
    864,334  /build/glibc-77giwP/glibc-2.24/elf/dl-lookup.c:do_lookup_x [/lib/x86_64-linux-gnu/ld-2.24.so]
    260,251  /build/glibc-77giwP/glibc-2.24/elf/../sysdeps/x86_64/dl-machine.h:_dl_relocate_object
    200,878  ???:__dynamic_cast [/usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.22]
    131,820  /build/glibc-77giwP/glibc-2.24/string/../sysdeps/x86_64/multiarch/../strcmp.S:strcmp [/lib/x86_64-linux-gnu/ld-2.24.so]
```

## Conclusion

After all the optimizations, I ended up speeding up the solver by over 120x, so I was very happy. The solver can now solve the hardest problems in 30 seconds, and solve the easier problems in less than the blink of an eye. When we shipped the update to the solver, many of the users didn't think it was working correctly since it was so fast.

Some of the optimizations could have likely been applied to the Java implementation as well, but I don't think Java would be able to reach this speed.

C++ is a very powerful language. It gives the programmer the responsibility to manage memory. Someone new to C++11 and the STL can easily run into performance pitfalls. Even experienced C++ programmers can and often do introduce performance regressions as well.

> C++ doesn't give you performance, it give you control over performance - Chandler Carruth

In the future I'd like to learn more about tuning low-level memory acceses and caching. But for now, I'm very happy with the results.

## Further work

I stopped trying to get the program to run any faster because I was getting tired and I wanted to just write this blog post. I probably could have tried a multi-threaded approach for the DFS. There are definitely more optimizations to be made by optimizing memory access patterns, but that would probably require me to look at assembly which I don't really want to do (I hardly know x86).

## Tip: always test!

When optimizing, I tended to try many different approaches. Some worked and some didn't. It's important to have a way to consistently measure the performance of the code being optimized so that you can get feedback about whether your approach is working. Additionally, having a test for correctness helps make sure you don't accidentally break functionality as you perform your optimizations. In my case, I had a fast test case that I could quickly run and use to validate correctness.

## Failed optimizations

Of course, not every attempt at optimization is successful. Here are some of the things I did that *didn't* work.

### F.1 Using constrefs for passing `GameState` around

To avoid copying when calling functions, I tried passing around `GameState` as `const GameState&` instead. However, the compiler likely already determined that those functions could be inlined. However, this is just a guess since I didn't look closely into it.

### F.2 `shared_ptr<GameState>` instead of `GameState` for bestGameState

When storing the best game state found so far, it is stored as a `GameState` struct. I tried replacing all uses of `GameState` with `shared_ptr<GameState>` in order to prevent some copies. However, this ended up only having a 0.06% performance improvement, at the cost of littering the codebase with calls to `make_shared<>()`. The performance didn't change much because the code that updates the best `GameState` runs relatively infrequently.

### F.3 Replacing `if`/`else` with `switch`

There were a few places where we consider all possible values of an enum within a big `if`/`else` statement. I replaced it with a big `switch` statement instead, but this ended up harming performance! My guess is that the branch predictors on modern CPUs are better at handling `if`/`else` than handling a jump table.

### Nightcore

I listened to a lot of 2011-era nightcore and vocaloid songs while working on this. It fit well with the theme of my work, and it certainly improved my efficiency. I hope you enjoy listening too!

<iframe class="youtube" src="https://www.youtube.com/embed/WiUjG9fF3zw" title="[Hatsune Miku Anime PV] Viva Happy feat. 初音ミク / Mitchie M" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe class="youtube" src="https://www.youtube.com/embed/cmlCuzn_mqI" title="Nightcore - Bad boy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

<iframe class="youtube" src="https://www.youtube.com/embed/8QG7CEuUqMc" title="Everytime we touch - Nightcore - HD" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
