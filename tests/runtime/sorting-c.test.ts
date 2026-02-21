import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Runtime Library - Sorting Algorithms C Tests (Task 15.1)', () => {
  const testCFile = path.join(__dirname, 'sorting.test.c');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-sorting-test-'));
  const executable = path.join(tempDir, 'sorting_test' + (process.platform === 'win32' ? '.exe' : ''));

  afterAll(() => {
    // Clean up temporary files
    try {
      if (fs.existsSync(executable)) {
        fs.unlinkSync(executable);
      }
      fs.rmdirSync(tempDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('should compile the C sorting test file', () => {
    const compiler = process.platform === 'win32' ? 'gcc' : 'gcc';
    const compileCmd = `${compiler} -o "${executable}" "${testCFile}" -lm`;
    
    expect(() => {
      execSync(compileCmd, { stdio: 'pipe' });
    }).not.toThrow();
    
    expect(fs.existsSync(executable)).toBe(true);
  });

  it('should run all sorting tests successfully', () => {
    const output = execSync(executable, { encoding: 'utf-8', stdio: 'pipe' });
    
    // Check that all tests passed
    expect(output).toContain('All Sorting Tests Passed!');
    expect(output).toContain('✓ Quicksort basic sorting passed');
    expect(output).toContain('✓ Quicksort custom comparator passed');
    expect(output).toContain('✓ Mergesort basic sorting passed');
    expect(output).toContain('✓ Mergesort custom comparator passed');
    expect(output).toContain('✓ Heapsort basic sorting passed');
    expect(output).toContain('✓ Heapsort custom comparator passed');
    expect(output).toContain('✓ Default sort passed');
    expect(output).toContain('✓ Empty array handling passed');
    expect(output).toContain('✓ Single element handling passed');
    expect(output).toContain('✓ Already sorted array passed');
    expect(output).toContain('✓ Duplicates handling passed');
    expect(output).toContain('✓ Mixed types sorting passed');
  });

  it('should verify quicksort correctness', () => {
    const output = execSync(executable, { encoding: 'utf-8', stdio: 'pipe' });
    expect(output).toContain('✓ Quicksort basic sorting passed');
  });

  it('should verify mergesort correctness', () => {
    const output = execSync(executable, { encoding: 'utf-8', stdio: 'pipe' });
    expect(output).toContain('✓ Mergesort basic sorting passed');
  });

  it('should verify heapsort correctness', () => {
    const output = execSync(executable, { encoding: 'utf-8', stdio: 'pipe' });
    expect(output).toContain('✓ Heapsort basic sorting passed');
  });

  it('should verify custom comparator support', () => {
    const output = execSync(executable, { encoding: 'utf-8', stdio: 'pipe' });
    expect(output).toContain('✓ Quicksort custom comparator passed');
    expect(output).toContain('✓ Mergesort custom comparator passed');
    expect(output).toContain('✓ Heapsort custom comparator passed');
  });

  it('should handle edge cases correctly', () => {
    const output = execSync(executable, { encoding: 'utf-8', stdio: 'pipe' });
    expect(output).toContain('✓ Empty array handling passed');
    expect(output).toContain('✓ Single element handling passed');
    expect(output).toContain('✓ Already sorted array passed');
    expect(output).toContain('✓ Duplicates handling passed');
  });
});
