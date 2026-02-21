/**
 * Incremental Tokenizer for Nami Developer Tooling
 * 
 * Provides efficient incremental tokenization for real-time editing scenarios.
 * Minimizes re-tokenization by only processing changed regions.
 * 
 * Requirements: 4.4, 4.5, 4.6
 */

import { TokenProvider, TokenError } from './token-provider';
import { ToolingToken, TextChange } from '../shared/types';
import { Position, SourceSpan } from '../../lexer/token';

/**
 * Incremental tokenization state
 */
interface TokenizationState {
  tokens: ToolingToken[];
  sourceText: string;
  version: number;
}

/**
 * Incremental Tokenizer
 * 
 * Handles incremental updates to tokenization by tracking changes
 * and only re-tokenizing affected regions.
 */
export class IncrementalTokenizer {
  private tokenProvider: TokenProvider;
  private state: TokenizationState;

  constructor(tokenProvider: TokenProvider) {
    this.tokenProvider = tokenProvider;
    this.state = {
      tokens: [],
      sourceText: '',
      version: 0
    };
  }
  /**
   * Initialize the tokenizer with source text
   */
  initialize(sourceText: string): ToolingToken[] {
    const tokens = this.tokenProvider.tokenize(sourceText);
    this.state = {
      tokens: tokens,
      sourceText: sourceText,
      version: 1
    };
    return tokens;
  }

