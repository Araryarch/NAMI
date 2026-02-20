/**
 * NAMI Lexer - Tokenizes NAMI source code
 * Requirements: 1.1 (parsing), 1.3 (error reporting with positions)
 */

import { Token, TokenType, KEYWORDS } from './token';

export class LexError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly offset: number
  ) {
    super(message);
    this.name = 'LexError';
  }
}

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private errors: LexError[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private startLine = 1;
  private startColumn = 1;
  private tokenIndex = 0; // For next_token() and peek_token()
  private allTokensScanned = false;

  constructor(source: string) {
    this.source = source;
  }

  /** Tokenize the entire source and return all tokens */
  tokenize(): Token[] {
    this.tokens = [];
    this.errors = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;
    this.tokenIndex = 0;
    this.allTokensScanned = false;

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startLine = this.line;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.column, this.current));
    this.allTokensScanned = true;
    return this.tokens;
  }

  /** Get any errors encountered during tokenization */
  getErrors(): LexError[] {
    return this.errors;
  }

  /**
   * Get the next token from the stream
   * Requirements: 1.1, 1.3 - State machine tokenization with position tracking
   */
  next_token(): Token {
    // Ensure all tokens are scanned first
    if (!this.allTokensScanned) {
      this.tokenize();
    }

    if (this.tokenIndex < this.tokens.length) {
      return this.tokens[this.tokenIndex++];
    }

    // Return EOF if we've exhausted all tokens
    return this.tokens[this.tokens.length - 1];
  }

  /**
   * Peek at the next token without consuming it
   * Requirements: 1.1, 1.3 - State machine tokenization with position tracking
   */
  peek_token(): Token {
    // Ensure all tokens are scanned first
    if (!this.allTokensScanned) {
      this.tokenize();
    }

    if (this.tokenIndex < this.tokens.length) {
      return this.tokens[this.tokenIndex];
    }

    // Return EOF if we've exhausted all tokens
    return this.tokens[this.tokens.length - 1];
  }

  /**
   * Check if there are more tokens to consume
   * Requirements: 1.1, 1.3 - State machine tokenization with position tracking
   */
  has_more(): boolean {
    // Ensure all tokens are scanned first
    if (!this.allTokensScanned) {
      this.tokenize();
    }

    // We have more tokens if we haven't reached EOF
    return this.tokenIndex < this.tokens.length && this.tokens[this.tokenIndex].type !== TokenType.EOF;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      // Single-character tokens
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case '[':
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case ']':
        this.addToken(TokenType.RIGHT_BRACKET);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '~':
        this.addToken(TokenType.BITWISE_NOT);
        break;
      case ':':
        this.addToken(TokenType.COLON);
        break;
      case '?':
        if (this.match('?')) {
          this.addToken(TokenType.NULLISH);
        } else if (this.match('.')) {
          this.addToken(TokenType.OPTIONAL_CHAIN);
        } else {
          this.addToken(TokenType.QUESTION);
        }
        break;

      // Dot, range, or spread
      case '.':
        if (this.match('.')) {
          if (this.match('.')) {
            this.addToken(TokenType.SPREAD); // ...
          } else {
            this.addToken(TokenType.RANGE); // ..  (NAMI range)
          }
        } else {
          this.addToken(TokenType.DOT);
        }
        break;

      // Operators that may be multi-character
      case '+':
        if (this.match('+')) {
          this.addToken(TokenType.INCREMENT);
        } else if (this.match('=')) {
          this.addToken(TokenType.PLUS_ASSIGN);
        } else {
          this.addToken(TokenType.PLUS);
        }
        break;
      case '-':
        if (this.match('-')) {
          this.addToken(TokenType.DECREMENT);
        } else if (this.match('=')) {
          this.addToken(TokenType.MINUS_ASSIGN);
        } else {
          this.addToken(TokenType.MINUS);
        }
        break;
      case '*':
        if (this.match('*')) {
          this.addToken(TokenType.POWER);
        } else if (this.match('=')) {
          this.addToken(TokenType.STAR_ASSIGN);
        } else {
          this.addToken(TokenType.STAR);
        }
        break;
      case '/':
        if (this.match('/')) {
          // Single-line comment
          this.singleLineComment();
        } else if (this.match('*')) {
          // Multi-line comment
          this.multiLineComment();
        } else if (this.match('=')) {
          this.addToken(TokenType.SLASH_ASSIGN);
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case '%':
        if (this.match('=')) {
          this.addToken(TokenType.PERCENT_ASSIGN);
        } else {
          this.addToken(TokenType.PERCENT);
        }
        break;
      case '=':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.STRICT_EQUAL);
          } else {
            this.addToken(TokenType.EQUAL);
          }
        } else if (this.match('>')) {
          this.addToken(TokenType.ARROW);
        } else {
          this.addToken(TokenType.ASSIGN);
        }
        break;
      case '!':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.STRICT_NOT_EQUAL);
          } else {
            this.addToken(TokenType.NOT_EQUAL);
          }
        } else {
          this.addToken(TokenType.NOT);
        }
        break;
      case '<':
        if (this.match('<')) {
          this.addToken(TokenType.LEFT_SHIFT);
        } else if (this.match('=')) {
          this.addToken(TokenType.LESS_EQUAL);
        } else {
          this.addToken(TokenType.LESS);
        }
        break;
      case '>':
        if (this.match('>')) {
          this.addToken(TokenType.RIGHT_SHIFT);
        } else if (this.match('=')) {
          this.addToken(TokenType.GREATER_EQUAL);
        } else {
          this.addToken(TokenType.GREATER);
        }
        break;
      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.AND);
        } else {
          this.addToken(TokenType.BITWISE_AND);
        }
        break;
      case '|':
        if (this.match('|')) {
          this.addToken(TokenType.OR);
        } else {
          this.addToken(TokenType.BITWISE_OR);
        }
        break;
      case '^':
        this.addToken(TokenType.BITWISE_XOR);
        break;

      // Strings
      case '"':
      case "'":
        this.string(c);
        break;
      case '`':
        this.templateString();
        break;

      // Whitespace
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        this.column = 1;
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.errors.push(
            new LexError(
              `Unexpected character '${c}'`,
              this.startLine,
              this.startColumn,
              this.start
            )
          );
        }
        break;
    }
  }

  private singleLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }
    const text = this.source.substring(this.start, this.current);
    this.addToken(TokenType.COMMENT, text);
  }

  private multiLineComment(): void {
    let depth = 1;
    while (!this.isAtEnd() && depth > 0) {
      if (this.peek() === '/' && this.peekNext() === '*') {
        depth++;
        this.advance();
        this.advance();
      } else if (this.peek() === '*' && this.peekNext() === '/') {
        depth--;
        this.advance();
        this.advance();
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 0;
        }
        this.advance();
      }
    }

    if (depth > 0) {
      this.errors.push(
        new LexError('Unterminated block comment', this.startLine, this.startColumn, this.start)
      );
      return;
    }

    const text = this.source.substring(this.start, this.current);
    this.addToken(TokenType.BLOCK_COMMENT, text);
  }

  private string(quote: string): void {
    let value = '';
    while (!this.isAtEnd() && this.peek() !== quote) {
      // Allow multi-line strings - track line numbers
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0; // Will be incremented by advance()
        value += this.advance();
        continue;
      }
      if (this.peek() === '\\') {
        this.advance(); // consume backslash
        const escaped = this.advance();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case "'":
            value += "'";
            break;
          case '"':
            value += '"';
            break;
          case '0':
            value += '\0';
            break;
          case 'b':
            value += '\b';
            break;
          case 'f':
            value += '\f';
            break;
          case 'v':
            value += '\v';
            break;
          case 'u': {
            // Unicode escape: \uXXXX
            let hex = '';
            for (let i = 0; i < 4; i++) {
              if (this.isAtEnd() || !this.isHexDigit(this.peek())) {
                this.errors.push(
                  new LexError(
                    'Invalid unicode escape sequence',
                    this.line,
                    this.column,
                    this.current
                  )
                );
                return;
              }
              hex += this.advance();
            }
            value += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          default:
            value += escaped;
            break;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.errors.push(
        new LexError('Unterminated string literal', this.startLine, this.startColumn, this.start)
      );
      return;
    }

    // Consume closing quote
    this.advance();
    this.addToken(TokenType.STRING, value);
  }

  private templateString(): void {
    // For now, treat template strings like regular strings
    let value = '';
    while (!this.isAtEnd() && this.peek() !== '`') {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      if (this.peek() === '\\') {
        this.advance();
        value += this.advance();
      } else {
        value += this.advance();
      }
    }
    if (this.isAtEnd()) {
      this.errors.push(
        new LexError('Unterminated template string', this.startLine, this.startColumn, this.start)
      );
      return;
    }
    this.advance(); // closing `
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    // Check for hex, octal, binary prefixes
    if (this.source[this.start] === '0' && !this.isAtEnd()) {
      const nextChar = this.peek();
      if (nextChar === 'x' || nextChar === 'X') {
        this.advance(); // consume 'x'
        while (!this.isAtEnd() && this.isHexDigit(this.peek())) {
          this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        this.addToken(TokenType.NUMBER, parseInt(text, 16));
        return;
      }
      if (nextChar === 'b' || nextChar === 'B') {
        this.advance();
        while (!this.isAtEnd() && (this.peek() === '0' || this.peek() === '1')) {
          this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        this.addToken(TokenType.NUMBER, parseInt(text.substring(2), 2));
        return;
      }
      if (nextChar === 'o' || nextChar === 'O') {
        this.advance();
        while (!this.isAtEnd() && this.peek() >= '0' && this.peek() <= '7') {
          this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        this.addToken(TokenType.NUMBER, parseInt(text.substring(2), 8));
        return;
      }
    }

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal point
    let isFloat = false;
    if (!this.isAtEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
      isFloat = true;
      this.advance(); // consume '.'
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Exponent
    if (!this.isAtEnd() && (this.peek() === 'e' || this.peek() === 'E')) {
      isFloat = true;
      this.advance();
      if (!this.isAtEnd() && (this.peek() === '+' || this.peek() === '-')) {
        this.advance();
      }
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const text = this.source.substring(this.start, this.current);
    const value = isFloat ? parseFloat(text) : parseInt(text, 10);
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const keywordType = KEYWORDS[text];
    if (keywordType) {
      // Handle boolean and null literals as keywords
      if (keywordType === TokenType.TRUE) {
        this.addToken(TokenType.TRUE, true);
      } else if (keywordType === TokenType.FALSE) {
        this.addToken(TokenType.FALSE, false);
      } else if (keywordType === TokenType.NULL) {
        this.addToken(TokenType.NULL, null);
      } else {
        this.addToken(keywordType);
      }
    } else {
      this.addToken(TokenType.IDENTIFIER);
    }
  }

  // ── Helper methods ───────────────────────────────────────

  private advance(): string {
    const c = this.source[this.current];
    this.current++;
    this.column++;
    return c;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.current] !== expected) {
      return false;
    }
    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isHexDigit(c: string): boolean {
    return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
  }

  private addToken(type: TokenType, literal?: unknown): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, this.startLine, this.startColumn, this.start, literal));
  }
}
