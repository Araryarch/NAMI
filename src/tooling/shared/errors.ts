/**
 * Core error types and shared interfaces for Nami Developer Tooling
 */

import { Position, SourceSpan } from '../../../src/lexer/token';

/**
 * Base error type for all tooling errors
 */
export abstract class ToolingError extends Error {
  abstract readonly component: string;
  readonly code?: string;

  constructor(
    message: string,
    code?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/**
 * Syntax errors detected during parsing
 */
export class SyntaxError extends ToolingError {
  readonly component = 'syntax';

  constructor(
    message: string,
    public readonly location: SourceSpan,
    public readonly suggestions: string[] = [],
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Semantic errors detected during analysis
 */
export class SemanticError extends ToolingError {
  readonly component = 'semantic';

  constructor(
    message: string,
    public readonly location: SourceSpan,
    public readonly quickFixes: QuickFix[] = [],
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * System errors (I/O, network, resources)
 */
export class SystemError extends ToolingError {
  readonly component = 'system';

  constructor(
    message: string,
    public readonly operation: string,
    cause?: Error,
    code?: string
  ) {
    super(message, code, cause);
  }
}

/**
 * LSP protocol communication errors
 */
export class ProtocolError extends ToolingError {
  readonly component = 'protocol';

  constructor(
    message: string,
    public readonly requestId?: string,
    code?: string
  ) {
    super(message, code);
  }
}

/**
 * Quick fix suggestion for resolving errors
 */
export interface QuickFix {
  title: string;
  edits: TextEdit[];
}

/**
 * Text edit for applying fixes
 */
export interface TextEdit {
  range: Range;
  newText: string;
}

/**
 * Position range in source code
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Diagnostic severity levels
 */
export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

/**
 * Diagnostic information for reporting issues
 */
export interface Diagnostic {
  severity: DiagnosticSeverity;
  range: Range;
  message: string;
  code?: string;
  source: string;
  quickFixes: QuickFix[];
}
