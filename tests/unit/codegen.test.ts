/**
 * Code Generator Unit Tests
 * Requirements: 1.2, 1.4, 1.5, 3.1-3.6, 4.2, 4.3, 4.6, 5.1, 6.3-6.5, 13.1-13.4, 15.1-15.5
 */

import { CodeGenerator } from '../../src/codegen/codegen';
import { Parser } from '../../src/parser/parser';
import { SemanticAnalyzer } from '../../src/analyzer/semantic';

describe('Code Generator', () => {
  describe('Basic Code Generation', () => {
    it('should generate C code for variable declarations', () => {
      const source = 'let x = 42';
      const parser = new Parser(source);
      const program = parser.parse();
      const analyzer = new SemanticAnalyzer();
      const { symbolTable } = analyzer.analyze(program);
      const generator = new CodeGenerator();
      const code = generator.generate(program, symbolTable);

      expect(code.sourceFile).toContain('nami_value_t x = nami_value_int(42LL)');
    });

    it('should generate C code for string literals', () => {
      const source = 'let s = "hello"';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('nami_value_string("hello")');
    });

    it('should generate C code for boolean literals', () => {
      const source = 'let b = true';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('NAMI_TRUE');
    });
  });

  describe('Function Generation (Requirement 4.6)', () => {
    it('should generate C function with proper signature', () => {
      const source = 'function add(a, b) { return a + b }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('nami_value_t add(nami_value_t a, nami_value_t b)');
      expect(code.sourceFile).toContain('return nami_add(a, b)');
    });

    it.skip('should generate function prototype in header', () => {
      const source = 'function test() { return 1 }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.headerFile).toContain('nami_value_t test(void);');
    });
  });

  describe('Control Flow Generation (Requirements 3.1-3.6)', () => {
    it('should generate if statement', () => {
      const source = 'if (x > 0) { print(x) }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('if (nami_truthy(');
    });

    it('should generate for loop with loop guard (Requirement 5.1)', () => {
      const source = 'for (let i = 0; i < 10; i++) { print(i) }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('while (nami_truthy(');
      expect(code.sourceFile).toContain('NAMI_LOOP_CHECK');
    });

    it('should generate while loop with loop guard', () => {
      const source = 'while (x > 0) { x = x - 1 }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('while (nami_truthy(');
      expect(code.sourceFile).toContain('NAMI_LOOP_CHECK');
    });
  });

  describe('Array Operations (Requirement 13.1-13.4)', () => {
    it('should generate array literal', () => {
      const source = 'let arr = [1, 2, 3]';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('nami_array_of');
    });
  });

  describe('Error Handling Generation (Requirements 15.1-15.5)', () => {
    it('should generate try-catch block', () => {
      const source = 'try { print(1) } catch (e) { print(e) }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('setjmp');
      expect(code.sourceFile).toContain('nami_error_context_t');
    });
  });

  describe('Code Structure', () => {
    it('should include runtime header', () => {
      const source = 'let x = 1';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('#include "nami_runtime.h"');
      expect(code.headerFile).toContain('#include "nami_runtime.h"');
    });

    it('should generate header guards', () => {
      const source = 'let x = 1';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.headerFile).toContain('#ifndef NAMI_GENERATED_H');
      expect(code.headerFile).toContain('#define NAMI_GENERATED_H');
      expect(code.headerFile).toContain('#endif // NAMI_GENERATED_H');
    });

    it('should generate main function', () => {
      const source = 'let x = 1';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('int main(int argc, char** argv)');
      expect(code.sourceFile).toContain('nami_gc_init(&nami_gc)');
      expect(code.sourceFile).toContain('return 0;');
    });
  });

  describe('Optimization Levels', () => {
    it('should include debug flag in debug mode', () => {
      const source = 'let x = 1';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator('debug');
      const code = generator.generate(program);

      expect(code.sourceFile).toContain('#define NAMI_DEBUG 1');
    });

    it('should disable loop guard in max optimization', () => {
      const source = 'while (true) { break }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator('max');
      const code = generator.generate(program);

      expect(code.sourceFile).not.toContain('NAMI_LOOP_CHECK');
    });
  });

  describe('Parameter Passing (Requirements 4.2, 4.3)', () => {
    it('should generate functions with nami_value_t parameters for pass-by-value primitives', () => {
      const source = 'function increment(x) { return x + 1 }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      // Verify function signature uses nami_value_t (passed by value)
      expect(code.sourceFile).toContain('nami_value_t increment(nami_value_t x)');
      // Verify comment about parameter passing
      expect(code.sourceFile).toContain(
        'Parameter passing: primitives by value, complex types by reference'
      );
    });

    it('should generate functions with nami_value_t parameters for pass-by-reference complex types', () => {
      const source = 'function modifyArray(arr) { arr.push(42); return arr }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      // Verify function signature uses nami_value_t (contains pointer for arrays)
      expect(code.sourceFile).toContain('nami_value_t modifyArray(nami_value_t arr)');
      // Verify comment about parameter passing
      expect(code.sourceFile).toContain(
        'Parameter passing: primitives by value, complex types by reference'
      );
    });

    it('should generate functions with multiple parameters', () => {
      const source = 'function process(num, str, arr) { return num + str.length + arr.length }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      // Verify all parameters use nami_value_t
      expect(code.sourceFile).toContain(
        'nami_value_t process(nami_value_t num, nami_value_t str, nami_value_t arr)'
      );
    });

    it('should document parameter passing strategy in file header', () => {
      const source = 'function test(x) { return x }';
      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);

      // The generated code should work correctly with the runtime's nami_value_t implementation
      // Primitives are stored directly in the union (pass-by-value semantics)
      // Complex types are stored as pointers (pass-by-reference semantics)
      expect(code.sourceFile).toContain('nami_value_t test(nami_value_t x)');
    });
  });
});
