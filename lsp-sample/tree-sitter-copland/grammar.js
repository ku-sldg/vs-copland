/**
 * @file Copland grammar for tree-sitter
 * @author Apk
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'copland',

  extras: $ => [/\s+/],

  rules: {
    copland: $ => choice(
      seq(
        '*',
        field('initial_place', $.places),
        ':',
        field('phrase', $.phrase)
      ),
      $.phrase
    ),

    places: $ => seq($.place, repeat(seq(',', $.place))),
    place: $ => $.symbol,

    phrase: $ => choice(
      alias($. at_expr, $.at_expr),
      alias($.seq_expr, $.seq_expr),
      alias($.branch_expr, $.branch_expr),
      alias($.measurement, $.measurement),
      alias($.null_expr, $.null_expr),
      alias($.copy_expr, $.copy_expr),
      alias($.sig_expr, $.sig_expr),
      alias($.hash_expr, $.hash_expr),
      $.symbol,
      seq('(', $.phrase, ')')
    ),

    at_expr: $ => choice(
      prec.right(1, seq(
        '@',
        field('place', $.place),
        '[',
        field('phrase', $.phrase),
        ']'
      ))
    ),

    branch_expr: $ => choice(
      prec.left(2, seq(
        field('branchLeft', $.phrase),
        field('op', $.branch_op),
        field('branchRight', $.phrase)
      ))
    ),

    seq_expr: $ => choice(
      prec.right(3, seq(
        field('seqLeft', $.phrase),
        '->',
        field('seqRight', $.phrase)
      ))
    ),

    measurement: $ => seq(
      field('probe', $.symbol),
      field('place', $.place),
      field('target', $.symbol)
    ),

    null_expr: _ => '{}',
    copy_expr: _ => '_',
    sig_expr: _ => '!',
    hash_expr: _ => '#',

    branch_op: _ => choice(
      '-<-', '+<-', '-<+', '+<+',
      '-~-', '+~-', '-~+', '+~+'
    ),

    symbol: _ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
});

// fix precedence. at needs to wrap everything