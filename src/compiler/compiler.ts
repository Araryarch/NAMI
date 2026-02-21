/**
 * NAMI Compiler - Main compilation pipeline
 * Lexer → Parser → Semantic Analyzer → Code Generator
 */

import { Lexer } from '../lexer';
import { Parser, Program } from '../parser';
import { SemanticAnalyzer, SymbolTable } from '../analyzer';
import { CodeGenerator, GeneratedCode } from '../codegen';
import { Optimizer, OptimizationLevel } from '../optimizer';

export interface CompilerOptions {
  optimization: OptimizationLevel;
  loopGuard: boolean;
  loopThreshold: number;
}

export interface CompilerResult {
  success: boolean;
  output?: GeneratedCode;
  ast?: Program;
  symbolTable?: SymbolTable;
  errors: CompilerError[];
}

export interface CompilerError {
  type: 'lex' | 'parse' | 'semantic';
  message: string;
  line?: number;
  column?: number;
}

const DEFAULT_OPTIONS: CompilerOptions = {
  optimization: 'debug',
  loopGuard: true,
  loopThreshold: 1000000,
};

export class Compiler {
  private options: CompilerOptions;

  constructor(options?: Partial<CompilerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Compile NAMI source code to C */
  compile(source: string): CompilerResult {
    const errors: CompilerError[] = [];

    // Step 1: Lexing
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const lexErrors = lexer.getErrors();

    for (const err of lexErrors) {
      errors.push({
        type: 'lex',
        message: err.message,
        line: err.line,
        column: err.column,
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Step 2: Parsing
    const parser = new Parser(
      undefined,
      tokens.filter((t) => t.type !== 'COMMENT' && t.type !== 'BLOCK_COMMENT')
    );
    const ast = parser.parse();
    const parseErrors = parser.getErrors();

    for (const err of parseErrors) {
      errors.push({
        type: 'parse',
        message: err.message,
        line: err.line,
        column: err.column,
      });
    }

    if (errors.length > 0) {
      return { success: false, ast, errors };
    }

    // Step 3: Semantic Analysis
    const analyzer = new SemanticAnalyzer();
    const { errors: semanticErrors, symbolTable } = analyzer.analyze(ast);

    for (const err of semanticErrors) {
      errors.push({
        type: 'semantic',
        message: err.message,
        line: err.line,
        column: err.column,
      });
    }

    if (errors.length > 0) {
      return { success: false, ast, symbolTable, errors };
    }

    // Step 4: Optimization (if enabled)
    let optimizedAst = ast;
    if (this.options.optimization !== 'debug') {
      const optimizer = new Optimizer({ level: this.options.optimization });
      optimizedAst = optimizer.optimize(ast);
    }

    // Step 5: Code Generation
    const codegen = new CodeGenerator(this.options.optimization);
    const output = codegen.generate(optimizedAst, symbolTable);

    return {
      success: true,
      output,
      ast: optimizedAst,
      symbolTable,
      errors: [],
    };
  }

  /** Parse only (for LSP and other tools) */
  parse(source: string): { ast: Program; errors: CompilerError[] } {
    const errors: CompilerError[] = [];
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    for (const err of lexer.getErrors()) {
      errors.push({ type: 'lex', message: err.message, line: err.line, column: err.column });
    }

    const parser = new Parser(
      undefined,
      tokens.filter((t) => t.type !== 'COMMENT' && t.type !== 'BLOCK_COMMENT')
    );
    const ast = parser.parse();

    for (const err of parser.getErrors()) {
      errors.push({ type: 'parse', message: err.message, line: err.line, column: err.column });
    }

    return { ast, errors };
  }
}
