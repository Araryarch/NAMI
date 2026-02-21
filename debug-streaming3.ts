import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { StreamingTokenizer } from './src/tooling/token-provider/streaming-tokenizer';
import { TokenType } from './src/lexer/token';

// Counterexample from test
const statements = ["print(_);","print(_);","print(_);","print(_ + true);","return \"\";","break;","let A = false;","break;","let a = A + false;","break;"];
const source = statements.join('\n');

console.log('Source:', JSON.stringify(source));
console.log('Source length:', source.length);

const tokenProvider = new TokenProvider();
const streamingTokenizer = new StreamingTokenizer(tokenProvider, {
  chunkSize: 80 // From the test
});

// Batch tokenization
const batchTokens = tokenProvider.tokenize(source);
const batchKinds = batchTokens.filter(t => t.kind !== TokenType.EOF).map(t => TokenType[t.kind]);

console.log('\nBatch token count:', batchTokens.filter(t => t.kind !== TokenType.EOF).length);

// Streaming tokenization
streamingTokenizer.tokenizeStream(source).then(streamTokens => {
  const streamKinds = streamTokens.filter(t => t.kind !== TokenType.EOF).map(t => TokenType[t.kind]);
  
  console.log('Stream token count:', streamTokens.filter(t => t.kind !== TokenType.EOF).length);
  
  console.log('\nMatch:', JSON.stringify(batchKinds) === JSON.stringify(streamKinds));
  
  if (JSON.stringify(batchKinds) !== JSON.stringify(streamKinds)) {
    console.log('\nBatch kinds:', batchKinds);
    console.log('\nStream kinds:', streamKinds);
    
    // Find differences
    const maxLen = Math.max(batchKinds.length, streamKinds.length);
    for (let i = 0; i < maxLen; i++) {
      if (batchKinds[i] !== streamKinds[i]) {
        console.log(`\nDifference at index ${i}:`);
        console.log(`  Batch: ${batchKinds[i]}`);
        console.log(`  Stream: ${streamKinds[i]}`);
        break;
      }
    }
  }
});
