---
layout: post
title: scheme_eval and scheme_apply
---

Today we'll be taking a look at how many times `scheme_eval` and `scheme_apply` are
called in our Scheme interpreter.

How many times are `scheme_eval` and `scheme_apply` called for the following?


### `(+ 2 3 (- 4 5) 1)`

* `('+' 2 3 (- 4 5) 1)` *1*
	* `'+'` *2*
	* `2` *3*
	* `3` *4*
	* `('-' 4 5)` *5*
		* `'-'` *6*
		* `4` *7*
		* `5` *8*
		* `(apply #[-] '(4 5))` *1*
	* `1` *9*
	* `(apply #[+] '(2 3 -1 1))` *2*

### `(begin (define (foo x) (+ x 3)) (foo (- 5 2)))`

* `(begin (define (foo x) (+ x 3)) (foo (- 5 2)))` *1*
	* `(define (foo x) (+ x 3))` *2*
	* `(foo (- 5 2))` *3*
	* `foo` *4*
	* `(- 5 2)` *5*
		* `-` *6*
		* `5` *7*
		* `2` *8*
		* `(apply #[-] '(5 2))` *1*
	* `(apply foo '(3))` *9*

### `(define a 2)` <br> `(define (b) 3)` <br> `(let ((b a) (a (b))) ((lambda (x) (- x a b)) 5))`

* `(define a 2)` *1*
	* `2` *2*
* `('define' (b) a)` *3*
* `('let' ((b a) (a (b))) ((lambda (x) (- x a b)) 5))` *4*
	* `a` *5*
	* `(b)` *6*
		* `b` *7*
		* `(apply ((lambda () 3)) '())` *1*
			* `3` *8*
	* `((lambda (x) (- x a b)) 5))` *9*
		* `'(lambda (x) (- x a b))` *10*
		* `5` *11*
		* `(apply (lambda (x) '(- x a b)) (5))` *2*
			* `(- x a b)` *12*
				* `-` *13*
				* `x` *14*
				* `a` *15*
				* `b` *16*
				* `(apply #[-] '(5 3 2))` *3*

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

Here is a chart for reference:

Special Form | Evaluation Procedure
:-- | :--
`(begin . exprs)`| evaluate all expressions
`(and . exprs)`| evaluate expressions until one returns false
`(or . exprs)`| evaluate expressions until one returns true
`(cond ((pred) expr) ... (else 1))`| evaluate predicates until one returns true and evaluate the corresponding expression
`(if expr expr expr)`| evaluate the first expression and either the second or third expression
`(let ((name expr) ...)`| evaluate second expressions in binding pairs and all expressions after list of bindings
`(define name expr)`| no evaluation
`(define (name . formals) expr)`| evaluate second expression
`(lambda (formals) expr)`| no evaluation
`(quote expr)`| no evaluation