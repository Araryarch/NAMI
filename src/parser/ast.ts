/**
 * AST Node Types for NAMI Language
 * Requirements: 1.1, 3.1-3.6, 4.1, 6.1, 6.2, 15.1, 16.1, 16.2
 */

import { SourceSpan } from '../lexer/token';

// ── Base Types ───────────────────────────────────────────

/**
 * Unique identifier for AST nodes
 */
export type NodeId = number;

/**
 * Type information attached to AST nodes during semantic analysis
 */
export interface TypeInfo {
  /** The inferred or declared type */
  type: string;
  /** Whether the type was inferred or explicitly declared */
  inferred: boolean;
  /** Additional type metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Base interface for all AST nodes
 * Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 6.1, 6.2, 15.1, 16.1, 16.2
 */
export interface ASTNode {
  /** Node type discriminator */
  type: string;
  /** Unique identifier for this node (used for tracking during compilation) */
  nodeId?: NodeId;
  /** Source location information */
  span?: SourceSpan;
  /** Type information (populated during semantic analysis) */
  type_info?: TypeInfo;
}

// ── Program ──────────────────────────────────────────────

export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

// ── Statements ───────────────────────────────────────────

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | IfStatement
  | ForStatement
  | ForInStatement
  | ForOfStatement
  | WhileStatement
  | DoWhileStatement
  | LoopStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | SwitchStatement
  | BlockStatement
  | ExpressionStatement
  | TryCatchStatement
  | ThrowStatement
  | ImportStatement
  | NamiImportStatement
  | ExportStatement
  | ClassDeclaration
  | PrintStatement
  | EmptyStatement;

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  kind: 'let' | 'const' | 'var';
  declarations: VariableDeclarator[];
}

export interface VariableDeclarator extends ASTNode {
  type: 'VariableDeclarator';
  id: Identifier | ArrayPattern | ObjectPattern;
  init: Expression | null;
}

export interface ArrayPattern extends ASTNode {
  type: 'ArrayPattern';
  elements: (Identifier | null)[];
}

export interface ObjectPattern extends ASTNode {
  type: 'ObjectPattern';
  properties: { key: Identifier; value: Identifier }[];
}

export interface FunctionDeclaration extends ASTNode {
  type: 'FunctionDeclaration';
  id: Identifier;
  params: Parameter[];
  body: BlockStatement;
  async: boolean;
  generator: boolean;
}

export interface Parameter extends ASTNode {
  type: 'Parameter';
  name: string;
  typeAnnotation?: TypeAnnotation;
  defaultValue?: Expression;
  rest: boolean;
}

export interface TypeAnnotation extends ASTNode {
  type: 'TypeAnnotation';
  name: string;
  generic?: TypeAnnotation[];
}

export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface ForStatement extends ASTNode {
  type: 'ForStatement';
  init: VariableDeclaration | Expression | null;
  test: Expression | null;
  update: Expression | null;
  body: Statement;
}

export interface ForInStatement extends ASTNode {
  type: 'ForInStatement';
  left: VariableDeclaration | Identifier;
  right: Expression;
  body: Statement;
}

export interface ForOfStatement extends ASTNode {
  type: 'ForOfStatement';
  left: VariableDeclaration | Identifier;
  right: Expression;
  body: Statement;
}

export interface WhileStatement extends ASTNode {
  type: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface DoWhileStatement extends ASTNode {
  type: 'DoWhileStatement';
  body: Statement;
  test: Expression;
}

export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement';
  argument: Expression | null;
}

export interface BreakStatement extends ASTNode {
  type: 'BreakStatement';
}

export interface ContinueStatement extends ASTNode {
  type: 'ContinueStatement';
}

export interface SwitchStatement extends ASTNode {
  type: 'SwitchStatement';
  discriminant: Expression;
  cases: SwitchCase[];
}

export interface SwitchCase extends ASTNode {
  type: 'SwitchCase';
  test: Expression | null; // null = default
  consequent: Statement[];
}

