/**
 * Unit tests for AST node types
 * Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 6.1, 6.2, 15.1, 16.1, 16.2
 */

import {
  ASTNode,
  NodeId,
  TypeInfo,
  Program,
  VariableDeclaration,
  FunctionDeclaration,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  ReturnStatement,
  BlockStatement,
  TryCatchStatement,
  ImportStatement,
  ExportStatement,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  MemberExpression,
  ArrayExpression,
  ObjectExpression,
  Identifier,
  NumericLiteral,
  StringLiteral,
  ArrowFunctionExpression,
  AwaitExpression,
} from '../../src/parser/ast';

describe('AST Node Types', () => {
  describe('Base ASTNode', () => {
    it('should have required type field', () => {
      const node: ASTNode = {
        type: 'TestNode',
      };
      expect(node.type).toBe('TestNode');
    });

    it('should support optional nodeId field', () => {
      const nodeId: NodeId = 42;
      const node: ASTNode = {
        type: 'TestNode',
        nodeId,
      };
      expect(node.nodeId).toBe(42);
    });

    it('should support optional span field', () => {
      const node: ASTNode = {
        type: 'TestNode',
        span: {
          start: { line: 1, column: 0, offset: 0 },
          end: { line: 1, column: 5, offset: 5 },
        },
      };
      expect(node.span).toBeDefined();
      expect(node.span?.start.line).toBe(1);
    });

    it('should support optional type_info field', () => {
      const typeInfo: TypeInfo = {
        type: 'number',
        inferred: true,
      };
      const node: ASTNode = {
        type: 'TestNode',
        type_info: typeInfo,
      };
      expect(node.type_info).toBeDefined();
      expect(node.type_info?.type).toBe('number');
      expect(node.type_info?.inferred).toBe(true);
    });
  });

  describe('Statement Types', () => {
    it('should create VariableDeclaration node', () => {
      const node: VariableDeclaration = {
        type: 'VariableDeclaration',
        kind: 'let',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'x' },
            init: { type: 'NumericLiteral', value: 42 },
          },
        ],
      };
      expect(node.type).toBe('VariableDeclaration');
      expect(node.kind).toBe('let');
      expect(node.declarations).toHaveLength(1);
    });

    it('should create FunctionDeclaration node', () => {
      const node: FunctionDeclaration = {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'add' },
        params: [
          { type: 'Parameter', name: 'a', rest: false },
          { type: 'Parameter', name: 'b', rest: false },
        ],
        body: { type: 'BlockStatement', body: [] },
        async: false,
        generator: false,
      };
      expect(node.type).toBe('FunctionDeclaration');
      expect(node.id.name).toBe('add');
      expect(node.params).toHaveLength(2);
      expect(node.async).toBe(false);
    });

    it('should create async FunctionDeclaration node', () => {
      const node: FunctionDeclaration = {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'fetchData' },
        params: [],
        body: { type: 'BlockStatement', body: [] },
        async: true,
        generator: false,
      };
      expect(node.async).toBe(true);
    });

    it('should create IfStatement node', () => {
      const node: IfStatement = {
        type: 'IfStatement',
        test: { type: 'BooleanLiteral', value: true },
        consequent: { type: 'BlockStatement', body: [] },
        alternate: null,
      };
      expect(node.type).toBe('IfStatement');
      expect(node.test).toBeDefined();
      expect(node.consequent).toBeDefined();
    });

    it('should create ForStatement node', () => {
      const node: ForStatement = {
        type: 'ForStatement',
        init: {
          type: 'VariableDeclaration',
          kind: 'let',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'i' },
              init: { type: 'NumericLiteral', value: 0 },
            },
          ],
        },
        test: {
          type: 'BinaryExpression',
          operator: '<',
          left: { type: 'Identifier', name: 'i' },
          right: { type: 'NumericLiteral', value: 10 },
        },
        update: {
          type: 'UpdateExpression',
          operator: '++',
          argument: { type: 'Identifier', name: 'i' },
          prefix: false,
        },
        body: { type: 'BlockStatement', body: [] },
      };
      expect(node.type).toBe('ForStatement');
      expect(node.init).toBeDefined();
      expect(node.test).toBeDefined();
      expect(node.update).toBeDefined();
    });

    it('should create WhileStatement node', () => {
      const node: WhileStatement = {
        type: 'WhileStatement',
        test: { type: 'BooleanLiteral', value: true },
        body: { type: 'BlockStatement', body: [] },
      };
      expect(node.type).toBe('WhileStatement');
      expect(node.test).toBeDefined();
    });

    it('should create DoWhileStatement node', () => {
      const node: DoWhileStatement = {
        type: 'DoWhileStatement',
        body: { type: 'BlockStatement', body: [] },
        test: { type: 'BooleanLiteral', value: true },
      };
      expect(node.type).toBe('DoWhileStatement');
      expect(node.body).toBeDefined();
      expect(node.test).toBeDefined();
    });

    it('should create ReturnStatement node', () => {
      const node: ReturnStatement = {
        type: 'ReturnStatement',
        argument: { type: 'NumericLiteral', value: 42 },
      };
      expect(node.type).toBe('ReturnStatement');
      expect(node.argument).toBeDefined();
    });

    it('should create BlockStatement node', () => {
      const node: BlockStatement = {
        type: 'BlockStatement',
        body: [
          {
            type: 'ReturnStatement',
            argument: { type: 'NumericLiteral', value: 42 },
          },
        ],
      };
      expect(node.type).toBe('BlockStatement');
      expect(node.body).toHaveLength(1);
    });

    it('should create TryCatchStatement node', () => {
      const node: TryCatchStatement = {
        type: 'TryCatchStatement',
        block: { type: 'BlockStatement', body: [] },
        handler: {
          type: 'CatchClause',
          param: { type: 'Identifier', name: 'error' },
          body: { type: 'BlockStatement', body: [] },
        },
        finalizer: null,
      };
      expect(node.type).toBe('TryCatchStatement');
      expect(node.block).toBeDefined();
      expect(node.handler).toBeDefined();
    });

    it('should create ImportStatement node', () => {
      const node: ImportStatement = {
        type: 'ImportStatement',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'foo' },
            local: { type: 'Identifier', name: 'foo' },
          },
        ],
        source: { type: 'StringLiteral', value: './module' },
      };
      expect(node.type).toBe('ImportStatement');
      expect(node.specifiers).toHaveLength(1);
    });

    it('should create ExportStatement node', () => {
      const node: ExportStatement = {
        type: 'ExportStatement',
        declaration: {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'foo' },
          params: [],
          body: { type: 'BlockStatement', body: [] },
          async: false,
          generator: false,
        },
        specifiers: [],
        default: false,
      };
      expect(node.type).toBe('ExportStatement');
      expect(node.declaration).toBeDefined();
    });
  });

  describe('Expression Types', () => {
    it('should create BinaryExpression node', () => {
      const node: BinaryExpression = {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'NumericLiteral', value: 1 },
        right: { type: 'NumericLiteral', value: 2 },
      };
      expect(node.type).toBe('BinaryExpression');
      expect(node.operator).toBe('+');
    });

    it('should create UnaryExpression node', () => {
      const node: UnaryExpression = {
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'NumericLiteral', value: 42 },
        prefix: true,
      };
      expect(node.type).toBe('UnaryExpression');
      expect(node.operator).toBe('-');
      expect(node.prefix).toBe(true);
    });

    it('should create CallExpression node', () => {
      const node: CallExpression = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'foo' },
        arguments: [
          { type: 'NumericLiteral', value: 1 },
          { type: 'NumericLiteral', value: 2 },
        ],
      };
      expect(node.type).toBe('CallExpression');
      expect(node.callee).toBeDefined();
      expect(node.arguments).toHaveLength(2);
    });

    it('should create MemberExpression node', () => {
      const node: MemberExpression = {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'obj' },
        property: { type: 'Identifier', name: 'prop' },
        computed: false,
        optional: false,
      };
      expect(node.type).toBe('MemberExpression');
      expect(node.computed).toBe(false);
    });

    it('should create ArrayExpression node', () => {
      const node: ArrayExpression = {
        type: 'ArrayExpression',
        elements: [
          { type: 'NumericLiteral', value: 1 },
          { type: 'NumericLiteral', value: 2 },
          { type: 'NumericLiteral', value: 3 },
        ],
      };
      expect(node.type).toBe('ArrayExpression');
      expect(node.elements).toHaveLength(3);
    });

    it('should create ObjectExpression node', () => {
      const node: ObjectExpression = {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'x' },
            value: { type: 'NumericLiteral', value: 42 },
            computed: false,
            shorthand: false,
          },
        ],
      };
      expect(node.type).toBe('ObjectExpression');
      expect(node.properties).toHaveLength(1);
    });

    it('should create Identifier node', () => {
      const node: Identifier = {
        type: 'Identifier',
        name: 'myVariable',
      };
      expect(node.type).toBe('Identifier');
      expect(node.name).toBe('myVariable');
    });

    it('should create NumericLiteral node', () => {
      const node: NumericLiteral = {
        type: 'NumericLiteral',
        value: 42,
      };
      expect(node.type).toBe('NumericLiteral');
      expect(node.value).toBe(42);
    });

    it('should create StringLiteral node', () => {
      const node: StringLiteral = {
        type: 'StringLiteral',
        value: 'hello',
      };
      expect(node.type).toBe('StringLiteral');
      expect(node.value).toBe('hello');
    });

    it('should create ArrowFunctionExpression node', () => {
      const node: ArrowFunctionExpression = {
        type: 'ArrowFunctionExpression',
        params: [{ type: 'Parameter', name: 'x', rest: false }],
        body: {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'Identifier', name: 'x' },
          right: { type: 'NumericLiteral', value: 2 },
        },
        async: false,
      };
      expect(node.type).toBe('ArrowFunctionExpression');
      expect(node.params).toHaveLength(1);
    });

    it('should create AwaitExpression node', () => {
      const node: AwaitExpression = {
        type: 'AwaitExpression',
        argument: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'fetchData' },
          arguments: [],
        },
      };
      expect(node.type).toBe('AwaitExpression');
      expect(node.argument).toBeDefined();
    });
  });

  describe('TypeInfo', () => {
    it('should create TypeInfo with inferred type', () => {
      const typeInfo: TypeInfo = {
        type: 'number',
        inferred: true,
      };
      expect(typeInfo.type).toBe('number');
      expect(typeInfo.inferred).toBe(true);
    });

    it('should create TypeInfo with explicit type', () => {
      const typeInfo: TypeInfo = {
        type: 'string',
        inferred: false,
      };
      expect(typeInfo.type).toBe('string');
      expect(typeInfo.inferred).toBe(false);
    });

    it('should support metadata in TypeInfo', () => {
      const typeInfo: TypeInfo = {
        type: 'Array<number>',
        inferred: true,
        metadata: {
          elementType: 'number',
          nullable: false,
        },
      };
      expect(typeInfo.metadata).toBeDefined();
      expect(typeInfo.metadata?.elementType).toBe('number');
    });
  });

  describe('Program node', () => {
    it('should create Program node with statements', () => {
      const program: Program = {
        type: 'Program',
        body: [
          {
            type: 'VariableDeclaration',
            kind: 'let',
            declarations: [
              {
                type: 'VariableDeclarator',
                id: { type: 'Identifier', name: 'x' },
                init: { type: 'NumericLiteral', value: 42 },
              },
            ],
          },
        ],
      };
      expect(program.type).toBe('Program');
      expect(program.body).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty BlockStatement', () => {
      const node: BlockStatement = {
        type: 'BlockStatement',
        body: [],
      };
      expect(node.body).toHaveLength(0);
    });

    it('should handle ReturnStatement without argument', () => {
      const node: ReturnStatement = {
        type: 'ReturnStatement',
        argument: null,
      };
      expect(node.argument).toBeNull();
    });

    it('should handle ForStatement with null init, test, and update', () => {
      const node: ForStatement = {
        type: 'ForStatement',
        init: null,
        test: null,
        update: null,
        body: { type: 'BlockStatement', body: [] },
      };
      expect(node.init).toBeNull();
      expect(node.test).toBeNull();
      expect(node.update).toBeNull();
    });

    it('should handle IfStatement with else branch', () => {
      const node: IfStatement = {
        type: 'IfStatement',
        test: { type: 'BooleanLiteral', value: true },
        consequent: { type: 'BlockStatement', body: [] },
        alternate: { type: 'BlockStatement', body: [] },
      };
      expect(node.alternate).toBeDefined();
    });
  });
});