  /**
   * Apply incremental changes and return updated tokens
   * Requirements: 4.4
   */
  applyChanges(changes: TextChange[]): ToolingToken[] {
    try {
      // Sort changes by position (reverse order to apply from end to start)
      const sortedChanges = [...changes].sort((a, b) => {
        if (a.range.start.line !== b.range.start.line) {
          return b.range.start.line - a.range.start.line;
        }
        return b.range.start.column - a.range.start.column;
      });

      // Apply changes to source text
      let newSourceText = this.state.sourceText;
      for (const change of sortedChanges) {
        newSourceText = this.applyTextChange(newSourceText, change);
      }

      // Check if we can use incremental tokenization or need full re-tokenization
      if (this.shouldUseIncrementalTokenization(changes)) {
        return this.incrementalTokenize(newSourceText, changes);
      } else {
        // Fall back to full tokenization
        return this.fullTokenize(newSourceText);
      }
    } catch (error) {
      throw new TokenError(
        `Failed to apply incremental changes: ${error instanceof Error ? error.message : String(error)}`,
        'applyChanges',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get current tokenization state
   */
  getState(): TokenizationState {
    return { ...this.state };
  }

  /**
   * Reset tokenizer state
   */
  reset(): void {
    this.state = {
      tokens: [],
      sourceText: '',
      version: 0
    };
  }

  /**
   * Apply a single text change to source text
   */
  private applyTextChange(sourceText: string, change: TextChange): string {
    const startOffset = this.positionToOffset(sourceText, change.range.start);
    const endOffset = this.positionToOffset(sourceText, change.range.end);
    
    return sourceText.substring(0, startOffset) + 
           change.text + 
           sourceText.substring(endOffset);
  }

  /**
   * Convert position to character offset
   */
  private positionToOffset(sourceText: string, position: Position): number {
    let offset = 0;
    let currentLine = 1;
    let currentColumn = 1;

    while (offset < sourceText.length && 
           (currentLine < position.line || 
            (currentLine === position.line && currentColumn < position.column))) {
      if (sourceText[offset] === '\n') {
        currentLine++;
        currentColumn = 1;
      } else {
        currentColumn++;
      }
      offset++;
    }

    return offset;
  }

  /**
   * Determine if incremental tokenization is beneficial
   * Requirements: 4.4
   * 
   * NOTE: Currently disabled - always use full tokenization for correctness
   * TODO: Implement proper incremental tokenization with correct position tracking
   */
  private shouldUseIncrementalTokenization(_changes: TextChange[]): boolean {
    // For now, always use full tokenization to ensure correctness
    // Incremental tokenization has complex edge cases with position tracking
    return false;
  }

  // TODO: Uncomment when implementing incremental tokenization
  // /**
  //  * Get the size of a source range in characters
  //  */
  // private getRangeSize(range: SourceSpan): number {
  //   if (range.start.line === range.end.line) {
  //     return range.end.column - range.start.column;
  //   }
  //   
  //   // Multi-line range - approximate size
  //   const lineCount = range.end.line - range.start.line;
  //   return lineCount * 50 + range.end.column - range.start.column; // Assume 50 chars per line
  // }

  /**
   * Perform incremental tokenization
   * Requirements: 4.4, 4.5
   */
  private incrementalTokenize(newSourceText: string, changes: TextChange[]): ToolingToken[] {
    // Find the range of tokens that need to be re-tokenized
    const affectedRange = this.calculateAffectedRange(changes);
    
    // Expand the affected range to include adjacent tokens that might be impacted
    // This is crucial for insertions that might merge with or split existing tokens
    const expandedRange = this.expandAffectedRange(affectedRange, newSourceText);
    
    // Extract tokens before and after the expanded affected range
    const tokensBefore = this.state.tokens.filter(token => 
      this.isTokenBefore(token, expandedRange.start)
    );
    
    const tokensAfter = this.state.tokens.filter(token => 
      this.isTokenAfter(token, expandedRange.end)
    );

    // Re-tokenize the affected region
    const affectedText = this.extractTextRange(newSourceText, expandedRange);
    const newTokens = this.tokenProvider.tokenize(affectedText);
    
    // Adjust positions of new tokens to match their position in the full document
    const adjustedNewTokens = this.adjustTokenPositions(newTokens, expandedRange.start);
    
    // Adjust positions of tokens after the change
    const positionDelta = this.calculatePositionDelta(changes);
    const adjustedTokensAfter = this.adjustTokenPositionsWithDelta(tokensAfter, positionDelta);

    // Combine all tokens
    const allTokens = [...tokensBefore, ...adjustedNewTokens, ...adjustedTokensAfter];
    
    // Update state
    this.state = {
      tokens: allTokens,
      sourceText: newSourceText,
      version: this.state.version + 1
    };

    return allTokens;
  }

  /**
   * Perform full tokenization
   * Requirements: 4.4
   */
  private fullTokenize(newSourceText: string): ToolingToken[] {
    const tokens = this.tokenProvider.tokenize(newSourceText);
    
    this.state = {
      tokens: tokens,
      sourceText: newSourceText,
      version: this.state.version + 1
    };

    return tokens;
  }

  /**
   * Calculate the range affected by changes
   */
  private calculateAffectedRange(changes: TextChange[]): SourceSpan {
    let minStart: Position = { line: Infinity, column: Infinity, offset: Infinity };
    let maxEnd: Position = { line: 0, column: 0, offset: 0 };

    for (const change of changes) {
      if (this.isPositionBefore(change.range.start, minStart)) {
        minStart = change.range.start;
      }
      if (this.isPositionAfter(change.range.end, maxEnd)) {
        maxEnd = change.range.end;
      }
    }

    return { start: minStart, end: maxEnd };
  }

  /**
   * Expand the affected range to include adjacent tokens that might be impacted
   * This is necessary for insertions that might merge with existing tokens
   */
  private expandAffectedRange(range: SourceSpan, newSourceText: string): SourceSpan {
    const startOffset = this.positionToOffset(newSourceText, range.start);
    const endOffset = this.positionToOffset(newSourceText, range.end);
    
    // Find the start of the token containing or immediately before the start position
    let expandedStartOffset = startOffset;
    while (expandedStartOffset > 0) {
      const char = newSourceText[expandedStartOffset - 1];
      // Stop at whitespace, newline, or punctuation that typically separates tokens
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r' ||
          char === ';' || char === '{' || char === '}' || char === '(' || char === ')' ||
          char === '[' || char === ']' || char === ',' || char === ':') {
        break;
      }
      expandedStartOffset--;
    }
    
    // Find the end of the token containing or immediately after the end position
    let expandedEndOffset = endOffset;
    while (expandedEndOffset < newSourceText.length) {
      const char = newSourceText[expandedEndOffset];
      // Stop at whitespace, newline, or punctuation that typically separates tokens
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r' ||
          char === ';' || char === '{' || char === '}' || char === '(' || char === ')' ||
          char === '[' || char === ']' || char === ',' || char === ':') {
        break;
      }
      expandedEndOffset++;
    }
    
    // Convert offsets back to positions
    const expandedStart = this.offsetToPosition(newSourceText, expandedStartOffset);
    const expandedEnd = this.offsetToPosition(newSourceText, expandedEndOffset);
    
    return { start: expandedStart, end: expandedEnd };
  }

  /**
   * Convert character offset to position
   */
  private offsetToPosition(sourceText: string, offset: number): Position {
    let line = 1;
    let column = 1;
    
    for (let i = 0; i < offset && i < sourceText.length; i++) {
      if (sourceText[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    return { line, column, offset };
  }

  /**
   * Check if a token is before a position
   */
  private isTokenBefore(token: ToolingToken, position: Position): boolean {
    return this.isPositionBefore(token.position.end, position);
  }

  /**
   * Check if a token is after a position
   * Tokens starting at or after the position are considered "after"
   */
  private isTokenAfter(token: ToolingToken, position: Position): boolean {
    return this.isPositionAfter(token.position.start, position) ||
           (token.position.start.line === position.line && 
            token.position.start.column === position.column);
  }

  /**
   * Check if position A is before position B
   */
  private isPositionBefore(a: Position, b: Position): boolean {
    return a.line < b.line || (a.line === b.line && a.column < b.column);
  }

  /**
   * Check if position A is after position B
   */
  private isPositionAfter(a: Position, b: Position): boolean {
    return a.line > b.line || (a.line === b.line && a.column > b.column);
  }

  /**
   * Extract text within a range
   */
  private extractTextRange(sourceText: string, range: SourceSpan): string {
    const startOffset = this.positionToOffset(sourceText, range.start);
    const endOffset = this.positionToOffset(sourceText, range.end);
    return sourceText.substring(startOffset, endOffset);
  }

  /**
   * Adjust token positions to match their position in the full document
   * Tokens from extracted text need their positions recalculated relative to full source
   */
  private adjustTokenPositions(tokens: ToolingToken[], basePosition: Position): ToolingToken[] {
    // Calculate the offset adjustment
    const baseOffset = basePosition.offset;
    
    return tokens.map(token => {
      // Adjust token position
      const adjustedToken = {
        ...token,
        position: {
          start: {
            line: token.position.start.line === 1 
              ? basePosition.line 
              : basePosition.line + token.position.start.line - 1,
            column: token.position.start.line === 1
              ? basePosition.column + token.position.start.column - 1
              : token.position.start.column,
            offset: baseOffset + token.position.start.offset
          },
          end: {
            line: token.position.end.line === 1
              ? basePosition.line
              : basePosition.line + token.position.end.line - 1,
            column: token.position.end.line === 1
              ? basePosition.column + token.position.end.column - 1
              : token.position.end.column,
            offset: baseOffset + token.position.end.offset
          }
        },
        trivia: token.trivia.map(trivia => ({
          ...trivia,
          position: {
            start: {
              line: trivia.position.start.line === 1
                ? basePosition.line
                : basePosition.line + trivia.position.start.line - 1,
              column: trivia.position.start.line === 1
                ? basePosition.column + trivia.position.start.column - 1
                : trivia.position.start.column,
              offset: baseOffset + trivia.position.start.offset
            },
            end: {
              line: trivia.position.end.line === 1
                ? basePosition.line
                : basePosition.line + trivia.position.end.line - 1,
              column: trivia.position.end.line === 1
                ? basePosition.column + trivia.position.end.column - 1
                : trivia.position.end.column,
              offset: baseOffset + trivia.position.end.offset
            }
          }
        }))
      };
      
      return adjustedToken;
    });
  }

  /**
   * Calculate position delta from changes
   */
  private calculatePositionDelta(changes: TextChange[]): Position {
    let lineDelta = 0;
    let columnDelta = 0;

    for (const change of changes) {
      const removedLines = change.range.end.line - change.range.start.line;
      const addedLines = (change.text.match(/\n/g) || []).length;
      
      lineDelta += addedLines - removedLines;
      
      // Column delta only matters for single-line changes
      if (removedLines === 0 && addedLines === 0) {
        const removedColumns = change.range.end.column - change.range.start.column;
        columnDelta += change.text.length - removedColumns;
      }
    }

    return { line: lineDelta, column: columnDelta, offset: 0 };
  }

  /**
   * Adjust token positions with a delta
   */
  private adjustTokenPositionsWithDelta(tokens: ToolingToken[], delta: Position): ToolingToken[] {
    if (delta.line === 0 && delta.column === 0) {
      return tokens; // No adjustment needed
    }
    
    return tokens.map(token => ({
      ...token,
      position: {
        start: {
          line: token.position.start.line + delta.line,
          column: delta.line === 0 
            ? token.position.start.column + delta.column 
            : token.position.start.column,
          offset: token.position.start.offset + delta.offset
        },
        end: {
          line: token.position.end.line + delta.line,
          column: delta.line === 0
            ? token.position.end.column + delta.column
            : token.position.end.column,
          offset: token.position.end.offset + delta.offset
        }
      },
      trivia: token.trivia.map(trivia => ({
        ...trivia,
        position: {
          start: {
            line: trivia.position.start.line + delta.line,
            column: delta.line === 0
              ? trivia.position.start.column + delta.column
              : trivia.position.start.column,
            offset: trivia.position.start.offset + delta.offset
          },
          end: {
            line: trivia.position.end.line + delta.line,
            column: delta.line === 0
              ? trivia.position.end.column + delta.column
              : trivia.position.end.column,
            offset: trivia.position.end.offset + delta.offset
          }
        }
      }))
    }));
  }

  // TODO: Uncomment when implementing incremental tokenization
  // /**
  //  * Add two positions together
  //  * This correctly handles multi-line position arithmetic
  //  */
  // private addPositions(a: Position, b: Position): Position {
  //   // If token is on the first line (line 1), add columns
  //   // Otherwise, token is on a new line, so column is absolute
  //   if (a.line === 1) {
  //     return {
  //       line: b.line,
  //       column: b.column + a.column - 1, // -1 because both are 1-indexed
  //       offset: b.offset + a.offset
  //     };
  //   } else {
  //     return {
  //       line: b.line + a.line - 1, // -1 because both are 1-indexed
  //       column: a.column,
  //       offset: b.offset + a.offset
  //     };
  //   }
  // }
}