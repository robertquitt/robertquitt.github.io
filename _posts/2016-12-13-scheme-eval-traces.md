---
layout: post
title: scheme_eval and scheme_apply
---

Today we'll be taking a look at how many times `scheme_eval` and `scheme_apply` are
called in our Scheme interpreter.

How many times are `scheme_eval` and `scheme_apply` called for the following?


* `(+ 2 3 (- 4 5) 1)`:


        scheme_eval('('+' 2 3 (- 4 5) 1), <Global Frame>):
            scheme_eval('+', <Global Frame>) -> #[+]
            scheme_eval(2, <Global Frame>) -> 2
            scheme_eval(3, <Global Frame>) -> 3
            scheme_eval('('-' 4 5)'), <Global Frame>):
                scheme_eval('-', <Global Frame>) -> #[-]
                scheme_eval(4, <Global Frame>) -> 4
                scheme_eval(5, <Global Frame>) -> 5
                scheme_apply(#[-], '(4 5), <Global Frame>) -> -1
            -> -1
            scheme_eval(1, <Global Frame>) -> 1
            scheme_apply(#[+], '(2 3 -1 1), <Global Frame>) -> 5
        -> 5


* `(begin (define (foo x) (+ x 3)) (foo (- 5 2)))`
* `(define a 2)` <br>
  `(define (b) a)` <br>
  `(let ((b a) (a (b))) ((lambda (x) (- x a b)) 5))`:

        scheme_eval('('define' 'a' 2)):
            scheme_eval(2) -> 2
        -> a
        scheme_eval('('define' ('b') 'a')) -> b
        scheme_eval('('let' (('b' 'a') ('a' ('b'))) (('lambda' ('x') ('-' 'x' 'a' 'b')) 5)), <Global Frame>):
            scheme_eval('a', <Global Frame>) -> 2
            scheme_eval('(b), <Global Frame>):
                scheme_eval('b', <Global Frame>) -> (lambda () a)
                scheme_apply((lambda () a), <Global Frame>), nil, <Global Frame>):
                    scheme_eval('a', <{} -> <Global Frame>>, True) -> 2
                -> 2
            -> 2
            scheme_eval('(('lambda' ('x') ('-' 'x' 'a' 'b')) 5)), <{a: 2, b: 2} -> <Global Frame>>, True):
                scheme_eval('('lambda' ('x') ('-' 'x' 'a' 'b')), <{a: 2, b: 2} -> <Global Frame>>) -> (lambda (x) (- x a b))
                scheme_eval(5, <{a: 2, b: 2} -> <Global Frame>>) -> 5
                scheme_apply((lambda ('x') ('-' 'x' 'a' 'b')), '(5), <{a: 2, b: 2} -> <Global Frame>>):
                    scheme_eval('('-' 'x' 'a' 'b'), <{x: 5} -> <{a: 2, b: 2} -> <Global Frame>>>, True):
                        scheme_eval('-', <{x: 5} -> <{a: 2, b: 2} -> <Global Frame>>>) -> #[-]
                        scheme_eval('x', <{x: 5} -> <{a: 2, b: 2} -> <Global Frame>>>) -> 5
                        scheme_eval('a', <{x: 5} -> <{a: 2, b: 2} -> <Global Frame>>>) -> 2
                        scheme_eval('b', <{x: 5} -> <{a: 2, b: 2} -> <Global Frame>>>) -> 2
                        scheme_apply(#[-], '(5 2 2), <{x: 5} -> <{a: 2, b: 2} -> <Global Frame>>>) -> 1
                    -> 1
                -> 1
            -> 1
        -> 1

A few things to note:

* The `let` form evaluates the value of each pair, including call procedures.
* `scheme_eval` is always called on the whole expression, then resolves
left-to-right.
* Call expressions resolve by evaluating the procedure, then the arguments.
* Defining a function _does not_ evaluate the function until it is called. Think
of it as creating a lambda and binding it to the name.
    * `(define (b) a)` is equivalent to `(define b (lambda () a))` except
    the lambda atom is evaluated in the latter.
* Defining a variable _does_ evaluate the contents of the `define`.
* Every name must be evaluated.