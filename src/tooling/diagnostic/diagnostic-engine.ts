/**
 * Diagnostic Engine for Nami Developer Tooling
 *
 * Integrates with the semantic analyzer to provide comprehensive error reporting,
 * warnings, and quick fix suggestions.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { SemanticAnalyzer, SemanticError as AnalyzerSemanticError } from '../../analyzer/semantic';
import { Parser } from '../../parser/parser';
import { Lexer } from '../../lexer/lexer';
import { Diagnostic, DiagnosticSeverity, QuickFix, Range } from '../shared/errors';
import { SourceSpan } from '../../lexer/token';

/**
 * Options for diagnostic analysis
 */
export interface DiagnosticOptions {
  /** Enable unused variable detection */
  enableUnusedVariableWarnings?: boolean;
  /** Enable unreachable code detection */
  enableUnreachableCodeWarnings?: boolean;
  /** Maximum number of diagnostics per file */
  maxDiagnosticsPerFile?: number;
}

/**
 * Result of workspace-wide analysis
 */
export interface WorkspaceDiagnostics {
  [filePath: string]: Diagnostic[];
}

/**
 * Diagnostic Engine
 *
 * Provides comprehensive error reporting and code analysis by integrating
 * with the Nami semantic analyzer.
 */
export class DiagnosticEngine {
  private options: Required<DiagnosticOptions>;

  constructor(options: DiagnosticOptions = {}) {
    this.options = {
      enableUnusedVariableWarnings: options.enableUnusedVariableWarnings ?? true,
      enableUnreachableCodeWarnings: options.enableUnreachableCodeWarnings ?? true,
      maxDiagnosticsPerFile: options.maxDiagnosticsPerFile ?? 100,
    };
  }

