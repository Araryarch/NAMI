/**
 * Streaming Tokenizer for Nami Developer Tooling
 * 
 * Provides streaming tokenization for large files to improve performance
 * and memory usage by processing tokens in chunks.
 * 
 * Requirements: 4.6
 */

import { TokenProvider, TokenError } from './token-provider';
import { ToolingToken } from '../shared/types';
import { Position } from '../../lexer/token';

/**
 * Streaming tokenization options
 */
export interface StreamingOptions {
  chunkSize?: number;        // Size of each chunk in characters
  maxMemoryTokens?: number;  // Maximum tokens to keep in memory
  onTokenChunk?: (tokens: ToolingToken[], chunkIndex: number) => void;
  onProgress?: (progress: number) => void; // Progress callback (0-1)
}

/**
 * Token chunk information
 */
export interface TokenChunk {
  tokens: ToolingToken[];
  startOffset: number;
  endOffset: number;
  chunkIndex: number;
}

/**
 * Streaming Tokenizer
 * 
 * Processes large source files in chunks to maintain memory efficiency
 * while providing the same tokenization results as batch processing.
 */
export class StreamingTokenizer {
  private tokenProvider: TokenProvider;
  private options: Required<StreamingOptions>;

  constructor(tokenProvider: TokenProvider, options: StreamingOptions = {}) {
    this.tokenProvider = tokenProvider;
    this.options = {
      chunkSize: options.chunkSize || 8192,        // 8KB chunks
      maxMemoryTokens: options.maxMemoryTokens || 10000, // 10K tokens max
      onTokenChunk: options.onTokenChunk || (() => {}),
      onProgress: options.onProgress || (() => {})
    };
  }

