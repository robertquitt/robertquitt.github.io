---
layout: post
title: scheme_eval and scheme_apply
---

Today we'll be taking a look at how many times `scheme_eval` and `scheme_apply` are
called in our Scheme interpreter.

How many times are `scheme_eval` and `scheme_apply` called for the following?


* `(+ 2 3 (- 4 5) 1)`:

		('+' 2 3 (- 4 5) 1)
			'+'
			2
			3
			('-' 4 5)
				'-'
				4
				5
				(apply #[-] '(4 5))
			1
			(apply #[+] '(2 3 -1 1))


* `(begin (define (foo x) (+ x 3)) (foo (- 5 2)))`

* `(define a 2)` <br>
  `(define (b) 3)` <br>
  `(let ((b a) (a (b))) ((lambda (x) (- x a b)) 5))`:

		('define' 'a' 2)
			2
		('define' ('b') 'a')
		('let' (('b' 'a') ('a' ('b'))) (('lambda' ('x') ('-' 'x' 'a' 'b')) 5))
			'a'
			('b')
				'b'
				(apply ((lambda () 3)) '())
					3
			(('lambda' ('x') ('-' 'x' 'a' 'b')) 5))
				'('lambda' ('x') ('-' 'x' 'a' 'b'))
				5
				(apply (lambda ('x') '('-' 'x' 'a' 'b')) (5))
					('-' 'x' 'a' 'b')
						'-'
						'x'
						'a'
						'b'
						(apply #[-] '(5 3 2))

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