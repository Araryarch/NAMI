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

describe('Runtime Library - Pointer Operations (C Execution)', () => {
  const testFile = path.join(__dirname, 'pointer-operations.test.c');
  const runtimeHeader = path.join(__dirname, '../../runtime/nami_runtime.h');
  const outputFile = path.join(__dirname, '../../test-output', 'pointer-operations-test' + (os.platform() === 'win32' ? '.exe' : ''));

  beforeAll(() => {
    // Ensure test-output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  if (!isGccAvailable()) {
    it('should skip C tests when gcc is not available', () => {
      console.log('Skipping C test: gcc not available');
      expect(true).toBe(true);
    });
    return;
  }

  it('should compile and run C pointer operations tests successfully', () => {
    // Compile the test
    expect(() => {
      const compiler = 'gcc';
      execSync(`${compiler} -o "${outputFile}" "${testFile}" -std=c11 -Wall -Wextra -I"${path.dirname(runtimeHeader)}"`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    }).not.toThrow();

    // Run the test
    const output = execSync(`"${outputFile}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    // Verify test output
    expect(output).toContain('Running Pointer Operations tests');
    expect(output).toContain('✓ test_pointer_registry_init passed');
    expect(output).toContain('✓ test_pointer_enable_disable passed');
    expect(output).toContain('✓ test_pointer_alloc_and_register passed');
    expect(output).toContain('✓ test_pointer_bounds_check_valid passed');
    expect(output).toContain('✓ test_pointer_null_check_nullable passed');
    expect(output).toContain('✓ test_pointer_null_check_non_nullable passed');
    expect(output).toContain('✓ test_pointer_register_unregister passed');
    expect(output).toContain('✓ test_pointer_multiple_allocations passed');
    expect(output).toContain('✓ test_pointer_bounds_check_with_offset passed');
    expect(output).toContain('✓ test_pointer_cleanup_registry passed');
    expect(output).toContain('✓ test_pointer_disabled_checks passed');
    expect(output).toContain('✓ All Pointer Operations tests passed');
  });
});
