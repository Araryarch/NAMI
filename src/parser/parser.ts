/**
 * NAMI Parser - Recursive descent parser for NAMI language
 * Requirements: 1.1, 3.1-3.6, 4.1
 */

import { Token, TokenType } from '../lexer/token';
import { Lexer } from '../lexer/lexer';
import {
  Program,
  Statement,
  Expression,
  VariableDeclaration,
  FunctionDeclaration,
  IfStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  SwitchStatement,
  SwitchCase,
  BlockStatement,
  ExpressionStatement,
  TryCatchStatement,
  ThrowStatement,
  ImportStatement,
  ExportStatement,
  Identifier,
  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  NullLiteral,
  ArrayExpression,
  ObjectExpression,
  ObjectProperty,
  BinaryExpression,
  LogicalExpression,
  UnaryExpression,
  UpdateExpression,
  ConditionalExpression,
  CallExpression,
  MemberExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  AwaitExpression,
  SpreadElement,
  Parameter,
  EmptyStatement,
  NewExpression,
  ThisExpression,
  TypeofExpression,
  ForInStatement,
  ForOfStatement,
  LoopStatement,
  PrintStatement,
  NamiImportStatement,
  RangeExpression,
} from './ast';

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly token: Token,
    public readonly line: number,
    public readonly column: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  private errors: ParseError[] = [];

  constructor(
    private source?: string,
    tokens?: Token[]
  ) {
    if (tokens) {
      this.tokens = tokens;
    }
  }

  /** Parse the source into a Program AST */
  parse(): Program {
    if (this.tokens.length === 0 && this.source) {
      const lexer = new Lexer(this.source);
      this.tokens = lexer
        .tokenize()
        .filter((t) => t.type !== TokenType.COMMENT && t.type !== TokenType.BLOCK_COMMENT);
    }

    // Ensure we have at least an EOF token
    if (this.tokens.length === 0) {
      this.tokens = [new Token(TokenType.EOF, '', 1, 1, 0)];
    }

    this.current = 0;
    this.errors = [];

    const body: Statement[] = [];
    while (!this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      } catch (e) {
        if (e instanceof ParseError) {
          this.errors.push(e);
          this.synchronize();
        } else {
          throw e;
        }
      }
    }

    return { type: 'Program', body };
  }

  getErrors(): ParseError[] {
    return this.errors;
  }

  // ── Statement Parsing ──────────────────────────────────

  private parseStatement(): Statement {
    switch (this.peek().type) {
      case TokenType.LET:
      case TokenType.CONST:
      case TokenType.VAR:
        return this.parseVariableDeclaration();
      case TokenType.FUNCTION:
      case TokenType.FN: // NAMI: fn keyword
        return this.parseFunctionDeclaration(false);
      case TokenType.ASYNC:
        if (this.peekNext().type === TokenType.FUNCTION || this.peekNext().type === TokenType.FN) {
          return this.parseFunctionDeclaration(true);
        }
        return this.parseExpressionStatement();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.DO:
        return this.parseDoWhileStatement();
      case TokenType.LOOP: // NAMI: loop { ... }
        return this.parseLoopStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      case TokenType.BREAK:
        return this.parseBreakStatement();
      case TokenType.CONTINUE:
        return this.parseContinueStatement();
      case TokenType.SWITCH:
        return this.parseSwitchStatement();
      case TokenType.LEFT_BRACE:
        return this.parseBlockStatement();
      case TokenType.TRY:
        return this.parseTryCatchStatement();
      case TokenType.THROW:
        return this.parseThrowStatement();
      case TokenType.IMPORT:
        return this.parseImportStatement();
      case TokenType.EXPORT:
        return this.parseExportStatement();
      case TokenType.PRINT: // NAMI: print(...)
      case TokenType.PRINTLN: // NAMI: println(...)
        return this.parsePrintStatement();
      case TokenType.SEMICOLON:
        this.advance();
        return { type: 'EmptyStatement' } as EmptyStatement;
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const kindToken = this.advance();
    const kind = kindToken.lexeme as 'let' | 'const' | 'var';
    const span = kindToken.span;

    const declarations = [];
    do {
      const id = this.parseIdentifierOrPattern();
      let init: Expression | null = null;
      if (this.match(TokenType.ASSIGN)) {
        init = this.parseAssignmentExpression();
      }
      declarations.push({
        type: 'VariableDeclarator' as const,
        id,
        init,
        span,
      });
    } while (this.match(TokenType.COMMA));

    this.consumeOptionalSemicolon();
    return { type: 'VariableDeclaration', kind, declarations, span };
  }

  private parseIdentifierOrPattern(): Identifier {
    return this.parseIdentifier();
  }

  private parseFunctionDeclaration(isAsync: boolean): FunctionDeclaration {
    if (isAsync) this.advance(); // consume 'async'
    // Support both 'function' and 'fn' keywords
    let funcToken: Token;
    if (this.check(TokenType.FN)) {
      funcToken = this.advance();
    } else {
      funcToken = this.expect(TokenType.FUNCTION, "Expected 'function' or 'fn'");
    }
    const id = this.parseIdentifier();
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after function name");
    const params = this.parseParameterList();
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    const body = this.parseBlockStatement();

    return {
      type: 'FunctionDeclaration',
      id,
      params,
      body,
      async: isAsync,
      generator: false,
      span: funcToken.span,
    };
  }

  private parseParameterList(): Parameter[] {
    const params: Parameter[] = [];
    if (this.peek().type === TokenType.RIGHT_PAREN) return params;

    do {
      let rest = false;
      if (this.match(TokenType.SPREAD)) {
        rest = true;
      }
      const name = this.parseIdentifier().name;
      let defaultValue: Expression | undefined;
      if (this.match(TokenType.ASSIGN)) {
        defaultValue = this.parseAssignmentExpression();
      }
      params.push({ type: 'Parameter', name, rest, defaultValue });
    } while (this.match(TokenType.COMMA));

    return params;
  }

  private parseIfStatement(): IfStatement {
    const ifToken = this.advance(); // consume 'if'
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after 'if'");
    const test = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after if condition");
    const consequent = this.parseStatement();

    let alternate: Statement | null = null;
    if (this.match(TokenType.ELSE)) {
      alternate = this.parseStatement();
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
      span: ifToken.span,
    };
  }

  private parseForStatement(): ForStatement | ForInStatement | ForOfStatement {
    const forToken = this.advance(); // consume 'for'
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after 'for'");

    // Check for for-in / for-of
    if (
      this.peek().type === TokenType.LET ||
      this.peek().type === TokenType.CONST ||
      this.peek().type === TokenType.VAR
    ) {
      const savedPos = this.current;
      const kind = this.advance(); // let/const/var
      if (this.peek().type === TokenType.IDENTIFIER) {
        const id = this.parseIdentifier();
        if (this.peek().type === TokenType.IN) {
          this.advance(); // consume 'in'
          const right = this.parseExpression();
          this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
          const body = this.parseStatement();
          const left: VariableDeclaration = {
            type: 'VariableDeclaration',
            kind: kind.lexeme as 'let' | 'const' | 'var',
            declarations: [{ type: 'VariableDeclarator', id, init: null }],
          };
          return {
            type: 'ForInStatement',
            left,
            right,
            body,
            span: forToken.span,
          } as ForInStatement;
        }
        if (this.peek().type === TokenType.OF) {
          this.advance(); // consume 'of'
          const right = this.parseExpression();
          this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
          const body = this.parseStatement();
          const left: VariableDeclaration = {
            type: 'VariableDeclaration',
            kind: kind.lexeme as 'let' | 'const' | 'var',
            declarations: [{ type: 'VariableDeclarator', id, init: null }],
          };
          return {
            type: 'ForOfStatement',
            left,
            right,
            body,
            span: forToken.span,
          } as ForOfStatement;
        }
      }
      // Not a for-in/for-of, backtrack
      this.current = savedPos;
    }

    // Standard for loop
    let init: VariableDeclaration | Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      if (
        this.peek().type === TokenType.LET ||
        this.peek().type === TokenType.CONST ||
        this.peek().type === TokenType.VAR
      ) {
        init = this.parseVariableDeclarationNoSemicolon();
      } else {
        init = this.parseExpression();
      }
    }
    this.expect(TokenType.SEMICOLON, "Expected ';' in for loop");

    let test: Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      test = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON, "Expected ';' in for loop");

    let update: Expression | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      update = this.parseExpression();
    }
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after for clauses");

    const body = this.parseStatement();
    return { type: 'ForStatement', init, test, update, body, span: forToken.span };
  }

  private parseVariableDeclarationNoSemicolon(): VariableDeclaration {
    const kindToken = this.advance();
    const kind = kindToken.lexeme as 'let' | 'const' | 'var';
    const span = kindToken.span;

    const declarations = [];
    do {
      const id = this.parseIdentifier();
      let init: Expression | null = null;
      if (this.match(TokenType.ASSIGN)) {
        init = this.parseAssignmentExpression();
      }
      declarations.push({
        type: 'VariableDeclarator' as const,
        id,
        init,
        span,
      });
    } while (this.match(TokenType.COMMA));

    return { type: 'VariableDeclaration', kind, declarations, span };
  }

  private parseWhileStatement(): WhileStatement {
    const whileToken = this.advance();
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after 'while'");
    const test = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after while condition");
    const body = this.parseStatement();
    return { type: 'WhileStatement', test, body, span: whileToken.span };
  }

  private parseDoWhileStatement(): DoWhileStatement {
    const doToken = this.advance();
    const body = this.parseStatement();
    this.expect(TokenType.WHILE, "Expected 'while' after do body");
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after 'while'");
    const test = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after while condition");
    this.consumeOptionalSemicolon();
    return { type: 'DoWhileStatement', body, test, span: doToken.span };
  }

  private parseReturnStatement(): ReturnStatement {
    const returnToken = this.advance();
    let argument: Expression | null = null;
    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      argument = this.parseExpression();
    }
    this.consumeOptionalSemicolon();
    return { type: 'ReturnStatement', argument, span: returnToken.span };
  }

  private parseBreakStatement(): BreakStatement {
    const token = this.advance();
    this.consumeOptionalSemicolon();
    return { type: 'BreakStatement', span: token.span };
  }

  private parseContinueStatement(): ContinueStatement {
    const token = this.advance();
    this.consumeOptionalSemicolon();
    return { type: 'ContinueStatement', span: token.span };
  }

  private parseSwitchStatement(): SwitchStatement {
    const switchToken = this.advance();
    this.expect(TokenType.LEFT_PAREN, "Expected '(' after 'switch'");
    const discriminant = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after switch value");
    this.expect(TokenType.LEFT_BRACE, "Expected '{' for switch body");

    const cases: SwitchCase[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.CASE)) {
        const test = this.parseExpression();
        this.expect(TokenType.COLON, "Expected ':' after case value");
        const consequent: Statement[] = [];
        while (
          !this.check(TokenType.CASE) &&
          !this.check(TokenType.DEFAULT) &&
          !this.check(TokenType.RIGHT_BRACE) &&
          !this.isAtEnd()
        ) {
          consequent.push(this.parseStatement());
        }
        cases.push({ type: 'SwitchCase', test, consequent });
      } else if (this.match(TokenType.DEFAULT)) {
        this.expect(TokenType.COLON, "Expected ':' after 'default'");
        const consequent: Statement[] = [];
        while (
          !this.check(TokenType.CASE) &&
          !this.check(TokenType.DEFAULT) &&
          !this.check(TokenType.RIGHT_BRACE) &&
          !this.isAtEnd()
        ) {
          consequent.push(this.parseStatement());
        }
        cases.push({ type: 'SwitchCase', test: null, consequent });
      } else {
        throw this.error(this.peek(), 'Expected case or default');
      }
    }

    this.expect(TokenType.RIGHT_BRACE, "Expected '}' for switch body");
    return {
      type: 'SwitchStatement',
      discriminant,
      cases,
      span: switchToken.span,
    };
  }

  private parseBlockStatement(): BlockStatement {
    const braceToken = this.expect(TokenType.LEFT_BRACE, "Expected '{'");
    const body: Statement[] = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RIGHT_BRACE, "Expected '}'");
    return { type: 'BlockStatement', body, span: braceToken.span };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression();
    this.consumeOptionalSemicolon();
    return {
      type: 'ExpressionStatement',
      expression,
      span: expression.span,
    };
  }

  private parseTryCatchStatement(): TryCatchStatement {
    const tryToken = this.advance();
    const block = this.parseBlockStatement();

    let handler = null;
    if (this.match(TokenType.CATCH)) {
      let param: Identifier | null = null;
      if (this.match(TokenType.LEFT_PAREN)) {
        param = this.parseIdentifier();
        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after catch parameter");
      }
      const body = this.parseBlockStatement();
      handler = { type: 'CatchClause' as const, param, body };
    }

    let finalizer: BlockStatement | null = null;
    if (this.match(TokenType.FINALLY)) {
      finalizer = this.parseBlockStatement();
    }

    if (!handler && !finalizer) {
      throw this.error(this.peek(), 'Expected catch or finally');
    }

    return {
      type: 'TryCatchStatement',
      block,
      handler,
      finalizer,
      span: tryToken.span,
    };
  }

  private parseThrowStatement(): ThrowStatement {
    const token = this.advance();
    const argument = this.parseExpression();
    this.consumeOptionalSemicolon();
    return { type: 'ThrowStatement', argument, span: token.span };
  }

  private parseImportStatement(): ImportStatement | NamiImportStatement {
    const importToken = this.advance();

    // NAMI-style bare import: `import nm` or `import http`
    if (
      this.peek().type === TokenType.IDENTIFIER &&
      this.peekNext().type !== TokenType.COMMA &&
      this.peekNext().type !== TokenType.FROM &&
      this.peekNext().lexeme !== 'as'
    ) {
      const module = this.parseIdentifier();
      this.consumeOptionalSemicolon();
      return {
        type: 'NamiImportStatement',
        module,
        span: importToken.span,
      } as NamiImportStatement;
    }

    const specifiers: { type: 'ImportSpecifier'; imported: Identifier; local: Identifier }[] = [];

    if (this.match(TokenType.LEFT_BRACE)) {
      do {
        const imported = this.parseIdentifier();
        let local = imported;
        if (this.peek().lexeme === 'as') {
          this.advance();
          local = this.parseIdentifier();
        }
        specifiers.push({ type: 'ImportSpecifier', imported, local });
      } while (this.match(TokenType.COMMA));
      this.expect(TokenType.RIGHT_BRACE, "Expected '}'");
    }

    this.expect(TokenType.FROM, "Expected 'from'");
    const sourceToken = this.expect(TokenType.STRING, 'Expected module path');
    const source: StringLiteral = {
      type: 'StringLiteral',
      value: sourceToken.literal as string,
      span: sourceToken.span,
    };
    this.consumeOptionalSemicolon();
    return {
      type: 'ImportStatement',
      specifiers,
      source,
      span: importToken.span,
    };
  }

  private parseExportStatement(): ExportStatement {
    const exportToken = this.advance();

    let isDefault = false;
    if (this.match(TokenType.DEFAULT)) {
      isDefault = true;
    }

    let declaration: Statement | null = null;
    if (
      this.peek().type === TokenType.FUNCTION ||
      this.peek().type === TokenType.FN || // NAMI: export fn
      (this.peek().type === TokenType.ASYNC &&
        (this.peekNext().type === TokenType.FUNCTION || this.peekNext().type === TokenType.FN))
    ) {
      const isAsync = this.peek().type === TokenType.ASYNC;
      declaration = this.parseFunctionDeclaration(isAsync);
    } else if (
      this.peek().type === TokenType.LET ||
      this.peek().type === TokenType.CONST ||
      this.peek().type === TokenType.VAR
    ) {
      declaration = this.parseVariableDeclaration();
    } else {
      // export expression
      const expr = this.parseExpression();
      this.consumeOptionalSemicolon();
      declaration = { type: 'ExpressionStatement', expression: expr } as ExpressionStatement;
    }

    return {
      type: 'ExportStatement',
      declaration,
      specifiers: [],
      default: isDefault,
      span: exportToken.span,
    };
  }

  // ── NAMI-Specific Statement Parsing ─────────────────────

  /** Parse `loop { ... }` — NAMI infinite loop */
  private parseLoopStatement(): LoopStatement {
    const loopToken = this.advance(); // consume 'loop'
    const body = this.parseBlockStatement();
    return {
      type: 'LoopStatement',
      body,
      span: loopToken.span,
    };
  }

  /** Parse `print(...)` or `println(...)` — NAMI built-in output */
  private parsePrintStatement(): PrintStatement {
    const printToken = this.advance(); // consume 'print' or 'println'
    const newline = printToken.lexeme === 'println';

    this.expect(TokenType.LEFT_PAREN, "Expected '(' after print/println");
    const args: Expression[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.parseAssignmentExpression());
      } while (this.match(TokenType.COMMA));
    }
    this.expect(TokenType.RIGHT_PAREN, "Expected ')' after print arguments");
    this.consumeOptionalSemicolon();

    return {
      type: 'PrintStatement',
      arguments: args,
      newline,
      span: printToken.span,
    };
  }

  // ── Expression Parsing (Precedence Climbing) ───────────

  private parseExpression(): Expression {
    return this.parseSequenceExpression();
  }

  private parseSequenceExpression(): Expression {
    const expr = this.parseAssignmentExpression();
    if (this.check(TokenType.COMMA) && !this.isInCallArgs) {
      const expressions: Expression[] = [expr];
      while (this.match(TokenType.COMMA)) {
        expressions.push(this.parseAssignmentExpression());
      }
      return { type: 'SequenceExpression', expressions, span: expr.span };
    }
    return expr;
  }

  private isInCallArgs = false;

  private parseAssignmentExpression(): Expression {
    const expr = this.parseConditionalExpression();

    if (
      this.check(TokenType.ASSIGN) ||
      this.check(TokenType.PLUS_ASSIGN) ||
      this.check(TokenType.MINUS_ASSIGN) ||
      this.check(TokenType.STAR_ASSIGN) ||
      this.check(TokenType.SLASH_ASSIGN) ||
      this.check(TokenType.PERCENT_ASSIGN)
    ) {
      const operator = this.advance().lexeme;
      const right = this.parseAssignmentExpression();
      return {
        type: 'AssignmentExpression',
        operator,
        left: expr,
        right,
        span: expr.span,
      };
    }

    return expr;
  }

  private parseConditionalExpression(): Expression {
    const expr = this.parseNullishCoalescing();

    if (this.match(TokenType.QUESTION)) {
      const consequent = this.parseAssignmentExpression();
      this.expect(TokenType.COLON, "Expected ':' in conditional expression");
      const alternate = this.parseAssignmentExpression();
      return {
        type: 'ConditionalExpression',
        test: expr,
        consequent,
        alternate,
        span: expr.span,
      } as ConditionalExpression;
    }

    return expr;
  }

  private parseNullishCoalescing(): Expression {
    let left = this.parseLogicalOr();

    while (this.match(TokenType.NULLISH)) {
      const right = this.parseLogicalOr();
      left = {
        type: 'LogicalExpression',
        operator: '??',
        left,
        right,
        span: left.span,
      } as LogicalExpression;
    }

    return left;
  }

  private parseLogicalOr(): Expression {
    let left = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const right = this.parseLogicalAnd();
      left = {
        type: 'LogicalExpression',
        operator: '||',
        left,
        right,
        span: left.span,
      } as LogicalExpression;
    }

    return left;
  }

  private parseLogicalAnd(): Expression {
    let left = this.parseBitwiseOr();

    while (this.match(TokenType.AND)) {
      const right = this.parseBitwiseOr();
      left = {
        type: 'LogicalExpression',
        operator: '&&',
        left,
        right,
        span: left.span,
      } as LogicalExpression;
    }

    return left;
  }

  private parseBitwiseOr(): Expression {
    let left = this.parseBitwiseXor();

    while (this.match(TokenType.BITWISE_OR)) {
      const right = this.parseBitwiseXor();
      left = {
        type: 'BinaryExpression',
        operator: '|',
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseBitwiseXor(): Expression {
    let left = this.parseBitwiseAnd();

    while (this.match(TokenType.BITWISE_XOR)) {
      const right = this.parseBitwiseAnd();
      left = {
        type: 'BinaryExpression',
        operator: '^',
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseBitwiseAnd(): Expression {
    let left = this.parseEquality();

    while (this.match(TokenType.BITWISE_AND)) {
      const right = this.parseEquality();
      left = {
        type: 'BinaryExpression',
        operator: '&',
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();

    while (
      this.check(TokenType.EQUAL) ||
      this.check(TokenType.NOT_EQUAL) ||
      this.check(TokenType.STRICT_EQUAL) ||
      this.check(TokenType.STRICT_NOT_EQUAL)
    ) {
      const operator = this.advance().lexeme;
      const right = this.parseComparison();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseShift();

    while (
      this.check(TokenType.LESS) ||
      this.check(TokenType.GREATER) ||
      this.check(TokenType.LESS_EQUAL) ||
      this.check(TokenType.GREATER_EQUAL) ||
      this.check(TokenType.IN)
    ) {
      const operator = this.advance().lexeme;
      const right = this.parseShift();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseShift(): Expression {
    let left = this.parseRange();

    while (this.check(TokenType.LEFT_SHIFT) || this.check(TokenType.RIGHT_SHIFT)) {
      const operator = this.advance().lexeme;
      const right = this.parseRange();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  /** Parse range expressions: `start..end` */
  private parseRange(): Expression {
    const left = this.parseAdditive();

    if (this.check(TokenType.RANGE)) {
      this.advance(); // consume '..'
      const end = this.parseAdditive();
      return {
        type: 'RangeExpression',
        start: left,
        end,
        inclusive: false,
        span: left.span,
      } as RangeExpression;
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      const operator = this.advance().lexeme;
      const right = this.parseMultiplicative();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseExponentation();

    while (
      this.check(TokenType.STAR) ||
      this.check(TokenType.SLASH) ||
      this.check(TokenType.PERCENT)
    ) {
      const operator = this.advance().lexeme;
      const right = this.parseExponentation();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseExponentation(): Expression {
    let left = this.parseUnary();

    if (this.match(TokenType.POWER)) {
      const right = this.parseExponentation(); // right-associative
      left = {
        type: 'BinaryExpression',
        operator: '**',
        left,
        right,
        span: left.span,
      } as BinaryExpression;
    }

    return left;
  }

  private parseUnary(): Expression {
    if (
      this.check(TokenType.NOT) ||
      this.check(TokenType.MINUS) ||
      this.check(TokenType.PLUS) ||
      this.check(TokenType.BITWISE_NOT)
    ) {
      const operator = this.advance().lexeme;
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator,
        argument,
        prefix: true,
        span: argument.span,
      } as UnaryExpression;
    }

    if (this.check(TokenType.TYPEOF)) {
      this.advance();
      const argument = this.parseUnary();
      return {
        type: 'TypeofExpression',
        argument,
        span: argument.span,
      } as TypeofExpression;
    }

    // Pre-increment/decrement
    if (this.check(TokenType.INCREMENT) || this.check(TokenType.DECREMENT)) {
      const op = this.advance().lexeme as '++' | '--';
      const argument = this.parseUnary();
      return {
        type: 'UpdateExpression',
        operator: op,
        argument,
        prefix: true,
        span: argument.span,
      } as UpdateExpression;
    }

    if (this.check(TokenType.AWAIT)) {
      this.advance();
      const argument = this.parseUnary();
      return {
        type: 'AwaitExpression',
        argument,
        span: argument.span,
      } as AwaitExpression;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expr = this.parseCallExpression();

    while (this.check(TokenType.INCREMENT) || this.check(TokenType.DECREMENT)) {
      const op = this.advance().lexeme as '++' | '--';
      expr = {
        type: 'UpdateExpression',
        operator: op,
        argument: expr,
        prefix: false,
        span: expr.span,
      } as UpdateExpression;
    }

    return expr;
  }

  private parseCallExpression(): Expression {
    let expr = this.parsePrimary();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.check(TokenType.LEFT_PAREN)) {
        this.advance();
        const args = this.parseArguments();
        this.expect(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
          span: expr.span,
        } as CallExpression;
      } else if (this.match(TokenType.DOT)) {
        const property = this.parseIdentifier();
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: false,
          optional: false,
          span: expr.span,
        } as MemberExpression;
      } else if (this.match(TokenType.OPTIONAL_CHAIN)) {
        if (this.check(TokenType.LEFT_PAREN)) {
          // Optional call: obj?.()
          this.advance();
          const args = this.parseArguments();
          this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
          expr = {
            type: 'CallExpression',
            callee: expr,
            arguments: args,
            span: expr.span,
          } as CallExpression;
        } else {
          const property = this.parseIdentifier();
          expr = {
            type: 'MemberExpression',
            object: expr,
            property,
            computed: false,
            optional: true,
            span: expr.span,
          } as MemberExpression;
        }
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const property = this.parseExpression();
        this.expect(TokenType.RIGHT_BRACKET, "Expected ']'");
        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true,
          optional: false,
          span: expr.span,
        } as MemberExpression;
      } else {
        break;
      }
    }

    return expr;
  }

  private parseArguments(): Expression[] {
    const args: Expression[] = [];
    if (this.check(TokenType.RIGHT_PAREN)) return args;

    const prevInCallArgs = this.isInCallArgs;
    this.isInCallArgs = true;

    do {
      if (this.check(TokenType.SPREAD)) {
        this.advance();
        const argument = this.parseAssignmentExpression();
        args.push({
          type: 'SpreadElement',
          argument,
          span: argument.span,
        } as SpreadElement);
      } else {
        args.push(this.parseAssignmentExpression());
      }
    } while (this.match(TokenType.COMMA));

    this.isInCallArgs = prevInCallArgs;
    return args;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    switch (token.type) {
      case TokenType.NUMBER: {
        this.advance();
        return {
          type: 'NumericLiteral',
          value: token.literal as number,
          span: token.span,
        } as NumericLiteral;
      }

      case TokenType.STRING: {
        this.advance();
        return {
          type: 'StringLiteral',
          value: token.literal as string,
          span: token.span,
        } as StringLiteral;
      }

      case TokenType.TRUE:
      case TokenType.FALSE: {
        this.advance();
        return {
          type: 'BooleanLiteral',
          value: token.type === TokenType.TRUE,
          span: token.span,
        } as BooleanLiteral;
      }

      case TokenType.NULL: {
        this.advance();
        return { type: 'NullLiteral', span: token.span } as NullLiteral;
      }

      case TokenType.THIS: {
        this.advance();
        return { type: 'ThisExpression', span: token.span } as ThisExpression;
      }

      case TokenType.IDENTIFIER: {
        // Check for arrow function: (ident) => ... or ident => ...
        if (this.peekNext().type === TokenType.ARROW) {
          return this.parseArrowFunction(false);
        }
        this.advance();
        return {
          type: 'Identifier',
          name: token.lexeme,
          span: token.span,
        } as Identifier;
      }

      case TokenType.LEFT_PAREN: {
        // Could be arrow function or grouping
        if (this.isArrowFunction()) {
          return this.parseArrowFunction(false);
        }
        this.advance();
        const expr = this.parseExpression();
        this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
        return expr;
      }

      case TokenType.LEFT_BRACKET: {
        return this.parseArrayExpression();
      }

      case TokenType.LEFT_BRACE: {
        return this.parseObjectExpression();
      }

      case TokenType.FUNCTION:
      case TokenType.FN: {
        // NAMI: fn(...) { ... } as expression
        return this.parseFunctionExpression(false);
      }

      case TokenType.ASYNC: {
        if (this.peekNext().type === TokenType.FUNCTION || this.peekNext().type === TokenType.FN) {
          return this.parseFunctionExpression(true);
        }
        if (this.peekNext().type === TokenType.LEFT_PAREN) {
          return this.parseArrowFunction(true);
        }
        // Treat as identifier
        this.advance();
        return {
          type: 'Identifier',
          name: token.lexeme,
          span: token.span,
        } as Identifier;
      }

      case TokenType.NEW: {
        return this.parseNewExpression();
      }

      default:
        throw this.error(token, `Unexpected token '${token.lexeme}'`);
    }
  }

  private parseArrowFunction(isAsync: boolean): ArrowFunctionExpression {
    if (isAsync) this.advance(); // consume 'async'

    let params: Parameter[];
    const startSpan = this.peek().span;

    if (this.peek().type === TokenType.IDENTIFIER) {
      // Single param: x => ...
      const name = this.advance().lexeme;
      params = [{ type: 'Parameter', name, rest: false }];
    } else {
      // (a, b) => ...
      this.expect(TokenType.LEFT_PAREN, "Expected '('");
      params = this.parseParameterList();
      this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
    }

    this.expect(TokenType.ARROW, "Expected '=>'");

    let body: BlockStatement | Expression;
    if (this.check(TokenType.LEFT_BRACE)) {
      body = this.parseBlockStatement();
    } else {
      body = this.parseAssignmentExpression();
    }

    return {
      type: 'ArrowFunctionExpression',
      params,
      body,
      async: isAsync,
      span: startSpan,
    };
  }

  private parseFunctionExpression(isAsync: boolean): FunctionExpression {
    if (isAsync) this.advance(); // consume 'async'
    const funcToken = this.advance(); // consume 'function' or 'fn'
    let id: Identifier | null = null;
    if (this.peek().type === TokenType.IDENTIFIER) {
      id = this.parseIdentifier();
    }
    this.expect(TokenType.LEFT_PAREN, "Expected '('");
    const params = this.parseParameterList();
    this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
    const body = this.parseBlockStatement();

    return {
      type: 'FunctionExpression',
      id,
      params,
      body,
      async: isAsync,
      span: funcToken.span,
    };
  }

  private parseNewExpression(): NewExpression {
    const newToken = this.advance();
    let callee = this.parsePrimary();

    // Handle member expressions: new Foo.Bar()
    while (this.match(TokenType.DOT)) {
      const property = this.parseIdentifier();
      callee = {
        type: 'MemberExpression',
        object: callee,
        property,
        computed: false,
        optional: false,
        span: callee.span,
      } as MemberExpression;
    }

    let args: Expression[] = [];
    if (this.match(TokenType.LEFT_PAREN)) {
      args = this.parseArguments();
      this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
    }

    return {
      type: 'NewExpression',
      callee,
      arguments: args,
      span: newToken.span,
    };
  }

  private parseArrayExpression(): ArrayExpression {
    const bracketToken = this.advance(); // consume '['
    const elements: (Expression | SpreadElement | null)[] = [];

    while (!this.check(TokenType.RIGHT_BRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.COMMA)) {
        elements.push(null); // elision
      } else if (this.check(TokenType.SPREAD)) {
        this.advance();
        const argument = this.parseAssignmentExpression();
        elements.push({
          type: 'SpreadElement',
          argument,
          span: argument.span,
        } as SpreadElement);
      } else {
        elements.push(this.parseAssignmentExpression());
      }
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        this.expect(TokenType.COMMA, "Expected ',' or ']'");
      }
    }

    this.expect(TokenType.RIGHT_BRACKET, "Expected ']'");
    return {
      type: 'ArrayExpression',
      elements,
      span: bracketToken.span,
    };
  }

  private parseObjectExpression(): ObjectExpression {
    const braceToken = this.advance(); // consume '{'
    const properties: (ObjectProperty | SpreadElement)[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.SPREAD)) {
        this.advance();
        const argument = this.parseAssignmentExpression();
        properties.push({
          type: 'SpreadElement',
          argument,
          span: argument.span,
        } as SpreadElement);
      } else {
        let key: Expression;
        let computed = false;

        if (this.match(TokenType.LEFT_BRACKET)) {
          computed = true;
          key = this.parseExpression();
          this.expect(TokenType.RIGHT_BRACKET, "Expected ']'");
        } else if (this.peek().type === TokenType.STRING || this.peek().type === TokenType.NUMBER) {
          const t = this.advance();
          key =
            t.type === TokenType.STRING
              ? ({
                  type: 'StringLiteral',
                  value: t.literal as string,
                  span: t.span,
                } as StringLiteral)
              : ({
                  type: 'NumericLiteral',
                  value: t.literal as number,
                  span: t.span,
                } as NumericLiteral);
        } else {
          const ident = this.parseIdentifier();
          key = ident;

          // Shorthand property: { x } means { x: x }
          if (!this.check(TokenType.COLON) && !this.check(TokenType.LEFT_PAREN)) {
            properties.push({
              type: 'ObjectProperty',
              key,
              value: { ...ident },
              computed: false,
              shorthand: true,
              span: ident.span,
            } as ObjectProperty);
            if (!this.check(TokenType.RIGHT_BRACE)) {
              this.expect(TokenType.COMMA, "Expected ',' or '}'");
            }
            continue;
          }
        }

        // Method shorthand: { foo() { ... } }
        if (this.check(TokenType.LEFT_PAREN) && !computed) {
          this.advance();
          const params = this.parseParameterList();
          this.expect(TokenType.RIGHT_PAREN, "Expected ')'");
          const body = this.parseBlockStatement();
          const value: FunctionExpression = {
            type: 'FunctionExpression',
            id: null,
            params,
            body,
            async: false,
            span: key.span,
          };
          properties.push({
            type: 'ObjectProperty',
            key,
            value,
            computed: false,
            shorthand: false,
            span: key.span,
          } as ObjectProperty);
        } else {
          this.expect(TokenType.COLON, "Expected ':' after property key");
          const value = this.parseAssignmentExpression();
          properties.push({
            type: 'ObjectProperty',
            key,
            value,
            computed,
            shorthand: false,
            span: key.span,
          } as ObjectProperty);
        }
      }

      if (!this.check(TokenType.RIGHT_BRACE)) {
        this.expect(TokenType.COMMA, "Expected ',' or '}'");
      }
    }

    this.expect(TokenType.RIGHT_BRACE, "Expected '}'");
    return {
      type: 'ObjectExpression',
      properties,
      span: braceToken.span,
    };
  }

  /** Check if the current position is the start of an arrow function */
  private isArrowFunction(): boolean {
    if (this.peek().type !== TokenType.LEFT_PAREN) return false;

    // Try scanning through (params)
    let depth = 0;
    let pos = this.current;
    while (pos < this.tokens.length) {
      const t = this.tokens[pos];
      if (t.type === TokenType.LEFT_PAREN) depth++;
      else if (t.type === TokenType.RIGHT_PAREN) {
        depth--;
        if (depth === 0) {
          // Check if followed by =>
          if (pos + 1 < this.tokens.length && this.tokens[pos + 1].type === TokenType.ARROW) {
            return true;
          }
          return false;
        }
      }
      pos++;
    }
    return false;
  }

  // ── Helper methods ─────────────────────────────────────

  private parseIdentifier(): Identifier {
    const token = this.expect(TokenType.IDENTIFIER, 'Expected identifier');
    return {
      type: 'Identifier',
      name: token.lexeme,
      span: token.span,
    };
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.tokens[this.current - 1];
  }

  private peek(): Token {
    if (this.current >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[this.current];
  }

  private peekNext(): Token {
    if (this.current + 1 >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[this.current + 1];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private consumeOptionalSemicolon(): void {
    this.match(TokenType.SEMICOLON);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private error(token: Token, message: string): ParseError {
    return new ParseError(message, token, token.line, token.column);
  }

  /**
   * Error recovery: Skip tokens until a statement boundary
   * Synchronizes on:
   * - Semicolons (statement terminators)
   * - Braces (block boundaries)
   * - Statement keywords (function, let, if, for, etc.)
   * Requirements: 1.3
   */
  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      const prevToken = this.tokens[this.current - 1];

      // Synchronize on semicolons
      if (prevToken.type === TokenType.SEMICOLON) return;

      // Synchronize on closing braces (end of block)
      if (prevToken.type === TokenType.RIGHT_BRACE) return;

      const currentToken = this.peek();

      // Synchronize on opening braces (start of block)
      if (currentToken.type === TokenType.LEFT_BRACE) return;

      // Synchronize on statement keywords
      switch (currentToken.type) {
        case TokenType.FUNCTION:
        case TokenType.FN:
        case TokenType.ASYNC:
        case TokenType.LET:
        case TokenType.CONST:
        case TokenType.VAR:
        case TokenType.IF:
        case TokenType.FOR:
        case TokenType.WHILE:
        case TokenType.DO:
        case TokenType.LOOP:
        case TokenType.RETURN:
        case TokenType.BREAK:
        case TokenType.CONTINUE:
        case TokenType.SWITCH:
        case TokenType.TRY:
        case TokenType.THROW:
        case TokenType.IMPORT:
        case TokenType.EXPORT:
        case TokenType.PRINT:
        case TokenType.PRINTLN:
          return;
      }

      this.advance();
    }
  }
}
