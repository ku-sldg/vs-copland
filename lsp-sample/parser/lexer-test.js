const lexer = require('./copland-lexer');

const input = "*p0: @p1 kim p2 ker -> ! -<- @p2 (vc p2 sys) -> !";

lexer.reset(input);

console.log("Tokens:");
for (let token of lexer) {
	console.log(token);
}