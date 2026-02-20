/**
 * Unit tests for Lexer class
 * Task 2.2: Implement Lexer class with state machine tokenization
 * Requirements: 1.1, 1.3
 */

import { Lexer, TokenType } from '../../src/lexer';

describe('Lexer', () => {
  describe('next_token()', () => {
    it('should return tokens one at a time', () => {
      const source = 'let x = 42;';
      const lexer = new Lexer(source);

      const token1 = lexer.next_token();
      expect(token1.type).toBe(TokenType.LET);
      expect(token1.lexeme).toBe('let');

      const token2 = lexer.next_token();
      expect(token2.type).toBe(TokenType.IDENTIFIER);
      expect(token2.lexeme).toBe('x');

      const token3 = lexer.next_token();
      expect(token3.type).toBe(TokenType.ASSIGN);
      expect(token3.lexeme).toBe('=');

      const token4 = lexer.next_token();
      expect(token4.type).toBe(TokenType.NUMBER);
      expect(token4.lexeme).toBe('42');

      const token5 = lexer.next_token();
      expect(token5.type).toBe(TokenType.SEMICOLON);
      expect(token5.lexeme).toBe(';');

      const token6 = lexer.next_token();
      expect(token6.type).toBe(TokenType.EOF);
    });

    it('should return EOF when exhausted', () => {
      const source = 'x';
      const lexer = new Lexer(source);

      lexer.next_token(); // x
      const eof1 = lexer.next_token(); // EOF
      const eof2 = lexer.next_token(); // Should still return EOF
      const eof3 = lexer.next_token(); // Should still return EOF

      expect(eof1.type).toBe(TokenType.EOF);
      expect(eof2.type).toBe(TokenType.EOF);
      expect(eof3.type).toBe(TokenType.EOF);
    });

    it('should track line and column numbers correctly', () => {
      const source = 'let x\nlet y';
      const lexer = new Lexer(source);

      const token1 = lexer.next_token();
      expect(token1.line).toBe(1);
      expect(token1.column).toBe(1);

      const token2 = lexer.next_token();
      expect(token2.line).toBe(1);
      expect(token2.column).toBe(5);

      const token3 = lexer.next_token();
      expect(token3.line).toBe(2);
      expect(token3.column).toBe(1);

      const token4 = lexer.next_token();
      expect(token4.line).toBe(2);
      expect(token4.column).toBe(5);
    });
  });

  describe('peek_token()', () => {
    it('should return next token without consuming it', () => {
      const source = 'let x = 42;';
      const lexer = new Lexer(source);

      const peeked1 = lexer.peek_token();
      expect(peeked1.type).toBe(TokenType.LET);

      const peeked2 = lexer.peek_token();
      expect(peeked2.type).toBe(TokenType.LET); // Still LET

      const consumed = lexer.next_token();
      expect(consumed.type).toBe(TokenType.LET);

      const peeked3 = lexer.peek_token();
      expect(peeked3.type).toBe(TokenType.IDENTIFIER); // Now IDENTIFIER
    });

    it('should return EOF when at end', () => {
      const source = 'x';
      const lexer = new Lexer(source);

      lexer.next_token(); // x
      lexer.next_token(); // EOF

      const peeked = lexer.peek_token();
      expect(peeked.type).toBe(TokenType.EOF);
    });
  });

  describe('has_more()', () => {
    it('should return true when tokens remain', () => {
      const source = 'let x = 42;';
      const lexer = new Lexer(source);

      expect(lexer.has_more()).toBe(true);

      lexer.next_token(); // let
      expect(lexer.has_more()).toBe(true);

      lexer.next_token(); // x
      expect(lexer.has_more()).toBe(true);

      lexer.next_token(); // =
      expect(lexer.has_more()).toBe(true);

      lexer.next_token(); // 42
      expect(lexer.has_more()).toBe(true);

      lexer.next_token(); // ;
      expect(lexer.has_more()).toBe(false); // EOF reached
    });

    it('should return false when at EOF', () => {
      const source = '';
      const lexer = new Lexer(source);

      expect(lexer.has_more()).toBe(false);
    });

    it('should return false after consuming all tokens', () => {
      const source = 'x';
      const lexer = new Lexer(source);

      lexer.next_token(); // x
      expect(lexer.has_more()).toBe(false);
    });
  });

  describe('tokenize()', () => {
    it('should handle keywords', () => {
      const source = 'let const function if else for while';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.LET);
      expect(tokens[1].type).toBe(TokenType.CONST);
      expect(tokens[2].type).toBe(TokenType.FUNCTION);
      expect(tokens[3].type).toBe(TokenType.IF);
      expect(tokens[4].type).toBe(TokenType.ELSE);
      expect(tokens[5].type).toBe(TokenType.FOR);
      expect(tokens[6].type).toBe(TokenType.WHILE);
      expect(tokens[7].type).toBe(TokenType.EOF);
    });

    it('should handle identifiers', () => {
      const source = 'myVar _private $jquery';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].lexeme).toBe('myVar');
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].lexeme).toBe('_private');
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].lexeme).toBe('$jquery');
    });

    it('should handle numbers', () => {
      const source = '42 3.14 0x1A 0b1010 0o17';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(42);
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].literal).toBe(3.14);
      expect(tokens[2].type).toBe(TokenType.NUMBER);
      expect(tokens[2].literal).toBe(0x1A);
      expect(tokens[3].type).toBe(TokenType.NUMBER);
      expect(tokens[3].literal).toBe(0b1010);
      expect(tokens[4].type).toBe(TokenType.NUMBER);
      expect(tokens[4].literal).toBe(0o17);
    });

    it('should handle strings with escape sequences', () => {
      const source = '"hello" \'world\' "line\\nbreak" "tab\\there"';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('hello');
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[1].literal).toBe('world');
      expect(tokens[2].type).toBe(TokenType.STRING);
      expect(tokens[2].literal).toBe('line\nbreak');
      expect(tokens[3].type).toBe(TokenType.STRING);
      expect(tokens[3].literal).toBe('tab\there');
    });

    it('should handle multi-line strings with double quotes', () => {
      const source = '"line one\nline two\nline three"';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('line one\nline two\nline three');
      expect(tokens[0].line).toBe(1); // Start line
      expect(tokens[1].type).toBe(TokenType.EOF);
    });

    it('should handle multi-line strings with single quotes', () => {
      const source = '\'first line\nsecond line\'';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('first line\nsecond line');
      expect(tokens[1].type).toBe(TokenType.EOF);
    });

    it('should handle all escape sequences', () => {
      const source = '"\\n\\t\\r\\\\\\\'\\"\\"\\0\\b\\f\\v"';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('\n\t\r\\\'\"\"\0\b\f\v');
    });

    it('should handle unicode escape sequences', () => {
      const source = '"\\u0041\\u0042\\u0043"'; // ABC
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe('ABC');
    });

    it('should handle operators', () => {
      const source = '+ - * / % ** = += -= == === != !== < > <= >= && || !';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.PLUS);
      expect(tokens[1].type).toBe(TokenType.MINUS);
      expect(tokens[2].type).toBe(TokenType.STAR);
      expect(tokens[3].type).toBe(TokenType.SLASH);
      expect(tokens[4].type).toBe(TokenType.PERCENT);
      expect(tokens[5].type).toBe(TokenType.POWER);
      expect(tokens[6].type).toBe(TokenType.ASSIGN);
      expect(tokens[7].type).toBe(TokenType.PLUS_ASSIGN);
      expect(tokens[8].type).toBe(TokenType.MINUS_ASSIGN);
      expect(tokens[9].type).toBe(TokenType.EQUAL);
      expect(tokens[10].type).toBe(TokenType.STRICT_EQUAL);
      expect(tokens[11].type).toBe(TokenType.NOT_EQUAL);
      expect(tokens[12].type).toBe(TokenType.STRICT_NOT_EQUAL);
      expect(tokens[13].type).toBe(TokenType.LESS);
      expect(tokens[14].type).toBe(TokenType.GREATER);
      expect(tokens[15].type).toBe(TokenType.LESS_EQUAL);
      expect(tokens[16].type).toBe(TokenType.GREATER_EQUAL);
      expect(tokens[17].type).toBe(TokenType.AND);
      expect(tokens[18].type).toBe(TokenType.OR);
      expect(tokens[19].type).toBe(TokenType.NOT);
    });

    it('should handle punctuation', () => {
      const source = '( ) { } [ ] ; , .';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.LEFT_PAREN);
      expect(tokens[1].type).toBe(TokenType.RIGHT_PAREN);
      expect(tokens[2].type).toBe(TokenType.LEFT_BRACE);
      expect(tokens[3].type).toBe(TokenType.RIGHT_BRACE);
      expect(tokens[4].type).toBe(TokenType.LEFT_BRACKET);
      expect(tokens[5].type).toBe(TokenType.RIGHT_BRACKET);
      expect(tokens[6].type).toBe(TokenType.SEMICOLON);
      expect(tokens[7].type).toBe(TokenType.COMMA);
      expect(tokens[8].type).toBe(TokenType.DOT);
    });

    it('should handle comments', () => {
      const source = '// single line\n/* block comment */';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.COMMENT);
      expect(tokens[1].type).toBe(TokenType.BLOCK_COMMENT);
    });

    it('should track line and column numbers', () => {
      const source = 'let x = 42;\nlet y = 10;';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      expect(tokens[0].line).toBe(1);
      expect(tokens[0].column).toBe(1);
      expect(tokens[5].line).toBe(2);
      expect(tokens[5].column).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should report unterminated string', () => {
      const source = '"unterminated';
      const lexer = new Lexer(source);
      lexer.tokenize();
      const errors = lexer.getErrors();

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unterminated string');
    });

    it('should report unexpected character', () => {
      const source = 'let x = @;';
      const lexer = new Lexer(source);
      lexer.tokenize();
      const errors = lexer.getErrors();

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unexpected character');
    });

    it('should report unterminated block comment', () => {
      const source = '/* unterminated';
      const lexer = new Lexer(source);
      lexer.tokenize();
      const errors = lexer.getErrors();

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Unterminated block comment');
    });
  });
});
