import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { TokenType } from './src/lexer/token';

// The problematic string
const source1 = "println('          ');";
console.log('=== Test 1: Full source ===');
console.log('Source:', JSON.stringify(source1));

const tokenProvider1 = new TokenProvider();
const tokens1 = tokenProvider1.tokenize(source1);

console.log('Tokens:');
tokens1.forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}"`);
});

// Now test with a chunk that might split the string
const source2 = "println('     ";
console.log('\n=== Test 2: Partial source (chunk boundary) ===');
console.log('Source:', JSON.stringify(source2));

const tokenProvider2 = new TokenProvider();
const tokens2 = tokenProvider2.tokenize(source2);

console.log('Tokens:');
tokens2.forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}"`);
});
