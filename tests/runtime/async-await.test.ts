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

describe.skip('Runtime Library - Async/Await (C Execution)', () => {
  const testFile = path.join(__dirname, 'async-await.test.c');
  const runtimeHeader = path.join(__dirname, '../../runtime/nami_runtime.h');
  const outputFile = path.join(
    __dirname,
    '../../test-output',
    'async-await-test' + (os.platform() === 'win32' ? '.exe' : '')
  );

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

  it('should compile and run C async/await tests successfully', () => {
    // Compile the test
    expect(() => {
      const compiler = 'gcc';
      execSync(
        `${compiler} -o "${outputFile}" "${testFile}" -std=c11 -Wall -Wextra -I"${path.dirname(runtimeHeader)}"`,
        {
          stdio: 'pipe',
          encoding: 'utf-8',
        }
      );
    }).not.toThrow();

    // Run the test
    const output = execSync(`"${outputFile}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Verify test output
    expect(output).toContain('Running Async/Await Runtime tests');
    expect(output).toContain('✓ test_async_create: promise created passed');
    expect(output).toContain('✓ test_async_create: initial state is PENDING passed');
    expect(output).toContain('✓ test_async_resolve: state is RESOLVED passed');
    expect(output).toContain('✓ test_async_reject: state is REJECTED passed');
    expect(output).toContain('✓ test_async_await_resolved: result value is 100 passed');
    expect(output).toContain('✓ test_async_await_rejected: result type is STRING passed');
    expect(output).toContain('✓ test_async_resolve_once: first value is kept passed');
    expect(output).toContain('✓ test_async_then_resolve: continuation was called passed');
    expect(output).toContain('✓ test_async_then_reject: continuation was called passed');
    expect(output).toContain(
      '✓ test_async_then_already_resolved: continuation was called immediately passed'
    );
    expect(output).toContain('✓ test_async_multiple_promises: promise1 is RESOLVED passed');
    expect(output).toContain('✓ All async/await tests passed');
  });
});
