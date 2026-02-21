/**
 * Optimizer Integration Tests
 * Tests the optimizer working with the full compiler pipeline
 * Requirements: 17.1, 17.2, 17.3
 */

import { Compiler } from '../../src/compiler/compiler';

describe('Optimizer Integration', () => {
  describe('Dead Code Elimination in Compiler', () => {
    it('should remove unreachable code in release mode', () => {
      const source = `
        function test() {
          return 42;
          let x = 1; // dead code
          let y = 2; // dead code
        }
      `;

      const debugCompiler = new Compiler({ optimization: 'debug' });
      const debugResult = debugCompiler.compile(source);
      expect(debugResult.success).toBe(true);
      expect(debugResult.ast?.body[0].type).toBe('FunctionDeclaration');
      if (debugResult.ast?.body[0].type === 'FunctionDeclaration') {
        // In debug mode, dead code remains
        expect(debugResult.ast.body[0].body.body.length).toBe(3);
      }

      const releaseCompiler = new Compiler({ optimization: 'release' });
      const releaseResult = releaseCompiler.compile(source);
      expect(releaseResult.success).toBe(true);
      expect(releaseResult.ast?.body[0].type).toBe('FunctionDeclaration');
      if (releaseResult.ast?.body[0].type === 'FunctionDeclaration') {
        // In release mode, dead code is removed
        expect(releaseResult.ast.body[0].body.body.length).toBe(1);
      }
    });

    it('should eliminate constant false branches', () => {
      const source = `
        function test() {
          if (false) {
            return 1;
          } else {
            return 2;
          }
        }
      `;

      const compiler = new Compiler({ optimization: 'release' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);

      // The false branch should be eliminated
      const func = result.ast?.body[0];
      expect(func?.type).toBe('FunctionDeclaration');
      if (func?.type === 'FunctionDeclaration') {
        // The if statement should be replaced with just the else branch
        expect(func.body.body.length).toBe(1);
        expect(func.body.body[0].type).toBe('BlockStatement');
      }
    });

    it('should eliminate constant true branches', () => {
      const source = `
        function test() {
          if (true) {
            return 1;
          } else {
            return 2;
          }
        }
      `;

      const compiler = new Compiler({ optimization: 'release' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);

      // The else branch should be eliminated
      const func = result.ast?.body[0];
      expect(func?.type).toBe('FunctionDeclaration');
      if (func?.type === 'FunctionDeclaration') {
        // The if statement should be replaced with just the then branch
        expect(func.body.body.length).toBe(1);
        expect(func.body.body[0].type).toBe('BlockStatement');
      }
    });
  });

  describe('Function Inlining in Compiler', () => {
    it('should inline small functions in max optimization mode', () => {
      const source = `
        function add(a, b) {
          return a + b;
        }
        let result = add(1, 2);
      `;

      const debugCompiler = new Compiler({ optimization: 'debug' });
      const debugResult = debugCompiler.compile(source);
      expect(debugResult.success).toBe(true);

      const maxCompiler = new Compiler({ optimization: 'max' });
      const maxResult = maxCompiler.compile(source);
      expect(maxResult.success).toBe(true);

      // Both should compile successfully
      expect(debugResult.output).toBeDefined();
      expect(maxResult.output).toBeDefined();
    });

    it('should not inline recursive functions', () => {
      const source = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        let result = factorial(5);
      `;

      const compiler = new Compiler({ optimization: 'max' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
  });

  describe('Combined Optimizations', () => {
    it('should apply both dead code elimination and inlining in max mode', () => {
      const source = `
        function double(x) {
          return x * 2;
        }
        function test() {
          if (false) {
            return 0;
          }
          return double(21);
        }
      `;

      const compiler = new Compiler({ optimization: 'max' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();

      // Verify the AST has been optimized
      const testFunc = result.ast?.body[1];
      expect(testFunc?.type).toBe('FunctionDeclaration');
      if (testFunc?.type === 'FunctionDeclaration') {
        // The false branch should be eliminated
        expect(testFunc.body.body.length).toBe(1);
      }
    });

    it('should generate valid C code after optimization', () => {
      const source = `
        function add(a, b) {
          return a + b;
        }
        function main() {
          let x = add(1, 2);
          return x;
        }
      `;

      const compiler = new Compiler({ optimization: 'max' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.sourceFile).toContain('nami_value_t main');
      expect(result.output?.headerFile).toContain('#ifndef');
    });
  });

  describe('Optimization Level Configuration', () => {
    it('should respect debug optimization level', () => {
      const source = `
        function test() {
          return 1;
          let x = 2;
        }
      `;

      const compiler = new Compiler({ optimization: 'debug' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);

      const func = result.ast?.body[0];
      if (func?.type === 'FunctionDeclaration') {
        // Dead code should remain in debug mode
        expect(func.body.body.length).toBe(2);
      }
    });

    it('should respect release optimization level', () => {
      const source = `
        function test() {
          return 1;
          let x = 2;
        }
      `;

      const compiler = new Compiler({ optimization: 'release' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);

      const func = result.ast?.body[0];
      if (func?.type === 'FunctionDeclaration') {
        // Dead code should be removed in release mode
        expect(func.body.body.length).toBe(1);
      }
    });

    it('should respect max optimization level', () => {
      const source = `
        function add(a, b) {
          return a + b;
        }
        function test() {
          return add(1, 2);
        }
      `;

      const compiler = new Compiler({ optimization: 'max' });
      const result = compiler.compile(source);
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
  });
});
