/**
 * Unit tests for Token data structure and TokenType enum
 * Task 2.1: Implement Token data structure and TokenType enum
 * Requirements: 1.1
 */

import { Token, TokenType, KEYWORDS, Position, SourceSpan } from '../../src/lexer/token';

describe('Token', () => {
  describe('constructor', () => {
    it('should create a token with all required properties', () => {
      const token = new Token(TokenType.IDENTIFIER, 'myVar', 1, 5, 10);
      
      expect(token.type).toBe(TokenType.IDENTIFIER);
      expect(token.lexeme).toBe('myVar');
      expect(token.line).toBe(1);
      expect(token.column).toBe(5);
      expect(token.offset).toBe(10);
    });

    it('should create a token with optional literal value', () => {
      const token = new Token(TokenType.NUMBER, '42', 1, 0, 0, 42);
      
      expect(token.literal).toBe(42);
    });

    it('should default offset to 0 if not provided', () => {
      const token = new Token(TokenType.PLUS, '+', 1, 10);
      
      expect(token.offset).toBe(0);
    });
  });

  describe('span', () => {
    it('should calculate correct source span', () => {
      const token = new Token(TokenType.IDENTIFIER, 'hello', 2, 10, 50);
      const span = token.span;
      
      expect(span.start.line).toBe(2);
      expect(span.start.column).toBe(10);
      expect(span.start.offset).toBe(50);
      expect(span.end.line).toBe(2);
      expect(span.end.column).toBe(15); // 10 + 'hello'.length
      expect(span.end.offset).toBe(55); // 50 + 'hello'.length
    });
  });

  describe('isKeyword', () => {
    it('should return true for keyword tokens', () => {
      const letToken = new Token(TokenType.LET, 'let', 1, 0);
      const constToken = new Token(TokenType.CONST, 'const', 1, 0);
      const functionToken = new Token(TokenType.FUNCTION, 'function', 1, 0);
      
      expect(letToken.isKeyword()).toBe(true);
      expect(constToken.isKeyword()).toBe(true);
      expect(functionToken.isKeyword()).toBe(true);
    });

    it('should return false for non-keyword tokens', () => {
      const identifier = new Token(TokenType.IDENTIFIER, 'myVar', 1, 0);
      const number = new Token(TokenType.NUMBER, '42', 1, 0);
      const operator = new Token(TokenType.PLUS, '+', 1, 0);
      
      expect(identifier.isKeyword()).toBe(false);
      expect(number.isKeyword()).toBe(false);
      expect(operator.isKeyword()).toBe(false);
    });
  });

  describe('isLiteral', () => {
    it('should return true for literal tokens', () => {
      const number = new Token(TokenType.NUMBER, '42', 1, 0);
      const string = new Token(TokenType.STRING, '"hello"', 1, 0);
      const boolean = new Token(TokenType.BOOLEAN, 'true', 1, 0);
      const nullToken = new Token(TokenType.NULL, 'null', 1, 0);
      
      expect(number.isLiteral()).toBe(true);
      expect(string.isLiteral()).toBe(true);
      expect(boolean.isLiteral()).toBe(true);
      expect(nullToken.isLiteral()).toBe(true);
    });

    it('should return false for non-literal tokens', () => {
      const identifier = new Token(TokenType.IDENTIFIER, 'myVar', 1, 0);
      const keyword = new Token(TokenType.LET, 'let', 1, 0);
      const operator = new Token(TokenType.PLUS, '+', 1, 0);
      
      expect(identifier.isLiteral()).toBe(false);
      expect(keyword.isLiteral()).toBe(false);
      expect(operator.isLiteral()).toBe(false);
    });
  });

  describe('isOperator', () => {
    it('should return true for operator tokens', () => {
      const plus = new Token(TokenType.PLUS, '+', 1, 0);
      const minus = new Token(TokenType.MINUS, '-', 1, 0);
      const equal = new Token(TokenType.EQUAL, '==', 1, 0);
      const strictEqual = new Token(TokenType.STRICT_EQUAL, '===', 1, 0);
      const arrow = new Token(TokenType.ARROW, '=>', 1, 0);
      
      expect(plus.isOperator()).toBe(true);
      expect(minus.isOperator()).toBe(true);
      expect(equal.isOperator()).toBe(true);
      expect(strictEqual.isOperator()).toBe(true);
      expect(arrow.isOperator()).toBe(true);
    });

    it('should return false for non-operator tokens', () => {
      const identifier = new Token(TokenType.IDENTIFIER, 'myVar', 1, 0);
      const keyword = new Token(TokenType.LET, 'let', 1, 0);
      const punctuation = new Token(TokenType.SEMICOLON, ';', 1, 0);
      
      expect(identifier.isOperator()).toBe(false);
      expect(keyword.isOperator()).toBe(false);
      expect(punctuation.isOperator()).toBe(false);
    });
  });

  describe('isPunctuation', () => {
    it('should return true for punctuation tokens', () => {
      const leftParen = new Token(TokenType.LEFT_PAREN, '(', 1, 0);
      const rightBrace = new Token(TokenType.RIGHT_BRACE, '}', 1, 0);
      const semicolon = new Token(TokenType.SEMICOLON, ';', 1, 0);
      const comma = new Token(TokenType.COMMA, ',', 1, 0);
      
      expect(leftParen.isPunctuation()).toBe(true);
      expect(rightBrace.isPunctuation()).toBe(true);
      expect(semicolon.isPunctuation()).toBe(true);
      expect(comma.isPunctuation()).toBe(true);
    });

    it('should return false for non-punctuation tokens', () => {
      const identifier = new Token(TokenType.IDENTIFIER, 'myVar', 1, 0);
      const operator = new Token(TokenType.PLUS, '+', 1, 0);
      const keyword = new Token(TokenType.LET, 'let', 1, 0);
      
      expect(identifier.isPunctuation()).toBe(false);
      expect(operator.isPunctuation()).toBe(false);
      expect(keyword.isPunctuation()).toBe(false);
    });
  });

  describe('isComment', () => {
    it('should return true for comment tokens', () => {
      const comment = new Token(TokenType.COMMENT, '// comment', 1, 0);
      const blockComment = new Token(TokenType.BLOCK_COMMENT, '/* comment */', 1, 0);
      
      expect(comment.isComment()).toBe(true);
      expect(blockComment.isComment()).toBe(true);
    });

    it('should return false for non-comment tokens', () => {
      const identifier = new Token(TokenType.IDENTIFIER, 'myVar', 1, 0);
      const operator = new Token(TokenType.PLUS, '+', 1, 0);
      
      expect(identifier.isComment()).toBe(false);
      expect(operator.isComment()).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return a readable string representation', () => {
      const token = new Token(TokenType.IDENTIFIER, 'myVar', 5, 10);
      const str = token.toString();
      
      expect(str).toBe("Token(IDENTIFIER, 'myVar', 5:10)");
    });
  });
});

