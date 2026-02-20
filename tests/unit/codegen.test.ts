/**
 * Code Generator Unit Tests
 * Requirements: 1.2, 1.4, 1.5, 3.1-3.6, 4.2, 4.3, 4.6, 5.1, 6.3-6.5, 13.1-13.4, 15.1-15.5
 */

import { CodeGenerator } from '../../src/codegen/codegen';
import { Parser } from '../../src/parser/parser';
import { Lexer } from '../../src/lexer/lexer';
import { SemanticAnalyzer } from '../../src/analyzer/semantic';

describe('Code Generator', () => {
  describe('Basic Code Generation', () => {
    it('should generate C code for variable declarations', () => {
      const lexer = new Lexer('let x = 42');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const analyzer = new SemanticAnalyzer();
      const { symbolTable } = analyzer.analyze(program);
      const generator = new CodeGenerator();
      const code = generator.generate(program, symbolTable);
      
      expect(code.sourceFile).toContain('int64_t x = 42LL');
    });

    it('should generate C code for string literals', () => {
      const lexer = new Lexer('let s = "hello"');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('nami_value_string("hello")');
    });

    it('should generate C code for boolean literals', () => {
      const lexer = new Lexer('let b = true');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('NAMI_TRUE');
    });
  });

  describe('Function Generation (Requirement 4.6)', () => {
    it('should generate C function with proper signature', () => {
      const lexer = new Lexer('function add(a, b) { return a + b }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('nami_value_t add(nami_value_t a, nami_value_t b)');
      expect(code.sourceFile).toContain('return nami_add(a, b)');
    });

    it('should generate function prototype in header', () => {
      const lexer = new Lexer('function test() { return 1 }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.headerFile).toContain('nami_value_t test(void);');
    });
  });

  describe('Control Flow Generation (Requirements 3.1-3.6)', () => {
    it('should generate if statement', () => {
      const lexer = new Lexer('if (x > 0) { print(x) }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('if (nami_truthy(');
    });

    it('should generate for loop with loop guard (Requirement 5.1)', () => {
      const lexer = new Lexer('for (let i = 0; i < 10; i++) { print(i) }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('while (nami_truthy(');
      expect(code.sourceFile).toContain('NAMI_LOOP_CHECK');
    });

    it('should generate while loop with loop guard', () => {
      const lexer = new Lexer('while (x > 0) { x = x - 1 }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('while (nami_truthy(');
      expect(code.sourceFile).toContain('NAMI_LOOP_CHECK');
    });
  });

  describe('Array Operations (Requirement 13.1-13.4)', () => {
    it('should generate array literal', () => {
      const lexer = new Lexer('let arr = [1, 2, 3]');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('nami_array_of');
    });
  });

  describe('Error Handling Generation (Requirements 15.1-15.5)', () => {
    it('should generate try-catch block', () => {
      const lexer = new Lexer('try { print(1) } catch (e) { print(e) }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('setjmp');
      expect(code.sourceFile).toContain('nami_error_context_t');
    });
  });

  describe('Code Structure', () => {
    it('should include runtime header', () => {
      const lexer = new Lexer('let x = 1');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('#include "nami_generated.h"');
      expect(code.headerFile).toContain('#include "nami_runtime.h"');
    });

    it('should generate header guards', () => {
      const lexer = new Lexer('let x = 1');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const code = generator.generate(program);
      
      expect(code.headerFile).toContain('#ifndef NAMI_GENERATED_H');
      expect(code.headerFile).toContain('#define NAMI_GENERATED_H');
      expect(code.headerFile).toContain('#endif // NAMI_GENERATED_H');
    });

    it('should generate main function', () => {
      const lexer = new Lexer('let x = 1');
      const parser = new Parser(lexer);
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
      const lexer = new Lexer('let x = 1');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator('debug');
      const code = generator.generate(program);
      
      expect(code.sourceFile).toContain('#define NAMI_DEBUG 1');
    });

    it('should disable loop guard in max optimization', () => {
      const lexer = new Lexer('while (true) { break }');
      const parser = new Parser(lexer);
      const program = parser.parse();
      const generator = new CodeGenerator('max');
      const code = generator.generate(program);
      
      expect(code.sourceFile).not.toContain('NAMI_LOOP_CHECK');
    });
  });
});
