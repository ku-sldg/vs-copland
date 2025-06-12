@lexer lexer

@{%

const lexer = require("./copland-lexer.js")

%}

copland -> initial_place _ phrase
			| phrase

initial_place -> %star places %colon

places -> place _ (%comma _ place _):*
					| place (_ place):*

phrase -> symbol _ place _ symbol
		| %null


symbol -> %identifier

place -> symbol

_ -> %ws:*