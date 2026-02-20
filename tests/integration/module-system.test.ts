/**
 * Module System Integration Tests
 * Requirements: 16.1, 16.2
 * 
 * Tests the complete flow of parsing import and export statements
 */

import { Parser } from '../../src/parser/parser';
import { Lexer } from '../../src/lexer/lexer';
import { ImportStatement, ExportStatement, NamiImportStatement } from '../../src/parser/ast';

describe('Module System Integration', () => {
  describe('Import Statements', () => {
    it('should tokenize and parse NAMI-style bare import', () => {
      const source = 'import nm;';
      const lexer = new Lexer(source);
      const tokens = [];
      while (lexer.has_more()) {
        tokens.push(lexer.next_token());
      }
      
      // Verify tokens
      expect(tokens[0].type).toBe('IMPORT');
      expect(tokens[1].type).toBe('IDENTIFIER');
      expect(tokens[1].lexeme).toBe('nm');
      
      // Verify parsing
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as NamiImportStatement;
      expect(stmt.type).toBe('NamiImportStatement');
      expect(stmt.module.name).toBe('nm');
      expect(parser.getErrors()).toEqual([]);
    });

    it('should tokenize and parse named imports with from clause', () => {
      const source = 'import { add, subtract } from "./math";';
      const lexer = new Lexer(source);
      const tokens = [];
      while (lexer.has_more()) {
        tokens.push(lexer.next_token());
      }
      
      // Verify key tokens
      expect(tokens[0].type).toBe('IMPORT');
      expect(tokens[1].type).toBe('LEFT_BRACE');
      expect(tokens.some(t => t.type === 'FROM')).toBe(true);
      expect(tokens.some(t => t.type === 'STRING')).toBe(true);
      
      // Verify parsing
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as ImportStatement;
      expect(stmt.type).toBe('ImportStatement');
      expect(stmt.specifiers.length).toBe(2);
      expect(stmt.specifiers[0].imported.name).toBe('add');
      expect(stmt.specifiers[1].imported.name).toBe('subtract');
      expect(stmt.source.value).toBe('./math');
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse imports with aliases', () => {
      const source = 'import { longFunctionName as short } from "./utils";';
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as ImportStatement;
      
      expect(stmt.type).toBe('ImportStatement');
      expect(stmt.specifiers[0].imported.name).toBe('longFunctionName');
      expect(stmt.specifiers[0].local.name).toBe('short');
      expect(parser.getErrors()).toEqual([]);
    });
  });

  describe('Export Statements', () => {
    it('should tokenize and parse export function', () => {
      const source = 'export function multiply(a, b) { return a * b; }';
      const lexer = new Lexer(source);
      const tokens = [];
      while (lexer.has_more()) {
        tokens.push(lexer.next_token());
      }
      
      // Verify tokens
      expect(tokens[0].type).toBe('EXPORT');
      expect(tokens[1].type).toBe('FUNCTION');
      
      // Verify parsing
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as ExportStatement;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('FunctionDeclaration');
      expect(stmt.default).toBe(false);
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse export default', () => {
      const source = 'export default function main() { return 0; }';
      const lexer = new Lexer(source);
      const tokens = [];
      while (lexer.has_more()) {
        tokens.push(lexer.next_token());
      }
      
      // Verify tokens
      expect(tokens[0].type).toBe('EXPORT');
      expect(tokens[1].type).toBe('DEFAULT');
      expect(tokens[2].type).toBe('FUNCTION');
      
      // Verify parsing
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as ExportStatement;
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.default).toBe(true);
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse export variable declaration', () => {
      const source = 'export const VERSION = "1.0.0";';
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as ExportStatement;
      
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('VariableDeclaration');
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse export async function', () => {
      const source = 'export async function fetchData() { return await getData(); }';
      const parser = new Parser(source);
      const ast = parser.parse();
      const stmt = ast.body[0] as ExportStatement;
      
      expect(stmt.type).toBe('ExportStatement');
      expect(stmt.declaration.type).toBe('FunctionDeclaration');
      expect((stmt.declaration as any).async).toBe(true);
      expect(parser.getErrors()).toEqual([]);
    });
  });

  describe('Complete Module Files', () => {
    it('should parse a module with imports and exports', () => {
      const source = `
        import { helper } from "./helpers";
        import { config } from "./config";
        
        export function processData(data) {
          return helper(data, config);
        }
        
        export const VERSION = "2.0.0";
      `;
      
      const parser = new Parser(source);
      const ast = parser.parse();
      
      expect(ast.body.length).toBe(4);
      expect(ast.body[0].type).toBe('ImportStatement');
      expect(ast.body[1].type).toBe('ImportStatement');
      expect(ast.body[2].type).toBe('ExportStatement');
      expect(ast.body[3].type).toBe('ExportStatement');
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse NAMI built-in module imports', () => {
      const source = `
        import nm;
        import http;
        
        export function main() {
          const input = nm.input();
          const server = http.create();
          return 0;
        }
      `;
      
      const parser = new Parser(source);
      const ast = parser.parse();
      
      expect(ast.body.length).toBe(3);
      expect(ast.body[0].type).toBe('NamiImportStatement');
      expect(ast.body[1].type).toBe('NamiImportStatement');
      expect(ast.body[2].type).toBe('ExportStatement');
      expect(parser.getErrors()).toEqual([]);
    });

    it('should parse mixed import styles', () => {
      const source = `
        import nm;
        import { readFile, writeFile } from "./fs";
        import { parse as parseJSON } from "./json";
        
        export async function loadConfig(path) {
          const content = await readFile(path);
          return parseJSON(content);
        }
      `;
      
      const parser = new Parser(source);
      const ast = parser.parse();
      
      expect(ast.body.length).toBe(4);
      expect(ast.body[0].type).toBe('NamiImportStatement');
      expect(ast.body[1].type).toBe('ImportStatement');
      expect(ast.body[2].type).toBe('ImportStatement');
      expect(ast.body[3].type).toBe('ExportStatement');
      expect(parser.getErrors()).toEqual([]);
    });
  });

  describe('Error Cases', () => {
    it('should handle import without from clause for named imports', () => {
      const source = 'import { foo };'; // Missing 'from' clause
      const parser = new Parser(source);
      const ast = parser.parse();
      
      // Should have errors
      expect(parser.getErrors().length).toBeGreaterThan(0);
    });

    it('should handle export without declaration', () => {
      const source = 'export;'; // Missing what to export
      const parser = new Parser(source);
      const ast = parser.parse();
      
      // Parser should handle this gracefully
      expect(ast.body.length).toBeGreaterThanOrEqual(0);
    });
  });
});
