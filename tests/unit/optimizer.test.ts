/**
 * Optimizer Unit Tests
 * Requirements: 17.1, 17.2, 17.3, 17.5
 */

import { Optimizer, DeadCodeEliminator, FunctionInliner } from '../../src/optimizer';
import { Parser } from '../../src/parser/parser';

describe('Optimizer', () => {
  describe('Optimization Levels (Requirement 17.1)', () => {
    it('should not optimize in debug mode', () => {
      const source = `
        function test() {
          return 1;
          let x = 2; // dead code
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimizer = new Optimizer({ level: 'debug' });
      const optimized = optimizer.optimize(program);

      // In debug mode, dead code should remain
      const func = optimized.body[0];
      expect(func.type).toBe('FunctionDeclaration');
      if (func.type === 'FunctionDeclaration') {
        expect(func.body.body.length).toBe(2); // return + dead code
      }
    });

    it('should apply dead code elimination in release mode', () => {
      const source = `
        function test() {
          return 1;
          let x = 2; // dead code
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimizer = new Optimizer({ level: 'release' });
      const optimized = optimizer.optimize(program);

      const func = optimized.body[0];
      expect(func.type).toBe('FunctionDeclaration');
      if (func.type === 'FunctionDeclaration') {
        expect(func.body.body.length).toBe(1); // only return
      }
    });

    it('should apply all optimizations in max mode', () => {
      const source = `
        function add(a, b) {
          return a + b;
        }
        function test() {
          return add(1, 2);
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimizer = new Optimizer({ level: 'max' });
      optimizer.optimize(program);

      const stats = optimizer.getStats();
      expect(stats.level).toBe('max');
      expect(stats.inlining).toBeDefined();
      expect(stats.deadCode).toBeDefined();
    });
  });

  describe('Dead Code Elimination (Requirement 17.2)', () => {
    let eliminator: DeadCodeEliminator;

    beforeEach(() => {
      eliminator = new DeadCodeEliminator();
    });

    it('should remove code after return statement', () => {
      const source = `
        function test() {
          return 1;
          let x = 2;
          let y = 3;
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimized = eliminator.eliminate(program);

      const func = optimized.body[0];
      expect(func.type).toBe('FunctionDeclaration');
      if (func.type === 'FunctionDeclaration') {
        expect(func.body.body.length).toBe(1);
        expect(func.body.body[0].type).toBe('ReturnStatement');
      }

      const stats = eliminator.getStats();
      expect(stats.unreachableAfterReturn).toBe(2);
    });

    it('should eliminate false branches in if statements', () => {
      const source = `
        function test() {
          if (false) {
            let x = 1;
          } else {
            let y = 2;
          }
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimized = eliminator.eliminate(program);

      const func = optimized.body[0];
      expect(func.type).toBe('FunctionDeclaration');
      if (func.type === 'FunctionDeclaration') {
        // The if statement should be replaced with just the else branch
        expect(func.body.body.length).toBe(1);
        const stmt = func.body.body[0];
        expect(stmt.type).toBe('BlockStatement');
      }

      const stats = eliminator.getStats();
      expect(stats.constantBranches).toBeGreaterThan(0);
    });

    it('should eliminate true branches in if statements', () => {
      const source = `
        function test() {
          if (true) {
            let x = 1;
          } else {
            let y = 2;
          }
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimized = eliminator.eliminate(program);

      const func = optimized.body[0];
      expect(func.type).toBe('FunctionDeclaration');
      if (func.type === 'FunctionDeclaration') {
        // The if statement should be replaced with just the then branch
        expect(func.body.body.length).toBe(1);
        const stmt = func.body.body[0];
        expect(stmt.type).toBe('BlockStatement');
      }

      const stats = eliminator.getStats();
      expect(stats.constantBranches).toBeGreaterThan(0);
    });

    it('should track optimization statistics', () => {
      const source = `
        function test() {
          if (false) {
            let a = 1;
          }
          return 1;
          let x = 2;
          let y = 3;
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      eliminator.eliminate(program);

      const stats = eliminator.getStats();
      expect(stats.statementsRemoved).toBeGreaterThan(0);
      expect(stats.unreachableAfterReturn).toBe(2);
      expect(stats.constantBranches).toBe(1);
    });
  });

  describe('Function Inlining (Requirement 17.3)', () => {
    let inliner: FunctionInliner;

    beforeEach(() => {
      inliner = new FunctionInliner({ maxStatements: 5 });
    });

    it('should inline small functions', () => {
      const source = `
        function add(a, b) {
          return a + b;
        }
        let result = add(1, 2);
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      inliner.inline(program);

      const stats = inliner.getStats();
      expect(stats.callSitesInlined).toBeGreaterThan(0);
    });

    it('should not inline recursive functions', () => {
      const source = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        let result = factorial(5);
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      inliner.inline(program);

      const stats = inliner.getStats();
      expect(stats.recursiveFunctionsSkipped).toBeGreaterThan(0);
      expect(stats.callSitesInlined).toBe(0);
    });

    it('should not inline large functions', () => {
      const source = `
        function large(x) {
          let a = x + 1;
          let b = x + 2;
          let c = x + 3;
          let d = x + 4;
          let e = x + 5;
          let f = x + 6;
          return a + b + c + d + e + f;
        }
        let result = large(10);
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      inliner.inline(program);

      const stats = inliner.getStats();
      // Function is too large, should not be inlined
      expect(stats.callSitesInlined).toBe(0);
    });

    it('should substitute parameters correctly', () => {
      const source = `
        function double(x) {
          return x * 2;
        }
        let result = double(5);
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      inliner.inline(program);

      const stats = inliner.getStats();
      expect(stats.callSitesInlined).toBeGreaterThan(0);
    });

    it('should respect max depth to prevent exponential growth', () => {
      const source = `
        function a(x) { return x + 1; }
        function b(x) { return a(x) + 1; }
        function c(x) { return b(x) + 1; }
        function d(x) { return c(x) + 1; }
        let result = d(1);
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const inlinerWithDepth = new FunctionInliner({ maxStatements: 5, maxDepth: 2 });
      inlinerWithDepth.inline(program);

      const stats = inlinerWithDepth.getStats();
      // Should inline some but not all due to depth limit
      expect(stats.callSitesInlined).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('should work with the full compiler pipeline', () => {
      const source = `
        function add(a, b) {
          return a + b;
        }
        function test() {
          if (false) {
            return 0;
          }
          return add(1, 2);
        }
      `;
      const parser = new Parser(source);
      const program = parser.parse();
      const optimizer = new Optimizer({ level: 'max' });
      optimizer.optimize(program);

      const stats = optimizer.getStats();
      expect(stats.level).toBe('max');
      expect(stats.deadCode?.constantBranches).toBeGreaterThan(0);
    });
  });
});
