/**
 * Shared types and interfaces for Nami Developer Tooling
 */

import { SourceSpan } from '../../../src/lexer/token';
import { TokenType } from '../../../src/lexer/token';

/**
 * Enhanced token with additional metadata for tooling
 */
export interface ToolingToken {
  kind: TokenType;
  text: string;
  position: SourceSpan;
  trivia: Trivia[];
}

/**
 * Trivia (comments and whitespace) associated with tokens
 */
export interface Trivia {
  kind: TriviaKind;
  text: string;
  position: SourceSpan;
}

/**
 * Types of trivia
 */
export enum TriviaKind {
  Whitespace = 'whitespace',
  LineComment = 'line-comment',
  BlockComment = 'block-comment',
}

/**
 * Symbol information for LSP and navigation
 */
export interface Symbol {
  name: string;
  kind: SymbolKind;
  range: SourceSpan;
  selectionRange: SourceSpan;
  detail?: string;
  documentation?: string;
  references: Location[];
}

/**
 * Symbol kinds for LSP
 */
export enum SymbolKind {
  Function = 1,
  Variable = 2,
  Parameter = 3,
  Module = 4,
  Namespace = 5,
  Class = 6,
  Method = 7,
  Property = 8,
  Field = 9,
  Constructor = 10,
  Enum = 11,
  Interface = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
}

/**
 * Location in source code
 */
export interface Location {
  uri: string;
  range: SourceSpan;
}

/**
 * Workspace model for multi-file projects
 */
export interface Workspace {
  rootPath: string;
  files: Map<string, SourceFile>;
  configuration: any; // Will be typed when config is implemented
  symbolTable: Map<string, Symbol[]>;
}

/**
 * Source file representation
 */
export interface SourceFile {
  path: string;
  content: string;
  version: number;
  tokens?: ToolingToken[];
  ast?: any; // Will be typed when AST is enhanced
  diagnostics: any[]; // Will be typed when diagnostics are implemented
  symbols: Symbol[];
}

/**
 * Completion item for LSP
 */
export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
  filterText?: string;
}

/**
 * Completion item kinds
 */
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

/**
 * Hover information
 */
export interface Hover {
  contents: string | string[];
  range?: SourceSpan;
}

/**
 * Text change for incremental updates
 */
export interface TextChange {
  range: SourceSpan;
  text: string;
}

/**
 * Document symbol for outline
 */
export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  range: SourceSpan;
  selectionRange: SourceSpan;
  children?: DocumentSymbol[];
}

/**
 * Workspace symbol information
 */
export interface SymbolInformation {
  name: string;
  kind: SymbolKind;
  location: Location;
  containerName?: string;
}
