const lexer = require('./copland-lexer');

const input = "*p0: @p1 _kim p2 ker -> ! -<- @p2 (vc p2 sys) -> !  _!123123ss _123 _1kimdfj _hey_hey _AAAA AAAaa A2323 aAaA";

lexer.reset(input);

console.log("Tokens:");
for (let token of lexer) {
	console.log(token);
}