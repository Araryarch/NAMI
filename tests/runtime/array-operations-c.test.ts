import { describe, it, expect } from '@jest/globals';
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

describe.skip('Runtime Library - Array Operations (C Runtime)', () => {
  const testFile = path.join(__dirname, 'array-operations.test.c');
  const outputFile = path.join(
    __dirname,
    '../../test-output',
    'array-operations-test' + (os.platform() === 'win32' ? '.exe' : '')
  );

  beforeAll(() => {
    // Ensure test-output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  // Skip all tests if gcc is not available
  const describeOrSkip = isGccAvailable() ? describe : describe.skip;

  describeOrSkip('C Runtime Tests (requires gcc)', () => {
    it('should compile the C test file without errors', () => {
      expect(() => {
        const compiler = 'gcc';
        execSync(`${compiler} -o "${outputFile}" "${testFile}" -std=c11 -Wall -Wextra`, {
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      }).not.toThrow();
    });

    it('should execute array operations tests successfully', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Check for test output
      expect(output).toContain('NAMI Array Operations Tests');
      expect(output).toContain('Testing array create and destroy');
      expect(output).toContain('Testing array push and pop');
      expect(output).toContain('Testing array dynamic resizing');
      expect(output).toContain('Testing array slice');
      expect(output).toContain('Testing array map');
      expect(output).toContain('Testing array filter');
      expect(output).toContain('Testing array foreach');
      expect(output).toContain('Testing array reduce');
      expect(output).toContain('Testing array get and set');
      expect(output).toContain('All array operation tests passed');
    });

    it('should verify array create and destroy functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array create and destroy works');
    });

    it('should verify array push and pop functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array push and pop works');
    });

    it('should verify array dynamic resizing', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array dynamic resizing works');
    });

    it('should verify array slice functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array slice works');
    });

    it('should verify array map functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array map works');
    });

    it('should verify array filter functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array filter works');
    });

    it('should verify array foreach functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array foreach works');
    });

    it('should verify array reduce functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array reduce works');
    });

    it('should verify array get and set functionality', () => {
      const output = execSync(`"${outputFile}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      expect(output).toContain('✓ Array get and set works');
    });
  });
});
