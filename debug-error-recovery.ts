import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { TokenType } from './src/lexer/token';

const validCode = "return null;";
const source = `let x = "unterminated\n${validCode}`;

console.log('Source:', JSON.stringify(source));

const tokenProvider = new TokenProvider();
const tokens = tokenProvider.tokenize(source);

console.log('\nAll tokens:');
tokens.forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

const hasValidTokens = tokens.some(t => 
  t.kind !== TokenType.EOF && 
  t.position.start.line > 1
);

console.log('\nHas valid tokens on line > 1:', hasValidTokens);
