/**
 * Unit tests for IncrementalTokenizer
 *
 * Tests incremental tokenization functionality for efficient handling
 * of text changes in real-time editing scenarios.
 */

import { IncrementalTokenizer } from '../../../src/tooling/token-provider/incremental-tokenizer';
import { TokenProvider } from '../../../src/tooling/token-provider/token-provider';
import { TextChange } from '../../../src/tooling/shared/types';
import { TokenType } from '../../../src/lexer/token';

describe('IncrementalTokenizer', () => {
  let tokenProvider: TokenProvider;
  let incrementalTokenizer: IncrementalTokenizer;

  beforeEach(() => {
    tokenProvider = new TokenProvider();
    incrementalTokenizer = new IncrementalTokenizer(tokenProvider);
  });

  describe('Basic Incremental Updates', () => {
    it('should handle simple text insertion', () => {
      // Initial tokenization
      const initialSource = 'fn main() {}';
      incrementalTokenizer.initialize(initialSource);

      // Simulate adding a space and comment
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 11, offset: 10 },
            end: { line: 1, column: 11, offset: 10 },
          },
          text: ' // comment',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      // Verify key tokens are preserved
      expect(updatedTokens.length).toBeGreaterThan(0);
      expect(updatedTokens.some((t) => t.text === 'fn')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'main')).toBe(true);
    });

    it('should handle text deletion', () => {
      // Start with source that has extra content
      const initialSource = 'fn main() { let x = 42; }';
      incrementalTokenizer.initialize(initialSource);

      // Remove the variable declaration
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 12, offset: 11 },
            end: { line: 1, column: 23, offset: 22 },
          },
          text: '',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      expect(updatedTokens.some((t) => t.text === 'fn')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'main')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'let')).toBe(false);
    });

    it('should handle text replacement', () => {
      const initialSource = 'fn main() { print("hello"); }';
      incrementalTokenizer.initialize(initialSource);

      // Replace "hello" with "world"
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 19, offset: 18 },
            end: { line: 1, column: 24, offset: 23 },
          },
          text: 'world',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      expect(updatedTokens.some((t) => t.text === 'fn')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'print')).toBe(true);
      // Note: The string content is stored as literal value, not in text
    });
  });

  describe('Multi-line Changes', () => {
    it('should handle insertion of new lines', () => {
      const initialSource = 'fn main() {}';
      incrementalTokenizer.initialize(initialSource);

      // Insert new line with content
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 11, offset: 10 },
            end: { line: 1, column: 11, offset: 10 },
          },
          text: '\n  let x = 42;\n',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      expect(updatedTokens.some((t) => t.text === 'fn')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'let')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'x')).toBe(true);
    });

    it('should handle deletion of lines', () => {
      const initialSource = 'fn main() {\n  let x = 42;\n  print(x);\n}';
      incrementalTokenizer.initialize(initialSource);

      // Delete the let statement line
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 2, column: 1, offset: 12 },
            end: { line: 3, column: 1, offset: 26 },
          },
          text: '',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      expect(updatedTokens.some((t) => t.text === 'fn')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'print')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'let')).toBe(false);
    });
  });

  describe('Multiple Changes', () => {
    it('should handle multiple simultaneous changes', () => {
      const initialSource = 'fn main() { let x = 42; let y = 24; }';
      incrementalTokenizer.initialize(initialSource);

      // Change both variable values
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 21, offset: 20 },
            end: { line: 1, column: 23, offset: 22 },
          },
          text: '100',
        },
        {
          range: {
            start: { line: 1, column: 33, offset: 32 },
            end: { line: 1, column: 35, offset: 34 },
          },
          text: '200',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      expect(updatedTokens.some((t) => t.text === 'fn')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'let')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'x')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'y')).toBe(true);
    });

    it('should handle overlapping changes correctly', () => {
      const initialSource = 'fn main() { let x = 42; }';
      incrementalTokenizer.initialize(initialSource);

      // Overlapping changes should be handled gracefully
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 17, offset: 16 },
            end: { line: 1, column: 23, offset: 22 },
          },
          text: '= 100',
        },
        {
          range: {
            start: { line: 1, column: 19, offset: 18 },
            end: { line: 1, column: 21, offset: 20 },
          },
          text: '50',
        },
      ];

      expect(() => {
        incrementalTokenizer.applyChanges(changes);
      }).not.toThrow();
    });
  });

  describe('Fallback to Full Tokenization', () => {
    it('should fall back to full tokenization for large changes', () => {
      const initialSource = 'fn main() { print("hello"); }';
      incrementalTokenizer.initialize(initialSource);

      // Very large change that should trigger full re-tokenization
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 29, offset: 28 },
          },
          text: 'fn test() {\n  for i in 1..10 {\n    println(i);\n  }\n}',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      expect(updatedTokens.some((t) => t.text === 'test')).toBe(true);
      expect(updatedTokens.some((t) => t.text === 'for')).toBe(true);
      expect(updatedTokens.some((t) => t.kind === TokenType.RANGE)).toBe(true);
    });

    it('should fall back for too many changes', () => {
      const initialSource = 'fn main() { let a = 1; let b = 2; let c = 3; }';
      incrementalTokenizer.initialize(initialSource);

      // Many small changes
      const changes: TextChange[] = [];
      for (let i = 0; i < 10; i++) {
        changes.push({
          range: {
            start: { line: 1, column: 20 + i * 10, offset: 19 + i * 10 },
            end: { line: 1, column: 21 + i * 10, offset: 20 + i * 10 },
          },
          text: '9',
        });
      }

      expect(() => {
        incrementalTokenizer.applyChanges(changes);
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should track tokenization state', () => {
      const initialSource = 'fn main() {}';
      incrementalTokenizer.initialize(initialSource);

      const initialState = incrementalTokenizer.getState();
      expect(initialState.sourceText).toBe(initialSource);
      expect(initialState.version).toBe(1);

      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 11, offset: 10 },
            end: { line: 1, column: 11, offset: 10 },
          },
          text: ' // comment',
        },
      ];

      incrementalTokenizer.applyChanges(changes);

      const updatedState = incrementalTokenizer.getState();
      expect(updatedState.version).toBe(2);
      expect(updatedState.tokens.length).toBeGreaterThan(0);
    });

    it('should reset state correctly', () => {
      const initialSource = 'fn main() {}';
      incrementalTokenizer.initialize(initialSource);

      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 11, offset: 10 },
            end: { line: 1, column: 11, offset: 10 },
          },
          text: ' // comment',
        },
      ];

      incrementalTokenizer.applyChanges(changes);

      const stateBeforeReset = incrementalTokenizer.getState();
      expect(stateBeforeReset.version).toBeGreaterThan(0);

      incrementalTokenizer.reset();

      const stateAfterReset = incrementalTokenizer.getState();
      expect(stateAfterReset.version).toBe(0);
      expect(stateAfterReset.tokens).toHaveLength(0);
      expect(stateAfterReset.sourceText).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in change application gracefully', () => {
      const initialSource = 'fn main() {}';
      incrementalTokenizer.initialize(initialSource);

      // Invalid change with negative positions
      const changes: TextChange[] = [
        {
          range: {
            start: { line: -1, column: -1, offset: -1 },
            end: { line: 1, column: 1, offset: 0 },
          },
          text: 'invalid',
        },
      ];

      expect(() => {
        incrementalTokenizer.applyChanges(changes);
      }).not.toThrow();
    });

    it('should handle tokenization errors during incremental updates', () => {
      // Mock token provider that throws errors
      const mockTokenProvider = {
        tokenize: jest.fn().mockImplementation(() => {
          throw new Error('Mock tokenization error');
        }),
      } as any;

      const incrementalTokenizer = new IncrementalTokenizer(mockTokenProvider);

      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
          },
          text: 'fn main() {}',
        },
      ];

      expect(() => {
        incrementalTokenizer.applyChanges(changes);
      }).toThrow();
    });
  });

  describe('Position Calculations', () => {
    it('should correctly calculate positions for insertions', () => {
      const initialSource = 'fn main() {}';
      incrementalTokenizer.initialize(initialSource);

      // Insert at the beginning
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
          },
          text: '// Comment\n',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      // The 'fn' token should now be on line 2
      const fnToken = updatedTokens.find((t) => t.text === 'fn');
      expect(fnToken).toBeDefined();
      expect(fnToken!.position.start.line).toBe(2);
    });

    it('should correctly handle position adjustments for deletions', () => {
      const initialSource = '// Comment\nfn main() {}';
      incrementalTokenizer.initialize(initialSource);

      // Delete the comment line
      const changes: TextChange[] = [
        {
          range: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 2, column: 1, offset: 11 },
          },
          text: '',
        },
      ];

      const updatedTokens = incrementalTokenizer.applyChanges(changes);

      // The 'fn' token should now be on line 1
      const fnToken = updatedTokens.find((t) => t.text === 'fn');
      expect(fnToken).toBeDefined();
      expect(fnToken!.position.start.line).toBe(1);
    });
  });
});
