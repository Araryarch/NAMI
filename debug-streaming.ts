import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { StreamingTokenizer } from './src/tooling/token-provider/streaming-tokenizer';
import { TokenType } from './src/lexer/token';

// Counterexample from test
const statements = ["print(true);","let A = a;","return a + 0b0;","let a = A;","return a;"];
const source = statements.join('\n');

console.log('Source:', JSON.stringify(source));
console.log('Source length:', source.length);

const tokenProvider = new TokenProvider();
const streamingTokenizer = new StreamingTokenizer(tokenProvider, {
  chunkSize: 50 // Small chunks to test streaming
});

// Batch tokenization
console.log('\n=== Batch Tokenization ===');
const batchTokens = tokenProvider.tokenize(source);
console.log('Batch token count:', batchTokens.filter(t => t.kind !== TokenType.EOF).length);
console.log('Batch tokens:');
batchTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
  console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
});

// Streaming tokenization
console.log('\n=== Streaming Tokenization ===');
streamingTokenizer.tokenizeStream(source).then(streamTokens => {
  console.log('Stream token count:', streamTokens.filter(t => t.kind !== TokenType.EOF).length);
  console.log('Stream tokens:');
  streamTokens.filter(t => t.kind !== TokenType.EOF).forEach((t, i) => {
    console.log(`  ${i}: ${TokenType[t.kind]} "${t.text}" at ${t.position.start.line}:${t.position.start.column}`);
  });
  
  // Compare
  const batchKinds = batchTokens.filter(t => t.kind !== TokenType.EOF).map(t => TokenType[t.kind]);
  const streamKinds = streamTokens.filter(t => t.kind !== TokenType.EOF).map(t => TokenType[t.kind]);
  
  console.log('\n=== Comparison ===');
  console.log('Batch kinds:', batchKinds);
  console.log('Stream kinds:', streamKinds);
  console.log('Match:', JSON.stringify(batchKinds) === JSON.stringify(streamKinds));
});
