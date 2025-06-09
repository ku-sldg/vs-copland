const moo = require("moo");

const lexer = moo.compile({
  ws:       { match: /[ \t\r\n]+/, lineBreaks: true },
  comment:  { match: /\%.*$/, lineBreaks: false },

  // Phrase operators
  null:     { match: '{}', value: () => '{}', type: 'null' },
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
  lbrace:   '{',
  rbrace:   '}',
  lbrack:   '[',
  rbrack:   ']',
  lparen:   '(',
  rparen:   ')',
  colon:    ':',
  comma:    ',',

  // Initial place
  star:     '*',

  // Places and symbols
  name: /\b[a-z0-9][a-zA-Z0-9_]*\b|\b\d+\b/,

  // Catch everything else as unknown
  unknown:  { match: /./, error: true }
});

module.exports = lexer;
