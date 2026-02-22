/**
 * NAMI Pretty Printer - Converts AST back to NAMI source code
 * Used for parser round-trip testing and code formatting
 */

/* eslint-disable no-case-declarations */

import { Program, Statement, Expression, Parameter } from '../parser/ast';

export class PrettyPrinter {
  private indent = 0;
  private output: string[] = [];

  print(program: Program): string {
    this.indent = 0;
    this.output = [];

    for (const stmt of program.body) {
      this.printStatement(stmt);
    }

    return this.output.join('\n');
  }

  private printStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'VariableDeclaration': {
        const parts = stmt.declarations.map((d) => {
          const name = d.id.type === 'Identifier' ? d.id.name : '/* pattern */';
          if (d.init) {
            return `${name} = ${this.printExpression(d.init)}`;
          }
          return name;
        });
        this.emitLine(`${stmt.kind} ${parts.join(', ')};`);
        break;
      }

      case 'FunctionDeclaration': {
        const async = stmt.async ? 'async ' : '';
        const params = stmt.params.map((p) => this.printParam(p)).join(', ');
        this.emitLine(`${async}function ${stmt.id.name}(${params}) {`);
        this.indent++;
        for (const s of stmt.body.body) {
          this.printStatement(s);
        }
        this.indent--;
        this.emitLine('}');
        break;
      }

      case 'IfStatement': {
        this.emitLine(`if (${this.printExpression(stmt.test)}) {`);
        this.indent++;
        this.printStatement(stmt.consequent);
        this.indent--;
        if (stmt.alternate) {
          if (stmt.alternate.type === 'IfStatement') {
            this.emit('} else ');
            this.printStatement(stmt.alternate);
          } else {
            this.emitLine('} else {');
            this.indent++;
            this.printStatement(stmt.alternate);
            this.indent--;
            this.emitLine('}');
          }
        } else {
          this.emitLine('}');
        }
        break;
      }

      case 'ForStatement': {
        let init = '';
        if (stmt.init) {
          if (stmt.init.type === 'VariableDeclaration') {
            const parts = stmt.init.declarations.map((d) => {
              const name = d.id.type === 'Identifier' ? d.id.name : '';
              return d.init ? `${name} = ${this.printExpression(d.init)}` : name;
            });
            init = `${stmt.init.kind} ${parts.join(', ')}`;
          } else {
            init = this.printExpression(stmt.init);
          }
        }
        const test = stmt.test ? this.printExpression(stmt.test) : '';
        const update = stmt.update ? this.printExpression(stmt.update) : '';
        this.emitLine(`for (${init}; ${test}; ${update}) {`);
        this.indent++;
        this.printStatement(stmt.body);
        this.indent--;
        this.emitLine('}');
        break;
      }

      case 'WhileStatement':
        this.emitLine(`while (${this.printExpression(stmt.test)}) {`);
        this.indent++;
        this.printStatement(stmt.body);
        this.indent--;
        this.emitLine('}');
        break;

      case 'DoWhileStatement':
        this.emitLine('do {');
        this.indent++;
        this.printStatement(stmt.body);
        this.indent--;
        this.emitLine(`} while (${this.printExpression(stmt.test)});`);
        break;

      case 'ReturnStatement':
        if (stmt.argument) {
          this.emitLine(`return ${this.printExpression(stmt.argument)};`);
        } else {
          this.emitLine('return;');
        }
        break;

      case 'BreakStatement':
        this.emitLine('break;');
        break;

      case 'ContinueStatement':
        this.emitLine('continue;');
        break;

      case 'SwitchStatement':
        this.emitLine(`switch (${this.printExpression(stmt.discriminant)}) {`);
        this.indent++;
        for (const c of stmt.cases) {
          if (c.test) {
            this.emitLine(`case ${this.printExpression(c.test)}:`);
          } else {
            this.emitLine('default:');
          }
          this.indent++;
          for (const s of c.consequent) {
            this.printStatement(s);
          }
          this.indent--;
        }
        this.indent--;
        this.emitLine('}');
        break;

      case 'BlockStatement':
        for (const s of stmt.body) {
          this.printStatement(s);
        }
        break;

      case 'ExpressionStatement':
        this.emitLine(`${this.printExpression(stmt.expression)};`);
        break;

      case 'TryCatchStatement':
        this.emitLine('try {');
        this.indent++;
        for (const s of stmt.block.body) {
          this.printStatement(s);
        }
        this.indent--;
        if (stmt.handler) {
          const param = stmt.handler.param ? `(${stmt.handler.param.name})` : '';
          this.emitLine(`} catch ${param} {`);
          this.indent++;
          for (const s of stmt.handler.body.body) {
            this.printStatement(s);
          }
          this.indent--;
        }
        if (stmt.finalizer) {
          this.emitLine('} finally {');
          this.indent++;
          for (const s of stmt.finalizer.body) {
            this.printStatement(s);
          }
          this.indent--;
        }
        this.emitLine('}');
        break;

      case 'ThrowStatement':
        this.emitLine(`throw ${this.printExpression(stmt.argument)};`);
        break;

