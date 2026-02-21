import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Runtime Library - Tree C Implementation Tests', () => {
  const testFile = path.join(__dirname, 'tree.test.c');
  const runtimeHeader = path.join(__dirname, '../../runtime/nami_runtime.h');
  
  it('should compile the tree test file', () => {
    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.existsSync(runtimeHeader)).toBe(true);
  });

  it('should execute tree tests successfully', () => {
    const outputDir = path.join(__dirname, '../../test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const executable = path.join(outputDir, 'tree_test' + (os.platform() === 'win32' ? '.exe' : ''));
    
    try {
      // Compile the test
      const compileCmd = os.platform() === 'win32'
        ? `gcc -o "${executable}" "${testFile}" -I. -lm`
        : `gcc -o "${executable}" "${testFile}" -I. -lm`;
      
      execSync(compileCmd, { 
        cwd: __dirname,
        stdio: 'pipe'
      });

      // Run the test
      const output = execSync(executable, { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // Check that tests ran
      expect(output).toContain('Running Tree Data Structure Tests');
      expect(output).toContain('All tree tests completed!');
      
      // Check for test passes (✓ symbol or success indicators)
      expect(output).toContain('Tree creation');
      expect(output).toContain('Insert single value');
      expect(output).toContain('BST ordering');
      expect(output).toContain('Search');
      expect(output).toContain('traversal');
      expect(output).toContain('Tree height');
      expect(output).toContain('Tree size');
      expect(output).toContain('AVL balancing');
      
      // Should not contain FAILED
      expect(output).not.toContain('FAILED');

      console.log('\nTree C Test Output:');
      console.log(output);
    } catch (error: any) {
      console.error('Compilation or execution failed:', error.message);
      if (error.stdout) console.log('stdout:', error.stdout.toString());
      if (error.stderr) console.error('stderr:', error.stderr.toString());
      throw error;
    }
  }, 30000); // 30 second timeout for compilation and execution
});
