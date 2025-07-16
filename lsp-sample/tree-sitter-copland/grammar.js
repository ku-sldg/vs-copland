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

    // lowest prec
    at_expr: $ => choice(
      seq('@', $.place, '[', $.term_expr, ']')
    ),

    term_expr: $ => choice(
      seq($.symbol, $.place, $.symbol)
    ),

    symbol: _ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
});

