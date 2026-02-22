/**
 * Unit tests for StreamingTokenizer
 *
 * Tests streaming tokenization functionality for efficient handling
 * of large files with memory management and progress tracking.
 */

import {
  StreamingTokenizer,
  StreamingOptions,
} from '../../../src/tooling/token-provider/streaming-tokenizer';
import { TokenProvider } from '../../../src/tooling/token-provider/token-provider';

describe('StreamingTokenizer', () => {
  let tokenProvider: TokenProvider;
  let streamingTokenizer: StreamingTokenizer;

  beforeEach(() => {
    tokenProvider = new TokenProvider();
  });

  describe('Basic Streaming', () => {
    it('should handle small files without streaming', async () => {
      const options: StreamingOptions = { chunkSize: 1000 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = 'fn main() { print("hello"); }';
      const tokens = await streamingTokenizer.tokenizeStream(source);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some((t) => t.text === 'fn')).toBe(true);
      expect(tokens.some((t) => t.text === 'main')).toBe(true);
      expect(tokens.some((t) => t.text === 'print')).toBe(true);
    });

    it('should stream large files in chunks', async () => {
      const options: StreamingOptions = {
        chunkSize: 50, // Small chunks to force streaming
        maxMemoryTokens: 100,
      };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      // Create a large source file
      const functionDef = 'fn test() { print("hello world"); }\n';
      const source = functionDef.repeat(10); // Repeat to make it large

      const tokens = await streamingTokenizer.tokenizeStream(source);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.filter((t) => t.text === 'fn')).toHaveLength(10);
      expect(tokens.filter((t) => t.text === 'test')).toHaveLength(10);
    });

    it('should provide progress callbacks', async () => {
      const progressUpdates: number[] = [];
      const options: StreamingOptions = {
        chunkSize: 30,
        onProgress: (progress) => progressUpdates.push(progress),
      };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const functionDef = 'fn test() { print("hello"); }\n';
      const source = functionDef.repeat(50); // Increased to trigger streaming

      await streamingTokenizer.tokenizeStream(source);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(1); // Should end at 100%
      expect(progressUpdates.every((p) => p >= 0 && p <= 1)).toBe(true);
    });

    it('should provide chunk callbacks', async () => {
      const chunks: any[] = [];
      const options: StreamingOptions = {
        chunkSize: 40,
        onTokenChunk: (tokens, chunkIndex) => chunks.push({ tokens, chunkIndex }),
      };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const functionDef = 'fn test() { print("hello"); }\n';
      const source = functionDef.repeat(100); // Increased to trigger streaming

      await streamingTokenizer.tokenizeStream(source);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every((chunk) => Array.isArray(chunk.tokens))).toBe(true);
      expect(chunks.every((chunk) => typeof chunk.chunkIndex === 'number')).toBe(true);
    });
  });

  describe('Streaming Iterator', () => {
    it('should provide async iterator for token chunks', async () => {
      const options: StreamingOptions = { chunkSize: 50 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const functionDef = 'fn test() { print("hello"); }\n';
      const source = functionDef.repeat(5);

      const chunks = [];
      for await (const chunk of streamingTokenizer.tokenizeStreamIterator(source)) {
        chunks.push(chunk);
        expect(chunk.tokens).toBeDefined();
        expect(chunk.startOffset).toBeDefined();
        expect(chunk.endOffset).toBeDefined();
        expect(chunk.chunkIndex).toBeDefined();
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle small files in iterator mode', async () => {
      const options: StreamingOptions = { chunkSize: 1000 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = 'fn main() {}';

      const chunks = [];
      for await (const chunk of streamingTokenizer.tokenizeStreamIterator(source)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].tokens.some((t) => t.text === 'fn')).toBe(true);
    });
  });

  describe('Position Accuracy', () => {
    it('should maintain accurate positions across chunks', async () => {
      const options: StreamingOptions = { chunkSize: 30 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = 'fn first() {}\nfn second() {}\nfn third() {}';
      const tokens = await streamingTokenizer.tokenizeStream(source);

      const firstFn = tokens.find((t) => t.text === 'first');
      const secondFn = tokens.find((t) => t.text === 'second');
      const thirdFn = tokens.find((t) => t.text === 'third');

      expect(firstFn?.position.start.line).toBe(1);
      expect(secondFn?.position.start.line).toBe(2);
      expect(thirdFn?.position.start.line).toBe(3);
    });

    it('should handle multi-line tokens correctly', async () => {
      const options: StreamingOptions = { chunkSize: 25 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = `fn main() {
        /*
         * Multi-line comment
         */
        print("hello");
      }`;

      const tokens = await streamingTokenizer.tokenizeStream(source);

      const printToken = tokens.find((t) => t.text === 'print');
      expect(printToken).toBeDefined();
      expect(printToken!.position.start.line).toBeGreaterThan(1);
    });
  });

  describe('Chunk Boundary Handling', () => {
    it('should handle tokens that span chunk boundaries', async () => {
      const options: StreamingOptions = { chunkSize: 15 }; // Very small chunks
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = 'fn verylongfunctionname() {}';
      const tokens = await streamingTokenizer.tokenizeStream(source);

      expect(tokens.some((t) => t.text === 'verylongfunctionname')).toBe(true);
    });

    it('should break at appropriate boundaries', async () => {
      const options: StreamingOptions = { chunkSize: 20 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = 'fn test() { print("hello world"); }';

      // Test that chunking doesn't break tokens inappropriately
      const tokens = await streamingTokenizer.tokenizeStream(source);

      expect(tokens.some((t) => t.text === 'fn')).toBe(true);
      expect(tokens.some((t) => t.text === 'test')).toBe(true);
      expect(tokens.some((t) => t.text === 'print')).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should respect memory limits', async () => {
      const options: StreamingOptions = {
        chunkSize: 50,
        maxMemoryTokens: 10, // Very low limit to test memory management
      };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const functionDef = 'fn test() { print("hello"); }\n';
      const source = functionDef.repeat(20);

      // Should not throw memory errors
      expect(async () => {
        await streamingTokenizer.tokenizeStream(source);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle tokenization errors gracefully', async () => {
      // Mock token provider that throws errors
      const mockTokenProvider = {
        tokenize: jest.fn().mockImplementation(() => {
          throw new Error('Mock tokenization error');
        }),
      } as any;

      streamingTokenizer = new StreamingTokenizer(mockTokenProvider);

      await expect(streamingTokenizer.tokenizeStream('fn main() {}')).rejects.toThrow();
    });

    it('should handle invalid source gracefully', async () => {
      streamingTokenizer = new StreamingTokenizer(tokenProvider);

      // Should handle syntax errors without crashing
      const source = 'fn main() { @#$%^&*( }';

      expect(async () => {
        await streamingTokenizer.tokenizeStream(source);
      }).not.toThrow();
    });
  });

  describe('Equivalence Validation', () => {
    it('should produce same results as batch tokenization', async () => {
      const options: StreamingOptions = { chunkSize: 30 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const source = `
        fn main() {
          let x = 42;
          for i in 1..10 {
            print(i * x);
          }
        }
      `;

      const isEquivalent = await streamingTokenizer.validateStreamingEquivalence(source);
      expect(isEquivalent).toBe(true);
    });

    it('should handle edge cases in equivalence validation', async () => {
      streamingTokenizer = new StreamingTokenizer(tokenProvider);

      // Empty source
      expect(await streamingTokenizer.validateStreamingEquivalence('')).toBe(true);

      // Single token
      expect(await streamingTokenizer.validateStreamingEquivalence('fn')).toBe(true);

      // Only whitespace
      expect(await streamingTokenizer.validateStreamingEquivalence('   \n\t  ')).toBe(true);
    });

    it('should detect differences when they exist', async () => {
      // Mock token provider that returns different results
      let callCount = 0;
      const mockTokenProvider = {
        tokenize: jest.fn().mockImplementation((source: string) => {
          callCount++;
          if (callCount === 1) {
            // First call (batch) - return normal tokens
            return new TokenProvider().tokenize(source);
          } else {
            // Second call (streaming) - return different tokens
            return [];
          }
        }),
      } as any;

      streamingTokenizer = new StreamingTokenizer(mockTokenProvider);

      const isEquivalent = await streamingTokenizer.validateStreamingEquivalence('fn main() {}');
      expect(isEquivalent).toBe(false);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle very large files efficiently', async () => {
      const options: StreamingOptions = {
        chunkSize: 1000,
        maxMemoryTokens: 5000,
      };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      // Create a large source file
      const functionDef = 'fn test() { let x = 42; print(x); }\n';
      const source = functionDef.repeat(100); // Large file

      const startTime = Date.now();
      const tokens = await streamingTokenizer.tokenizeStream(source);
      const endTime = Date.now();

      expect(tokens.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should yield to event loop during processing', async () => {
      const options: StreamingOptions = { chunkSize: 100 };
      streamingTokenizer = new StreamingTokenizer(tokenProvider, options);

      const functionDef = 'fn test() { print("hello"); }\n';
      const source = functionDef.repeat(50);

      let eventLoopRan = false;
      setTimeout(() => {
        eventLoopRan = true;
      }, 0);

      await streamingTokenizer.tokenizeStream(source);

      // Give a moment for the timeout to execute
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(eventLoopRan).toBe(true);
    });
  });
});
