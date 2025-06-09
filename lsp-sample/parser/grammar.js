// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


const lexer = require("./copland-lexer.js")

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "initial_place", "symbols": [(lexer.has("star") ? {type: "star"} : star), "identifier_list", (lexer.has("colon") ? {type: "colon"} : colon)]},
    {"name": "identifier_list$ebnf$1", "symbols": []},
    {"name": "identifier_list$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "identifier_list$ebnf$1", "symbols": ["identifier_list$ebnf$1", "identifier_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "identifier_list", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "identifier_list$ebnf$1"]}
]
  , ParserStart: "initial_place"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
