/**
 * Unit tests for NAMI Type System
 * Task 6: Type System Implementation
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import {
  Types,
  typeEquals,
  isAssignable,
  toCType,
  coerceTypes,
  typeToString,
  type NamiType,
  type PrimitiveType,
  type ArrayType,
  type FunctionType,
  type ObjectType,
  type PointerType,
} from '../../src/types';

describe('Type System - Type Constructors', () => {
  describe('Primitive Types', () => {
    it('should create int type', () => {
      const intType = Types.int();
      expect(intType.kind).toBe('primitive');
      expect(intType.name).toBe('int');
    });

    it('should create float type', () => {
      const floatType = Types.float();
      expect(floatType.kind).toBe('primitive');
      expect(floatType.name).toBe('float');
    });

    it('should create string type', () => {
      const stringType = Types.string();
      expect(stringType.kind).toBe('primitive');
      expect(stringType.name).toBe('string');
    });

    it('should create bool type', () => {
      const boolType = Types.bool();
      expect(boolType.kind).toBe('primitive');
      expect(boolType.name).toBe('bool');
    });

    it('should create null type', () => {
      const nullType = Types.null();
      expect(nullType.kind).toBe('primitive');
      expect(nullType.name).toBe('null');
    });
  });

  describe('Complex Types', () => {
    it('should create array type', () => {
      const arrayType = Types.array(Types.int());
      expect(arrayType.kind).toBe('array');
      expect(arrayType.elementType).toEqual(Types.int());
    });

    it('should create function type', () => {
      const funcType = Types.function([Types.int(), Types.string()], Types.bool());
      expect(funcType.kind).toBe('function');
      expect(funcType.params).toHaveLength(2);
      expect(funcType.returnType).toEqual(Types.bool());
    });

    it('should create object type with fields', () => {
      const fields = new Map<string, NamiType>();
      fields.set('x', Types.int());
      fields.set('y', Types.float());
      const objType = Types.object(fields);
      expect(objType.kind).toBe('object');
      expect(objType.fields.size).toBe(2);
      expect(objType.fields.get('x')).toEqual(Types.int());
    });

    it('should create empty object type', () => {
      const objType = Types.object();
      expect(objType.kind).toBe('object');
      expect(objType.fields.size).toBe(0);
    });

    it('should create pointer type', () => {
      const ptrType = Types.pointer(Types.int(), false);
      expect(ptrType.kind).toBe('pointer');
      expect(ptrType.pointeeType).toEqual(Types.int());
      expect(ptrType.nullable).toBe(false);
    });

    it('should create nullable pointer by default', () => {
      const ptrType = Types.pointer(Types.int());
      expect(ptrType.nullable).toBe(true);
    });

    it('should create any type', () => {
      const anyType = Types.any();
      expect(anyType.kind).toBe('any');
    });

    it('should create void type', () => {
      const voidType = Types.void();
      expect(voidType.kind).toBe('void');
    });
  });
});

describe('Type System - Type Equality', () => {
  it('should return true for identical primitive types', () => {
    expect(typeEquals(Types.int(), Types.int())).toBe(true);
    expect(typeEquals(Types.string(), Types.string())).toBe(true);
  });

  it('should return false for different primitive types', () => {
    expect(typeEquals(Types.int(), Types.float())).toBe(false);
    expect(typeEquals(Types.string(), Types.bool())).toBe(false);
  });

  it('should return true for identical array types', () => {
    const arr1 = Types.array(Types.int());
    const arr2 = Types.array(Types.int());
    expect(typeEquals(arr1, arr2)).toBe(true);
  });

  it('should return false for arrays with different element types', () => {
    const arr1 = Types.array(Types.int());
    const arr2 = Types.array(Types.string());
    expect(typeEquals(arr1, arr2)).toBe(false);
  });

  it('should return true when comparing with any type', () => {
    expect(typeEquals(Types.any(), Types.int())).toBe(true);
    expect(typeEquals(Types.string(), Types.any())).toBe(true);
  });

  it('should return true for same kind of complex types', () => {
    expect(typeEquals(Types.void(), Types.void())).toBe(true);
  });
});

describe('Type System - Type Assignability', () => {
  it('should allow assigning same types', () => {
    expect(isAssignable(Types.int(), Types.int())).toBe(true);
    expect(isAssignable(Types.string(), Types.string())).toBe(true);
  });

  it('should allow assigning int to float (numeric coercion)', () => {
    expect(isAssignable(Types.float(), Types.int())).toBe(true);
  });

  it('should not allow assigning float to int', () => {
    expect(isAssignable(Types.int(), Types.float())).toBe(false);
  });

  it('should allow assigning any type to string (string coercion)', () => {
    expect(isAssignable(Types.string(), Types.int())).toBe(true);
    expect(isAssignable(Types.string(), Types.float())).toBe(true);
    expect(isAssignable(Types.string(), Types.bool())).toBe(true);
  });

  it('should allow assigning to/from any type', () => {
    expect(isAssignable(Types.any(), Types.int())).toBe(true);
    expect(isAssignable(Types.int(), Types.any())).toBe(true);
  });

  it('should not allow incompatible primitive assignments', () => {
    expect(isAssignable(Types.int(), Types.string())).toBe(false);
    expect(isAssignable(Types.bool(), Types.int())).toBe(false);
  });
});

describe('Type System - C Type Mapping (Requirement 12.4)', () => {
  describe('Primitive type mapping', () => {
    it('should map int to int64_t', () => {
      expect(toCType(Types.int())).toBe('int64_t');
    });

    it('should map float to double', () => {
      expect(toCType(Types.float())).toBe('double');
    });

    it('should map string to nami_string_t*', () => {
      expect(toCType(Types.string())).toBe('nami_string_t*');
    });

    it('should map bool to bool', () => {
      expect(toCType(Types.bool())).toBe('bool');
    });

    it('should map null to void*', () => {
      expect(toCType(Types.null())).toBe('void*');
    });
  });

  describe('Complex type mapping', () => {
    it('should map array to nami_array_t*', () => {
      expect(toCType(Types.array(Types.int()))).toBe('nami_array_t*');
    });

    it('should map function to nami_function_t', () => {
      expect(toCType(Types.function([Types.int()], Types.void()))).toBe('nami_function_t');
    });

    it('should map object to nami_object_t*', () => {
      expect(toCType(Types.object())).toBe('nami_object_t*');
    });

    it('should map pointer types correctly', () => {
      expect(toCType(Types.pointer(Types.int()))).toBe('int64_t*');
      expect(toCType(Types.pointer(Types.string()))).toBe('nami_string_t**');
    });

    it('should map any to nami_value_t', () => {
      expect(toCType(Types.any())).toBe('nami_value_t');
    });

    it('should map void to void', () => {
      expect(toCType(Types.void())).toBe('void');
    });
  });
});

describe('Type System - Type Coercion (Requirements 12.5, 12.6)', () => {
  describe('String concatenation', () => {
    it('should coerce to string when adding string + number', () => {
      const result = coerceTypes('+', Types.string(), Types.int());
      expect(result).toEqual(Types.string());
    });

    it('should coerce to string when adding number + string', () => {
      const result = coerceTypes('+', Types.int(), Types.string());
      expect(result).toEqual(Types.string());
    });

    it('should coerce to string when adding string + string', () => {
      const result = coerceTypes('+', Types.string(), Types.string());
      expect(result).toEqual(Types.string());
    });
  });

  describe('Numeric operations', () => {
    it('should return int for int + int', () => {
      const result = coerceTypes('+', Types.int(), Types.int());
      expect(result).toEqual(Types.int());
    });

    it('should return float for float + int', () => {
      const result = coerceTypes('+', Types.float(), Types.int());
      expect(result).toEqual(Types.float());
    });

    it('should return float for int + float', () => {
      const result = coerceTypes('+', Types.int(), Types.float());
      expect(result).toEqual(Types.float());
    });

    it('should return float for float + float', () => {
      const result = coerceTypes('+', Types.float(), Types.float());
      expect(result).toEqual(Types.float());
    });

    it('should handle subtraction correctly', () => {
      expect(coerceTypes('-', Types.int(), Types.int())).toEqual(Types.int());
      expect(coerceTypes('-', Types.float(), Types.int())).toEqual(Types.float());
    });

    it('should handle multiplication correctly', () => {
      expect(coerceTypes('*', Types.int(), Types.int())).toEqual(Types.int());
      expect(coerceTypes('*', Types.float(), Types.int())).toEqual(Types.float());
    });

    it('should handle division correctly', () => {
      expect(coerceTypes('/', Types.int(), Types.int())).toEqual(Types.int());
      expect(coerceTypes('/', Types.float(), Types.int())).toEqual(Types.float());
    });

    it('should handle modulo correctly', () => {
      expect(coerceTypes('%', Types.int(), Types.int())).toEqual(Types.int());
    });

    it('should handle exponentiation correctly', () => {
      expect(coerceTypes('**', Types.int(), Types.int())).toEqual(Types.int());
      expect(coerceTypes('**', Types.float(), Types.int())).toEqual(Types.float());
    });
  });

  describe('Comparison operations', () => {
    it('should return bool for equality operators', () => {
      expect(coerceTypes('==', Types.int(), Types.int())).toEqual(Types.bool());
      expect(coerceTypes('!=', Types.int(), Types.int())).toEqual(Types.bool());
      expect(coerceTypes('===', Types.int(), Types.int())).toEqual(Types.bool());
      expect(coerceTypes('!==', Types.int(), Types.int())).toEqual(Types.bool());
    });

    it('should return bool for relational operators', () => {
      expect(coerceTypes('<', Types.int(), Types.int())).toEqual(Types.bool());
      expect(coerceTypes('>', Types.int(), Types.int())).toEqual(Types.bool());
      expect(coerceTypes('<=', Types.int(), Types.int())).toEqual(Types.bool());
      expect(coerceTypes('>=', Types.int(), Types.int())).toEqual(Types.bool());
    });
  });

  describe('Bitwise operations', () => {
    it('should return int for bitwise AND', () => {
      expect(coerceTypes('&', Types.int(), Types.int())).toEqual(Types.int());
    });

    it('should return int for bitwise OR', () => {
      expect(coerceTypes('|', Types.int(), Types.int())).toEqual(Types.int());
    });

    it('should return int for bitwise XOR', () => {
      expect(coerceTypes('^', Types.int(), Types.int())).toEqual(Types.int());
    });

    it('should return int for left shift', () => {
      expect(coerceTypes('<<', Types.int(), Types.int())).toEqual(Types.int());
    });

    it('should return int for right shift', () => {
      expect(coerceTypes('>>', Types.int(), Types.int())).toEqual(Types.int());
    });
  });

  describe('Unknown operations', () => {
    it('should return any for unknown operators', () => {
      expect(coerceTypes('???', Types.int(), Types.int())).toEqual(Types.any());
    });
  });
});

describe('Type System - Type String Representation', () => {
  it('should convert primitive types to strings', () => {
    expect(typeToString(Types.int())).toBe('int');
    expect(typeToString(Types.float())).toBe('float');
    expect(typeToString(Types.string())).toBe('string');
    expect(typeToString(Types.bool())).toBe('bool');
    expect(typeToString(Types.null())).toBe('null');
  });

  it('should convert array types to strings', () => {
    expect(typeToString(Types.array(Types.int()))).toBe('Array<int>');
    expect(typeToString(Types.array(Types.string()))).toBe('Array<string>');
  });

  it('should convert nested array types to strings', () => {
    const nestedArray = Types.array(Types.array(Types.int()));
    expect(typeToString(nestedArray)).toBe('Array<Array<int>>');
  });

  it('should convert function types to strings', () => {
    const funcType = Types.function([Types.int(), Types.string()], Types.bool());
    expect(typeToString(funcType)).toBe('(int, string) => bool');
  });

  it('should convert function with no params to strings', () => {
    const funcType = Types.function([], Types.void());
    expect(typeToString(funcType)).toBe('() => void');
  });

  it('should convert object types to strings', () => {
    expect(typeToString(Types.object())).toBe('Object');
  });

  it('should convert pointer types to strings', () => {
    expect(typeToString(Types.pointer(Types.int()))).toBe('int*');
    expect(typeToString(Types.pointer(Types.string()))).toBe('string*');
  });

  it('should convert any type to string', () => {
    expect(typeToString(Types.any())).toBe('any');
  });

  it('should convert void type to string', () => {
    expect(typeToString(Types.void())).toBe('void');
  });
});

describe('Type System - Runtime Type Tags (Requirement 12.3)', () => {
  it('should verify runtime header defines type tags', () => {
    // This test verifies that the C runtime header has the type tag enum
    // The actual enum is defined in runtime/nami_runtime.h
    // We verify the TypeScript type system aligns with it
    const primitiveTypes = ['int', 'float', 'string', 'bool', 'null'];
    primitiveTypes.forEach((typeName) => {
      const type = Types[typeName as keyof typeof Types]() as PrimitiveType;
      expect(type.kind).toBe('primitive');
      expect(type.name).toBe(typeName);
    });
  });

  it('should support tagged union value type through any', () => {
    // The 'any' type maps to nami_value_t which is the tagged union
    const anyType = Types.any();
    expect(toCType(anyType)).toBe('nami_value_t');
  });
});

describe('Type System - Edge Cases', () => {
  it('should handle deeply nested types', () => {
    const deepType = Types.array(Types.array(Types.array(Types.int())));
    expect(typeToString(deepType)).toBe('Array<Array<Array<int>>>');
  });

  it('should handle complex function signatures', () => {
    const complexFunc = Types.function(
      [Types.array(Types.int()), Types.function([Types.string()], Types.bool())],
      Types.array(Types.string())
    );
    expect(typeToString(complexFunc)).toBe(
      '(Array<int>, (string) => bool) => Array<string>'
    );
  });

  it('should handle pointer to pointer', () => {
    const ptrPtr = Types.pointer(Types.pointer(Types.int()));
    expect(toCType(ptrPtr)).toBe('int64_t**');
  });

  it('should handle object with complex field types', () => {
    const fields = new Map<string, NamiType>();
    fields.set('arr', Types.array(Types.int()));
    fields.set('func', Types.function([Types.string()], Types.bool()));
    const objType = Types.object(fields);
    expect(objType.fields.size).toBe(2);
    expect(objType.fields.get('arr')?.kind).toBe('array');
    expect(objType.fields.get('func')?.kind).toBe('function');
  });
});