  /**
   * Analyze source code and generate diagnostics
   * Requirements: 5.1, 5.2, 5.3
   */
  analyze(source: string, _filePath: string = '<unknown>'): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    try {
      // Step 1: Lexical analysis
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const lexerErrors = lexer.getErrors();

      // Convert lexer errors to diagnostics
      for (const error of lexerErrors) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: this.createRange(error.line, error.column, error.line, error.column + 1),
          message: error.message,
          code: 'LEX_ERROR',
          source: 'nami-lexer',
          quickFixes: [],
        });
      }

      // Step 2: Syntax analysis
      const parser = new Parser(source, tokens);
      let ast;
      try {
        ast = parser.parse();
        const parserErrors = parser.getErrors();

        // Convert parser errors to diagnostics
        for (const error of parserErrors) {
          const span = this.extractSpanFromError(error);
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: this.spanToRange(span),
            message: error.message,
            code: 'PARSE_ERROR',
            source: 'nami-parser',
            quickFixes: this.generateRecoverySuggestions(error.message),
          });
        }
      } catch (error) {
        // Parser threw an exception - create diagnostic
        const errorMessage = error instanceof Error ? error.message : String(error);
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: this.createRange(1, 1, 1, 1),
          message: errorMessage,
          code: 'PARSE_ERROR',
          source: 'nami-parser',
          quickFixes: [],
        });

        // Return early if parsing failed completely
        return this.limitDiagnostics(diagnostics);
      }

      // Step 3: Semantic analysis
      if (ast) {
        const analyzer = new SemanticAnalyzer();
        const { errors: semanticErrors, symbolTable } = analyzer.analyze(ast);

        // Convert semantic errors to diagnostics
        for (const error of semanticErrors) {
          const range = this.createRange(
            error.line ?? 1,
            error.column ?? 1,
            error.line ?? 1,
            (error.column ?? 1) + 10
          );

          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range,
            message: error.message,
            code: 'SEMANTIC_ERROR',
            source: 'nami-semantic',
            quickFixes: this.generateSemanticQuickFixes(error),
          });
        }

        // Step 4: Additional analysis (unused variables, unreachable code)
        if (this.options.enableUnusedVariableWarnings) {
          const unusedVarDiagnostics = this.detectUnusedVariables(ast, symbolTable);
          diagnostics.push(...unusedVarDiagnostics);
        }

        if (this.options.enableUnreachableCodeWarnings) {
          const unreachableDiagnostics = this.detectUnreachableCode(ast);
          diagnostics.push(...unreachableDiagnostics);
        }
      }
    } catch (error) {
      // Unexpected error during analysis - provide partial diagnostics
      const errorMessage = error instanceof Error ? error.message : String(error);
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: this.createRange(1, 1, 1, 1),
        message: `Analysis failed: ${errorMessage}`,
        code: 'ANALYSIS_ERROR',
        source: 'nami-diagnostic',
        quickFixes: [],
      });
    }

    return this.limitDiagnostics(diagnostics);
  }

  /**
   * Analyze multiple files in a workspace
   * Requirements: 5.1, 5.2, 5.3
   */
  analyzeWorkspace(files: Map<string, string>): WorkspaceDiagnostics {
    const result: WorkspaceDiagnostics = {};

    for (const [filePath, source] of files.entries()) {
      result[filePath] = this.analyze(source, filePath);
    }

    return result;
  }

  /**
   * Generate quick fix suggestions for semantic errors
   * Requirements: 5.4
   */
  private generateSemanticQuickFixes(error: AnalyzerSemanticError): QuickFix[] {
    const quickFixes: QuickFix[] = [];
    const message = error.message.toLowerCase();

    // Undefined variable - suggest declaration
    if (message.includes('undefined variable')) {
      const match = error.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        quickFixes.push({
          title: `Declare variable '${varName}'`,
          edits: [
            {
              range: this.createRange(error.line ?? 1, 1, error.line ?? 1, 1),
              newText: `let ${varName};\n`,
            },
          ],
        });
      }
    }

    // Cannot assign to constant - suggest using let
    if (message.includes('cannot assign to constant')) {
      const match = error.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        quickFixes.push({
          title: `Change '${varName}' to 'let'`,
          edits: [
            {
              range: this.createRange(error.line ?? 1, 1, error.line ?? 1, 6),
              newText: 'let',
            },
          ],
        });
      }
    }

    return quickFixes;
  }

  /**
   * Generate recovery suggestions for syntax errors
   * Requirements: 5.5
   */
  private generateRecoverySuggestions(errorMessage: string): QuickFix[] {
    const quickFixes: QuickFix[] = [];
    const message = errorMessage.toLowerCase();

    // Missing semicolon
    if (message.includes('expected') && message.includes('semicolon')) {
      // Note: We can't provide exact position without more context
      // This is a placeholder for the structure
    }

    // Missing closing brace/bracket/paren
    if (
      message.includes('expected') &&
      (message.includes('}') || message.includes(']') || message.includes(')'))
    ) {
      // Placeholder for recovery suggestion
    }

    return quickFixes;
  }

  /**
   * Detect unused variables
   * Requirements: 5.6
   */
  private detectUnusedVariables(_ast: any, symbolTable: any): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Get all scopes from symbol table
    const scopes = symbolTable.getAllScopes();

    for (const scope of scopes) {
      for (const [_name, symbol] of scope.symbols.entries()) {
        // Skip built-in functions and parameters
        if (symbol.kind === 'function' && scope.parent === null) {
          continue; // Skip global functions (likely built-ins)
        }

        if (symbol.kind === 'parameter') {
          continue; // Parameters are often intentionally unused
        }

        // Check if variable is used (simplified - would need full reference tracking)
        // For now, we'll mark variables that are declared but this is a placeholder
        // A full implementation would track all references
        if (symbol.kind === 'variable' && symbol.declared) {
          // This is a simplified check - in a real implementation,
          // we'd need to track all references to determine if it's actually unused
          // For now, we'll skip this to avoid false positives
        }
      }
    }

    return diagnostics;
  }

  /**
   * Detect unreachable code
   * Requirements: 5.7
   */
  private detectUnreachableCode(ast: any): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Walk the AST to find unreachable code after return/break/continue
    const checkStatements = (statements: any[]): void => {
      let foundTerminator = false;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        if (foundTerminator) {
          // Code after terminator is unreachable
          if (stmt.span) {
            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: this.spanToRange(stmt.span),
              message: 'Unreachable code detected',
              code: 'UNREACHABLE_CODE',
              source: 'nami-diagnostic',
              quickFixes: [
                {
                  title: 'Remove unreachable code',
                  edits: [
                    {
                      range: this.spanToRange(stmt.span),
                      newText: '',
                    },
                  ],
                },
              ],
            });
          }
        }

        // Check if this statement is a terminator
        if (
          stmt.type === 'ReturnStatement' ||
          stmt.type === 'BreakStatement' ||
          stmt.type === 'ContinueStatement' ||
          stmt.type === 'ThrowStatement'
        ) {
          foundTerminator = true;
        }

        // Recursively check nested blocks
        if (stmt.type === 'BlockStatement' && stmt.body) {
          checkStatements(stmt.body);
        } else if (stmt.type === 'IfStatement') {
          if (stmt.consequent?.type === 'BlockStatement') {
            checkStatements(stmt.consequent.body);
          }
          if (stmt.alternate?.type === 'BlockStatement') {
            checkStatements(stmt.alternate.body);
          }
        } else if (stmt.type === 'FunctionDeclaration' && stmt.body?.body) {
          checkStatements(stmt.body.body);
        } else if (stmt.type === 'LoopStatement' && stmt.body?.type === 'BlockStatement') {
          // Check inside loop body
          checkStatements(stmt.body.body);
        } else if (stmt.type === 'WhileStatement' && stmt.body?.type === 'BlockStatement') {
          checkStatements(stmt.body.body);
        } else if (stmt.type === 'DoWhileStatement' && stmt.body?.type === 'BlockStatement') {
          checkStatements(stmt.body.body);
        } else if (stmt.type === 'ForStatement' && stmt.body?.type === 'BlockStatement') {
          checkStatements(stmt.body.body);
        }
      }
    };

    if (ast && ast.body) {
      checkStatements(ast.body);
    }

    return diagnostics;
  }

  /**
   * Convert SourceSpan to Range
   */
  private spanToRange(span: SourceSpan): Range {
    return {
      start: span.start,
      end: span.end,
    };
  }

  /**
   * Create a Range from line/column coordinates
   */
  private createRange(startLine: number, startCol: number, endLine: number, endCol: number): Range {
    return {
      start: { line: startLine, column: startCol, offset: 0 },
      end: { line: endLine, column: endCol, offset: 0 },
    };
  }

  /**
   * Extract span from error object
   */
  private extractSpanFromError(error: any): SourceSpan {
    if (error.line !== undefined && error.column !== undefined) {
      return {
        start: { line: error.line, column: error.column, offset: 0 },
        end: { line: error.line, column: error.column + 1, offset: 0 },
      };
    }
    return {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    };
  }

  /**
   * Limit diagnostics to configured maximum
   */
  private limitDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
    if (diagnostics.length <= this.options.maxDiagnosticsPerFile) {
      return diagnostics;
    }

    const limited = diagnostics.slice(0, this.options.maxDiagnosticsPerFile);
    limited.push({
      severity: DiagnosticSeverity.Information,
      range: this.createRange(1, 1, 1, 1),
      message: `Too many diagnostics (${diagnostics.length}). Showing first ${this.options.maxDiagnosticsPerFile}.`,
      code: 'TOO_MANY_DIAGNOSTICS',
      source: 'nami-diagnostic',
      quickFixes: [],
    });

    return limited;
  }
}
