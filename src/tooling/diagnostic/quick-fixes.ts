/**
 * Quick Fix Provider for Nami Developer Tooling
 * 
 * Generates and applies quick fixes for common code issues.
 * 
 * Requirements: 5.4
 */

import { QuickFix, TextEdit, Diagnostic } from '../shared/errors';

/**
 * Quick Fix Provider
 * 
 * Provides intelligent quick fix suggestions for diagnostics.
 */
export class QuickFixProvider {
  /**
   * Generate quick fixes for a diagnostic
   * Requirements: 5.4
   */
  generateQuickFixes(diagnostic: Diagnostic, _source: string): QuickFix[] {
    const quickFixes: QuickFix[] = [];

    // Add diagnostic-specific quick fixes
    if (diagnostic.code === 'SEMANTIC_ERROR') {
      quickFixes.push(...this.generateSemanticQuickFixes(diagnostic));
    } else if (diagnostic.code === 'PARSE_ERROR') {
      quickFixes.push(...this.generateSyntaxQuickFixes(diagnostic));
    } else if (diagnostic.code === 'UNREACHABLE_CODE') {
      quickFixes.push(...this.generateUnreachableCodeQuickFixes(diagnostic));
    }

    return quickFixes;
  }

  /**
   * Apply a quick fix to source code
   * Requirements: 5.4
   */
  applyQuickFix(source: string, quickFix: QuickFix): string {
    let result = source;
    
    // Apply edits in reverse order to maintain positions
    const sortedEdits = [...quickFix.edits].sort((a, b) => {
      if (a.range.start.line !== b.range.start.line) {
        return b.range.start.line - a.range.start.line;
      }
      return b.range.start.column - a.range.start.column;
    });

    for (const edit of sortedEdits) {
      result = this.applyTextEdit(result, edit);
    }

    return result;
  }

  /**
   * Generate quick fixes for semantic errors
   */
  private generateSemanticQuickFixes(diagnostic: Diagnostic): QuickFix[] {
    const quickFixes: QuickFix[] = [];
    const message = diagnostic.message.toLowerCase();

    // Undefined variable
    if (message.includes('undefined variable')) {
      const match = diagnostic.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        quickFixes.push({
          title: `Declare variable '${varName}'`,
          edits: [{
            range: {
              start: { line: diagnostic.range.start.line, column: 1, offset: 0 },
              end: { line: diagnostic.range.start.line, column: 1, offset: 0 }
            },
            newText: `let ${varName};\n`
          }]
        });
      }
    }

    // Cannot assign to constant
    if (message.includes('cannot assign to constant')) {
      const match = diagnostic.message.match(/'([^']+)'/);
      if (match) {
        const varName = match[1];
        // Find the const declaration and suggest changing to let
        quickFixes.push({
          title: `Change '${varName}' to use 'let' instead of 'const'`,
          edits: [] // Would need AST traversal to find exact location
        });
      }
    }

    return quickFixes;
  }

  /**
   * Generate quick fixes for syntax errors
   */
  private generateSyntaxQuickFixes(diagnostic: Diagnostic): QuickFix[] {
    const quickFixes: QuickFix[] = [];
    const message = diagnostic.message.toLowerCase();

    // Missing semicolon
    if (message.includes('expected') && message.includes('semicolon')) {
      quickFixes.push({
        title: 'Add semicolon',
        edits: [{
          range: {
            start: diagnostic.range.end,
            end: diagnostic.range.end
          },
          newText: ';'
        }]
      });
    }

    // Missing closing brace
    if (message.includes('expected') && message.includes('}')) {
      quickFixes.push({
        title: 'Add closing brace',
        edits: [{
          range: {
            start: diagnostic.range.end,
            end: diagnostic.range.end
          },
          newText: '\n}'
        }]
      });
    }

    // Missing closing bracket
    if (message.includes('expected') && message.includes(']')) {
      quickFixes.push({
        title: 'Add closing bracket',
        edits: [{
          range: {
            start: diagnostic.range.end,
            end: diagnostic.range.end
          },
          newText: ']'
        }]
      });
    }

    // Missing closing paren
    if (message.includes('expected') && message.includes(')')) {
      quickFixes.push({
        title: 'Add closing parenthesis',
        edits: [{
          range: {
            start: diagnostic.range.end,
            end: diagnostic.range.end
          },
          newText: ')'
        }]
      });
    }

    return quickFixes;
  }

  /**
   * Generate quick fixes for unreachable code
   */
  private generateUnreachableCodeQuickFixes(diagnostic: Diagnostic): QuickFix[] {
    return [{
      title: 'Remove unreachable code',
      edits: [{
        range: diagnostic.range,
        newText: ''
      }]
    }];
  }

  /**
   * Apply a single text edit to source code
   */
  private applyTextEdit(source: string, edit: TextEdit): string {
    const lines = source.split('\n');
    const startLine = edit.range.start.line - 1;
    const endLine = edit.range.end.line - 1;
    const startCol = edit.range.start.column - 1;
    const endCol = edit.range.end.column - 1;

    if (startLine < 0 || startLine >= lines.length) {
      return source;
    }

    if (startLine === endLine) {
      // Single line edit
      const line = lines[startLine];
      lines[startLine] = 
        line.substring(0, startCol) + 
        edit.newText + 
        line.substring(endCol);
    } else {
      // Multi-line edit
      const firstLine = lines[startLine].substring(0, startCol);
      const lastLine = endLine < lines.length ? lines[endLine].substring(endCol) : '';
      
      lines.splice(
        startLine,
        endLine - startLine + 1,
        firstLine + edit.newText + lastLine
      );
    }

    return lines.join('\n');
  }

  /**
   * Validate that a quick fix is applicable
   */
  isQuickFixApplicable(quickFix: QuickFix, source: string): boolean {
    try {
      // Try to apply the quick fix
      this.applyQuickFix(source, quickFix);
      return true;
    } catch {
      return false;
    }
  }
}