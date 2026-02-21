import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { IncrementalTokenizer } from './src/tooling/token-provider/incremental-tokenizer';
import { TokenType } from './src/lexer/token';

// Test case from failing property test
// Counterexample: ["fn A() {\n  print(_);\n}",[{"line":0,"column":0,"text":"a"}]]
const source1 = "fn A() {\n  print(_);\n}";
const changes1 = [{"line":0,"column":0,"text":"a"}];

console.log('=== Test Case 1: Insert "a" at line 0, column 0 ===');
console.log('Source:', JSON.stringify(source1));
console.log('Changes:', JSON.stringify(changes1));

const tokenProvider1 = new TokenProvider();
const incrementalTokenizer1 = new IncrementalTokenizer(tokenProvider1);

// Initialize
incrementalTokenizer1.initialize(source1);

// Apply changes
const textChanges1 = changes1.map(change => ({
  range: {
    start: { line: change.line + 1, column: change.column + 1, offset: 0 },
    end: { line: change.line + 1, column: change.column + 1, offset: 0 }
  },
  text: change.text
}));

console.log('Text changes:', JSON.stringify(textChanges1, null, 2));

const incrementalTokens1 = incrementalTokenizer1.applyChanges(textChanges1);

// Get the final source text
const finalSource1 = incrementalTokenizer1.getState().sourceText;
console.log('Final source:', JSON.stringify(finalSource1));

// Full re-tokenization
const fullTokens1 = tokenProvider1.tokenize(finalSource1);

// Compare token kinds
const incrementalKinds1 = incrementalTokens1
  .filter(t => t.kind !== TokenType.EOF)
  .map(t => TokenType[t.kind]);
const fullKinds1 = fullTokens1
  .filter(t => t.kind !== TokenType.EOF)
  .map(t => TokenType[t.kind]);

console.log('\nIncremental token kinds:', incrementalKinds1);
console.log('Full token kinds:', fullKinds1);
console.log('Match:', JSON.stringify(incrementalKinds1) === JSON.stringify(fullKinds1));

console.log('\nIncremental tokens:');
incrementalTokens1.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

console.log('\nFull tokens:');
fullTokens1.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

// Test case 2
// Counterexample: ["print(null);","!"]
const source2 = "print(null);";
const insertion2 = "!";

console.log('\n\n=== Test Case 2: Insert "!" at beginning ===');
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
const finalSource2 = incrementalTokenizer2.getState().sourceText;
console.log('Final source:', JSON.stringify(finalSource2));

const fullTokens2 = tokenProvider2.tokenize(finalSource2);

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