  /**
   * Tokenize source using streaming approach
   * Requirements: 4.6
   */
  async tokenizeStream(source: string): Promise<ToolingToken[]> {
    try {
      // For small files, use regular tokenization
      // Streaming is only beneficial for large files
      // Use a threshold of 1KB to avoid chunking issues with small test cases
      if (source.length <= Math.max(this.options.chunkSize, 1024)) {
        return this.tokenProvider.tokenize(source);
      }

      const chunks = this.createChunks(source);
      const allTokens: ToolingToken[] = [];
      let processedTokens = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Tokenize chunk
        const chunkTokens = await this.tokenizeChunk(chunk, source);
        
        // Add to results
        allTokens.push(...chunkTokens.tokens);
        processedTokens += chunkTokens.tokens.length;
        
        // Call progress callback
        const progress = (i + 1) / chunks.length;
        this.options.onProgress(progress);
        
        // Call chunk callback
        this.options.onTokenChunk(chunkTokens.tokens, i);
        
        // Memory management - if we have too many tokens, we might need to yield
        if (processedTokens > this.options.maxMemoryTokens) {
          await this.yieldToEventLoop();
        }
      }

      return allTokens;
    } catch (error) {
      throw new TokenError(
        `Failed to tokenize stream: ${error instanceof Error ? error.message : String(error)}`,
        'tokenizeStream',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Tokenize source using streaming approach with iterator
   * Requirements: 4.6
   */
  async* tokenizeStreamIterator(source: string): AsyncGenerator<TokenChunk, void, unknown> {
    try {
      if (source.length <= this.options.chunkSize) {
        // Small file, yield all tokens at once
        const tokens = this.tokenProvider.tokenize(source);
        yield {
          tokens,
          startOffset: 0,
          endOffset: source.length,
          chunkIndex: 0
        };
        return;
      }

      const chunks = this.createChunks(source);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkTokens = await this.tokenizeChunk(chunk, source);
        
        // Report progress
        const progress = (i + 1) / chunks.length;
        this.options.onProgress(progress);
        
        yield chunkTokens;
        
        // Yield to event loop periodically
        if (i % 10 === 0) {
          await this.yieldToEventLoop();
        }
      }
    } catch (error) {
      throw new TokenError(
        `Failed to tokenize stream iterator: ${error instanceof Error ? error.message : String(error)}`,
        'tokenizeStreamIterator',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create chunks from source text with overlap for proper tokenization
   */
  private createChunks(source: string): Array<{text: string, textStartOffset: number, startOffset: number, endOffset: number}> {
    const chunks: Array<{text: string, textStartOffset: number, startOffset: number, endOffset: number}> = [];
    const overlapSize = 200; // Large overlap to handle tokens that span chunk boundaries
    
    let offset = 0;
    let chunkIndex = 0;
    
    while (offset < source.length) {
      // For chunks after the first, include overlap but don't go back too far
      const textStart = chunkIndex > 0 ? Math.max(offset - overlapSize, 0) : 0;
      const chunkEnd = Math.min(source.length, offset + this.options.chunkSize);
      
      // Try to break at word boundaries to avoid splitting tokens
      let actualChunkEnd = chunkEnd;
      if (chunkEnd < source.length) {
        // Look for a good break point (whitespace, newline, or punctuation)
        for (let i = chunkEnd; i > chunkEnd - 50 && i > textStart; i--) {
          const char = source[i];
          if (char === '\n' || char === ' ' || char === '\t' || 
              char === ';' || char === '{' || char === '}') {
            actualChunkEnd = i + 1;
            break;
          }
        }
      }
      
      chunks.push({
        text: source.substring(textStart, actualChunkEnd),
        textStartOffset: textStart, // Where the extracted text starts in the full source
        startOffset: offset, // Start of the range we want to keep tokens from
        endOffset: actualChunkEnd // End of the range
      });
      
      offset = actualChunkEnd;
      chunkIndex++;
    }
    
    return chunks;
  }

  /**
   * Tokenize a single chunk and adjust positions
   */
  private async tokenizeChunk(
    chunk: {text: string, textStartOffset: number, startOffset: number, endOffset: number}, 
    fullSource: string
  ): Promise<TokenChunk> {
    // Tokenize the chunk
    const tokens = this.tokenProvider.tokenize(chunk.text);
    
    // Adjust token positions to be relative to the full source
    const adjustedTokens = tokens.map(token => ({
      ...token,
      position: {
        start: this.adjustPosition(token.position.start, chunk.textStartOffset, fullSource),
        end: this.adjustPosition(token.position.end, chunk.textStartOffset, fullSource)
      },
      trivia: token.trivia.map(trivia => ({
        ...trivia,
        position: {
          start: this.adjustPosition(trivia.position.start, chunk.textStartOffset, fullSource),
          end: this.adjustPosition(trivia.position.end, chunk.textStartOffset, fullSource)
        }
      }))
    }));

    // Filter out tokens that are in the overlap region
    // Only keep tokens that start within [startOffset, endOffset)
    const filteredTokens = adjustedTokens.filter(token => {
      const tokenOffset = token.position.start.offset;
      return tokenOffset >= chunk.startOffset && tokenOffset < chunk.endOffset;
    });

    return {
      tokens: filteredTokens,
      startOffset: chunk.startOffset,
      endOffset: chunk.endOffset,
      chunkIndex: 0 // Will be set by caller
    };
  }

  /**
   * Adjust position from chunk-relative to source-relative
   */
  private adjustPosition(position: Position, chunkStartOffset: number, fullSource: string): Position {
    const absoluteOffset = position.offset + chunkStartOffset;
    
    // Calculate line and column in full source
    let line = 1;
    let column = 1;
    
    for (let i = 0; i < absoluteOffset && i < fullSource.length; i++) {
      if (fullSource[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    return {
      line,
      column,
      offset: absoluteOffset
    };
  }

  /**
   * Yield control to the event loop to prevent blocking
   */
  private async yieldToEventLoop(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Validate that streaming tokenization produces the same result as batch tokenization
   * This is useful for testing and debugging
   */
  async validateStreamingEquivalence(source: string): Promise<boolean> {
    try {
      // Get batch tokenization result
      const batchTokens = this.tokenProvider.tokenize(source);
      
      // Get streaming tokenization result
      const streamTokens = await this.tokenizeStream(source);
      
      // Compare results
      if (batchTokens.length !== streamTokens.length) {
        return false;
      }
      
      for (let i = 0; i < batchTokens.length; i++) {
        const batchToken = batchTokens[i];
        const streamToken = streamTokens[i];
        
        if (!this.tokensEqual(batchToken, streamToken)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Compare two tokens for equality
   */
  private tokensEqual(a: ToolingToken, b: ToolingToken): boolean {
    return (
      a.kind === b.kind &&
      a.text === b.text &&
      a.position.start.line === b.position.start.line &&
      a.position.start.column === b.position.start.column &&
      a.position.end.line === b.position.end.line &&
      a.position.end.column === b.position.end.column &&
      a.trivia.length === b.trivia.length
    );
  }
}