/**
 * Setup tests for Nami Developer Tooling
 */

import { initializeTooling, TOOLING_VERSION } from '../../src/tooling';
import { loadConfig, validateConfig, DEFAULT_CONFIG } from '../../src/tooling/shared/config';
import { generators, testHelpers } from '../../src/tooling/shared/test-utils';
import * as fc from 'fast-check';

describe('Nami Developer Tooling Setup', () => {
  describe('Version and Initialization', () => {
    it('should have correct version', () => {
      expect(TOOLING_VERSION).toBe('0.1.0');
    });

    it('should initialize with default configuration', () => {
      const config = initializeTooling();
      expect(config).toBeDefined();
      expect(config.lsp).toBeDefined();
      expect(config.formatting).toBeDefined();
      expect(config.diagnostics).toBeDefined();
      expect(config.cli).toBeDefined();
    });
  });

  describe('Configuration System', () => {
    it('should load default configuration', () => {
      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should validate default configuration', () => {
      const errors = validateConfig(DEFAULT_CONFIG);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid configuration values', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        formatting: {
          ...DEFAULT_CONFIG.formatting,
          indentSize: 0 // Invalid: must be >= 1
        }
      };
      
      const errors = validateConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('indentSize must be between 1 and 8');
    });
  });

  describe('Property-Based Testing Setup', () => {
    it('should have fast-check configured correctly', () => {
      expect(fc).toBeDefined();
      expect(typeof fc.assert).toBe('function');
      expect(typeof fc.property).toBe('function');
    });

    it('should generate valid Nami source code', () => {
      const sourceGen = generators.namiSource();
      const sample = fc.sample(sourceGen, 10);
      
      expect(sample).toHaveLength(10);
      sample.forEach(source => {
        expect(typeof source).toBe('string');
        expect(source.length).toBeGreaterThan(0);
      });
    });

    it('should generate valid positions', () => {
      const posGen = generators.position();
      const sample = fc.sample(posGen, 10);
      
      sample.forEach(pos => {
        expect(pos.line).toBeGreaterThanOrEqual(0);
        expect(pos.column).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate valid source spans', () => {
      const spanGen = generators.sourceSpan();
      const sample = fc.sample(spanGen, 10);
      
      sample.forEach(span => {
        expect(span.start.line).toBeLessThanOrEqual(span.end.line);
        if (span.start.line === span.end.line) {
          expect(span.start.column).toBeLessThanOrEqual(span.end.column);
        }
      });
    });
  });

  describe('Test Utilities', () => {
    it('should create source files correctly', () => {
      const content = 'let x = 42;';
      const file = testHelpers.createSourceFile(content);
      
      expect(file.content).toBe(content);
      expect(file.path).toBe('test.nm');
      expect(file.version).toBe(1);
      expect(Array.isArray(file.tokens)).toBe(true);
      expect(Array.isArray(file.diagnostics)).toBe(true);
      expect(Array.isArray(file.symbols)).toBe(true);
    });

    it('should create positions and spans correctly', () => {
      const pos = testHelpers.createPosition(5, 10);
      expect(pos.line).toBe(5);
      expect(pos.column).toBe(10);
      
      const span = testHelpers.createSpan(1, 0, 1, 10);
      expect(span.start.line).toBe(1);
      expect(span.start.column).toBe(0);
      expect(span.end.line).toBe(1);
      expect(span.end.column).toBe(10);
    });

    it('should normalize whitespace correctly', () => {
      const text = '  hello   world  \n  test  ';
      const normalized = testHelpers.normalizeWhitespace(text);
      expect(normalized).toBe('hello world test');
    });

    it('should compare spans correctly', () => {
      const span1 = testHelpers.createSpan(1, 0, 1, 10);
      const span2 = testHelpers.createSpan(1, 0, 1, 10);
      const span3 = testHelpers.createSpan(1, 0, 1, 11);
      
      expect(testHelpers.spansEqual(span1, span2)).toBe(true);
      expect(testHelpers.spansEqual(span1, span3)).toBe(false);
    });
  });
});