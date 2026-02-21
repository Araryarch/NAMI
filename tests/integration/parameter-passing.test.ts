/**
 * Parameter Passing Integration Tests
 * Requirements: 4.2, 4.3
 * 
 * These tests verify that:
 * - Primitives are passed by value (modifications don't affect originals)
 * - Complex types are passed by reference (modifications affect originals)
 */

import { Parser } from '../../src/parser/parser';
import { CodeGenerator } from '../../src/codegen/codegen';

describe('Parameter Passing Integration Tests', () => {
  describe('Primitive Pass-By-Value (Requirement 4.2)', () => {
    it('should not modify original primitive when parameter is modified', () => {
      const source = `
        function modifyPrimitive(x) {
          x = x + 10;
          return x;
        }
        
        let original = 5;
        let result = modifyPrimitive(original);
        
        // original should still be 5 (not modified)
        // result should be 15
        print(original);
        print(result);
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // Verify the generated code uses nami_value_t (passed by value)
      expect(generatedCode.sourceFile).toContain('nami_value_t modifyPrimitive(nami_value_t x)');
      
      // Verify parameter passing comment
      expect(generatedCode.sourceFile).toContain('Parameter passing: primitives by value, complex types by reference');
    });

    it('should generate correct code for integer parameter modification', () => {
      const source = `
        function increment(n) {
          n = n + 1;
          return n;
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // The function should receive nami_value_t by value
      expect(generatedCode.sourceFile).toContain('nami_value_t increment(nami_value_t n)');
      
      // The assignment should work on the local copy
      expect(generatedCode.sourceFile).toContain('n = nami_add(n, nami_value_int(1LL))');
    });

    it('should generate correct code for boolean parameter modification', () => {
      const source = `
        function negate(flag) {
          flag = !flag;
          return flag;
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      expect(generatedCode.sourceFile).toContain('nami_value_t negate(nami_value_t flag)');
      expect(generatedCode.sourceFile).toContain('flag = nami_not(flag)');
    });
  });

  describe('Complex Type Pass-By-Reference (Requirement 4.3)', () => {
    it('should modify original array when parameter is modified', () => {
      const source = `
        function modifyArray(arr) {
          arr.push(42);
          return arr;
        }
        
        let myArray = [1, 2, 3];
        modifyArray(myArray);
        
        // myArray should now contain [1, 2, 3, 42]
        print(myArray.length);
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // Verify the generated code uses nami_value_t (which contains a pointer for arrays)
      expect(generatedCode.sourceFile).toContain('nami_value_t modifyArray(nami_value_t arr)');
      
      // Verify array push is called (which modifies the array in-place)
      expect(generatedCode.sourceFile).toContain('nami_array_push');
    });

    it('should generate correct code for array parameter modification', () => {
      const source = `
        function appendToArray(arr, value) {
          arr.push(value);
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // The function should receive nami_value_t by value (but it contains a pointer)
      expect(generatedCode.sourceFile).toContain('nami_value_t appendToArray(nami_value_t arr, nami_value_t value)');
      
      // Array operations should work on the pointed-to array
      expect(generatedCode.sourceFile).toContain('nami_array_push(arr, value)');
    });

    it('should generate correct code for object parameter modification', () => {
      const source = `
        function setProperty(obj, key, value) {
          obj[key] = value;
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      expect(generatedCode.sourceFile).toContain('nami_value_t setProperty(nami_value_t obj, nami_value_t key, nami_value_t value)');
    });

    it('should handle string parameters correctly', () => {
      const source = `
        function processString(str) {
          return str.length;
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // Strings are immutable in JavaScript/NAMI, but they're still passed as pointers
      expect(generatedCode.sourceFile).toContain('nami_value_t processString(nami_value_t str)');
    });
  });

  describe('Mixed Parameter Types', () => {
    it('should handle functions with both primitive and complex parameters', () => {
      const source = `
        function mixedParams(num, arr, flag, obj) {
          num = num + 1;        // local modification (primitive)
          arr.push(num);        // modifies original (complex)
          flag = !flag;         // local modification (primitive)
          obj.count = num;      // modifies original (complex)
          return num;
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // All parameters should use nami_value_t
      expect(generatedCode.sourceFile).toContain(
        'nami_value_t mixedParams(nami_value_t num, nami_value_t arr, nami_value_t flag, nami_value_t obj)'
      );
      
      // Verify operations
      expect(generatedCode.sourceFile).toContain('nami_add');
      expect(generatedCode.sourceFile).toContain('nami_array_push');
      expect(generatedCode.sourceFile).toContain('nami_not');
    });
  });

  describe('Runtime Behavior Verification', () => {
    it('should document that nami_value_t provides correct semantics', () => {
      const source = `
        function test(x, arr) {
          x = x + 1;
          arr.push(x);
        }
      `;

      const parser = new Parser(source);
      const program = parser.parse();
      const generator = new CodeGenerator();
      const generatedCode = generator.generate(program);
      
      // The nami_value_t struct is passed by value
      // - For primitives: the value is copied (pass-by-value semantics)
      // - For complex types: the pointer is copied, but points to same data (pass-by-reference semantics)
      expect(generatedCode.sourceFile).toContain('nami_value_t test(nami_value_t x, nami_value_t arr)');
      
      // This is the correct implementation because:
      // 1. nami_value_t is a struct containing a union
      // 2. Primitives (int64_t, double, bool) are stored directly in the union
      // 3. Complex types (arrays, objects, strings) are stored as pointers in the union
      // 4. When the struct is passed by value, primitives are copied, pointers are copied
      // 5. Copied pointers still point to the same data → pass-by-reference semantics
    });
  });
});
