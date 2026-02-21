/**
 * Parser Tests
 * Requirements: 1.1, 3.1-3.6, 4.1, 4.4
 */

import { Parser } from '../../src/parser/parser';
import {
  VariableDeclaration,
  FunctionDeclaration,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  SwitchStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  BinaryExpression,
  CallExpression,
  Identifier,
} from '../../src/parser/ast';

describe('Parser', () => {
  describe('parse()', () => {
    it('should parse an empty program', () => {
      const parser = new Parser('');
      const ast = parser.parse();
      expect(ast.type).toBe('Program');
      expect(ast.body).toEqual([]);
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse a simple variable declaration', () => {
      const parser = new Parser('let x = 42;');
      const ast = parser.parse();
      expect(ast.type).toBe('Program');
      expect(ast.body.length).toBe(1);
      const stmt = ast.body[0] as VariableDeclaration;
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.kind).toBe('let');
      expect(stmt.declarations.length).toBe(1);
      expect(stmt.declarations[0].id.type).toBe('Identifier');
      expect((stmt.declarations[0].id as Identifier).name).toBe('x');
    });

    it('should parse multiple statements', () => {
      const source = `
        let x = 10;
        const y = 20;
        var z = 30;
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      expect(ast.body.length).toBe(3);
      expect((ast.body[0] as VariableDeclaration).kind).toBe('let');
      expect((ast.body[1] as VariableDeclaration).kind).toBe('const');
      expect((ast.body[2] as VariableDeclaration).kind).toBe('var');
    });
  });

  describe('parse_statement() - Variable Declarations', () => {
    it('should parse let declaration', () => {
      const parser = new Parser('let x = 5;');
      const ast = parser.parse();
      const stmt = ast.body[0] as VariableDeclaration;
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.kind).toBe('let');
    });

    it('should parse const declaration', () => {
      const parser = new Parser('const PI = 3.14;');
      const ast = parser.parse();
      const stmt = ast.body[0] as VariableDeclaration;
      expect(stmt.type).toBe('VariableDeclaration');
      expect(stmt.kind).toBe('const');
    });

    it('should parse multiple declarations', () => {
      const parser = new Parser('let a = 1, b = 2, c = 3;');
      const ast = parser.parse();
      const stmt = ast.body[0] as VariableDeclaration;
      expect(stmt.declarations.length).toBe(3);
    });
  });

  describe('parse_statement() - Function Declarations', () => {
    it('should parse function declaration', () => {
      const parser = new Parser('function add(a, b) { return a + b; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as FunctionDeclaration;
      expect(stmt.type).toBe('FunctionDeclaration');
      expect(stmt.id.name).toBe('add');
      expect(stmt.params.length).toBe(2);
      expect(stmt.params[0].name).toBe('a');
      expect(stmt.params[1].name).toBe('b');
      expect(stmt.async).toBe(false);
    });

    it('should parse async function declaration', () => {
      const parser = new Parser('async function fetchData() { return await getData(); }');
      const ast = parser.parse();
      const stmt = ast.body[0] as FunctionDeclaration;
      expect(stmt.type).toBe('FunctionDeclaration');
      expect(stmt.async).toBe(true);
    });

    it('should parse NAMI fn keyword', () => {
      const parser = new Parser('fn greet(name) { return "Hello " + name; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as FunctionDeclaration;
      expect(stmt.type).toBe('FunctionDeclaration');
      expect(stmt.id.name).toBe('greet');
    });

    it('should parse await expression', () => {
      const parser = new Parser('async function test() { let x = await fetch(); }');
      const ast = parser.parse();
      const func = ast.body[0] as FunctionDeclaration;
      expect(func.async).toBe(true);
      const varDecl = func.body.body[0] as any;
      expect(varDecl.type).toBe('VariableDeclaration');
      const awaitExpr = varDecl.declarations[0].init;
      expect(awaitExpr.type).toBe('AwaitExpression');
      expect(awaitExpr.argument.type).toBe('CallExpression');
    });

    it('should parse async arrow function', () => {
      const parser = new Parser('const fetchData = async () => { return await getData(); };');
      const ast = parser.parse();
      const varDecl = ast.body[0] as any;
      const arrowFunc = varDecl.declarations[0].init;
      expect(arrowFunc.type).toBe('ArrowFunctionExpression');
      expect(arrowFunc.async).toBe(true);
    });
  });

  describe('parse_statement() - Error Handling', () => {
    it('should parse try-catch block', () => {
      const parser = new Parser('try { riskyOperation(); } catch (e) { handleError(e); }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('TryCatchStatement');
      expect(stmt.block.type).toBe('BlockStatement');
      expect(stmt.handler).not.toBeNull();
      expect(stmt.handler.param?.name).toBe('e');
      expect(stmt.handler.body.type).toBe('BlockStatement');
      expect(stmt.finalizer).toBeNull();
    });

    it('should parse try-finally block', () => {
      const parser = new Parser('try { doSomething(); } finally { cleanup(); }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('TryCatchStatement');
      expect(stmt.block.type).toBe('BlockStatement');
      expect(stmt.handler).toBeNull();
      expect(stmt.finalizer).not.toBeNull();
      expect(stmt.finalizer.type).toBe('BlockStatement');
    });

    it('should parse try-catch-finally block', () => {
      const parser = new Parser('try { riskyOp(); } catch (err) { log(err); } finally { cleanup(); }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('TryCatchStatement');
      expect(stmt.block.type).toBe('BlockStatement');
      expect(stmt.handler).not.toBeNull();
      expect(stmt.handler.param?.name).toBe('err');
      expect(stmt.finalizer).not.toBeNull();
      expect(stmt.finalizer.type).toBe('BlockStatement');
    });

    it('should parse catch without parameter', () => {
      const parser = new Parser('try { test(); } catch { handleError(); }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('TryCatchStatement');
      expect(stmt.handler).not.toBeNull();
      expect(stmt.handler.param).toBeNull();
    });

    it('should parse nested try-catch blocks', () => {
      const source = `
        try {
          try {
            innerOp();
          } catch (inner) {
            handleInner(inner);
          }
        } catch (outer) {
          handleOuter(outer);
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const outerTry = ast.body[0] as any;
      expect(outerTry.type).toBe('TryCatchStatement');
      const innerTry = outerTry.block.body[0];
      expect(innerTry.type).toBe('TryCatchStatement');
    });
  });

  describe('parse_statement() - Control Flow', () => {
    it('should parse if statement', () => {
      const parser = new Parser('if (x > 0) { return x; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as IfStatement;
      expect(stmt.type).toBe('IfStatement');
      expect(stmt.test.type).toBe('BinaryExpression');
      expect(stmt.consequent.type).toBe('BlockStatement');
      expect(stmt.alternate).toBeNull();
    });

    it('should parse if-else statement', () => {
      const parser = new Parser('if (x > 0) { return x; } else { return -x; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as IfStatement;
      expect(stmt.type).toBe('IfStatement');
      expect(stmt.alternate).not.toBeNull();
      expect(stmt.alternate?.type).toBe('BlockStatement');
    });

    it('should parse for loop', () => {
      const parser = new Parser('for (let i = 0; i < 10; i++) { sum += i; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as ForStatement;
      expect(stmt.type).toBe('ForStatement');
      expect(stmt.init?.type).toBe('VariableDeclaration');
      expect(stmt.test?.type).toBe('BinaryExpression');
      expect(stmt.update?.type).toBe('UpdateExpression');
    });

    it('should parse while loop', () => {
      const parser = new Parser('while (x < 100) { x *= 2; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as WhileStatement;
      expect(stmt.type).toBe('WhileStatement');
      expect(stmt.test.type).toBe('BinaryExpression');
    });

    it('should parse do-while loop', () => {
      const parser = new Parser('do { x++; } while (x < 10);');
      const ast = parser.parse();
      const stmt = ast.body[0] as DoWhileStatement;
      expect(stmt.type).toBe('DoWhileStatement');
      expect(stmt.body.type).toBe('BlockStatement');
      expect(stmt.test.type).toBe('BinaryExpression');
    });

    it('should parse switch statement', () => {
      const source = `
        switch (x) {
          case 1:
            return "one";
          case 2:
            return "two";
          default:
            return "other";
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as SwitchStatement;
      expect(stmt.type).toBe('SwitchStatement');
      expect(stmt.cases.length).toBe(3);
      expect(stmt.cases[0].test).not.toBeNull();
      expect(stmt.cases[2].test).toBeNull(); // default case
    });

    it('should parse break statement', () => {
      const parser = new Parser('break;');
      const ast = parser.parse();
      const stmt = ast.body[0] as BreakStatement;
      expect(stmt.type).toBe('BreakStatement');
    });

    it('should parse continue statement', () => {
      const parser = new Parser('continue;');
      const ast = parser.parse();
      const stmt = ast.body[0] as ContinueStatement;
      expect(stmt.type).toBe('ContinueStatement');
    });

    it('should parse return statement', () => {
      const parser = new Parser('return 42;');
      const ast = parser.parse();
      const stmt = ast.body[0] as ReturnStatement;
      expect(stmt.type).toBe('ReturnStatement');
      expect(stmt.argument).not.toBeNull();
    });
  });

  describe('parse_expression() - Operator Precedence', () => {
    it('should parse addition', () => {
      const parser = new Parser('x + y;');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression as BinaryExpression;
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
    });

    it('should parse multiplication with higher precedence than addition', () => {
      const parser = new Parser('a + b * c;');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression as BinaryExpression;
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('+');
      expect((expr.right as BinaryExpression).operator).toBe('*');
    });

    it('should parse exponentiation with right associativity', () => {
      const parser = new Parser('2 ** 3 ** 2;');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression as BinaryExpression;
      expect(expr.type).toBe('BinaryExpression');
      expect(expr.operator).toBe('**');
      expect((expr.right as BinaryExpression).operator).toBe('**');
    });

    it('should parse comparison operators', () => {
      const parser = new Parser('x < y;');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression as BinaryExpression;
      expect(expr.operator).toBe('<');
    });

    it('should parse logical operators', () => {
      const parser = new Parser('a && b || c;');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression;
      expect(expr.type).toBe('LogicalExpression');
      expect(expr.operator).toBe('||');
    });

    it('should parse function calls', () => {
      const parser = new Parser('foo(1, 2, 3);');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression as CallExpression;
      expect(expr.type).toBe('CallExpression');
      expect(expr.arguments.length).toBe(3);
    });

    it('should parse member access', () => {
      const parser = new Parser('obj.prop;');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression;
      expect(expr.type).toBe('MemberExpression');
      expect(expr.computed).toBe(false);
    });

    it('should parse computed member access', () => {
      const parser = new Parser('arr[0];');
      const ast = parser.parse();
      const expr = (ast.body[0] as any).expression;
      expect(expr.type).toBe('MemberExpression');
      expect(expr.computed).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should collect errors without throwing', () => {
      const parser = new Parser('let x = ;'); // Invalid syntax
      parser.parse();
      expect(parser.getErrors().length).toBeGreaterThan(0);
    });

    it('should synchronize after error', () => {
      const source = `
        let x = ;
        let y = 10;
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      expect(parser.getErrors().length).toBeGreaterThan(0);
      // Should still parse the second statement
      expect(ast.body.length).toBeGreaterThan(0);
    });

    it('should synchronize on semicolons', () => {
      const source = `
        let x = ;
        let y = 20;
        let z = 30;
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const errors = parser.getErrors();
      
      // Should have one error for the invalid statement
      expect(errors.length).toBeGreaterThan(0);
      
      // Should still parse valid statements after error
      expect(ast.body.length).toBeGreaterThan(1);
    });

    it('should synchronize on braces', () => {
      const source = `
        function bad( {
          let x = 10;
        }
        function good() {
          let y = 20;
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const errors = parser.getErrors();
      
      // Should have errors for the bad function
      expect(errors.length).toBeGreaterThan(0);
      
      // Should still parse the good function
      expect(ast.body.length).toBeGreaterThan(0);
    });

    it('should collect multiple errors in one pass', () => {
      const source = `
        let x = ;
        function bad( {
          return;
        }
        let y = ;
        let z = 30;
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const errors = parser.getErrors();
      
      // Should collect multiple errors
      expect(errors.length).toBeGreaterThanOrEqual(2);
      
      // Should still parse valid statements
      expect(ast.body.length).toBeGreaterThan(0);
    });

    it('should provide descriptive error messages with line and column numbers', () => {
      const source = `let x = ;`;
      const parser = new Parser(source);
      parser.parse();
      const errors = parser.getErrors();
      
      expect(errors.length).toBeGreaterThan(0);
      const error = errors[0];
      
      // Error should have line and column information
      expect(error.line).toBeGreaterThan(0);
      expect(error.column).toBeGreaterThan(0);
      
      // Error should have a descriptive message
      expect(error.message).toBeTruthy();
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should synchronize on statement keywords', () => {
      const source = `
        let x = ;
        if (true) {
          let a = 1;
        }
        for (let i = 0; i < 10; i++) {
          let b = 2;
        }
        while (true) {
          break;
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const errors = parser.getErrors();
      
      // Should have one error for invalid let statement
      expect(errors.length).toBeGreaterThan(0);
      
      // Should parse all valid statements after error
      expect(ast.body.length).toBeGreaterThan(1);
    });

    it('should handle nested block errors', () => {
      const source = `
        function outer() {
          let x = ;
          function inner() {
            let y = 10;
          }
          let z = 20;
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const errors = parser.getErrors();
      
      // Should have error for invalid statement
      expect(errors.length).toBeGreaterThan(0);
      
      // Should still parse the outer function (and possibly recovered statements)
      expect(ast.body.length).toBeGreaterThanOrEqual(1);
      expect(ast.body[0].type).toBe('FunctionDeclaration');
    });

    it('should synchronize on NAMI-specific keywords', () => {
      const source = `
        let x = ;
        loop {
          break;
        }
        print("hello");
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      const errors = parser.getErrors();
      
      // Should have error for invalid let
      expect(errors.length).toBeGreaterThan(0);
      
      // Should parse NAMI-specific statements
      expect(ast.body.length).toBeGreaterThan(1);
    });
  });

  describe('parse_statement() - Module System', () => {
    it('should parse NAMI-style bare import', () => {
      const parser = new Parser('import nm;');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('NamiImportStatement');
      expect(stmt.module.name).toBe('nm');
    });

    it('should parse named imports', () => {
      const parser = new Parser('import { foo, bar } from "./module";');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ImportStatement');
      expect(stmt.specifiers.length).toBe(2);
      expect(stmt.specifiers[0].imported.name).toBe('foo');
      expect(stmt.specifiers[0].local.name).toBe('foo');
      expect(stmt.specifiers[1].imported.name).toBe('bar');
      expect(stmt.source.value).toBe('./module');
    });

    it('should parse named imports with aliases', () => {
      const parser = new Parser('import { foo as f, bar as b } from "./module";');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ImportStatement');
      expect(stmt.specifiers.length).toBe(2);
      expect(stmt.specifiers[0].imported.name).toBe('foo');
      expect(stmt.specifiers[0].local.name).toBe('f');
      expect(stmt.specifiers[1].imported.name).toBe('bar');
      expect(stmt.specifiers[1].local.name).toBe('b');
    });

    it('should parse export function declaration', () => {
      const parser = new Parser('export function add(a, b) { return a + b; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('FunctionDeclaration');
      expect(stmt.declaration.id.name).toBe('add');
      expect(stmt.default).toBe(false);
    });

    it('should parse export default function', () => {
      const parser = new Parser('export default function main() { return 0; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('FunctionDeclaration');
      expect(stmt.default).toBe(true);
    });

    it('should parse export variable declaration', () => {
      const parser = new Parser('export const PI = 3.14;');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('VariableDeclaration');
      expect(stmt.default).toBe(false);
    });

    it('should parse export async function', () => {
      const parser = new Parser('export async function fetchData() { return await getData(); }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('FunctionDeclaration');
      expect(stmt.declaration.async).toBe(true);
    });

    it('should parse export with NAMI fn keyword', () => {
      const parser = new Parser('export fn greet(name) { return "Hello " + name; }');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('FunctionDeclaration');
      expect(stmt.declaration.id.name).toBe('greet');
    });

    it('should parse export expression', () => {
      const parser = new Parser('export 42;');
      const ast = parser.parse();
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('ExpressionStatement');
    });

    it('should parse multiple imports and exports', () => {
      const source = `
        import { foo } from "./foo";
        import { bar } from "./bar";
        export function baz() { return foo() + bar(); }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      expect(ast.body.length).toBe(3);
      expect(ast.body[0].type).toBe('ImportStatement');
      expect(ast.body[1].type).toBe('ImportStatement');
      expect(ast.body[2].type).toBe('ExportStatement');
    });
  });

  describe('Complex programs', () => {
    it('should parse a complete function with control flow', () => {
      const source = `
        function factorial(n) {
          if (n <= 1) {
            return 1;
          }
          return n * factorial(n - 1);
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      expect(ast.body.length).toBe(1);
      const func = ast.body[0] as FunctionDeclaration;
      expect(func.type).toBe('FunctionDeclaration');
      expect(func.id.name).toBe('factorial');
      expect(func.body.body.length).toBe(2); // if statement and return
    });

    it('should parse nested control structures', () => {
      const source = `
        for (let i = 0; i < 10; i++) {
          if (i % 2 === 0) {
            continue;
          }
          sum += i;
        }
      `;
      const parser = new Parser(source);
      const ast = parser.parse();
      expect(ast.body.length).toBe(1);
      const forLoop = ast.body[0] as ForStatement;
      expect(forLoop.type).toBe('ForStatement');
    });
  });
});
