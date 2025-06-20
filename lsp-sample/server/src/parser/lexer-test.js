const lexer = require('./copland-lexer');

const input = "dfjjdskjf {} dsfjdsj { sdfj {} }}}  dskls";

lexer.reset(input);

console.log("Tokens:");
for (let token of lexer) {
	console.log(token);
}