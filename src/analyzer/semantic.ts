/**
 * NAMI Semantic Analyzer
 * Requirements: 1.1, 1.3, 12.1, 12.2, 12.5
 */

import {
  Program,
  Statement,
  Expression,
  FunctionDeclaration,
  VariableDeclaration,
  BlockStatement,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  SwitchStatement,
  TryCatchStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ForInStatement,
  ForOfStatement,
  ImportStatement,
} from '../parser/ast';
import { NamiType, Types, coerceTypes } from '../types/types';

// ── Symbol Table ──────────────────────────────────────

export type SymbolKind = 'variable' | 'function' | 'parameter' | 'type';

export interface SymbolInfo {
  name: string;
  type: NamiType;
  kind: SymbolKind;
  isMutable: boolean;
  declared: boolean;
  line?: number;
  column?: number;
}

export class Scope {
  public symbols = new Map<string, SymbolInfo>();
  public children: Scope[] = [];

  constructor(
    public readonly id: number,
    public readonly parent: Scope | null = null,
    public readonly label?: string
  ) {}

  define(symbol: SymbolInfo): void {
    this.symbols.set(symbol.name, symbol);
  }

  resolve(name: string): SymbolInfo | null {
    const symbol = this.symbols.get(name);
    if (symbol) return symbol;
    if (this.parent) return this.parent.resolve(name);
    return null;
  }

  resolveLocal(name: string): SymbolInfo | null {
    return this.symbols.get(name) || null;
  }
}

export class SymbolTable {
  private scopes: Scope[] = [];
  private currentScope: Scope;
  private nextScopeId = 0;

  constructor() {
    this.currentScope = new Scope(this.nextScopeId++, null, 'global');
    this.scopes.push(this.currentScope);
    this.defineBuiltins();
  }

  private defineBuiltins(): void {
    // Built-in functions
    const builtins: [string, NamiType][] = [
      ['print', Types.function([Types.any()], Types.void())],
      ['println', Types.function([Types.any()], Types.void())],
      ['input', Types.function([], Types.string())],
      ['parseInt', Types.function([Types.string()], Types.int())],
      ['parseFloat', Types.function([Types.string()], Types.float())],
      ['String', Types.function([Types.any()], Types.string())],
      ['Number', Types.function([Types.any()], Types.float())],
      ['Boolean', Types.function([Types.any()], Types.bool())],
      ['Array', Types.function([], Types.array(Types.any()))],
      ['Object', Types.function([], Types.object())],
      ['Math', Types.object()],
      ['console', Types.object()],
      ['JSON', Types.object()],
    ];

    for (const [name, type] of builtins) {
      this.currentScope.define({
        name,
        type,
        kind: 'function',
        isMutable: false,
        declared: true,
      });
    }
  }

  enterScope(label?: string): Scope {
    const scope = new Scope(this.nextScopeId++, this.currentScope, label);
    this.currentScope.children.push(scope);
    this.scopes.push(scope);
    this.currentScope = scope;
    return scope;
  }

  exitScope(): void {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  define(symbol: SymbolInfo): void {
    this.currentScope.define(symbol);
  }

  resolve(name: string): SymbolInfo | null {
    return this.currentScope.resolve(name);
  }

  resolveLocal(name: string): SymbolInfo | null {
    return this.currentScope.resolveLocal(name);
  }

  getCurrentScope(): Scope {
    return this.currentScope;
  }

  getAllScopes(): Scope[] {
    return this.scopes;
  }
}

// ── Semantic Error ──────────────────────────────────────

export class SemanticError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    super(message);
    this.name = 'SemanticError';
  }
}

// ── Semantic Analyzer ─────────────────────────────────

export class SemanticAnalyzer {
  private symbolTable: SymbolTable;
  private errors: SemanticError[] = [];
  private inLoop = 0;
  private inFunction = 0;
  private inAsync = false;

  constructor() {
    this.symbolTable = new SymbolTable();
  }

  analyze(program: Program): { errors: SemanticError[]; symbolTable: SymbolTable } {
    this.errors = [];
    this.analyzeStatements(program.body);
    return { errors: this.errors, symbolTable: this.symbolTable };
  }

  getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }

  private analyzeStatements(statements: Statement[]): void {
    for (const stmt of statements) {
      this.analyzeStatement(stmt);
    }
  }

  private analyzeStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'VariableDeclaration':
        this.analyzeVariableDeclaration(stmt);
        break;
      case 'FunctionDeclaration':
        this.analyzeFunctionDeclaration(stmt);
        break;
      case 'IfStatement':
        this.analyzeIfStatement(stmt);
        break;
      case 'ForStatement':
        this.analyzeForStatement(stmt);
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        this.analyzeForInOfStatement(stmt);
        break;
      case 'WhileStatement':
        this.analyzeWhileStatement(stmt);
        break;
      case 'DoWhileStatement':
        this.analyzeDoWhileStatement(stmt);
        break;
      case 'ReturnStatement':
        this.analyzeReturnStatement(stmt);
        break;
      case 'BreakStatement':
        this.analyzeBreakStatement(stmt);
        break;
      case 'ContinueStatement':
        this.analyzeContinueStatement(stmt);
        break;
      case 'SwitchStatement':
        this.analyzeSwitchStatement(stmt);
        break;
      case 'BlockStatement':
        this.analyzeBlockStatement(stmt);
        break;
      case 'ExpressionStatement':
        this.analyzeExpression(stmt.expression);
        break;
      case 'TryCatchStatement':
        this.analyzeTryCatch(stmt);
        break;
      case 'ThrowStatement':
        this.analyzeExpression(stmt.argument);
        break;
      case 'ImportStatement':
        this.analyzeImport(stmt);
        break;
      case 'ExportStatement':
        if (stmt.declaration) this.analyzeStatement(stmt.declaration);
        break;
      case 'EmptyStatement':
        break;
      case 'ClassDeclaration':
        // Simplified class support
        this.symbolTable.define({
          name: stmt.id.name,
          type: Types.function([], Types.object()),
          kind: 'type',
          isMutable: false,
          declared: true,
          line: stmt.span?.start.line,
          column: stmt.span?.start.column,
        });
        break;
    }
  }

  private analyzeVariableDeclaration(decl: VariableDeclaration): void {
    for (const declarator of decl.declarations) {
      if (declarator.id.type === 'Identifier') {
        const name = declarator.id.name;

        // Check for duplicate in same scope
        const existing = this.symbolTable.resolveLocal(name);
        if (existing && decl.kind !== 'var') {
          this.addError(
            `Variable '${name}' is already declared in this scope`,
            declarator.span?.start.line,
            declarator.span?.start.column
          );
        }

        let inferredType: NamiType = Types.any();
        if (declarator.init) {
          inferredType = this.inferType(declarator.init);
          this.analyzeExpression(declarator.init);
        }

        this.symbolTable.define({
          name,
          type: inferredType,
          kind: 'variable',
          isMutable: decl.kind !== 'const',
          declared: true,
          line: declarator.span?.start.line,
          column: declarator.span?.start.column,
        });
      }
    }
  }

  private analyzeFunctionDeclaration(decl: FunctionDeclaration): void {
    const name = decl.id.name;
    const paramTypes = decl.params.map(() => Types.any());
    const funcType = Types.function(paramTypes, Types.any());

    this.symbolTable.define({
      name,
      type: funcType,
      kind: 'function',
      isMutable: false,
      declared: true,
      line: decl.span?.start.line,
      column: decl.span?.start.column,
    });

    this.symbolTable.enterScope(`function:${name}`);
    this.inFunction++;
    const prevAsync = this.inAsync;
    this.inAsync = decl.async;

    // Define parameters
    for (const param of decl.params) {
      this.symbolTable.define({
        name: param.name,
        type: Types.any(),
        kind: 'parameter',
        isMutable: true,
        declared: true,
      });
      if (param.defaultValue) {
        this.analyzeExpression(param.defaultValue);
      }
    }

    this.analyzeStatements(decl.body.body);

    this.inAsync = prevAsync;
    this.inFunction--;
    this.symbolTable.exitScope();
  }

  private analyzeIfStatement(stmt: IfStatement): void {
    this.analyzeExpression(stmt.test);
    this.analyzeStatement(stmt.consequent);
    if (stmt.alternate) {
      this.analyzeStatement(stmt.alternate);
    }
  }

  private analyzeForStatement(stmt: ForStatement): void {
    this.symbolTable.enterScope('for');
    this.inLoop++;

    if (stmt.init) {
      if (stmt.init.type === 'VariableDeclaration') {
        this.analyzeVariableDeclaration(stmt.init);
      } else {
        this.analyzeExpression(stmt.init);
      }
    }
    if (stmt.test) this.analyzeExpression(stmt.test);
    if (stmt.update) this.analyzeExpression(stmt.update);
    this.analyzeStatement(stmt.body);

    this.inLoop--;
    this.symbolTable.exitScope();
  }

  private analyzeForInOfStatement(stmt: ForInStatement | ForOfStatement): void {
    this.symbolTable.enterScope('for-in-of');
    this.inLoop++;

    if (stmt.left.type === 'VariableDeclaration') {
      this.analyzeVariableDeclaration(stmt.left);
    }
    this.analyzeExpression(stmt.right);
    this.analyzeStatement(stmt.body);

    this.inLoop--;
    this.symbolTable.exitScope();
  }

  private analyzeWhileStatement(stmt: WhileStatement): void {
    this.analyzeExpression(stmt.test);
    this.symbolTable.enterScope('while');
    this.inLoop++;
    this.analyzeStatement(stmt.body);
    this.inLoop--;
    this.symbolTable.exitScope();
  }

  private analyzeDoWhileStatement(stmt: DoWhileStatement): void {
    this.symbolTable.enterScope('do-while');
    this.inLoop++;
    this.analyzeStatement(stmt.body);
    this.inLoop--;
    this.symbolTable.exitScope();
    this.analyzeExpression(stmt.test);
  }

  private analyzeReturnStatement(stmt: ReturnStatement): void {
    if (this.inFunction === 0) {
      this.addError(
        "'return' statement outside of function",
        stmt.span?.start.line,
        stmt.span?.start.column
      );
    }
    if (stmt.argument) {
      this.analyzeExpression(stmt.argument);
    }
  }

  private analyzeBreakStatement(stmt: BreakStatement): void {
    if (this.inLoop === 0) {
      this.addError(
        "'break' statement outside of loop or switch",
        stmt.span?.start.line,
        stmt.span?.start.column
      );
    }
  }

  private analyzeContinueStatement(stmt: ContinueStatement): void {
    if (this.inLoop === 0) {
      this.addError(
        "'continue' statement outside of loop",
        stmt.span?.start.line,
        stmt.span?.start.column
      );
    }
  }

  private analyzeSwitchStatement(stmt: SwitchStatement): void {
    this.analyzeExpression(stmt.discriminant);
    this.inLoop++; // Allow break in switch
    for (const c of stmt.cases) {
      if (c.test) this.analyzeExpression(c.test);
      this.analyzeStatements(c.consequent);
    }
    this.inLoop--;
  }

  private analyzeBlockStatement(stmt: BlockStatement): void {
    this.symbolTable.enterScope('block');
    this.analyzeStatements(stmt.body);
    this.symbolTable.exitScope();
  }

  private analyzeTryCatch(stmt: TryCatchStatement): void {
    this.symbolTable.enterScope('try');
    this.analyzeStatements(stmt.block.body);
    this.symbolTable.exitScope();

    if (stmt.handler) {
      this.symbolTable.enterScope('catch');
      if (stmt.handler.param) {
        this.symbolTable.define({
          name: stmt.handler.param.name,
          type: Types.any(),
          kind: 'variable',
          isMutable: true,
          declared: true,
        });
      }
      this.analyzeStatements(stmt.handler.body.body);
      this.symbolTable.exitScope();
    }

    if (stmt.finalizer) {
      this.symbolTable.enterScope('finally');
      this.analyzeStatements(stmt.finalizer.body);
      this.symbolTable.exitScope();
    }
  }

  private analyzeImport(stmt: ImportStatement): void {
    for (const specifier of stmt.specifiers) {
      this.symbolTable.define({
        name: specifier.local.name,
        type: Types.any(),
        kind: 'variable',
        isMutable: false,
        declared: true,
      });
    }
  }

  // ── Expression Analysis ──────────────────────────────

  private analyzeExpression(expr: Expression): void {
    switch (expr.type) {
      case 'Identifier': {
        const symbol = this.symbolTable.resolve(expr.name);
        if (!symbol) {
          this.addError(
            `Undefined variable '${expr.name}'`,
            expr.span?.start.line,
            expr.span?.start.column
          );
        }
        break;
      }
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
      case 'NullLiteral':
      case 'ThisExpression':
        break;
      case 'BinaryExpression':
        this.analyzeExpression(expr.left);
        this.analyzeExpression(expr.right);
        break;
      case 'LogicalExpression':
        this.analyzeExpression(expr.left);
        this.analyzeExpression(expr.right);
        break;
      case 'UnaryExpression':
        this.analyzeExpression(expr.argument);
        break;
      case 'UpdateExpression':
        this.analyzeExpression(expr.argument);
        break;
      case 'AssignmentExpression':
        this.analyzeExpression(expr.left);
        this.analyzeExpression(expr.right);
        // Check mutability
        if (expr.left.type === 'Identifier') {
          const symbol = this.symbolTable.resolve(expr.left.name);
          if (symbol && !symbol.isMutable) {
            this.addError(
              `Cannot assign to constant '${expr.left.name}'`,
              expr.span?.start.line,
              expr.span?.start.column
            );
          }
        }
        break;
      case 'ConditionalExpression':
        this.analyzeExpression(expr.test);
        this.analyzeExpression(expr.consequent);
        this.analyzeExpression(expr.alternate);
        break;
      case 'CallExpression':
        this.analyzeExpression(expr.callee);
        for (const arg of expr.arguments) {
          this.analyzeExpression(arg);
        }
        break;
      case 'NewExpression':
        this.analyzeExpression(expr.callee);
        for (const arg of expr.arguments) {
          this.analyzeExpression(arg);
        }
        break;
      case 'MemberExpression':
        this.analyzeExpression(expr.object);
        if (expr.computed) {
          this.analyzeExpression(expr.property);
        }
        break;
      case 'ArrayExpression':
        for (const elem of expr.elements) {
          if (elem) this.analyzeExpression(elem);
        }
        break;
      case 'ObjectExpression':
        for (const prop of expr.properties) {
          if (prop.type === 'SpreadElement') {
            this.analyzeExpression(prop.argument);
          } else {
            if (prop.computed) this.analyzeExpression(prop.key);
            this.analyzeExpression(prop.value);
          }
        }
        break;
      case 'ArrowFunctionExpression': {
        this.symbolTable.enterScope('arrow');
        this.inFunction++;
        const prevAsync = this.inAsync;
        this.inAsync = expr.async;
        for (const param of expr.params) {
          this.symbolTable.define({
            name: param.name,
            type: Types.any(),
            kind: 'parameter',
            isMutable: true,
            declared: true,
          });
        }
        if (expr.body.type === 'BlockStatement') {
          this.analyzeStatements(expr.body.body);
        } else {
          this.analyzeExpression(expr.body);
        }
        this.inAsync = prevAsync;
        this.inFunction--;
        this.symbolTable.exitScope();
        break;
      }
      case 'FunctionExpression': {
        this.symbolTable.enterScope('function-expr');
        this.inFunction++;
        if (expr.id) {
          this.symbolTable.define({
            name: expr.id.name,
            type: Types.function([], Types.any()),
            kind: 'function',
            isMutable: false,
            declared: true,
          });
        }
        for (const param of expr.params) {
          this.symbolTable.define({
            name: param.name,
            type: Types.any(),
            kind: 'parameter',
            isMutable: true,
            declared: true,
          });
        }
        this.analyzeStatements(expr.body.body);
        this.inFunction--;
        this.symbolTable.exitScope();
        break;
      }
      case 'AwaitExpression':
        if (!this.inAsync) {
          this.addError(
            "'await' expression outside of async function",
            expr.span?.start.line,
            expr.span?.start.column
          );
        }
        this.analyzeExpression(expr.argument);
        break;
      case 'SpreadElement':
        this.analyzeExpression(expr.argument);
        break;
      case 'SequenceExpression':
        for (const e of expr.expressions) {
          this.analyzeExpression(e);
        }
        break;
      case 'TypeofExpression':
        this.analyzeExpression(expr.argument);
        break;
      case 'TemplateLiteral':
        for (const e of expr.expressions) {
          this.analyzeExpression(e);
        }
        break;
      case 'TaggedTemplateExpression':
        this.analyzeExpression(expr.tag);
        break;
    }
  }

  // ── Type Inference ──────────────────────────────────

  inferType(expr: Expression): NamiType {
    switch (expr.type) {
      case 'NumericLiteral':
        return Number.isInteger(expr.value) ? Types.int() : Types.float();
      case 'StringLiteral':
        return Types.string();
      case 'BooleanLiteral':
        return Types.bool();
      case 'NullLiteral':
        return Types.null();
      case 'ArrayExpression':
        if (expr.elements.length > 0 && expr.elements[0]) {
          const elemType = this.inferType(expr.elements[0]);
          return Types.array(elemType);
        }
        return Types.array(Types.any());
      case 'ObjectExpression':
        return Types.object();
      case 'BinaryExpression': {
        const leftType = this.inferType(expr.left);
        const rightType = this.inferType(expr.right);
        return coerceTypes(expr.operator, leftType, rightType);
      }
      case 'LogicalExpression':
        return Types.bool();
      case 'UnaryExpression':
        if (expr.operator === '!') return Types.bool();
        if (expr.operator === '~') return Types.int();
        return this.inferType(expr.argument);
      case 'CallExpression':
        return Types.any();
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return Types.function([], Types.any());
      case 'Identifier': {
        const symbol = this.symbolTable.resolve(expr.name);
        return symbol ? symbol.type : Types.any();
      }
      case 'ConditionalExpression':
        return this.inferType(expr.consequent);
      case 'MemberExpression':
        return Types.any();
      case 'AssignmentExpression':
        return this.inferType(expr.right);
      default:
        return Types.any();
    }
  }

  private addError(message: string, line?: number, column?: number): void {
    this.errors.push(new SemanticError(message, line, column));
  }
}
