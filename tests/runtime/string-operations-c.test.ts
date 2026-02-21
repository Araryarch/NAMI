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

describe('Runtime Library - String Operations (C Execution)', () => {
  const testCFile = path.join(__dirname, 'string-operations.test.c');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-string-test-'));
  const exePath = path.join(tempDir, 'string-test' + (process.platform === 'win32' ? '.exe' : ''));

  afterAll(() => {
    // Clean up
    try {
      if (fs.existsSync(exePath)) {
        fs.unlinkSync(exePath);
      }
      fs.rmdirSync(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('should compile and run C string operations tests successfully', () => {
    if (!isGccAvailable()) {
      console.log('Skipping C test: gcc not available');
      return;
    }
    // Compile the C test file
    const compileCmd = process.platform === 'win32'
      ? `gcc "${testCFile}" -o "${exePath}" -std=c11 -Wall -Wextra`
      : `gcc "${testCFile}" -o "${exePath}" -std=c11 -Wall -Wextra`;

    try {
      execSync(compileCmd, { stdio: 'pipe' });
    } catch (error: any) {
      console.error('Compilation failed:', error.stderr?.toString());
      throw new Error(`Failed to compile C test: ${error.message}`);
    }

    expect(fs.existsSync(exePath)).toBe(true);

    // Run the compiled test
    try {
      const output = execSync(`"${exePath}"`, { encoding: 'utf-8' });
      
      // Check that all tests passed
      expect(output).toContain('NAMI String Operations Tests');
      expect(output).toContain('Testing string create and destroy');
      expect(output).toContain('✓ String create and destroy works');
      expect(output).toContain('Testing string concatenation');
      expect(output).toContain('✓ String concatenation works');
      expect(output).toContain('Testing string substring');
      expect(output).toContain('✓ String substring works');
      expect(output).toContain('Testing string index_of');
      expect(output).toContain('✓ String index_of works');
      expect(output).toContain('Testing string replace');
      expect(output).toContain('✓ String replace works');
      expect(output).toContain('Testing string split');
      expect(output).toContain('✓ String split works');
      expect(output).toContain('Testing string join');
      expect(output).toContain('✓ String join works');
      expect(output).toContain('Testing string split-join round trip');
      expect(output).toContain('✓ String split-join round trip works');
      expect(output).toContain('All string operation tests passed');
    } catch (error: any) {
      console.error('Test execution failed:', error.stdout?.toString());
      throw new Error(`C test execution failed: ${error.message}`);
    }
  });
});
