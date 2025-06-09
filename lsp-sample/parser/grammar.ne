@lexer lexer

@{%

const lexer = require("./copland-lexer.js")

%}

initial_place -> %star identifier_list %colon

identifier_list -> %identifier (%comma %identifier):*

# add whitespace