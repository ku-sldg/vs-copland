const lexer = require('./copland-lexer');

const input = " _!123123ss _123 _1kimdfj _hey_hey _AAAA AAAaa A2323 aAaA {ASD} {a} +++++ @";

lexer.reset(input);

console.log("Tokens:");
for (let token of lexer) {
	console.log(token);
}