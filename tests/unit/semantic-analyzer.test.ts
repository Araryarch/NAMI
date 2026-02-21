/**
 * Comprehensive Semantic Analyzer Tests
 * Requirements: 1.1, 1.3, 6.2, 12.1, 12.2, 12.3, 12.5, 12.6
 */

import { Parser } from '../../src/parser/parser';
import { SemanticAnalyzer } from '../../src/analyzer/semantic';

describe('Semantic Analyzer - Symbol Table', () => {
  it('should define and resolve variables', () => {
    const source = `
      let x = 42;
      let y = x + 10;
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const symbolTable = result.symbolTable;
    const x = symbolTable.resolve('x');
    const y = symbolTable.resolve('y');

    expect(x).toBeDefined();
    expect(y).toBeDefined();
    expect(x?.name).toBe('x');
    expect(y?.name).toBe('y');
  });

  it('should detect undefined variables', () => {
    const source = `
      let x = y + 10;
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Undefined variable');
    expect(result.errors[0].message).toContain('y');
  });

  it('should detect duplicate declarations in same scope', () => {
    const source = `
      let x = 42;
      let x = 10;
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('already declared');
  });

  it('should allow shadowing in nested scopes', () => {
    const source = `
      let x = 42;
      function test() {
        let x = 10;
        return x;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should define function parameters in function scope', () => {
    const source = `
      function add(a, b) {
        return a + b;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should detect const reassignment', () => {
    const source = `
      const x = 42;
      x = 10;
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('constant');
  });
});

describe('Semantic Analyzer - Control Flow', () => {
  it('should allow break in loops', () => {
    const source = `
      for (let i = 0; i < 10; i++) {
        if (i === 5) break;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should error on break outside loop', () => {
    const source = `
      function test() {
        break;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('break');
  });

  it('should allow continue in loops', () => {
    const source = `
      while (true) {
        continue;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should error on continue outside loop', () => {
    const source = `
      function test() {
        continue;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('continue');
  });

  it('should allow return in functions', () => {
    const source = `
      function test() {
        return 42;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should error on return outside function', () => {
    const source = `
      let x = 42;
      return x;
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('return');
  });

  it('should allow break in switch statements', () => {
    const source = `
      let x = 1;
      switch (x) {
        case 1:
          break;
        case 2:
          break;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });
});

describe('Semantic Analyzer - Type Inference', () => {
  it('should infer int type from integer literal', () => {
    const source = `let x = 42;`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('primitive');
    if (x?.type.kind === 'primitive') {
      expect(x.type.name).toBe('int');
    }
  });

  it('should infer float type from float literal', () => {
    const source = `let x = 3.14;`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('primitive');
    if (x?.type.kind === 'primitive') {
      expect(x.type.name).toBe('float');
    }
  });

  it('should infer string type from string literal', () => {
    const source = `let x = "hello";`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('primitive');
    if (x?.type.kind === 'primitive') {
      expect(x.type.name).toBe('string');
    }
  });

  it('should infer bool type from boolean literal', () => {
    const source = `let x = true;`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('primitive');
    if (x?.type.kind === 'primitive') {
      expect(x.type.name).toBe('bool');
    }
  });

  it('should infer array type from array literal', () => {
    const source = `let x = [1, 2, 3];`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('array');
  });

  it('should infer object type from object literal', () => {
    const source = `let x = { a: 1, b: 2 };`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('object');
  });

  it('should infer function type from arrow function', () => {
    const source = `let x = () => 42;`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
    const x = result.symbolTable.resolve('x');
    expect(x?.type.kind).toBe('function');
  });
});

describe('Semantic Analyzer - Scoping', () => {
  it('should create scope for block statements', () => {
    const source = `
      let x = 1;
      {
        let y = 2;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should create scope for for loops', () => {
    const source = `
      for (let i = 0; i < 10; i++) {
        let x = i;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should create scope for while loops', () => {
    const source = `
      while (true) {
        let x = 1;
        break;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should create scope for try-catch blocks', () => {
    const source = `
      try {
        let x = 1;
      } catch (e) {
        let y = 2;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should define catch parameter in catch scope', () => {
    const source = `
      try {
        let x = 1;
      } catch (error) {
        let message = error;
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });
});

describe('Semantic Analyzer - Built-in Functions', () => {
  it('should recognize built-in print function', () => {
    const source = `print("hello");`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should recognize built-in input function', () => {
    const source = `let x = input();`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should recognize built-in parseInt function', () => {
    const source = `let x = parseInt("42");`;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });
});

describe('Semantic Analyzer - Complex Programs', () => {
  it('should analyze a complete program with functions and control flow', () => {
    const source = `
      function factorial(n) {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }
      
      let result = factorial(5);
      print(result);
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should analyze nested functions', () => {
    const source = `
      function outer() {
        let x = 1;
        function inner() {
          return x + 1;
        }
        return inner();
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });

  it('should analyze arrow functions with closures', () => {
    const source = `
      function makeCounter() {
        let count = 0;
        return () => {
          count = count + 1;
          return count;
        };
      }
    `;
    const parser = new Parser(source);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer();
    const result = analyzer.analyze(ast);

    expect(result.errors.length).toBe(0);
  });
});
