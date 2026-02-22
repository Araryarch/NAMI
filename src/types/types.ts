/**
 * NAMI Type System
 * Requirements: 12.1, 12.2, 12.4, 12.5, 12.6
 */

// ── Type Definitions ──────────────────────────────────

export type NamiType =
  | PrimitiveType
  | ArrayType
  | FunctionType
  | ObjectType
  | PointerType
  | AnyType
  | VoidType;

export interface PrimitiveType {
  kind: 'primitive';
  name: 'int' | 'float' | 'string' | 'bool' | 'null';
}

export interface ArrayType {
  kind: 'array';
  elementType: NamiType;
}

export interface FunctionType {
  kind: 'function';
  params: NamiType[];
  returnType: NamiType;
}

export interface ObjectType {
  kind: 'object';
  fields: Map<string, NamiType>;
}

export interface PointerType {
  kind: 'pointer';
  pointeeType: NamiType;
  nullable: boolean;
}

export interface AnyType {
  kind: 'any';
}

export interface VoidType {
  kind: 'void';
}

// ── Type Constructors ───────────────────────────────────

export const Types = {
  int: (): PrimitiveType => ({ kind: 'primitive', name: 'int' }),
  float: (): PrimitiveType => ({ kind: 'primitive', name: 'float' }),
  string: (): PrimitiveType => ({ kind: 'primitive', name: 'string' }),
  bool: (): PrimitiveType => ({ kind: 'primitive', name: 'bool' }),
  null: (): PrimitiveType => ({ kind: 'primitive', name: 'null' }),
  array: (elementType: NamiType): ArrayType => ({
    kind: 'array',
    elementType,
  }),
  function: (params: NamiType[], returnType: NamiType): FunctionType => ({
    kind: 'function',
    params,
    returnType,
  }),
  object: (fields?: Map<string, NamiType>): ObjectType => ({
    kind: 'object',
    fields: fields || new Map<string, NamiType>(),
  }),
  pointer: (pointeeType: NamiType, nullable = true): PointerType => ({
    kind: 'pointer',
    pointeeType,
    nullable,
  }),
  any: (): AnyType => ({ kind: 'any' }),
  void: (): VoidType => ({ kind: 'void' }),
};

// ── Type Utilities ──────────────────────────────────────

export function typeEquals(a: NamiType, b: NamiType): boolean {
  // Any type equals everything
  if (a.kind === 'any' || b.kind === 'any') return true;

  if (a.kind !== b.kind) return false;
  if (a.kind === 'primitive' && b.kind === 'primitive') {
    return a.name === b.name;
  }
  if (a.kind === 'array' && b.kind === 'array') {
    return typeEquals(a.elementType, b.elementType);
  }
  return a.kind === b.kind;
}

export function isAssignable(target: NamiType, source: NamiType): boolean {
  if (target.kind === 'any' || source.kind === 'any') return true;
  if (typeEquals(target, source)) return true;

  // Numeric coercion
  if (target.kind === 'primitive' && source.kind === 'primitive') {
    if (target.name === 'float' && source.name === 'int') return true;
    if (target.name === 'string') return true; // anything can become string
  }

  return false;
}

/** Get the C type string for a NAMI type */
export function toCType(type: NamiType): string {
  switch (type.kind) {
    case 'primitive':
      switch (type.name) {
        case 'int':
          return 'int64_t';
        case 'float':
          return 'double';
        case 'string':
          return 'nami_string_t*';
        case 'bool':
          return 'bool';
        case 'null':
          return 'void*';
      }
      break;
    case 'array':
      return 'nami_array_t*';
    case 'function':
      return 'nami_function_t';
    case 'object':
      return 'nami_object_t*';
    case 'pointer':
      return `${toCType(type.pointeeType)}*`;
    case 'any':
      return 'nami_value_t';
    case 'void':
      return 'void';
  }
}

/** Coerce types for binary operation following JS semantics */
export function coerceTypes(op: string, left: NamiType, right: NamiType): NamiType {
  // String concatenation
  if (op === '+') {
    if (
      (left.kind === 'primitive' && left.name === 'string') ||
      (right.kind === 'primitive' && right.name === 'string')
    ) {
      return Types.string();
    }
  }

  // Numeric operations
  if (['+', '-', '*', '/', '%', '**'].includes(op)) {
    if (left.kind === 'primitive' && right.kind === 'primitive') {
      if (left.name === 'float' || right.name === 'float') {
        return Types.float();
      }
      if (left.name === 'int' && right.name === 'int') {
        return Types.int();
      }
    }
  }

  // Comparison operators
  if (['==', '!=', '===', '!==', '<', '>', '<=', '>='].includes(op)) {
    return Types.bool();
  }

  // Bitwise operations
  if (['&', '|', '^', '<<', '>>'].includes(op)) {
    return Types.int();
  }

  return Types.any();
}

/** Get string representation of a type */
export function typeToString(type: NamiType): string {
  switch (type.kind) {
    case 'primitive':
      return type.name;
    case 'array':
      return `Array<${typeToString(type.elementType)}>`;
    case 'function':
      return `(${type.params.map(typeToString).join(', ')}) => ${typeToString(type.returnType)}`;
    case 'object':
      return 'Object';
    case 'pointer':
      return `${typeToString(type.pointeeType)}*`;
    case 'any':
      return 'any';
    case 'void':
      return 'void';
  }
}
