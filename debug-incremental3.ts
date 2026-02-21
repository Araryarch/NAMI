import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { IncrementalTokenizer } from './src/tooling/token-provider/incremental-tokenizer';
import { TokenType } from './src/lexer/token';

// Simple test: insert "!" at beginning of "print(null);"
const source = "print(null);";
const insertion = "!";

console.log('=== Debug: Insert "!" at beginning ===');
console.log('Source:', JSON.stringify(source));
console.log('Insertion:', JSON.stringify(insertion));

const tokenProvider = new TokenProvider();

// First, let's see what tokens we get from just tokenizing "!print"
console.log('\n--- Tokenizing "!print" directly ---');
const testTokens = tokenProvider.tokenize("!print");
testTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column} (offset ${t.position.start.offset})`);
});

// Now let's trace through the incremental tokenizer
const incrementalTokenizer = new IncrementalTokenizer(tokenProvider);
incrementalTokenizer.initialize(source);

const change = {
  range: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
  },
  text: insertion
};

console.log('\n--- Applying incremental change ---');
const updatedTokens = incrementalTokenizer.applyChanges([change]);
const finalSource = incrementalTokenizer.getState().sourceText;
console.log('Final source:', JSON.stringify(finalSource));

console.log('\nIncremental tokens:');
updatedTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column} (offset ${t.position.start.offset})`);
});

// Full re-tokenization for comparison
const fullTokens = tokenProvider.tokenize(finalSource);
console.log('\nFull tokens:');
fullTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column} (offset ${t.position.start.offset})`);
});
