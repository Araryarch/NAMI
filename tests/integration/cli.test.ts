/**
 * Integration tests for CLI tool
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const CLI_PATH = path.join(__dirname, '..', '..', 'lib', 'cli.js');
const EXAMPLES_DIR = path.join(__dirname, '..', '..', 'examples');

describe('CLI Tool', () => {
  describe('--help command', () => {
    it('should display help information', () => {
      const output = execSync(`node "${CLI_PATH}" --help`, { encoding: 'utf-8' });
      expect(output).toContain('NAMI Language Compiler');
      expect(output).toContain('Commands:');
      expect(output).toContain('run');
      expect(output).toContain('build');
      expect(output).toContain('compile');
      expect(output).toContain('check');
    });
  });

  describe('--version command', () => {
    it('should display version information', () => {
      const output = execSync(`node "${CLI_PATH}" --version`, { encoding: 'utf-8' });
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('check command', () => {
    it('should check valid NAMI file without errors', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-cli.nm');
      const output = execSync(`node "${CLI_PATH}" check "${testFile}"`, { encoding: 'utf-8' });
      expect(output).toContain('No errors found');
    });

    it('should report errors for invalid NAMI file', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-error.nm');
      try {
        execSync(`node "${CLI_PATH}" check "${testFile}"`, { encoding: 'utf-8' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain('error');
      }
    });

    it('should report error for non-existent file', () => {
      try {
        execSync(`node "${CLI_PATH}" check "nonexistent.nm"`, { encoding: 'utf-8' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stderr.toString()).toContain('File not found');
      }
    });
  });

  describe('build command', () => {
    const outputDir = path.join(EXAMPLES_DIR, 'test-build-output');

    afterEach(() => {
      // Clean up test output
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    });

    it('should build NAMI file to C source', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-cli.nm');
      const output = execSync(`node "${CLI_PATH}" build "${testFile}" -o "${outputDir}"`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('Build successful');
      expect(fs.existsSync(path.join(outputDir, 'test-cli.c'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'test-cli.h'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'nami_runtime.h'))).toBe(true);
    });

    it('should generate valid C code', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-cli.nm');
      execSync(`node "${CLI_PATH}" build "${testFile}" -o "${outputDir}"`, {
        encoding: 'utf-8',
      });

      const cSource = fs.readFileSync(path.join(outputDir, 'test-cli.c'), 'utf-8');
      expect(cSource).toContain('#include');
      expect(cSource).toContain('int main');
    });
  });

  describe('ast command', () => {
    it('should print AST for valid NAMI file', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-cli.nm');
      const output = execSync(`node "${CLI_PATH}" ast "${testFile}"`, { encoding: 'utf-8' });

      const ast = JSON.parse(output);
      expect(ast).toHaveProperty('type');
      expect(ast).toHaveProperty('body');
      expect(Array.isArray(ast.body)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should exit with non-zero status on compilation error', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-error.nm');
      try {
        execSync(`node "${CLI_PATH}" build "${testFile}"`, { encoding: 'utf-8' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });

    it('should display error location with file, line, and column', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-error.nm');
      try {
        execSync(`node "${CLI_PATH}" check "${testFile}"`, { encoding: 'utf-8' });
        fail('Should have thrown an error');
      } catch (error: any) {
        const stderr = error.stderr.toString();
        expect(stderr).toMatch(/\[\S+:\d+:\d+\]/); // [file:line:column]
      }
    });
  });

  describe('optimization flags', () => {
    const outputDir = path.join(EXAMPLES_DIR, 'test-opt-output');

    afterEach(() => {
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    });

    it('should accept optimization level flag', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-cli.nm');
      const output = execSync(
        `node "${CLI_PATH}" build "${testFile}" -o "${outputDir}" -O release`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('Build successful');
    });

    it('should accept debug flag', () => {
      const testFile = path.join(EXAMPLES_DIR, 'test-cli.nm');
      const output = execSync(`node "${CLI_PATH}" build "${testFile}" -o "${outputDir}" --debug`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('Build successful');
    });
  });
});
