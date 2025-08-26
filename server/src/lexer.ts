import moo from "moo";

export const Lexer = moo.compile({
  ws:       { match: /[\s|\t|\r|\n]/, lineBreaks: true },
  comment:  { match: /%.*$/, lineBreaks: false },

  // Invalid use of copy
  invalid_copy: /_[^\s]+/,

  // Invalid identifier casing
  invalid_identifier_case: /\b[A-Z]+[a-zA-Z0-9_]*\b/,

  // Invalid use of null
  invalid_null: /\{[^}]+\}/,

  // Phrase operators
  null:     '{}',
  arrow:    '->',
  sig:      '!',
  hash:     '#',
  copy:     '_',
  at:       '@',

  // Branch operators
  seq_branch: [
    '-<-', '+<-', '-<+', '+<+'
  ],
  par_branch: [
    '-~-', '+~-', '-~+', '+~+'
  ],

  // Grouping and punctuation
  lbrack:   '[',
  rbrack:   ']',
  lparen:   '(',
  rparen:   ')',
  colon:    ':',
  rcurly:   '{',
  lcurly:   '}',


  // Initial place
  star:     '*',
  

  // Places and symbols
  identifier: /\b[a-z0-9][a-zA-Z0-9_]*\b|\b\d+\b/,

  // Catch everything else as unknown
  unknown:  { match: /./, error: true }
});

