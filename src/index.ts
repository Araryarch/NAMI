/**
 * NAMI Language Compiler
 * Main entry point for the compiler library
 */

export { version } from './version';

// Core compiler modules
export { Lexer, LexError, Token, TokenType, KEYWORDS } from './lexer';
export type { Position, SourceSpan } from './lexer';

export { Parser, ParseError } from './parser';
export type { Program, Statement, Expression, ASTNode } from './parser';

export { SemanticAnalyzer, SemanticError, SymbolTable, Scope } from './analyzer';
export type { SymbolInfo, SymbolKind } from './analyzer';

export { CodeGenerator } from './codegen';
export type { GeneratedCode } from './codegen';

export { Compiler } from './compiler';
export type { CompilerOptions, CompilerResult, CompilerError } from './compiler';

export { PrettyPrinter } from './printer';

// Optimizer
export { Optimizer, DeadCodeEliminator, FunctionInliner } from './optimizer';
export type {
  OptimizationLevel,
  OptimizerOptions,
  OptimizationStats,
  DeadCodeStats,
  InliningStats,
  InliningOptions,
} from './optimizer';

// Type system
export { Types, typeEquals, isAssignable, toCType, coerceTypes, typeToString } from './types';
export type { NamiType, PrimitiveType, ArrayType, FunctionType, ObjectType } from './types';

// Standard library
export { quicksort, mergesort, heapsort, sort, Graph, BinarySearchTree, TreeNode } from './stdlib';
