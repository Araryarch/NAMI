import { TokenProvider } from './src/tooling/token-provider/token-provider';
import { StreamingTokenizer } from './src/tooling/token-provider/streaming-tokenizer';
import { TokenType } from './src/lexer/token';

// First counterexample from test
const statements = ["return A + \"\";","const a000 = Aa_0a0_aa0_;","const Aaa_ = _aa_ + \"\";","println(true);","println('          ');","return 0;","break;","return A + null;","let a = true;","return A + true;","print(A);","print(A);","print(A);","let _ = 0b0;","print(_);"];
const source = statements.join('\n');

console.log('Source length:', source.length);

const tokenProvider = new TokenProvider();
const streamingTokenizer = new StreamingTokenizer(tokenProvider, {
  chunkSize: 100 // From the test
});

// Batch tokenization
const batchTokens = tokenProvider.tokenize(source);
const batchKinds = batchTokens.filter(t => t.kind !== TokenType.EOF).map(t => TokenType[t.kind]);

console.log('Batch token count:', batchTokens.filter(t => t.kind !== TokenType.EOF).length);

// Streaming tokenization
streamingTokenizer.tokenizeStream(source).then(streamTokens => {
  const streamKinds = streamTokens.filter(t => t.kind !== TokenType.EOF).map(t => TokenType[t.kind]);
  
  console.log('Stream token count:', streamTokens.filter(t => t.kind !== TokenType.EOF).length);
  
  console.log('\nMatch:', JSON.stringify(batchKinds) === JSON.stringify(streamKinds));
  
  if (JSON.stringify(batchKinds) !== JSON.stringify(streamKinds)) {
    console.log('\nBatch kinds:', batchKinds);
    console.log('\nStream kinds:', streamKinds);
    
    // Find first difference
    const maxLen = Math.max(batchKinds.length, streamKinds.length);
    for (let i = 0; i < maxLen; i++) {
      if (batchKinds[i] !== streamKinds[i]) {
        console.log(`\nFirst difference at index ${i}:`);
        console.log(`  Batch: ${batchKinds[i]}`);
        console.log(`  Stream: ${streamKinds[i]}`);
        
        // Show context
        console.log('\nContext (batch):');
        for (let j = Math.max(0, i - 2); j < Math.min(batchKinds.length, i + 3); j++) {
          console.log(`  ${j}: ${batchKinds[j]}`);
        }
        console.log('\nContext (stream):');
        for (let j = Math.max(0, i - 2); j < Math.min(streamKinds.length, i + 3); j++) {
          console.log(`  ${j}: ${streamKinds[j]}`);
        }
        break;
      }
    }
  }
});
