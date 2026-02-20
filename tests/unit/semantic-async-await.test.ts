/**
 * Semantic Analyzer Tests for Async/Await
 * Requirements: 6.1, 6.2
 */

import { Parser } from '../../src/parser/parser';
import { SemanticAnalyzer } from '../../src/analyzer/semantic';

describe('Semantic Analyzer - Async/Await', () => {
  it('should allow await in async function', () => {
    const source = `
      function getData() { return 42; }
      async function test() { 
        let x = await getData(); 
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);
    expect(result.errors.length).toBe(0);
  });

  it('should error on await outside async function', () => {
    const source = `
      function getData() { return 42; }
      function test() { 
        let x = await getData(); 
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('await');
    expect(result.errors[0].message).toContain('async');
  });

  it('should allow await in async arrow function', () => {
    const source = `
      function getData() { return 42; }
      const test = async () => { 
        return await getData(); 
      };
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);
    expect(result.errors.length).toBe(0);
  });

  it('should error on await in non-async arrow function', () => {
    const source = `
      function getData() { return 42; }
      const test = () => { 
        return await getData(); 
      };
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('await');
  });

  it('should allow nested async functions', () => {
    const source = `
      function getData() { return 42; }
      async function outer() {
        async function inner() {
          return await getData();
        }
        return await inner();
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);
    expect(result.errors.length).toBe(0);
  });

  it('should error on await in nested non-async function inside async function', () => {
    const source = `
      function getData() { return 42; }
      async function outer() {
        function inner() {
          return await getData();
        }
        return inner();
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('await');
  });
});
