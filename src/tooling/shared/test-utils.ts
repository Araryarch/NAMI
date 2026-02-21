/**
 * Testing utilities and property-based testing support for Nami Developer Tooling
 */

import * as fc from 'fast-check';
import { TokenType } from '../../../src/lexer/token';
import { ToolingToken, TriviaKind, Trivia } from './types';
import { Position, SourceSpan } from '../../../src/lexer/token';

/**
 * Property-based test configuration
 */
export const PBT_CONFIG = {
  numRuns: 100,
  verbose: false,
  seed: undefined as number | undefined
};

/**
 * Generators for property-based testing
 */
export const generators = {
  /**
   * Generate valid Nami source code
   */
  namiSource: (): fc.Arbitrary<string> => {
    return fc.oneof(
      // Simple statements
      fc.record({
        type: fc.constant('variable'),
        name: fc.stringOf(fc.char().filter(c => /[a-zA-Z_]/.test(c)), { minLength: 1, maxLength: 10 }),
        value: fc.oneof(
          fc.integer().map(n => n.toString()),
          fc.float().map(n => n.toString()),
          fc.string().map(s => `"${s.replace(/"/g, '\\"')}"`),
          fc.boolean().map(b => b.toString())
        )
      }).map(({ name, value }) => `let ${name} = ${value};`),
      
      // Function declarations
      fc.record({
        name: fc.stringOf(fc.char().filter(c => /[a-zA-Z_]/.test(c)), { minLength: 1, maxLength: 10 }),
        params: fc.array(fc.stringOf(fc.char().filter(c => /[a-zA-Z_]/.test(c)), { minLength: 1, maxLength: 8 }), { maxLength: 3 }),
        body: fc.constant('return 42;')
      }).map(({ name, params, body }) => `function ${name}(${params.join(', ')}) { ${body} }`),
      
      // Comments
      fc.string().map(s => `// ${s.replace(/\n/g, ' ')}`),
      
      // Print statements
      fc.string().map(s => `println("${s.replace(/"/g, '\\"')}");`)
    );
  },

  /**
   * Generate positions in source code
   */
  position: (): fc.Arbitrary<Position> => {
    return fc.record({
      line: fc.nat(100),
      column: fc.nat(100),
      offset: fc.nat(10000)
    });
  },

  /**
   * Generate source spans
   */
  sourceSpan: (): fc.Arbitrary<SourceSpan> => {
    return fc.record({
      start: generators.position(),
      end: generators.position()
    }).filter(({ start, end }) => 
      start.line < end.line || (start.line === end.line && start.column <= end.column)
    );
  },

  /**
   * Generate tooling tokens
   */
  toolingToken: (): fc.Arbitrary<ToolingToken> => {
    return fc.record({
      kind: fc.constantFrom(...Object.values(TokenType).filter(t => typeof t === 'number')),
      text: fc.string({ minLength: 1, maxLength: 20 }),
      position: generators.sourceSpan(),
      trivia: fc.array(generators.trivia(), { maxLength: 3 })
    });
  },

  /**
   * Generate trivia (comments and whitespace)
   */
  trivia: (): fc.Arbitrary<Trivia> => {
    return fc.record({
      kind: fc.constantFrom(...Object.values(TriviaKind)),
      text: fc.string({ maxLength: 50 }),
      position: generators.sourceSpan()
    });
  },

  /**
   * Generate text changes for incremental updates
   */
  textChange: (): fc.Arbitrary<{ range: SourceSpan; text: string }> => {
    return fc.record({
      range: generators.sourceSpan(),
      text: fc.string({ maxLength: 100 })
    });
  },

  /**
   * Generate configuration options
   */
  formattingOptions: (): fc.Arbitrary<{
    indentSize: number;
    useTabs: boolean;
    maxLineLength: number;
  }> => {
    return fc.record({
      indentSize: fc.integer({ min: 1, max: 8 }),
      useTabs: fc.boolean(),
      maxLineLength: fc.integer({ min: 40, max: 200 })
    });
  }
};

/**
 * Helper functions for testing
 */
export const testHelpers = {
  /**
   * Create a minimal source file for testing
   */
  createSourceFile: (content: string, path = 'test.nm'): any => ({
    path,
    content,
    version: 1,
    tokens: [],
    diagnostics: [],
    symbols: []
  }),

  /**
   * Create a position from line/column numbers
   */
  createPosition: (line: number, column: number, offset = 0): Position => ({
    line,
    column,
    offset
  }),

  /**
   * Create a source span from coordinates
   */
  createSpan: (startLine: number, startCol: number, endLine: number, endCol: number): SourceSpan => ({
    start: { line: startLine, column: startCol, offset: 0 },
    end: { line: endLine, column: endCol, offset: 0 }
  }),

  /**
   * Normalize whitespace for comparison
   */
  normalizeWhitespace: (text: string): string => {
    return text.replace(/\s+/g, ' ').trim();
  },

  /**
   * Check if two source spans are equal
   */
  spansEqual: (a: SourceSpan, b: SourceSpan): boolean => {
    return a.start.line === b.start.line &&
           a.start.column === b.start.column &&
           a.end.line === b.end.line &&
           a.end.column === b.end.column;
  }
};

/**
 * Property test runner with consistent configuration
 */
export function runPropertyTest<T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | void,
  options: Partial<typeof PBT_CONFIG> = {}
): void {
  const config = { ...PBT_CONFIG, ...options };
  
  test(name, () => {
    fc.assert(
      fc.property(arbitrary, predicate),
      {
        numRuns: config.numRuns,
        verbose: config.verbose,
        seed: config.seed
      }
    );
  });
}