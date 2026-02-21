import { TokenProvider } from './src/tooling/token-provider/token-provider';

const source = "print(true);\nlet A = a;\nreturn a + 0b0;\nlet a = A;\nreturn a;";
console.log('Source:', JSON.stringify(source));
console.log('Source length:', source.length);

// Simulate createChunks logic
const chunkSize = 50;
const overlapSize = 100;
const chunks: Array<{text: string, startOffset: number, endOffset: number}> = [];

let offset = 0;
let chunkIndex = 0;

while (offset < source.length) {
  const chunkStart = Math.max(0, offset - (chunkIndex > 0 ? overlapSize : 0));
  const chunkEnd = Math.min(source.length, offset + chunkSize);
  
  // Try to break at word boundaries
  let actualChunkEnd = chunkEnd;
  if (chunkEnd < source.length) {
    for (let i = chunkEnd; i > chunkEnd - 50 && i > chunkStart; i--) {
      const char = source[i];
      if (char === '\n' || char === ' ' || char === '\t' || 
          char === ';' || char === '{' || char === '}') {
        actualChunkEnd = i + 1;
        break;
      }
    }
  }
  
  chunks.push({
    text: source.substring(chunkStart, actualChunkEnd),
    startOffset: chunkStart,
    endOffset: actualChunkEnd
  });
  
  console.log(`\nChunk ${chunkIndex}:`);
  console.log(`  offset: ${offset}`);
  console.log(`  chunkStart: ${chunkStart}`);
  console.log(`  chunkEnd: ${chunkEnd}`);
  console.log(`  actualChunkEnd: ${actualChunkEnd}`);
  console.log(`  text: ${JSON.stringify(source.substring(chunkStart, actualChunkEnd))}`);
  console.log(`  startOffset: ${chunkStart}, endOffset: ${actualChunkEnd}`);
  
  offset = actualChunkEnd;
  chunkIndex++;
}

console.log(`\nTotal chunks: ${chunks.length}`);