export interface BlockStatement extends ASTNode {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface TryCatchStatement extends ASTNode {
  type: 'TryCatchStatement';
  block: BlockStatement;
  handler: CatchClause | null;
  finalizer: BlockStatement | null;
}

export interface CatchClause extends ASTNode {
  type: 'CatchClause';
  param: Identifier | null;
  body: BlockStatement;
}

export interface ThrowStatement extends ASTNode {
  type: 'ThrowStatement';
  argument: Expression;
}

export interface ImportStatement extends ASTNode {
  type: 'ImportStatement';
  specifiers: ImportSpecifier[];
  source: StringLiteral;
}

/** NAMI-style import: `import nm` or `import http` */
export interface NamiImportStatement extends ASTNode {
  type: 'NamiImportStatement';
  module: Identifier;
}

export interface ImportSpecifier extends ASTNode {
  type: 'ImportSpecifier';
  imported: Identifier;
  local: Identifier;
}

export interface ExportStatement extends ASTNode {
  type: 'ExportStatement';
  declaration: Statement | null;
  specifiers: ExportSpecifier[];
  default: boolean;
}

export interface ExportSpecifier extends ASTNode {
  type: 'ExportSpecifier';
  exported: Identifier;
  local: Identifier;
}

export interface ClassDeclaration extends ASTNode {
  type: 'ClassDeclaration';
  id: Identifier;
  superClass: Expression | null;
  body: ClassBody;
}

export interface ClassBody extends ASTNode {
  type: 'ClassBody';
  body: (MethodDefinition | PropertyDefinition)[];
}

export interface MethodDefinition extends ASTNode {
  type: 'MethodDefinition';
  key: Identifier;
  value: FunctionExpression;
  kind: 'constructor' | 'method' | 'get' | 'set';
  static: boolean;
}

export interface PropertyDefinition extends ASTNode {
  type: 'PropertyDefinition';
  key: Identifier;
  value: Expression | null;
  static: boolean;
}

export interface EmptyStatement extends ASTNode {
  type: 'EmptyStatement';
}

/** NAMI: `loop { ... }` — infinite loop */
export interface LoopStatement extends ASTNode {
  type: 'LoopStatement';
  body: Statement;
}

/** NAMI: `print(expr)` or `println(expr)` */
export interface PrintStatement extends ASTNode {
  type: 'PrintStatement';
  arguments: Expression[];
  newline: boolean; // println = true, print = false
}

// ── Expressions ─────────────────────────────────────────

export type Expression =
  | Identifier
  | NumericLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayExpression
  | ObjectExpression
  | BinaryExpression
  | LogicalExpression
  | UnaryExpression
  | UpdateExpression
  | AssignmentExpression
  | ConditionalExpression
  | CallExpression
  | NewExpression
  | MemberExpression
  | ArrowFunctionExpression
  | FunctionExpression
  | AwaitExpression
  | SpreadElement
  | SequenceExpression
  | TemplateLiteral
  | TaggedTemplateExpression
  | ThisExpression
  | TypeofExpression
  | RangeExpression;

export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface NumericLiteral extends ASTNode {
  type: 'NumericLiteral';
  value: number;
}

export interface StringLiteral extends ASTNode {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral extends ASTNode {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NullLiteral extends ASTNode {
  type: 'NullLiteral';
}

export interface ArrayExpression extends ASTNode {
  type: 'ArrayExpression';
  elements: (Expression | SpreadElement | null)[];
}

export interface ObjectExpression extends ASTNode {
  type: 'ObjectExpression';
  properties: (ObjectProperty | SpreadElement)[];
}

export interface ObjectProperty extends ASTNode {
  type: 'ObjectProperty';
  key: Expression;
  value: Expression;
  computed: boolean;
  shorthand: boolean;
}

export interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface LogicalExpression extends ASTNode {
  type: 'LogicalExpression';
  operator: '&&' | '||' | '??';
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
  prefix: boolean;
}

export interface UpdateExpression extends ASTNode {
  type: 'UpdateExpression';
  operator: '++' | '--';
  argument: Expression;
  prefix: boolean;
}

export interface AssignmentExpression extends ASTNode {
  type: 'AssignmentExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface ConditionalExpression extends ASTNode {
  type: 'ConditionalExpression';
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface CallExpression extends ASTNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface NewExpression extends ASTNode {
  type: 'NewExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends ASTNode {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
  optional: boolean;
}

export interface ArrowFunctionExpression extends ASTNode {
  type: 'ArrowFunctionExpression';
  params: Parameter[];
  body: BlockStatement | Expression;
  async: boolean;
}

export interface FunctionExpression extends ASTNode {
  type: 'FunctionExpression';
  id: Identifier | null;
  params: Parameter[];
  body: BlockStatement;
  async: boolean;
}

export interface AwaitExpression extends ASTNode {
  type: 'AwaitExpression';
  argument: Expression;
}

export interface SpreadElement extends ASTNode {
  type: 'SpreadElement';
  argument: Expression;
}

export interface SequenceExpression extends ASTNode {
  type: 'SequenceExpression';
  expressions: Expression[];
}

export interface TemplateLiteral extends ASTNode {
  type: 'TemplateLiteral';
  quasis: string[];
  expressions: Expression[];
}

export interface TaggedTemplateExpression extends ASTNode {
  type: 'TaggedTemplateExpression';
  tag: Expression;
  quasi: TemplateLiteral;
}

export interface ThisExpression extends ASTNode {
  type: 'ThisExpression';
}

export interface TypeofExpression extends ASTNode {
  type: 'TypeofExpression';
  argument: Expression;
}

/** NAMI: `0..10` or `start..end` — range expression */
export interface RangeExpression extends ASTNode {
  type: 'RangeExpression';
  start: Expression;
  end: Expression;
  inclusive: boolean; // ..= for inclusive, .. for exclusive
}
