/**
 * NAMI Code Generator - Generates C code from AST
 * Requirements: 1.2, 1.4, 1.5, 4.2, 4.3, 4.6
 *
 * Parameter Passing Strategy (Requirements 4.2 & 4.3):
 * - All parameters are passed as nami_value_t (a tagged union struct)
 * - The nami_value_t struct itself is passed by value
 * - Primitives (int, float, bool, null) are stored directly in the union
 *   → Modifications inside functions don't affect originals (pass-by-value semantics)
 * - Complex types (arrays, objects, strings) are stored as pointers in the union
 *   → Modifications inside functions affect originals (pass-by-reference semantics)
 */

import {
  Program,
  Statement,
  Expression,
  VariableDeclaration,
  FunctionDeclaration,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  SwitchStatement,
  TryCatchStatement,
  ReturnStatement,
  BlockStatement,
  ForInStatement,
  ForOfStatement,
  ImportStatement,
  LoopStatement,
  PrintStatement,
  NamiImportStatement,
  RangeExpression,
} from '../parser/ast';
import { SymbolTable } from '../analyzer/semantic';
import { resolveNmMethod } from '../features/nm-module';
import { isBuiltinModule } from '../features/module-system';

export interface GeneratedCode {
  sourceFile: string;
  headerFile: string;
  runtimeIncludes: string[];
}

export class CodeGenerator {
  private output: string[] = [];
  private headerOutput: string[] = [];
  private indent = 0;
  private lambdaCount = 0;
  private lambdas: string[] = [];
  private tempVarCount = 0;
  private symbolTable: SymbolTable | null = null;
  private loopDepth = 0;
  private enableLoopGuard = true;

  constructor(private optimizationLevel: 'debug' | 'release' | 'max' = 'debug') {
    this.enableLoopGuard = optimizationLevel !== 'max';
  }

  /** Generate C code from a program AST */
  generate(program: Program, symbolTable?: SymbolTable): GeneratedCode {
    this.output = [];
    this.headerOutput = [];
    this.lambdas = [];
    this.lambdaCount = 0;
    this.tempVarCount = 0;
    this.indent = 0;
    this.loopDepth = 0;
    this.symbolTable = symbolTable || null;

    // Use symbol table info for optimization decisions
    const hasMainFunc =
      this.symbolTable &&
      program.body.some((s) => s.type === 'FunctionDeclaration' && s.id.name === 'main');

    // For single-file output, include runtime directly in source
    this.emit('// NAMI Runtime - Inline');
    this.emit('#include <stdio.h>');
    this.emit('#include <stdlib.h>');
    this.emit('#include <string.h>');
    this.emit('#include <stdint.h>');
    this.emit('#include <stdbool.h>');
    this.emit('#include <stdarg.h>');
    this.emit('#include <math.h>');
    this.emit('#include <setjmp.h>');
    this.emit('');
    this.emit('// Runtime will be included here by the build process');
    this.emit('#include "nami_runtime.h"');
    this.emit('');

    // Optimization level defines
    if (this.optimizationLevel === 'debug') {
      this.emit('#define NAMI_DEBUG 1');
    }
    this.emit('');

    // Generate global declarations
    this.emit('// Global variables');
    this.emit('static nami_gc_t nami_gc;');
    this.emit('static nami_loop_guard_t nami_loop_guard = {0, 1000000, true};');
    this.emit('');

    // First pass: collect function declarations (forward declarations)
    this.emit('// Forward declarations');
    for (const stmt of program.body) {
      if (stmt.type === 'FunctionDeclaration') {
        const name = this.sanitizeIdentifier(stmt.id.name);
        const params = stmt.params
          .map((p) => `nami_value_t ${this.sanitizeIdentifier(p.name)}`)
          .join(', ');
        this.emit(`nami_value_t ${name}(${params || 'void'});`);
      }
    }

    this.emit('');
    this.emit('// Lambda functions');

    // Generate body
    const mainStatements: Statement[] = [];
    for (const stmt of program.body) {
      if (stmt.type === 'FunctionDeclaration') {
        this.generateStatement(stmt);
      } else {
        mainStatements.push(stmt);
      }
    }

    // Append lambdas
    for (const lambda of this.lambdas) {
      this.output.push(lambda);
    }

    // Generate main function (skip if user defined their own)
    if (!hasMainFunc) {
      this.emit('');
      this.emit('int main(int argc, char** argv) {');
      this.indent++;
      this.emitLine('(void)argc; (void)argv;');
      this.emitLine('nami_gc_init(&nami_gc);');
      this.emitLine('');

      for (const stmt of mainStatements) {
        this.generateStatement(stmt);
      }

      this.emitLine('');
      this.emitLine('nami_gc_collect(&nami_gc);');
      this.emitLine('return 0;');
      this.indent--;
      this.emit('}');
    } else {
      // User has a main function, just emit top-level statements
      for (const stmt of mainStatements) {
        this.generateStatement(stmt);
      }
    }

    // For backward compatibility, still generate header output
    this.headerOutput.push('#ifndef NAMI_GENERATED_H');
    this.headerOutput.push('#define NAMI_GENERATED_H');
    this.headerOutput.push('');
    this.headerOutput.push('#include "nami_runtime.h"');
    this.headerOutput.push('');
    this.headerOutput.push('#endif // NAMI_GENERATED_H');

    return {
      sourceFile: this.output.join('\n'),
      headerFile: this.headerOutput.join('\n'),
      runtimeIncludes: ['nami_runtime.h'],
    };
  }