      case 'ImportStatement': {
        const specs = stmt.specifiers
          .map((s) => {
            if (s.imported.name === s.local.name) return s.imported.name;
            return `${s.imported.name} as ${s.local.name}`;
          })
          .join(', ');
        this.emitLine(`import { ${specs} } from "${stmt.source.value}";`);
        break;
      }

      case 'ExportStatement':
        if (stmt.default) this.emit('export default ');
        else this.emit('export ');
        if (stmt.declaration) {
          this.printStatement(stmt.declaration);
        }
        break;

      case 'EmptyStatement':
        break;

      case 'ClassDeclaration':
        this.emitLine(`class ${stmt.id.name} {`);
        this.emitLine('}');
        break;

      default:
        this.emitLine(`/* unknown statement: ${(stmt as Statement).type} */`);
    }
  }

  printExpression(expr: Expression): string {
    switch (expr.type) {
      case 'NumericLiteral':
        return String(expr.value);
      case 'StringLiteral':
        return `"${expr.value.replace(/"/g, '\\"')}"`;
      case 'BooleanLiteral':
        return String(expr.value);
      case 'NullLiteral':
        return 'null';
      case 'ThisExpression':
        return 'this';
      case 'Identifier':
        return expr.name;

      case 'BinaryExpression':
        return `(${this.printExpression(expr.left)} ${expr.operator} ${this.printExpression(expr.right)})`;

      case 'LogicalExpression':
        return `(${this.printExpression(expr.left)} ${expr.operator} ${this.printExpression(expr.right)})`;

      case 'UnaryExpression':
        if (expr.prefix) {
          return `${expr.operator}${this.printExpression(expr.argument)}`;
        }
        return `${this.printExpression(expr.argument)}${expr.operator}`;

      case 'UpdateExpression':
        if (expr.prefix) {
          return `${expr.operator}${this.printExpression(expr.argument)}`;
        }
        return `${this.printExpression(expr.argument)}${expr.operator}`;

      case 'AssignmentExpression':
        return `${this.printExpression(expr.left)} ${expr.operator} ${this.printExpression(expr.right)}`;

      case 'ConditionalExpression':
        return `(${this.printExpression(expr.test)} ? ${this.printExpression(expr.consequent)} : ${this.printExpression(expr.alternate)})`;

      case 'CallExpression': {
        const callee = this.printExpression(expr.callee);
        const args = expr.arguments.map((a) => this.printExpression(a)).join(', ');
        return `${callee}(${args})`;
      }

      case 'NewExpression': {
        const callee = this.printExpression(expr.callee);
        const args = expr.arguments.map((a) => this.printExpression(a)).join(', ');
        return `new ${callee}(${args})`;
      }

      case 'MemberExpression': {
        if (expr.computed) {
          return `${this.printExpression(expr.object)}[${this.printExpression(expr.property)}]`;
        }
        const op = expr.optional ? '?.' : '.';
        return `${this.printExpression(expr.object)}${op}${this.printExpression(expr.property)}`;
      }

      case 'ArrayExpression': {
        const elements = expr.elements.map((e) => (e ? this.printExpression(e) : '')).join(', ');
        return `[${elements}]`;
      }

      case 'ObjectExpression': {
        if (expr.properties.length === 0) return '{}';
        const props = expr.properties
          .map((p) => {
            if (p.type === 'SpreadElement') {
              return `...${this.printExpression(p.argument)}`;
            }
            if (p.shorthand) {
              return this.printExpression(p.key);
            }
            return `${this.printExpression(p.key)}: ${this.printExpression(p.value)}`;
          })
          .join(', ');
        return `{ ${props} }`;
      }

      case 'ArrowFunctionExpression': {
        const async = expr.async ? 'async ' : '';
        const params = expr.params.map((p) => this.printParam(p)).join(', ');
        if (expr.body.type === 'BlockStatement') {
          // Can't inline block body in an expression string
          return `${async}(${params}) => { /* ... */ }`;
        }
        return `${async}(${params}) => ${this.printExpression(expr.body)}`;
      }

      case 'FunctionExpression': {
        const async = expr.async ? 'async ' : '';
        const name = expr.id ? expr.id.name : '';
        const params = expr.params.map((p) => this.printParam(p)).join(', ');
        return `${async}function ${name}(${params}) { /* ... */ }`;
      }

      case 'AwaitExpression':
        return `await ${this.printExpression(expr.argument)}`;

      case 'SpreadElement':
        return `...${this.printExpression(expr.argument)}`;

      case 'SequenceExpression':
        return expr.expressions.map((e) => this.printExpression(e)).join(', ');

      case 'TypeofExpression':
        return `typeof ${this.printExpression(expr.argument)}`;

      default:
        return `/* unknown: ${expr.type} */`;
    }
  }

  private printParam(p: Parameter): string {
    let str = '';
    if (p.rest) str += '...';
    str += p.name;
    if (p.defaultValue) {
      str += ` = ${this.printExpression(p.defaultValue)}`;
    }
    return str;
  }

  private emitLine(text: string): void {
    this.output.push('  '.repeat(this.indent) + text);
  }

  private emit(text: string): void {
    this.output.push(text);
  }
}
