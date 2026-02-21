/**
 * Token types and Token class for the NAMI Lexer
 * Requirements: 1.1 - Source code parsing according to NAMI grammar specification
 */

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Keywords
  LET = 'LET',
  CONST = 'CONST',
  FUNCTION = 'FUNCTION',
  FN = 'FN', // NAMI: fn keyword (shorthand for function)
  RETURN = 'RETURN',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  DO = 'DO',
  LOOP = 'LOOP', // NAMI: infinite loop
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  SWITCH = 'SWITCH',
  CASE = 'CASE',
  DEFAULT = 'DEFAULT',
  ASYNC = 'ASYNC',
  AWAIT = 'AWAIT',
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',
  THROW = 'THROW',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  NEW = 'NEW',
  TYPEOF = 'TYPEOF',
  VOID = 'VOID',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  CLASS = 'CLASS',
  EXTENDS = 'EXTENDS',
  SUPER = 'SUPER',
  THIS = 'THIS',
  IN = 'IN',
  OF = 'OF',
  VAR = 'VAR',
  PRINT = 'PRINT', // NAMI: built-in print
  PRINTLN = 'PRINTLN', // NAMI: built-in println

  // Operators
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  STAR = 'STAR', // *
  SLASH = 'SLASH', // /
  PERCENT = 'PERCENT', // %
  POWER = 'POWER', // **
  ASSIGN = 'ASSIGN', // =
  PLUS_ASSIGN = 'PLUS_ASSIGN', // +=
  MINUS_ASSIGN = 'MINUS_ASSIGN', // -=
  STAR_ASSIGN = 'STAR_ASSIGN', // *=
  SLASH_ASSIGN = 'SLASH_ASSIGN', // /=
  PERCENT_ASSIGN = 'PERCENT_ASSIGN', // %=
  EQUAL = 'EQUAL', // ==
  NOT_EQUAL = 'NOT_EQUAL', // !=
  STRICT_EQUAL = 'STRICT_EQUAL', // ===
  STRICT_NOT_EQUAL = 'STRICT_NOT_EQUAL', // !==
  LESS = 'LESS', // <
  GREATER = 'GREATER', // >
  LESS_EQUAL = 'LESS_EQUAL', // <=
  GREATER_EQUAL = 'GREATER_EQUAL', // >=
  AND = 'AND', // &&
  OR = 'OR', // ||
  NOT = 'NOT', // !
  BITWISE_AND = 'BITWISE_AND', // &
  BITWISE_OR = 'BITWISE_OR', // |
  BITWISE_XOR = 'BITWISE_XOR', // ^
  BITWISE_NOT = 'BITWISE_NOT', // ~
  LEFT_SHIFT = 'LEFT_SHIFT', // <<
  RIGHT_SHIFT = 'RIGHT_SHIFT', // >>
  INCREMENT = 'INCREMENT', // ++
  DECREMENT = 'DECREMENT', // --
  ARROW = 'ARROW', // =>
  QUESTION = 'QUESTION', // ?
  COLON = 'COLON', // :
  NULLISH = 'NULLISH', // ??
  OPTIONAL_CHAIN = 'OPTIONAL_CHAIN', // ?.
  SPREAD = 'SPREAD', // ...
  RANGE = 'RANGE', // .. (NAMI: range operator)

  // Punctuation
  LEFT_PAREN = 'LEFT_PAREN', // (
  RIGHT_PAREN = 'RIGHT_PAREN', // )
  LEFT_BRACE = 'LEFT_BRACE', // {
  RIGHT_BRACE = 'RIGHT_BRACE', // }
  LEFT_BRACKET = 'LEFT_BRACKET', // [
  RIGHT_BRACKET = 'RIGHT_BRACKET', // ]
  SEMICOLON = 'SEMICOLON', // ;
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .

  // Comments (preserved for LSP)
  COMMENT = 'COMMENT',
  BLOCK_COMMENT = 'BLOCK_COMMENT',

  // Error recovery
  ERROR = 'ERROR',

  // Special
  EOF = 'EOF',
}

