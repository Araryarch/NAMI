/**
 * Function Inlining Optimizer
 * Inlines small functions at call sites
 * Requirements: 17.3
 */

import {
  Program,
  Statement,
  Expression,
  FunctionDeclaration,
  CallExpression,
  Identifier,
  BlockStatement,
} from '../parser/ast';

export interface InliningStats {
  functionsInlined: number;
  callSitesInlined: number;
  recursiveFunctionsSkipped: number;
}

export interface InliningOptions {
  /** Maximum number of statements in a function to consider for inlining */
  maxStatements: number;
  /** Maximum depth of inlining (to prevent exponential growth) */
  maxDepth: number;
}

const DEFAULT_OPTIONS: InliningOptions = {
  maxStatements: 5,
  maxDepth: 3,
};

interface FunctionInfo {
  declaration: FunctionDeclaration;
  statementCount: number;
  isRecursive: boolean;
}

export class FunctionInliner {
  private options: InliningOptions;
  private stats: InliningStats = {
    functionsInlined: 0,
    callSitesInlined: 0,
    recursiveFunctionsSkipped: 0,
  };
  private functions: Map<string, FunctionInfo> = new Map();
  private currentDepth: number = 0;

  constructor(options?: Partial<InliningOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Inline small functions in the program
   */
  inline(program: Program): Program {
    this.stats = {
      functionsInlined: 0,
      callSitesInlined: 0,
      recursiveFunctionsSkipped: 0,
    };
    this.functions.clear();
    this.currentDepth = 0;

    // First pass: collect function information
    this.collectFunctions(program.body);

    // Second pass: inline function calls
    const body = this.inlineInStatements(program.body);

    return {
      ...program,
      body,
    };
  }

  /**
   * Get optimization statistics
   */
  getStats(): InliningStats {
    return { ...this.stats };
  }

  /**
   * Collect information about all functions
   */
  private collectFunctions(statements: Statement[]): void {
    for (const stmt of statements) {
      if (stmt.type === 'FunctionDeclaration') {
        const statementCount = this.countStatements(stmt.body);
        const isRecursive = this.isRecursiveFunction(stmt);

        this.functions.set(stmt.id.name, {
          declaration: stmt,
          statementCount,
          isRecursive,
        });
      }
    }
  }

  /**
   * Count statements in a block
   */
  private countStatements(block: BlockStatement): number {
    let count = 0;
    for (const stmt of block.body) {
      count++;
      if (stmt.type === 'BlockStatement') {
        count += this.countStatements(stmt);
      } else if (stmt.type === 'IfStatement') {
        if (stmt.consequent.type === 'BlockStatement') {
          count += this.countStatements(stmt.consequent);
        }
        if (stmt.alternate) {
          if (stmt.alternate.type === 'BlockStatement') {
            count += this.countStatements(stmt.alternate);
          } else {
            count++;
          }
        }
      }
    }
    return count;
  }

  /**
   * Check if a function is recursive
   */
  private isRecursiveFunction(func: FunctionDeclaration): boolean {
    const funcName = func.id.name;
    return this.containsCallTo(func.body, funcName);
  }

  /**
   * Check if a block contains a call to a specific function
   */
  private containsCallTo(block: BlockStatement, funcName: string): boolean {
    for (const stmt of block.body) {
      if (this.statementContainsCallTo(stmt, funcName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a statement contains a call to a specific function
   */
  private statementContainsCallTo(stmt: Statement, funcName: string): boolean {
    switch (stmt.type) {
      case 'ExpressionStatement':
        return this.expressionContainsCallTo(stmt.expression, funcName);
      case 'ReturnStatement':
        return stmt.argument ? this.expressionContainsCallTo(stmt.argument, funcName) : false;
      case 'VariableDeclaration':
        return stmt.declarations.some(
          (d) => d.init && this.expressionContainsCallTo(d.init, funcName)
        );
      case 'IfStatement':
        return (
          this.expressionContainsCallTo(stmt.test, funcName) ||
          this.statementContainsCallTo(stmt.consequent, funcName) ||
          (stmt.alternate ? this.statementContainsCallTo(stmt.alternate, funcName) : false)
        );
      case 'BlockStatement':
        return this.containsCallTo(stmt, funcName);
      default:
        return false;
    }
  }

  /**
   * Check if an expression contains a call to a specific function
   */
  private expressionContainsCallTo(expr: Expression, funcName: string): boolean {
    switch (expr.type) {
      case 'CallExpression':
        if (expr.callee.type === 'Identifier' && expr.callee.name === funcName) {
          return true;
        }
        return (
          this.expressionContainsCallTo(expr.callee, funcName) ||
          expr.arguments.some((arg) => this.expressionContainsCallTo(arg, funcName))
        );
      case 'BinaryExpression':
      case 'LogicalExpression':
        return (
          this.expressionContainsCallTo(expr.left, funcName) ||
          this.expressionContainsCallTo(expr.right, funcName)
        );
      case 'UnaryExpression':
        return this.expressionContainsCallTo(expr.argument, funcName);
      case 'MemberExpression':
        return this.expressionContainsCallTo(expr.object, funcName);
      case 'ArrayExpression':
        return expr.elements.some(
          (el) => el && el.type !== 'SpreadElement' && this.expressionContainsCallTo(el, funcName)
        );
      default:
        return false;
    }
  }

  /**
   * Inline functions in a list of statements
   */
  private inlineInStatements(statements: Statement[]): Statement[] {
    return statements.map((stmt) => this.inlineInStatement(stmt));
  }

  /**
   * Inline functions in a single statement
   */
  private inlineInStatement(stmt: Statement): Statement {
    switch (stmt.type) {
      case 'ExpressionStatement':
        return {
          ...stmt,
          expression: this.inlineInExpression(stmt.expression),
        };

      case 'ReturnStatement':
        return {
          ...stmt,
          argument: stmt.argument ? this.inlineInExpression(stmt.argument) : null,
        };

      case 'VariableDeclaration':
        return {
          ...stmt,
          declarations: stmt.declarations.map((d) => ({
            ...d,
            init: d.init ? this.inlineInExpression(d.init) : null,
          })),
        };

      case 'IfStatement':
        return {
          ...stmt,
          test: this.inlineInExpression(stmt.test),
          consequent: this.inlineInStatement(stmt.consequent),
          alternate: stmt.alternate ? this.inlineInStatement(stmt.alternate) : null,
        };

      case 'BlockStatement':
        return {
          ...stmt,
          body: this.inlineInStatements(stmt.body),
        };

      case 'ForStatement':
        return {
          ...stmt,
          init:
            stmt.init && stmt.init.type !== 'VariableDeclaration'
              ? this.inlineInExpression(stmt.init)
              : stmt.init,
          test: stmt.test ? this.inlineInExpression(stmt.test) : null,
          update: stmt.update ? this.inlineInExpression(stmt.update) : null,
          body: this.inlineInStatement(stmt.body),
        };

      case 'WhileStatement':
      case 'DoWhileStatement':
        return {
          ...stmt,
          test: this.inlineInExpression(stmt.test),
          body: this.inlineInStatement(stmt.body),
        };

      default:
        return stmt;
    }
  }

  /**
   * Inline functions in an expression
   */
  private inlineInExpression(expr: Expression): Expression {
    if (expr.type === 'CallExpression') {
      return this.tryInlineCall(expr);
    }

    switch (expr.type) {
      case 'BinaryExpression':
      case 'LogicalExpression':
        return {
          ...expr,
          left: this.inlineInExpression(expr.left),
          right: this.inlineInExpression(expr.right),
        };

      case 'UnaryExpression':
        return {
          ...expr,
          argument: this.inlineInExpression(expr.argument),
        };

      case 'MemberExpression':
        return {
          ...expr,
          object: this.inlineInExpression(expr.object),
          property: expr.computed ? this.inlineInExpression(expr.property) : expr.property,
        };

      case 'ArrayExpression':
        return {
          ...expr,
          elements: expr.elements.map((el) =>
            el && el.type !== 'SpreadElement' ? this.inlineInExpression(el) : el
          ),
        };

      case 'ConditionalExpression':
        return {
          ...expr,
          test: this.inlineInExpression(expr.test),
          consequent: this.inlineInExpression(expr.consequent),
          alternate: this.inlineInExpression(expr.alternate),
        };

      default:
        return expr;
    }
  }

  /**
   * Try to inline a function call
   */
  private tryInlineCall(call: CallExpression): Expression {
    // Check depth limit
    if (this.currentDepth >= this.options.maxDepth) {
      return call;
    }

    // Only inline direct function calls
    if (call.callee.type !== 'Identifier') {
      return {
        ...call,
        arguments: call.arguments.map((arg) => this.inlineInExpression(arg)),
      };
    }

    const funcName = call.callee.name;
    const funcInfo = this.functions.get(funcName);

    // Check if function can be inlined
    if (!funcInfo) {
      return call;
    }

    if (funcInfo.isRecursive) {
      this.stats.recursiveFunctionsSkipped++;
      return call;
    }

    if (funcInfo.statementCount > this.options.maxStatements) {
      return call;
    }

    // Inline the function
    this.currentDepth++;
    const inlined = this.inlineFunction(funcInfo.declaration, call.arguments);
    this.currentDepth--;

    this.stats.callSitesInlined++;
    return inlined;
  }

  /**
   * Inline a function with given arguments
   */
  private inlineFunction(func: FunctionDeclaration, args: Expression[]): Expression {
    // Create parameter substitution map
    const substitutions = new Map<string, Expression>();
    for (let i = 0; i < func.params.length; i++) {
      const param = func.params[i];
      const arg = args[i] || ({ type: 'Identifier', name: 'undefined' } as Identifier);
      substitutions.set(param.name, arg);
    }

    // If function has a single return statement, inline it directly
    if (func.body.body.length === 1 && func.body.body[0].type === 'ReturnStatement') {
      const returnStmt = func.body.body[0];
      if (returnStmt.argument) {
        return this.substituteParameters(returnStmt.argument, substitutions);
      }
    }

    // For more complex functions, we can't easily inline as an expression
    // Return the original call (could be improved with block expressions)
    return {
      type: 'CallExpression',
      callee: func.id,
      arguments: args,
    };
  }

  /**
   * Substitute parameters in an expression
   */
  private substituteParameters(
    expr: Expression,
    substitutions: Map<string, Expression>
  ): Expression {
    if (expr.type === 'Identifier' && substitutions.has(expr.name)) {
      return substitutions.get(expr.name)!;
    }

    switch (expr.type) {
      case 'BinaryExpression':
      case 'LogicalExpression':
        return {
          ...expr,
          left: this.substituteParameters(expr.left, substitutions),
          right: this.substituteParameters(expr.right, substitutions),
        };

      case 'UnaryExpression':
        return {
          ...expr,
          argument: this.substituteParameters(expr.argument, substitutions),
        };

      case 'CallExpression':
        return {
          ...expr,
          callee: this.substituteParameters(expr.callee, substitutions),
          arguments: expr.arguments.map((arg) => this.substituteParameters(arg, substitutions)),
        };

      case 'MemberExpression':
        return {
          ...expr,
          object: this.substituteParameters(expr.object, substitutions),
          property: expr.computed
            ? this.substituteParameters(expr.property, substitutions)
            : expr.property,
        };

      case 'ArrayExpression':
        return {
          ...expr,
          elements: expr.elements.map((el) =>
            el && el.type !== 'SpreadElement' ? this.substituteParameters(el, substitutions) : el
          ),
        };

      case 'ConditionalExpression':
        return {
          ...expr,
          test: this.substituteParameters(expr.test, substitutions),
          consequent: this.substituteParameters(expr.consequent, substitutions),
          alternate: this.substituteParameters(expr.alternate, substitutions),
        };

      default:
        return expr;
    }
  }
}
