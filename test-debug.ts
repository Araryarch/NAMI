import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { TokenType } from './src/lexer/token';

const validCode = 'print(a + "\\"");';
const source = `let x = "unterminated\n${validCode}`;

console.log('Source code:');
console.log(source);
console.log('\n---\n');

const tokenProvider = new TokenProvider();
const tokens = tokenProvider.tokenize(source);

console.log('Tokens:');
tokens.forEach((token, i) => {
  console.log(`${i}: ${TokenType[token.kind]} - "${token.text}"`);
});

const nonEofTokens = tokens.filter(t => t.kind !== TokenType.EOF);

const hasTokensBeforeError = nonEofTokens.some(t => 
  t.kind === TokenType.LET || t.kind === TokenType.IDENTIFIER
);

const hasErrorToken = nonEofTokens.some(t => t.kind === TokenType.ERROR);

console.log('\nhasTokensBeforeError:', hasTokensBeforeError);
console.log('hasErrorToken:', hasErrorToken);
console.log('Test passes:', hasTokensBeforeError && hasErrorToken);
