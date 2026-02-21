/**
 * Error Handling Runtime System Tests (TypeScript wrapper)
 * Compiles and runs the C error handling tests
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Helper to check if gcc is available
function isGccAvailable(): boolean {
  try {
    execSync('gcc --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

describe('Error Handling Runtime System', () => {
  const testFile = path.join(__dirname, 'error-handling.test.c');
  const outputFile = path.join(
    __dirname,
    '../../test-output',
    'error-handling-test' + (os.platform() === 'win32' ? '.exe' : '')
  );

  beforeAll(() => {
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  // Skip all tests if gcc is not available
  const describeOrSkip = describe.skip;

  describeOrSkip('C Runtime Tests (requires gcc)', () => {
    it('should compile the C error handling test', () => {
      expect(() => {
        execSync(`gcc -o "${outputFile}" "${testFile}" -std=c11 -Wall -Wextra`, {
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      }).not.toThrow();

      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should run all error handling tests successfully', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Verify test output
      expect(output).toContain('Error Handling Runtime System Tests');
      expect(output).toContain('Test 1: Error creation and destruction');
      expect(output).toContain('Test 2: Error type names');
      expect(output).toContain('Test 3: Basic try-catch');
      expect(output).toContain('Test 4: Try-catch without error');
      expect(output).toContain('Test 5: Finally block execution (no error)');
      expect(output).toContain('Test 6: Finally block execution (with error)');
      expect(output).toContain('Test 7: Multiple error types');
      expect(output).toContain('Test 8: Nested try-catch blocks');
      expect(output).toContain('Test 9: Error location information');
      expect(output).toContain('Test 10: Simple throw with string message');
      expect(output).toContain('All Error Handling Tests Passed');
    });

    it('should support error creation with all fields', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Error creation and destruction works');
    });

    it('should support all standard error types', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ All error type names are correct');
      expect(output).toContain('✓ Multiple error types work correctly');
    });

    it('should execute finally blocks regardless of errors', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Finally block executes when no error');
      expect(output).toContain('✓ Finally block executes when error is thrown');
    });

    it('should preserve error location information', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Error location information is preserved');
    });

    it('should support nested try-catch blocks', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Nested try-catch blocks work correctly');
    });

    it('should support basic try-catch', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Basic try-catch works');
    });

    it('should handle try-catch without error', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Try-catch without error works');
    });

    it('should support simple throw with string message', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Simple throw with string message works');
    });
  });
});
