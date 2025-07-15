/**
 * @file Copland grammar for tree-sitter
 * @author Apk
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'copland',

  extras: $ => [/\s+/], // allow whitespace

  rules: {
    copland: $ => choice(
      seq('*', $.places, ':', $.phrase),
      $.phrase
    ),

    place: $ => seq(
      $.symbol
    ),

    places: $ => seq(
      $.place,
      repeat(seq(optional(','), $.place))
    ),

    phrase: $ => $.at_expr,

    // Lowest precedence
    at_expr: $ => choice(
      seq('@', $.place, '[', $.phrase, ']'),
      seq('@', $.place, $.branch_expr),
      $.branch_expr
    ),

    // Medium precedence (non-associative branching)
    branch_expr: $ => choice(
      seq($.seq_expr, $.branch_op, $.seq_expr),
      $.seq_expr
    ),

    // Highest precedence (right-associative)
    seq_expr: $ => prec.right(1, seq($.prim_expr, '->', $.seq_expr)),
                   // right-associative
                   // higher prec than branch_expr and at_expr
                   // use prec.right to enforce this
                   //
                   // e.g., a -> b -> c parses as a -> (b -> c)

    // Core atomic expressions
    prim_expr: $ => choice(
      seq($.symbol, $.place, $.symbol), // measurement
      '{}',
      '_',
      '!',
      '#',
      seq('(', $.phrase, ')')
    ),

    branch_op: _ => choice('-<-', '+<-', '-<+', '+<+',
                           '-~-', '+~-', '-~+', '+~+'),

    symbol: _ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
});