  // ── Statement Generation ──────────────────────────────

  private generateStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'VariableDeclaration':
        this.generateVariableDeclaration(stmt);
        break;
      case 'FunctionDeclaration':
        this.generateFunctionDeclaration(stmt);
        break;
      case 'IfStatement':
        this.generateIfStatement(stmt);
        break;
      case 'ForStatement':
        this.generateForStatement(stmt);
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        this.generateForInOfStatement(stmt);
        break;
      case 'WhileStatement':
        this.generateWhileStatement(stmt);
        break;
      case 'DoWhileStatement':
        this.generateDoWhileStatement(stmt);
        break;
      case 'ReturnStatement':
        this.generateReturnStatement(stmt);
        break;
      case 'BreakStatement':
        this.emitLine('break;');
        break;
      case 'ContinueStatement':
        this.emitLine('continue;');
        break;
      case 'SwitchStatement':
        this.generateSwitchStatement(stmt);
        break;
      case 'BlockStatement':
        this.generateBlockStatement(stmt);
        break;
      case 'ExpressionStatement':
        this.emitLine(`${this.generateExpression(stmt.expression)};`);
        break;
      case 'TryCatchStatement':
        this.generateTryCatch(stmt);
        break;
      case 'ThrowStatement':
        this.emitLine(`nami_throw(${this.generateExpression(stmt.argument)});`);
        break;
      case 'ImportStatement':
        this.generateImport(stmt);
        break;
      case 'NamiImportStatement':
        this.generateNamiImport(stmt);
        break;
      case 'ExportStatement':
        if (stmt.declaration) this.generateStatement(stmt.declaration);
        break;
      case 'LoopStatement':
        this.generateLoopStatement(stmt);
        break;
      case 'PrintStatement':
        this.generatePrintStatement(stmt);
        break;
      case 'EmptyStatement':
        break;
      case 'ClassDeclaration':
        this.emitLine(`// Class ${stmt.id.name} - TODO: generate struct`);
        break;
    }
  }

  private generateVariableDeclaration(decl: VariableDeclaration): void {
    for (const declarator of decl.declarations) {
      if (declarator.id.type === 'Identifier') {
        const name = this.sanitizeIdentifier(declarator.id.name);
        if (declarator.init) {
          const initExpr = this.generateExpression(declarator.init);
          const cType = this.inferCType(declarator.init);
          if (decl.kind === 'const') {
            this.emitLine(`const ${cType} ${name} = ${initExpr};`);
          } else {
            this.emitLine(`${cType} ${name} = ${initExpr};`);
          }
        } else {
          this.emitLine(`nami_value_t ${name} = NAMI_NULL;`);
        }
      }
    }
  }

  private generateFunctionDeclaration(decl: FunctionDeclaration): void {
    const name = this.sanitizeIdentifier(decl.id.name);

    // Generate parameter list
    // Requirements 4.2 & 4.3: Parameter passing semantics
    // - Primitives (int, float, bool, null) are passed by value (stored directly in nami_value_t)
    // - Complex types (arrays, objects, strings) are passed by reference (pointers stored in nami_value_t)
    // The nami_value_t struct is passed by value, but contains pointers for complex types
    const params = decl.params
      .map((p) => `nami_value_t ${this.sanitizeIdentifier(p.name)}`)
      .join(', ');

    this.emit('');
    this.emit(`// Function: ${name}`);
    this.emit(`// Parameter passing: primitives by value, complex types by reference`);
    this.emit(`nami_value_t ${name}(${params || 'void'}) {`);
    this.indent++;

    for (const stmt of decl.body.body) {
      this.generateStatement(stmt);
    }

    // Ensure function always returns something
    this.emitLine('return NAMI_NULL;');
    this.indent--;
    this.emit('}');
  }

  private generateIfStatement(stmt: IfStatement): void {
    const condition = this.generateExpression(stmt.test);
    this.emitLine(`if (nami_truthy(${condition})) {`);
    this.indent++;
    this.generateStatement(stmt.consequent);
    this.indent--;
    if (stmt.alternate) {
      this.emitLine('} else {');
      this.indent++;
      this.generateStatement(stmt.alternate);
      this.indent--;
    }
    this.emitLine('}');
  }

  private generateForStatement(stmt: ForStatement): void {
    this.emitLine('{');
    this.indent++;

    // Init
    if (stmt.init) {
      if (stmt.init.type === 'VariableDeclaration') {
        this.generateVariableDeclaration(stmt.init);
      } else {
        this.emitLine(`${this.generateExpression(stmt.init)};`);
      }
    }

    const test = stmt.test ? `nami_truthy(${this.generateExpression(stmt.test)})` : '1';
    const update = stmt.update ? this.generateExpression(stmt.update) : '';

    this.emitLine(`while (${test}) {`);
    this.indent++;
    this.loopDepth++;

    if (this.enableLoopGuard) {
      this.emitLine('NAMI_LOOP_CHECK(&nami_loop_guard);');
    }

    this.generateStatement(stmt.body);

    if (update) {
      this.emitLine(`${update};`);
    }

    this.loopDepth--;
    this.indent--;
    this.emitLine('}');
    this.indent--;
    this.emitLine('}');
  }

  private generateForInOfStatement(stmt: ForInStatement | ForOfStatement): void {
    // Simplified: generate as a comment since we need runtime support
    this.emitLine('// for-in/for-of - requires runtime array iteration');
    const right = this.generateExpression(stmt.right);
    this.emitLine(`{`);
    this.indent++;
    this.emitLine(`nami_array_t* __iter = nami_to_array(${right});`);
    this.emitLine('for (int64_t __i = 0; __i < __iter->length; __i++) {');
    this.indent++;
    this.loopDepth++;

    if (this.enableLoopGuard) {
      this.emitLine('NAMI_LOOP_CHECK(&nami_loop_guard);');
    }

    if (stmt.left.type === 'VariableDeclaration') {
      const decl = stmt.left;
      if (decl.declarations[0].id.type === 'Identifier') {
        const name = this.sanitizeIdentifier(decl.declarations[0].id.name);
        if (stmt.type === 'ForInStatement') {
          this.emitLine(`nami_value_t ${name} = nami_value_int(__i);`);
        } else {
          this.emitLine(`nami_value_t ${name} = nami_array_get(__iter, __i);`);
        }
      }
    }

    this.generateStatement(stmt.body);

    this.loopDepth--;
    this.indent--;
    this.emitLine('}');
    this.indent--;
    this.emitLine('}');
  }

  private generateWhileStatement(stmt: WhileStatement): void {
    const test = this.generateExpression(stmt.test);
    this.emitLine(`while (nami_truthy(${test})) {`);
    this.indent++;
    this.loopDepth++;

    if (this.enableLoopGuard) {
      this.emitLine('NAMI_LOOP_CHECK(&nami_loop_guard);');
    }

    this.generateStatement(stmt.body);

    this.loopDepth--;
    this.indent--;
    this.emitLine('}');
  }

  private generateDoWhileStatement(stmt: DoWhileStatement): void {
    this.emitLine('do {');
    this.indent++;
    this.loopDepth++;

    if (this.enableLoopGuard) {
      this.emitLine('NAMI_LOOP_CHECK(&nami_loop_guard);');
    }

    this.generateStatement(stmt.body);

    this.loopDepth--;
    this.indent--;
    const test = this.generateExpression(stmt.test);
    this.emitLine(`} while (nami_truthy(${test}));`);
  }

  private generateReturnStatement(stmt: ReturnStatement): void {
    if (stmt.argument) {
      this.emitLine(`return ${this.generateExpression(stmt.argument)};`);
    } else {
      this.emitLine('return NAMI_NULL;');
    }
  }

  private generateSwitchStatement(stmt: SwitchStatement): void {
    const disc = this.generateExpression(stmt.discriminant);
    this.emitLine(`{`);
    this.indent++;
    this.emitLine(`nami_value_t __switch_val = ${disc};`);

    for (let i = 0; i < stmt.cases.length; i++) {
      const c = stmt.cases[i];
      if (c.test) {
        const testExpr = this.generateExpression(c.test);
        const keyword = i === 0 ? 'if' : '} else if';
        this.emitLine(`${keyword} (nami_equals(__switch_val, ${testExpr})) {`);
      } else {
        if (i > 0) {
          this.emitLine('} else {');
        } else {
          this.emitLine('{');
        }
      }
      this.indent++;
      for (const s of c.consequent) {
        this.generateStatement(s);
      }
      this.indent--;
    }

    if (stmt.cases.length > 0) {
      this.emitLine('}');
    }
    this.indent--;
    this.emitLine('}');
  }

  private generateBlockStatement(stmt: BlockStatement): void {
    this.emitLine('{');
    this.indent++;
    for (const s of stmt.body) {
      this.generateStatement(s);
    }
    this.indent--;
    this.emitLine('}');
  }

  private generateTryCatch(stmt: TryCatchStatement): void {
    this.emitLine('{');
    this.indent++;
    this.emitLine('nami_error_context_t __err_ctx;');
    this.emitLine('if (setjmp(__err_ctx.jmp_buf) == 0) {');
    this.indent++;
    this.emitLine('nami_push_error_context(&__err_ctx);');
    for (const s of stmt.block.body) {
      this.generateStatement(s);
    }
    this.emitLine('nami_pop_error_context();');
    this.indent--;

    if (stmt.handler) {
      this.emitLine('} else {');
      this.indent++;
      this.emitLine('nami_pop_error_context();');
      if (stmt.handler.param) {
        const name = this.sanitizeIdentifier(stmt.handler.param.name);
        this.emitLine(`nami_value_t ${name} = __err_ctx.error;`);
      }
      for (const s of stmt.handler.body.body) {
        this.generateStatement(s);
      }
      this.indent--;
    }

    this.emitLine('}');

    if (stmt.finalizer) {
      this.emitLine('// Finally block');
      for (const s of stmt.finalizer.body) {
        this.generateStatement(s);
      }
    }

    this.indent--;
    this.emitLine('}');
  }

  private generateImport(stmt: ImportStatement): void {
    this.emitLine(`// import from "${stmt.source.value}"`);
    this.headerOutput.push(`#include "${stmt.source.value.replace('.nm', '.h')}"`);
  }

  /** Generate NAMI-style module import: `import nm` */
  private generateNamiImport(stmt: NamiImportStatement): void {
    const moduleName = stmt.module.name;
    if (isBuiltinModule(moduleName)) {
      this.emitLine(`// import ${moduleName} (built-in module)`);
      this.headerOutput.push(`#include "nami_${moduleName}.h"`);
    } else {
      this.emitLine(`// import ${moduleName} (external module)`);
      this.headerOutput.push(`#include "${moduleName}.h"`);
    }
  }

  /** Generate infinite loop: `loop { ... }` */
  private generateLoopStatement(stmt: LoopStatement): void {
    this.loopDepth++;
    this.emitLine('while (1) {');
    this.indent++;
    if (this.enableLoopGuard) {
      this.emitLine('NAMI_LOOP_CHECK(&nami_loop_guard);');
    }
    if (stmt.body.type === 'BlockStatement') {
      for (const s of stmt.body.body) {
        this.generateStatement(s);
      }
    } else {
      this.generateStatement(stmt.body);
    }
    this.indent--;
    this.emitLine('}');
    this.loopDepth--;
  }

  /** Generate print/println: `print("hello")` or `println(x)` */
  private generatePrintStatement(stmt: PrintStatement): void {
    const args = stmt.arguments.map((a) => this.generateExpression(a)).join(', ');
    if (stmt.newline) {
      this.emitLine(`nami_println(${args || 'NAMI_NULL'});`);
    } else {
      this.emitLine(`nami_print(${args || 'NAMI_NULL'});`);
    }
  }

  /** Generate a range expression for use in for loops */
  private generateRangeExpression(expr: RangeExpression): string {
    const start = this.generateExpression(expr.start);
    const end = this.generateExpression(expr.end);
    return `nami_range(${start}, ${end}, ${expr.inclusive ? '1' : '0'})`;
  }

  // ── Expression Generation ──────────────────────────────

  private generateExpression(expr: Expression): string {
    switch (expr.type) {
      case 'NumericLiteral':
        if (Number.isInteger(expr.value)) {
          return `nami_value_int(${expr.value}LL)`;
        }
        return `nami_value_float(${expr.value})`;

      case 'StringLiteral':
        return `nami_value_string("${this.escapeString(expr.value)}")`;

      case 'BooleanLiteral':
        return expr.value ? 'NAMI_TRUE' : 'NAMI_FALSE';

      case 'NullLiteral':
        return 'NAMI_NULL';

      case 'ThisExpression':
        return '__this';

      case 'Identifier':
        return this.sanitizeIdentifier(expr.name);

      case 'BinaryExpression':
        return this.generateBinaryExpression(expr);

      case 'LogicalExpression':
        return this.generateLogicalExpression(expr);

      case 'UnaryExpression':
        return this.generateUnaryExpression(expr);

      case 'UpdateExpression':
        return this.generateUpdateExpression(expr);

      case 'AssignmentExpression':
        return this.generateAssignmentExpression(expr);

      case 'ConditionalExpression': {
        const test = this.generateExpression(expr.test);
        const cons = this.generateExpression(expr.consequent);
        const alt = this.generateExpression(expr.alternate);
        return `(nami_truthy(${test}) ? ${cons} : ${alt})`;
      }

      case 'CallExpression':
        return this.generateCallExpression(expr);

      case 'NewExpression':
        return this.generateNewExpression(expr);

      case 'MemberExpression':
        return this.generateMemberExpression(expr);

      case 'ArrayExpression':
        return this.generateArrayExpression(expr);

      case 'ObjectExpression':
        return this.generateObjectExpression(expr);

      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return this.generateLambda(expr);

      case 'AwaitExpression':
        return `nami_async_await(${this.generateExpression(expr.argument)})`;

      case 'SpreadElement':
        return `/* spread */ ${this.generateExpression(expr.argument)}`;

      case 'SequenceExpression': {
        const parts = expr.expressions.map((e) => this.generateExpression(e));
        return `(${parts.join(', ')})`;
      }

      case 'TypeofExpression':
        return `nami_typeof(${this.generateExpression(expr.argument)})`;

      case 'RangeExpression':
        return this.generateRangeExpression(expr);

      default:
        return `/* unknown expression: ${expr.type} */ NAMI_NULL`;
    }
  }

  private generateBinaryExpression(expr: import('../parser/ast').BinaryExpression): string {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);

    const opMap: Record<string, string> = {
      '+': 'nami_add',
      '-': 'nami_sub',
      '*': 'nami_mul',
      '/': 'nami_div',
      '%': 'nami_mod',
      '**': 'nami_pow',
      '==': 'nami_eq',
      '!=': 'nami_neq',
      '===': 'nami_strict_eq',
      '!==': 'nami_strict_neq',
      '<': 'nami_lt',
      '>': 'nami_gt',
      '<=': 'nami_lte',
      '>=': 'nami_gte',
      '&': 'nami_bitand',
      '|': 'nami_bitor',
      '^': 'nami_bitxor',
      '<<': 'nami_shl',
      '>>': 'nami_shr',
    };

    const func = opMap[expr.operator];
    if (func) {
      return `${func}(${left}, ${right})`;
    }

    return `/* unknown operator ${expr.operator} */ NAMI_NULL`;
  }

  private generateLogicalExpression(expr: import('../parser/ast').LogicalExpression): string {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);

    switch (expr.operator) {
      case '&&':
        return `(nami_truthy(${left}) ? ${right} : ${left})`;
      case '||':
        return `(nami_truthy(${left}) ? ${left} : ${right})`;
      case '??':
        return `(nami_is_null(${left}) ? ${right} : ${left})`;
    }
  }

  private generateUnaryExpression(expr: import('../parser/ast').UnaryExpression): string {
    const arg = this.generateExpression(expr.argument);
    switch (expr.operator) {
      case '!':
        return `nami_not(${arg})`;
      case '-':
        return `nami_neg(${arg})`;
      case '+':
        return `nami_pos(${arg})`;
      case '~':
        return `nami_bitnot(${arg})`;
      default:
        return arg;
    }
  }

  private generateUpdateExpression(expr: import('../parser/ast').UpdateExpression): string {
    const arg = this.generateExpression(expr.argument);
    const op = expr.operator === '++' ? 'nami_inc' : 'nami_dec';
    if (expr.prefix) {
      return `${op}(&${arg})`;
    }
    return `${op}_post(&${arg})`;
  }

  private generateAssignmentExpression(expr: import('../parser/ast').AssignmentExpression): string {
    // Check if left side is member expression (array[index] or obj.prop)
    if (expr.left.type === 'MemberExpression') {
      const member = expr.left;
      const obj = this.generateExpression(member.object);
      const right = this.generateExpression(expr.right);

      if (member.computed) {
        // Array access: arr[index] = value
        const key = this.generateExpression(member.property);
        if (expr.operator === '=') {
          return `(nami_set(${obj}, ${key}, ${right}), ${right})`;
        } else {
          // Compound assignment: arr[index] += value
          const opMap: Record<string, string> = {
            '+=': 'nami_add',
            '-=': 'nami_sub',
            '*=': 'nami_mul',
            '/=': 'nami_div',
            '%=': 'nami_mod',
          };
          const func = opMap[expr.operator];
          if (func) {
            const temp = `nami_get(${obj}, ${key})`;
            return `(nami_set(${obj}, ${key}, ${func}(${temp}, ${right})), ${func}(${temp}, ${right}))`;
          }
        }
      } else {
        // Object property: obj.prop = value
        const prop = (member.property as import('../parser/ast').Identifier).name;
        if (expr.operator === '=') {
          return `(nami_set_prop(${obj}, "${prop}", ${right}), ${right})`;
        } else {
          const opMap: Record<string, string> = {
            '+=': 'nami_add',
            '-=': 'nami_sub',
            '*=': 'nami_mul',
            '/=': 'nami_div',
            '%=': 'nami_mod',
          };
          const func = opMap[expr.operator];
          if (func) {
            const temp = `nami_get_prop(${obj}, "${prop}")`;
            return `(nami_set_prop(${obj}, "${prop}", ${func}(${temp}, ${right})), ${func}(${temp}, ${right}))`;
          }
        }
      }
    }

    // Regular variable assignment
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);

    if (expr.operator === '=') {
      return `(${left} = ${right})`;
    }

    const opMap: Record<string, string> = {
      '+=': 'nami_add',
      '-=': 'nami_sub',
      '*=': 'nami_mul',
      '/=': 'nami_div',
      '%=': 'nami_mod',
    };

    const func = opMap[expr.operator];
    if (func) {
      return `(${left} = ${func}(${left}, ${right}))`;
    }

    return `(${left} = ${right})`;
  }

  private generateCallExpression(expr: import('../parser/ast').CallExpression): string {
    const args = expr.arguments.map((a) => this.generateExpression(a)).join(', ');

    // Special built-in function handling
    if (expr.callee.type === 'Identifier') {
      switch (expr.callee.name) {
        case 'print':
          return `nami_print(${args})`;
        case 'println':
          return `nami_println(${args})`;
        case 'printf':
          return `nami_printf(${args})`;
        case 'printfln':
          return `nami_printfln(${args})`;
        case 'input':
          return 'nami_input()';
        case 'parseInt':
          return `nami_parse_int(${args})`;
        case 'parseFloat':
          return `nami_parse_float(${args})`;
      }
    }

    // Method calls: obj.method(args)
    if (expr.callee.type === 'MemberExpression') {
      return this.generateMethodCall(expr);
    }

    const callee = this.generateExpression(expr.callee);
    return `${callee}(${args})`;
  }

  private generateMethodCall(expr: import('../parser/ast').CallExpression): string {
    const member = expr.callee as import('../parser/ast').MemberExpression;
    const obj = this.generateExpression(member.object);
    const args = expr.arguments.map((a) => this.generateExpression(a)).join(', ');

    if (member.property.type === 'Identifier') {
      const methodName = member.property.name;

      // Array methods
      const arrayMethods: Record<string, string> = {
        push: 'nami_array_push',
        pop: 'nami_array_pop',
        map: 'nami_array_map',
        filter: 'nami_array_filter',
        forEach: 'nami_array_foreach',
        reduce: 'nami_array_reduce',
        slice: 'nami_array_slice',
        indexOf: 'nami_array_index_of',
        includes: 'nami_array_includes',
        join: 'nami_array_join',
        reverse: 'nami_array_reverse',
        sort: 'nami_array_sort',
        length: 'nami_array_length',
      };

      // String methods
      const stringMethods: Record<string, string> = {
        concat: 'nami_string_concat',
        substring: 'nami_string_substring',
        split: 'nami_string_split',
        join: 'nami_string_join',
        indexOf: 'nami_string_index_of',
        replace: 'nami_string_replace',
        toLowerCase: 'nami_string_to_lower',
        toUpperCase: 'nami_string_to_upper',
        trim: 'nami_string_trim',
        charAt: 'nami_string_char_at',
        length: 'nami_string_length',
      };

      // Console methods
      if (member.object.type === 'Identifier' && member.object.name === 'console') {
        if (methodName === 'log') return `nami_println(${args})`;
        if (methodName === 'error') return `nami_print_error(${args})`;
      }

      // NAMI: nm module methods — nm.input(), nm.exit(), etc.
      if (member.object.type === 'Identifier' && member.object.name === 'nm') {
        const nmMethod = resolveNmMethod(methodName);
        if (nmMethod) {
          return `${nmMethod.cName}(${args})`;
        }
      }

      // NAMI: http module methods — http.create(), etc.
      if (member.object.type === 'Identifier' && member.object.name === 'http') {
        return `nami_http_${methodName}(${args})`;
      }

      // Math methods
      if (member.object.type === 'Identifier' && member.object.name === 'Math') {
        return `nami_math_${methodName}(${args})`;
      }

      const arrayFunc = arrayMethods[methodName];
      if (arrayFunc) {
        return args ? `${arrayFunc}(${obj}, ${args})` : `${arrayFunc}(${obj})`;
      }

      const stringFunc = stringMethods[methodName];
      if (stringFunc) {
        return args ? `${stringFunc}(${obj}, ${args})` : `${stringFunc}(${obj})`;
      }

      // Generic method call
      return `nami_method_call(${obj}, "${methodName}"${args ? ', ' + args : ''})`;
    }

    // Computed method call
    const prop = this.generateExpression(member.property);
    return `nami_dynamic_call(${obj}, ${prop}${args ? ', ' + args : ''})`;
  }

  private generateNewExpression(expr: import('../parser/ast').NewExpression): string {
    const callee = this.generateExpression(expr.callee);
    const args = expr.arguments.map((a) => this.generateExpression(a)).join(', ');
    return `nami_new(${callee}${args ? ', ' + args : ''})`;
  }

  private generateMemberExpression(expr: import('../parser/ast').MemberExpression): string {
    const obj = this.generateExpression(expr.object);
    if (expr.computed) {
      const prop = this.generateExpression(expr.property);
      return `nami_get(${obj}, ${prop})`;
    }
    if (expr.property.type === 'Identifier') {
      const prop = expr.property.name;

      // Special properties
      if (prop === 'length') {
        return `nami_length(${obj})`;
      }

      return `nami_get_prop(${obj}, "${prop}")`;
    }
    return `nami_get(${obj}, ${this.generateExpression(expr.property)})`;
  }

  private generateArrayExpression(expr: import('../parser/ast').ArrayExpression): string {
    const elements = expr.elements
      .filter((e): e is Expression => e !== null)
      .map((e) => this.generateExpression(e))
      .join(', ');

    const count = expr.elements.filter((e) => e !== null).length;
    return `nami_array_of(${count}${elements ? ', ' + elements : ''})`;
  }

  private generateObjectExpression(expr: import('../parser/ast').ObjectExpression): string {
    if (expr.properties.length === 0) {
      return 'nami_object_create()';
    }

    this.tempVarCount++;
    // For inline objects, we'll use a helper function
    const props: string[] = [];
    for (const prop of expr.properties) {
      if (prop.type === 'SpreadElement') {
        // TODO: handle spread
        continue;
      }
      let key: string;
      if (prop.key.type === 'Identifier') {
        key = `"${prop.key.name}"`;
      } else if (prop.key.type === 'StringLiteral') {
        key = `"${this.escapeString(prop.key.value)}"`;
      } else {
        key = this.generateExpression(prop.key);
      }
      const value = this.generateExpression(prop.value);
      props.push(`${key}, ${value}`);
    }

    return `nami_object_of(${props.length}${props.length > 0 ? ', ' + props.join(', ') : ''})`;
  }

  private generateLambda(
    expr:
      | import('../parser/ast').ArrowFunctionExpression
      | import('../parser/ast').FunctionExpression
  ): string {
    const lambdaName = `__lambda_${this.lambdaCount++}`;
    const params =
      expr.params.map((p) => `nami_value_t ${this.sanitizeIdentifier(p.name)}`).join(', ') ||
      'void';

    const lines: string[] = [];
    lines.push(`static nami_value_t ${lambdaName}(${params}) {`);

    if (expr.type === 'ArrowFunctionExpression' && expr.body.type !== 'BlockStatement') {
      // Concise arrow: x => x + 1
      const bodyExpr = this.generateExpression(expr.body);
      lines.push(`    return ${bodyExpr};`);
    } else {
      const body =
        expr.type === 'ArrowFunctionExpression' ? (expr.body as BlockStatement) : expr.body;

      // Generate body - simplified, just use the output buffer temporarily
      const savedOutput = this.output;
      const savedIndent = this.indent;
      this.output = [];
      this.indent = 1;

      for (const stmt of body.body) {
        this.generateStatement(stmt);
      }
      lines.push(...this.output);
      lines.push('    return NAMI_NULL;');

      this.output = savedOutput;
      this.indent = savedIndent;
    }

    lines.push('}');
    this.lambdas.push(lines.join('\n'));

    return lambdaName;
  }

  // ── Helper Methods ─────────────────────────────────────

  private inferCType(_expr: Expression): string {
    // Always use nami_value_t for consistency
    // The runtime handles type conversions internally
    return 'nami_value_t';
  }

  private sanitizeIdentifier(name: string): string {
    // Prefix reserved C keywords
    const cKeywords = new Set([
      'auto',
      'break',
      'case',
      'char',
      'const',
      'continue',
      'default',
      'do',
      'double',
      'else',
      'enum',
      'extern',
      'float',
      'for',
      'goto',
      'if',
      'int',
      'long',
      'register',
      'return',
      'short',
      'signed',
      'sizeof',
      'static',
      'struct',
      'switch',
      'typedef',
      'union',
      'unsigned',
      'void',
      'volatile',
      'while',
    ]);

    if (cKeywords.has(name)) {
      return `_nami_${name}`;
    }

    return name.replace(/\$/g, '_dollar_');
  }

  private escapeString(s: string): string {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\0/g, '\\0');
  }

  private emit(text: string): void {
    this.output.push(text);
  }

  private emitLine(text: string): void {
    this.output.push('    '.repeat(this.indent) + text);
  }
}
