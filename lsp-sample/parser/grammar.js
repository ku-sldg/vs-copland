// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


const lexer = require("./copland-lexer.js")

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "copland", "symbols": ["initial_place", "_", "phrase"]},
    {"name": "copland", "symbols": ["phrase"]},
    {"name": "initial_place", "symbols": [(lexer.has("star") ? {type: "star"} : star), "places", (lexer.has("colon") ? {type: "colon"} : colon)]},
    {"name": "places$ebnf$1", "symbols": []},
    {"name": "places$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_", "place", "_"]},
    {"name": "places$ebnf$1", "symbols": ["places$ebnf$1", "places$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "places", "symbols": ["place", "_", "places$ebnf$1"]},
    {"name": "places$ebnf$2", "symbols": []},
    {"name": "places$ebnf$2$subexpression$1", "symbols": ["_", "place"]},
    {"name": "places$ebnf$2", "symbols": ["places$ebnf$2", "places$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "places", "symbols": ["place", "places$ebnf$2"]},
    {"name": "phrase", "symbols": ["symbol", "_", "place", "_", "symbol"]},
    {"name": "phrase", "symbols": [(lexer.has("null") ? {type: "null"} : null)]},
    {"name": "symbol", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "place", "symbols": ["symbol"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]}
]
  , ParserStart: "copland"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
