/**
 * Integration test for multi-line string support
 * Task 2.3: Add string literal handling with escape sequences
 * Requirements: 1.1
 */

import { Lexer, TokenType } from '../../src/lexer';

describe('Multi-line String Integration', () => {
  it('should handle complex multi-line strings with mixed content', () => {
    const source = `
      let message = "Hello, World!
This is a multi-line string.
It can span multiple lines.";
      
      let another = 'Single quotes
also work
for multi-line strings';
      
      let withEscapes = "Line 1\\nLine 2\\tTabbed\\nLine 3";
    `;

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const errors = lexer.getErrors();

    // Should have no errors
    expect(errors.length).toBe(0);

    // Find the string tokens
    const stringTokens = tokens.filter(t => t.type === TokenType.STRING);
    expect(stringTokens.length).toBe(3);

    // First string: multi-line with actual newlines
    expect(stringTokens[0].literal).toBe(
      'Hello, World!\nThis is a multi-line string.\nIt can span multiple lines.'
    );

    // Second string: single quotes multi-line
    expect(stringTokens[1].literal).toBe(
      'Single quotes\nalso work\nfor multi-line strings'
    );

    // Third string: escape sequences
    expect(stringTokens[2].literal).toBe('Line 1\nLine 2\tTabbed\nLine 3');
  });

  it('should handle strings with mixed quotes and escapes', () => {
    const source = `
      let str1 = "He said, \\"Hello!\\"";
      let str2 = 'She\\'s here';
      let str3 = "Multi-line with \\"quotes\\"
and more content";
    `;

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const errors = lexer.getErrors();

    expect(errors.length).toBe(0);

    const stringTokens = tokens.filter(t => t.type === TokenType.STRING);
    expect(stringTokens.length).toBe(3);

    expect(stringTokens[0].literal).toBe('He said, "Hello!"');
    expect(stringTokens[1].literal).toBe("She's here");
    expect(stringTokens[2].literal).toBe('Multi-line with "quotes"\nand more content');
  });

  it('should handle all supported escape sequences', () => {
    const source = `
      let escapes = "newline: \\n
tab: \\t
carriage return: \\r
backslash: \\\\
single quote: \\'
double quote: \\"
null: \\0
backspace: \\b
form feed: \\f
vertical tab: \\v
unicode: \\u0041\\u0042\\u0043";
    `;

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const errors = lexer.getErrors();

    expect(errors.length).toBe(0);

    const stringTokens = tokens.filter(t => t.type === TokenType.STRING);
    expect(stringTokens.length).toBe(1);

    const expected = 'newline: \n\ntab: \t\ncarriage return: \r\nbackslash: \\\n' +
      'single quote: \'\ndouble quote: "\nnull: \0\nbackspace: \b\n' +
      'form feed: \f\nvertical tab: \v\nunicode: ABC';

    expect(stringTokens[0].literal).toBe(expected);
  });

  it('should correctly track line numbers across multi-line strings', () => {
    const source = `let x = "line 1
line 2
line 3";
let y = 42;`;

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    // Find the 'y' identifier - it should be on line 4
    const yToken = tokens.find(t => t.type === TokenType.IDENTIFIER && t.lexeme === 'y');
    expect(yToken).toBeDefined();
    expect(yToken!.line).toBe(4);
  });

  it('should handle template strings (backticks) for multi-line content', () => {
    const source = '`template\nstring\nhere`';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const errors = lexer.getErrors();

    expect(errors.length).toBe(0);
    expect(tokens[0].type).toBe(TokenType.STRING);
    expect(tokens[0].literal).toBe('template\nstring\nhere');
  });
});
