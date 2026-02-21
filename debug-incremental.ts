import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { IncrementalTokenizer } from './src/tooling/token-provider/incremental-tokenizer';
import { TokenType } from './src/lexer/token';

// Test case 1: From failing test
const source1 = "fn A() {\n  break;\n}";
const insertion1 = "";

console.log('=== Test Case 1: Empty insertion ===');
console.log('Source:', JSON.stringify(source1));
console.log('Insertion:', JSON.stringify(insertion1));

const tokenProvider1 = new TokenProvider();
const incrementalTokenizer1 = new IncrementalTokenizer(tokenProvider1);

// Initialize
incrementalTokenizer1.initialize(source1);

// Insert text at the beginning
const change1 = {
  range: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
  },
  text: insertion1
};

const updatedTokens1 = incrementalTokenizer1.applyChanges([change1]);

// Full re-tokenization
const fullTokens1 = tokenProvider1.tokenize(insertion1 + source1);

// Token counts
const incrementalCount1 = updatedTokens1.filter(t => t.kind !== TokenType.EOF).length;
const fullCount1 = fullTokens1.filter(t => t.kind !== TokenType.EOF).length;

console.log('Incremental token count:', incrementalCount1);
console.log('Full token count:', fullCount1);
console.log('Match:', incrementalCount1 === fullCount1);

console.log('\nIncremental tokens:');
updatedTokens1.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

console.log('\nFull tokens:');
fullTokens1.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

// Test case 2: More complex
const source2 = "let x = 1;";
const insertion2 = "// comment\n";

console.log('\n\n=== Test Case 2: Comment insertion ===');
console.log('Source:', JSON.stringify(source2));
console.log('Insertion:', JSON.stringify(insertion2));

const tokenProvider2 = new TokenProvider();
const incrementalTokenizer2 = new IncrementalTokenizer(tokenProvider2);

incrementalTokenizer2.initialize(source2);

const change2 = {
  range: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
  },
  text: insertion2
};

const updatedTokens2 = incrementalTokenizer2.applyChanges([change2]);
const fullTokens2 = tokenProvider2.tokenize(insertion2 + source2);

const incrementalCount2 = updatedTokens2.filter(t => t.kind !== TokenType.EOF).length;
const fullCount2 = fullTokens2.filter(t => t.kind !== TokenType.EOF).length;

console.log('Incremental token count:', incrementalCount2);
console.log('Full token count:', fullCount2);
console.log('Match:', incrementalCount2 === fullCount2);

console.log('\nIncremental tokens:');
updatedTokens2.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

console.log('\nFull tokens:');
fullTokens2.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});
