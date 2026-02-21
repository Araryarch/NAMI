import { Lexer } from './src/lexer/lexer';

// Test 1: Unterminated string with newline
const source1 = `let x = "unterminated
return null;`;

console.log('=== Test 1: Unterminated string with newline ===');
console.log('Source:', JSON.stringify(source1));

const lexer1 = new Lexer(source1);
const tokens1 = lexer1.tokenize();
const errors1 = lexer1.getErrors();

console.log('\nTokens:');
tokens1.forEach((t, i) => {
  console.log(`  ${i}: ${t.type} "${t.lexeme}" at ${t.span.start.line}:${t.span.start.column}`);
});

console.log('\nErrors:', errors1.map(e => e.message));

// Test 2: String without closing quote but no newline
const source2 = `let x = "unterminated`;

console.log('\n\n=== Test 2: Unterminated string without newline ===');
console.log('Source:', JSON.stringify(source2));

const lexer2 = new Lexer(source2);
const tokens2 = lexer2.tokenize();
const errors2 = lexer2.getErrors();

console.log('\nTokens:');
tokens2.forEach((t, i) => {
  console.log(`  ${i}: ${t.type} "${t.lexeme}" at ${t.span.start.line}:${t.span.start.column}`);
});

console.log('\nErrors:', errors2.map(e => e.message));
