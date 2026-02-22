/**
 * Token Provider Service for Nami Developer Tooling
 *
 * Exposes the existing Nami lexer functionality as a service that can be consumed
 * by other tooling components like the LSP server and syntax highlighter.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { Lexer } from '../../lexer/lexer';
import { Token, Position } from '../../lexer/token';
import { ToolingToken, Trivia, TriviaKind } from '../shared/types';
import { SystemError } from '../shared/errors';

/**
 * Error thrown by TokenProvider operations
 */
export class TokenError extends SystemError {
  constructor(message: string, operation: string, cause?: Error) {
    super(message, operation, cause, 'TOKEN_ERROR');
  }
}

/**
 * Token Provider Service
 *
 * Provides enhanced tokenization capabilities with position tracking,
 * trivia preservation, and incremental updates.
 */
export class TokenProvider {
  private lexer: Lexer;
  private cachedTokens: ToolingToken[] = [];
  private sourceText: string = '';
  private version: number = 0;

  constructor(lexer?: Lexer) {
    this.lexer = lexer || new Lexer('');
  }

  /**
   * Tokenize source code and return enhanced tokens with trivia
   * Requirements: 4.1, 4.2, 4.3
   */
  tokenize(source: string): ToolingToken[] {
    try {
      this.sourceText = source;
      this.version++;

      // Create new lexer instance with the source
      this.lexer = new Lexer(source);

      // Get all tokens from lexer
      const rawTokens = this.lexer.tokenize();
      const errors = this.lexer.getErrors();

      // Convert to enhanced tokens with trivia
      this.cachedTokens = this.enhanceTokens(rawTokens, source);

      // Handle lexer errors gracefully - continue with partial tokenization
      if (errors.length > 0) {
        console.warn(
          `TokenProvider: ${errors.length} lexer errors encountered, continuing with partial tokenization`
        );
      }

      return this.cachedTokens;
    } catch (error) {
      throw new TokenError(
        `Failed to tokenize source: ${error instanceof Error ? error.message : String(error)}`,
        'tokenize',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get tokens within a specific range
   * Requirements: 4.2
   */
  getTokensInRange(start: Position, end: Position): ToolingToken[] {
    return this.cachedTokens.filter((token) => {
      const tokenStart = token.position.start;
      const tokenEnd = token.position.end;

      // Check if token overlaps with the requested range
      return (
        (tokenStart.line > start.line ||
          (tokenStart.line === start.line && tokenStart.column >= start.column)) &&
        (tokenEnd.line < end.line || (tokenEnd.line === end.line && tokenEnd.column <= end.column))
      );
    });
  }

  /**
   * Get the current source text
   */
  getSourceText(): string {
    return this.sourceText;
  }

  /**
   * Get the current version number
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Get all cached tokens
   */
  getAllTokens(): ToolingToken[] {
    return [...this.cachedTokens];
  }

  /**
   * Convert raw lexer tokens to enhanced tooling tokens with trivia
   * Requirements: 4.2, 4.3
   */
  private enhanceTokens(rawTokens: Token[], source: string): ToolingToken[] {
    const enhanced: ToolingToken[] = [];
    let pendingTrivia: Trivia[] = [];
    let sourceIndex = 0;

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];

      // Collect whitespace trivia before this token
      const tokenStart = token.offset;
      if (sourceIndex < tokenStart) {
        const triviaText = source.substring(sourceIndex, tokenStart);
        const whitespaceTrivia = this.extractWhitespace(triviaText, sourceIndex);
        pendingTrivia.push(...whitespaceTrivia);
      }

      // Check if this token is a comment - convert it to trivia
      if (token.type === 'COMMENT') {
        pendingTrivia.push({
          kind: TriviaKind.LineComment,
          text: token.lexeme,
          position: token.span,
        });
        sourceIndex = token.offset + token.lexeme.length;
        continue;
      } else if (token.type === 'BLOCK_COMMENT') {
        pendingTrivia.push({
          kind: TriviaKind.BlockComment,
          text: token.lexeme,
          position: token.span,
        });
        sourceIndex = token.offset + token.lexeme.length;
        continue;
      }

      // Create enhanced token with pending trivia
      const enhancedToken: ToolingToken = {
        kind: token.type,
        text: token.lexeme,
        position: token.span,
        trivia: pendingTrivia,
      };

      enhanced.push(enhancedToken);
      pendingTrivia = [];
      sourceIndex = token.offset + token.lexeme.length;
    }

    return enhanced;
  }

  /**
   * Extract whitespace trivia from text
   * Requirements: 4.3
   */
  private extractWhitespace(text: string, startOffset: number): Trivia[] {
    if (!text || text.length === 0) {
      return [];
    }

    const trivia: Trivia[] = [];
    let line = 1;
    let column = 1;

    // Calculate starting line and column from offset
    for (let i = 0; i < startOffset; i++) {
      if (this.sourceText[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }

    // Collect all whitespace as a single trivia
    if (text.match(/^[\s\r\n\t]+$/)) {
      const startLine = line;
      const startColumn = column;

      for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
      }

      trivia.push({
        kind: TriviaKind.Whitespace,
        text: text,
        position: {
          start: { line: startLine, column: startColumn, offset: startOffset },
          end: { line: line, column: column, offset: startOffset + text.length },
        },
      });
    }

    return trivia;
  }
}