describe('TokenType', () => {
  it('should have all required token type categories', () => {
    // Keywords
    expect(TokenType.LET).toBeDefined();
    expect(TokenType.CONST).toBeDefined();
    expect(TokenType.FUNCTION).toBeDefined();
    expect(TokenType.IF).toBeDefined();
    expect(TokenType.ELSE).toBeDefined();
    expect(TokenType.FOR).toBeDefined();
    expect(TokenType.WHILE).toBeDefined();
    expect(TokenType.ASYNC).toBeDefined();
    expect(TokenType.AWAIT).toBeDefined();
    
    // Identifiers
    expect(TokenType.IDENTIFIER).toBeDefined();
    
    // Literals
    expect(TokenType.NUMBER).toBeDefined();
    expect(TokenType.STRING).toBeDefined();
    expect(TokenType.BOOLEAN).toBeDefined();
    expect(TokenType.NULL).toBeDefined();
    
    // Operators
    expect(TokenType.PLUS).toBeDefined();
    expect(TokenType.MINUS).toBeDefined();
    expect(TokenType.STAR).toBeDefined();
    expect(TokenType.SLASH).toBeDefined();
    expect(TokenType.EQUAL).toBeDefined();
    expect(TokenType.STRICT_EQUAL).toBeDefined();
    
    // Punctuation
    expect(TokenType.LEFT_PAREN).toBeDefined();
    expect(TokenType.RIGHT_PAREN).toBeDefined();
    expect(TokenType.LEFT_BRACE).toBeDefined();
    expect(TokenType.RIGHT_BRACE).toBeDefined();
    expect(TokenType.SEMICOLON).toBeDefined();
    expect(TokenType.COMMA).toBeDefined();
    
    // Comments
    expect(TokenType.COMMENT).toBeDefined();
    expect(TokenType.BLOCK_COMMENT).toBeDefined();
    
    // Special
    expect(TokenType.EOF).toBeDefined();
  });
});

describe('KEYWORDS', () => {
  it('should map all keyword strings to their token types', () => {
    expect(KEYWORDS['let']).toBe(TokenType.LET);
    expect(KEYWORDS['const']).toBe(TokenType.CONST);
    expect(KEYWORDS['function']).toBe(TokenType.FUNCTION);
    expect(KEYWORDS['fn']).toBe(TokenType.FN);
    expect(KEYWORDS['if']).toBe(TokenType.IF);
    expect(KEYWORDS['else']).toBe(TokenType.ELSE);
    expect(KEYWORDS['for']).toBe(TokenType.FOR);
    expect(KEYWORDS['while']).toBe(TokenType.WHILE);
    expect(KEYWORDS['async']).toBe(TokenType.ASYNC);
    expect(KEYWORDS['await']).toBe(TokenType.AWAIT);
    expect(KEYWORDS['return']).toBe(TokenType.RETURN);
    expect(KEYWORDS['break']).toBe(TokenType.BREAK);
    expect(KEYWORDS['continue']).toBe(TokenType.CONTINUE);
  });

  it('should not contain non-keyword entries', () => {
    expect(KEYWORDS['myVariable']).toBeUndefined();
    expect(KEYWORDS['+']).toBeUndefined();
    expect(KEYWORDS['123']).toBeUndefined();
  });
});

describe('Position and SourceSpan', () => {
  it('should have correct Position structure', () => {
    const position: Position = {
      line: 1,
      column: 5,
      offset: 10,
    };
    
    expect(position.line).toBe(1);
    expect(position.column).toBe(5);
    expect(position.offset).toBe(10);
  });

  it('should have correct SourceSpan structure', () => {
    const span: SourceSpan = {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 1, column: 5, offset: 5 },
    };
    
    expect(span.start.line).toBe(1);
    expect(span.end.column).toBe(5);
  });
});
