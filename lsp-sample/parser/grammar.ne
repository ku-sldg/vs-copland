@lexer lexer

@{%

const lexer = require("./copland-lexer.js")

%}

copland -> initial_place _ phrase
			| phrase

initial_place -> %star identifier_list %colon

identifier_list -> %identifier _ (%comma _ %identifier _):*
					| %identifier (_ %identifier):*

phrase -> symbol _ place _ symbol
		| %null


symbol -> %identifier

place -> symbol
		| digits

digits -> [0-9]:+

_ -> %ws:*