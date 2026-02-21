import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { IncrementalTokenizer } from './src/tooling/token-provider/incremental-tokenizer';
import { TokenType } from './src/lexer/token';

// Counterexample: ["fn _() {\n  let a = _ + 0b0;\n}",[{"line":1,"column":3,"text":"\n"}]]
const source = "fn _() {\n  let a = _ + 0b0;\n}";
const changes = [{"line":1,"column":3,"text":"\n"}];

console.log('=== Test Case: Insert newline at line 1, column 3 ===');
console.log('Source:', JSON.stringify(source));
console.log('Changes:', JSON.stringify(changes));

const tokenProvider = new TokenProvider();
const incrementalTokenizer = new IncrementalTokenizer(tokenProvider);

// Initialize
incrementalTokenizer.initialize(source);

// Apply changes
const textChanges = changes.map(change => ({
  range: {
    start: { line: change.line + 1, column: change.column + 1, offset: 0 },
    end: { line: change.line + 1, column: change.column + 1, offset: 0 }
  },
  text: change.text
}));

console.log('Text changes:', JSON.stringify(textChanges, null, 2));

const incrementalTokens = incrementalTokenizer.applyChanges(textChanges);

// Get the final source text
const finalSource = incrementalTokenizer.getState().sourceText;
console.log('Final source:', JSON.stringify(finalSource));

// Full re-tokenization
const fullTokens = tokenProvider.tokenize(finalSource);

// Compare token kinds
const incrementalKinds = incrementalTokens
  .filter(t => t.kind !== TokenType.EOF)
  .map(t => TokenType[t.kind]);
const fullKinds = fullTokens
  .filter(t => t.kind !== TokenType.EOF)
  .map(t => TokenType[t.kind]);

console.log('\nIncremental token kinds:', incrementalKinds);
console.log('Full token kinds:', fullKinds);
console.log('Match:', JSON.stringify(incrementalKinds) === JSON.stringify(fullKinds));

if (JSON.stringify(incrementalKinds) !== JSON.stringify(fullKinds)) {
  console.log('\nIncremental tokens:');
  incrementalTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
    console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
  });

  console.log('\nFull tokens:');
  fullTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
    console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
  });
}
