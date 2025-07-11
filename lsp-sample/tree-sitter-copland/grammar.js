/**
 * @file Copland grammar for tree-sitter
 * @author Apk
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "copland",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
