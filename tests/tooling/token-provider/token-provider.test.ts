/**
 * Unit tests for TokenProvider
 * 
 * Tests the core tokenization functionality including position tracking,
 * trivia preservation, and error recovery.
 */

import { TokenProvider } from '../../../src/tooling/token-provider/token-provider';
import { TokenType } from '../../../src/lexer/token';
import { TriviaKind } from '../../../src/tooling/shared/types';

describe('TokenProvider', () => {
  let tokenProvider: TokenProvider;

  beforeEach(() => {
    tokenProvider = new TokenProvider();
  });

  describe('Basic Tokenization', () => {
    it('should tokenize simple Nami code', () => {
      const source = 'fn main() { print("Hello"); }';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0].kind).toBe(TokenType.FN);
      expect(tokens[0].text).toBe('fn');
      expect(tokens[1].kind).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].text).toBe('main');
    });

    it('should handle empty source', () => {
      const source = '';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens).toHaveLength(1); // Just EOF
      expect(tokens[0].kind).toBe(TokenType.EOF);
    });

    it('should handle whitespace-only source', () => {
      const source = '   \n\t  \n  ';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens).toHaveLength(1); // Just EOF
      expect(tokens[0].kind).toBe(TokenType.EOF);
    });
  });

  describe('Position Tracking', () => {
    it('should track accurate positions for single-line code', () => {
      const source = 'let x = 42;';
      const tokens = tokenProvider.tokenize(source);

      const letToken = tokens[0];
      expect(letToken.position.start.line).toBe(1);
      expect(letToken.position.start.column).toBe(1);
      expect(letToken.position.end.line).toBe(1);
      expect(letToken.position.end.column).toBe(4);

      const xToken = tokens[1];
      expect(xToken.position.start.line).toBe(1);
      expect(xToken.position.start.column).toBe(5);
    });

    it('should track accurate positions for multi-line code', () => {
      const source = 'fn test() {\n  let x = 1;\n}';
      const tokens = tokenProvider.tokenize(source);

      const letToken = tokens.find(t => t.kind === TokenType.LET);
      expect(letToken).toBeDefined();
      expect(letToken!.position.start.line).toBe(2);
      expect(letToken!.position.start.column).toBe(3);
    });

    it('should provide accurate offset positions', () => {
      const source = 'fn main() {}';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens[0].position.start.offset).toBe(0); // 'fn'
      expect(tokens[1].position.start.offset).toBe(3); // 'main'
      expect(tokens[2].position.start.offset).toBe(7); // '('
    });
  });

  describe('Trivia Preservation', () => {
    it('should preserve whitespace trivia', () => {
      const source = 'fn   main() {}';
      const tokens = tokenProvider.tokenize(source);

      const mainToken = tokens.find(t => t.text === 'main');
      expect(mainToken).toBeDefined();
      expect(mainToken!.trivia).toHaveLength(1);
      expect(mainToken!.trivia[0].kind).toBe(TriviaKind.Whitespace);
      expect(mainToken!.trivia[0].text).toBe('   ');
    });

    it('should preserve single-line comments', () => {
      const source = 'fn main() { // This is a comment\n  print("hello");\n}';
      const tokens = tokenProvider.tokenize(source);

      // Find token after the comment
      const printToken = tokens.find(t => t.text === 'print');
      expect(printToken).toBeDefined();
      
      // Check if comment is preserved in trivia
      const hasComment = tokens.some(token => 
        token.trivia.some(trivia => 
          trivia.kind === TriviaKind.LineComment && 
          trivia.text.includes('This is a comment')
        )
      );
      expect(hasComment).toBe(true);
    });

    it('should preserve block comments', () => {
      const source = 'fn main() { /* Block comment */ print("hello"); }';
      const tokens = tokenProvider.tokenize(source);

      const hasBlockComment = tokens.some(token => 
        token.trivia.some(trivia => 
          trivia.kind === TriviaKind.BlockComment && 
          trivia.text.includes('Block comment')
        )
      );
      expect(hasBlockComment).toBe(true);
    });

    it('should preserve multi-line block comments', () => {
      const source = `fn main() {
        /*
         * Multi-line
         * block comment
         */
        print("hello");
      }`;
      const tokens = tokenProvider.tokenize(source);

      const hasMultiLineComment = tokens.some(token => 
        token.trivia.some(trivia => 
          trivia.kind === TriviaKind.BlockComment && 
          trivia.text.includes('Multi-line')
        )
      );
      expect(hasMultiLineComment).toBe(true);
    });
  });

  describe('Range-based Token Retrieval', () => {
    it('should return tokens within specified range', () => {
      const source = 'fn main() {\n  let x = 42;\n  print(x);\n}';
      tokenProvider.tokenize(source);

      const start = { line: 2, column: 1, offset: 12 };
      const end = { line: 2, column: 13, offset: 24 };
      const rangeTokens = tokenProvider.getTokensInRange(start, end);

      expect(rangeTokens.length).toBeGreaterThan(0);
      expect(rangeTokens.some(t => t.text === 'let')).toBe(true);
      expect(rangeTokens.some(t => t.text === 'x')).toBe(true);
    });

    it('should return empty array for range with no tokens', () => {
      const source = 'fn main() {}';
      tokenProvider.tokenize(source);

      const start = { line: 10, column: 1, offset: 100 };
      const end = { line: 10, column: 10, offset: 110 };
      const rangeTokens = tokenProvider.getTokensInRange(start, end);

      expect(rangeTokens).toHaveLength(0);
    });
  });

  describe('Error Recovery', () => {
    it('should handle syntax errors gracefully', () => {
      const source = 'fn main() { let x = @#$; }'; // Invalid characters
      
      expect(() => {
        const tokens = tokenProvider.tokenize(source);
        expect(tokens.length).toBeGreaterThan(0); // Should still produce some tokens
      }).not.toThrow();
    });

    it('should continue tokenization after errors', () => {
      const source = 'fn main() { @#$ let x = 42; }';
      const tokens = tokenProvider.tokenize(source);

      // Should still find valid tokens after the error
      expect(tokens.some(t => t.text === 'fn')).toBe(true);
      expect(tokens.some(t => t.text === 'main')).toBe(true);
      expect(tokens.some(t => t.text === 'let')).toBe(true);
      expect(tokens.some(t => t.text === 'x')).toBe(true);
    });

    it('should handle unterminated strings gracefully', () => {
      const source = 'fn main() { print("unterminated string'; // Missing closing quote
      
      expect(() => {
        const tokens = tokenProvider.tokenize(source);
        expect(tokens.some(t => t.text === 'fn')).toBe(true);
      }).not.toThrow();
    });

    it('should handle unterminated comments gracefully', () => {
      const source = 'fn main() { /* unterminated comment'; // Missing */
      
      expect(() => {
        const tokens = tokenProvider.tokenize(source);
        expect(tokens.some(t => t.text === 'fn')).toBe(true);
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should track source text', () => {
      const source = 'fn main() {}';
      tokenProvider.tokenize(source);

      expect(tokenProvider.getSourceText()).toBe(source);
    });

    it('should increment version on each tokenization', () => {
      const initialVersion = tokenProvider.getVersion();
      
      tokenProvider.tokenize('fn main() {}');
      expect(tokenProvider.getVersion()).toBe(initialVersion + 1);
      
      tokenProvider.tokenize('fn test() {}');
      expect(tokenProvider.getVersion()).toBe(initialVersion + 2);
    });

    it('should return all cached tokens', () => {
      const source = 'fn main() {}';
      const tokens = tokenProvider.tokenize(source);
      const cachedTokens = tokenProvider.getAllTokens();

      expect(cachedTokens).toEqual(tokens);
      expect(cachedTokens).not.toBe(tokens); // Should be a copy
    });
  });

  describe('Nami Language Features', () => {
    it('should tokenize Nami-specific keywords', () => {
      const source = 'fn main() { loop { print("infinite"); break; } }';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens.some(t => t.kind === TokenType.FN)).toBe(true);
      expect(tokens.some(t => t.kind === TokenType.LOOP)).toBe(true);
      expect(tokens.some(t => t.kind === TokenType.PRINT)).toBe(true);
      expect(tokens.some(t => t.kind === TokenType.BREAK)).toBe(true);
    });

    it('should tokenize Nami range operator', () => {
      const source = 'for i in 1..10 { print(i); }';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens.some(t => t.kind === TokenType.RANGE)).toBe(true);
    });

    it('should tokenize Nami power operator', () => {
      const source = 'let result = 2 ** 3;';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens.some(t => t.kind === TokenType.POWER)).toBe(true);
    });

    it('should distinguish print and println', () => {
      const source = 'print("hello"); println("world");';
      const tokens = tokenProvider.tokenize(source);

      expect(tokens.some(t => t.kind === TokenType.PRINT && t.text === 'print')).toBe(true);
      expect(tokens.some(t => t.kind === TokenType.PRINTLN && t.text === 'println')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle lexer errors gracefully', () => {
      // TokenProvider handles lexer errors gracefully and continues with partial tokenization
      // This test verifies it doesn't throw for invalid syntax
      expect(() => {
        tokenProvider.tokenize('fn main() { invalid syntax @#$');
      }).not.toThrow();
    });

    it('should continue tokenization despite errors', () => {
      // Even with errors, should return some tokens
      const tokens = tokenProvider.tokenize('fn main() { @#$ }');
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some(t => t.text === 'fn')).toBe(true);
    });
  });
});