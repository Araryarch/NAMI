/**
 * Dead Code Elimination Optimizer
 * Removes unreachable code from the AST
 * Requirements: 17.2
 */

import {
  Program,
  Statement,
  Expression,
  BlockStatement,
  IfStatement,
  FunctionDeclaration,
} from '../parser/ast';

export interface DeadCodeStats {
  statementsRemoved: number;
  unreachableAfterReturn: number;
  constantBranches: number;
}

export class DeadCodeEliminator {
  private stats: DeadCodeStats = {
    statementsRemoved: 0,
    unreachableAfterReturn: 0,
    constantBranches: 0,
  };

  /**
   * Eliminate dead code from the program
   */
  eliminate(program: Program): Program {
    this.stats = {
      statementsRemoved: 0,
      unreachableAfterReturn: 0,
      constantBranches: 0,
    };

    return {
      ...program,
      body: this.eliminateDeadStatements(program.body),
    };
  }

  /**
   * Get optimization statistics
   */
  getStats(): DeadCodeStats {
    return { ...this.stats };
  }

  /**
   * Eliminate dead statements from a list
   */
  private eliminateDeadStatements(statements: Statement[]): Statement[] {
    const result: Statement[] = [];
    let reachedReturn = false;

    for (const stmt of statements) {
      if (reachedReturn) {
        // Code after return is unreachable
        this.stats.statementsRemoved++;
        this.stats.unreachableAfterReturn++;
        continue;
      }

      const optimized = this.optimizeStatement(stmt);
      if (optimized) {
        result.push(optimized);
        if (this.isTerminalStatement(optimized)) {
          reachedReturn = true;
        }
      } else {
        this.stats.statementsRemoved++;
      }
    }

    return result;
  }

  /**
   * Check if a statement terminates control flow
   */
  private isTerminalStatement(stmt: Statement): boolean {
    return stmt.type === 'ReturnStatement' || stmt.type === 'ThrowStatement';
  }

  /**
   * Optimize a single statement
   */
  private optimizeStatement(stmt: Statement): Statement | null {
    switch (stmt.type) {
      case 'BlockStatement':
        return this.optimizeBlock(stmt);

      case 'IfStatement':
        return this.optimizeIf(stmt);

      case 'FunctionDeclaration':
        return this.optimizeFunction(stmt);

      case 'ForStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'LoopStatement': {
        const optimizedBody = this.optimizeStatement((stmt as any).body);
        return {
          ...stmt,
          body: optimizedBody || ({ type: 'EmptyStatement' } as Statement),
        };
      }

      case 'SwitchStatement':
        return {
          ...stmt,
          cases: stmt.cases.map((c) => ({
            ...c,
            consequent: this.eliminateDeadStatements(c.consequent),
          })),
        };

      case 'TryCatchStatement':
        return {
          ...stmt,
          block: this.optimizeBlock(stmt.block) as BlockStatement,
          handler: stmt.handler
            ? {
                ...stmt.handler,
                body: this.optimizeBlock(stmt.handler.body) as BlockStatement,
              }
            : null,
          finalizer: stmt.finalizer
            ? (this.optimizeBlock(stmt.finalizer) as BlockStatement)
            : null,
        };

      default:
        return stmt;
    }
  }

  /**
   * Optimize a block statement
   */
  private optimizeBlock(block: BlockStatement): BlockStatement {
    return {
      ...block,
      body: this.eliminateDeadStatements(block.body),
    };
  }

  /**
   * Optimize an if statement
   */
  private optimizeIf(stmt: IfStatement): Statement | null {
    // Check for constant condition
    const constantValue = this.evaluateConstantBoolean(stmt.test);

    if (constantValue !== null) {
      this.stats.constantBranches++;

      if (constantValue) {
        // Condition is always true, keep only consequent
        this.stats.statementsRemoved++; // Count the eliminated branch
        return this.optimizeStatement(stmt.consequent);
      } else {
        // Condition is always false, keep only alternate
        this.stats.statementsRemoved++; // Count the eliminated branch
        return stmt.alternate ? this.optimizeStatement(stmt.alternate) : null;
      }
    }

    // Optimize both branches
    const consequent = this.optimizeStatement(stmt.consequent);
    const alternate = stmt.alternate ? this.optimizeStatement(stmt.alternate) : null;

    // If both branches are eliminated, remove the entire if statement
    if (!consequent && !alternate) {
      return null;
    }

    return {
      ...stmt,
      consequent: consequent || { type: 'EmptyStatement' },
      alternate,
    };
  }

  /**
   * Optimize a function declaration
   */
  private optimizeFunction(func: FunctionDeclaration): FunctionDeclaration {
    return {
      ...func,
      body: this.optimizeBlock(func.body) as BlockStatement,
    };
  }

  /**
   * Try to evaluate a constant boolean expression
   * Returns true, false, or null if not constant
   */
  private evaluateConstantBoolean(expr: Expression): boolean | null {
    switch (expr.type) {
      case 'BooleanLiteral':
        return expr.value;

      case 'NumericLiteral':
        return expr.value !== 0;

      case 'StringLiteral':
        return expr.value.length > 0;

      case 'NullLiteral':
        return false;

      case 'UnaryExpression':
        if (expr.operator === '!') {
          const inner = this.evaluateConstantBoolean(expr.argument);
          return inner !== null ? !inner : null;
        }
        return null;

      case 'LogicalExpression':
        const left = this.evaluateConstantBoolean(expr.left);
        const right = this.evaluateConstantBoolean(expr.right);

        if (expr.operator === '&&') {
          if (left === false) return false;
          if (left === true && right !== null) return right;
        } else if (expr.operator === '||') {
          if (left === true) return true;
          if (left === false && right !== null) return right;
        }
        return null;

      default:
        return null;
    }
  }
}