/** Map of NAMI keywords to their token types */
export const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.LET,
  const: TokenType.CONST,
  function: TokenType.FUNCTION,
  fn: TokenType.FN,
  return: TokenType.RETURN,
  if: TokenType.IF,
  else: TokenType.ELSE,
  for: TokenType.FOR,
  while: TokenType.WHILE,
  do: TokenType.DO,
  loop: TokenType.LOOP,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
  switch: TokenType.SWITCH,
  case: TokenType.CASE,
  default: TokenType.DEFAULT,
  async: TokenType.ASYNC,
  await: TokenType.AWAIT,
  try: TokenType.TRY,
  catch: TokenType.CATCH,
  finally: TokenType.FINALLY,
  throw: TokenType.THROW,
  import: TokenType.IMPORT,
  export: TokenType.EXPORT,
  from: TokenType.FROM,
  new: TokenType.NEW,
  typeof: TokenType.TYPEOF,
  void: TokenType.VOID,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  null: TokenType.NULL,
  class: TokenType.CLASS,
  extends: TokenType.EXTENDS,
  super: TokenType.SUPER,
  this: TokenType.THIS,
  in: TokenType.IN,
  of: TokenType.OF,
  var: TokenType.VAR,
  print: TokenType.PRINT,
  println: TokenType.PRINTLN,
};

/** Source position for error reporting */
export interface Position {
  line: number;
  column: number;
  offset: number;
}

/** Source span (start + end positions) */
export interface SourceSpan {
  start: Position;
  end: Position;
}

/** Token with position tracking */
export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly lexeme: string,
    public readonly line: number,
    public readonly column: number,
    public readonly offset: number = 0,
    public readonly literal?: unknown
  ) {}

  /** Get the source span of this token */
  get span(): SourceSpan {
    return {
      start: { line: this.line, column: this.column, offset: this.offset },
      end: {
        line: this.line,
        column: this.column + this.lexeme.length,
        offset: this.offset + this.lexeme.length,
      },
    };
  }

  /** Check if this token is a keyword */
  isKeyword(): boolean {
    return Object.values(KEYWORDS).includes(this.type);
  }

  /** Check if this token is a literal */
  isLiteral(): boolean {
    return [
      TokenType.NUMBER,
      TokenType.STRING,
      TokenType.BOOLEAN,
      TokenType.NULL,
      TokenType.TRUE,
      TokenType.FALSE,
    ].includes(this.type);
  }

  /** Check if this token is an operator */
  isOperator(): boolean {
    return [
      TokenType.PLUS,
      TokenType.MINUS,
      TokenType.STAR,
      TokenType.SLASH,
      TokenType.PERCENT,
      TokenType.POWER,
      TokenType.ASSIGN,
      TokenType.PLUS_ASSIGN,
      TokenType.MINUS_ASSIGN,
      TokenType.STAR_ASSIGN,
      TokenType.SLASH_ASSIGN,
      TokenType.PERCENT_ASSIGN,
      TokenType.EQUAL,
      TokenType.NOT_EQUAL,
      TokenType.STRICT_EQUAL,
      TokenType.STRICT_NOT_EQUAL,
      TokenType.LESS,
      TokenType.GREATER,
      TokenType.LESS_EQUAL,
      TokenType.GREATER_EQUAL,
      TokenType.AND,
      TokenType.OR,
      TokenType.NOT,
      TokenType.BITWISE_AND,
      TokenType.BITWISE_OR,
      TokenType.BITWISE_XOR,
      TokenType.BITWISE_NOT,
      TokenType.LEFT_SHIFT,
      TokenType.RIGHT_SHIFT,
      TokenType.INCREMENT,
      TokenType.DECREMENT,
      TokenType.ARROW,
      TokenType.QUESTION,
      TokenType.COLON,
      TokenType.NULLISH,
      TokenType.OPTIONAL_CHAIN,
      TokenType.SPREAD,
      TokenType.RANGE,
    ].includes(this.type);
  }

  /** Check if this token is punctuation */
  isPunctuation(): boolean {
    return [
      TokenType.LEFT_PAREN,
      TokenType.RIGHT_PAREN,
      TokenType.LEFT_BRACE,
      TokenType.RIGHT_BRACE,
      TokenType.LEFT_BRACKET,
      TokenType.RIGHT_BRACKET,
      TokenType.SEMICOLON,
      TokenType.COMMA,
      TokenType.DOT,
    ].includes(this.type);
  }

  /** Check if this token is a comment */
  isComment(): boolean {
    return [TokenType.COMMENT, TokenType.BLOCK_COMMENT].includes(this.type);
  }

  toString(): string {
    return `Token(${this.type}, '${this.lexeme}', ${this.line}:${this.column})`;
  }
}
