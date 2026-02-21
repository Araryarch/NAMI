import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Runtime Library - Graph C Implementation Tests', () => {
  const testCFile = path.join(__dirname, 'graph.test.c');
  const runtimeHeader = path.join(__dirname, '../../runtime/nami_runtime.h');
  
  it('should compile the C test file without errors', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-graph-test-'));
    const outputFile = path.join(tempDir, 'graph_test');
    
    try {
      // Compile the C test file
      const compileCmd = process.platform === 'win32'
        ? `gcc -o "${outputFile}.exe" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`
        : `gcc -o "${outputFile}" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`;
      
      execSync(compileCmd, { stdio: 'pipe' });
      
      // Check that the executable was created
      const executablePath = process.platform === 'win32' ? `${outputFile}.exe` : outputFile;
      expect(fs.existsSync(executablePath)).toBe(true);
    } finally {
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should run all C tests successfully', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-graph-test-'));
    const outputFile = path.join(tempDir, 'graph_test');
    
    try {
      // Compile the C test file
      const compileCmd = process.platform === 'win32'
        ? `gcc -o "${outputFile}.exe" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`
        : `gcc -o "${outputFile}" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`;
      
      execSync(compileCmd, { stdio: 'pipe' });
      
      // Run the tests
      const executablePath = process.platform === 'win32' ? `${outputFile}.exe` : outputFile;
      const output = execSync(executablePath, { encoding: 'utf-8' });
      
      // Check that all tests passed
      expect(output).toContain('All tests passed!');
      expect(output).toContain('Test 1: Graph creation and destruction');
      expect(output).toContain('Test 2: Adding edges');
      expect(output).toContain('Test 3: BFS traversal');
      expect(output).toContain('Test 4: DFS traversal');
      expect(output).toContain('Test 5: Dijkstra\'s shortest path');
      expect(output).toContain('Test 6: A* pathfinding');
      expect(output).toContain('Test 7: Edge cases');
      expect(output).toContain('Test 8: Disconnected graph');
    } finally {
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should verify graph creation test passes', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-graph-test-'));
    const outputFile = path.join(tempDir, 'graph_test');
    
    try {
      const compileCmd = process.platform === 'win32'
        ? `gcc -o "${outputFile}.exe" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`
        : `gcc -o "${outputFile}" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`;
      
      execSync(compileCmd, { stdio: 'pipe' });
      
      const executablePath = process.platform === 'win32' ? `${outputFile}.exe` : outputFile;
      const output = execSync(executablePath, { encoding: 'utf-8' });
      
      expect(output).toContain('✓ Graph creation and destruction works');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should verify BFS and DFS traversals work', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-graph-test-'));
    const outputFile = path.join(tempDir, 'graph_test');
    
    try {
      const compileCmd = process.platform === 'win32'
        ? `gcc -o "${outputFile}.exe" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`
        : `gcc -o "${outputFile}" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`;
      
      execSync(compileCmd, { stdio: 'pipe' });
      
      const executablePath = process.platform === 'win32' ? `${outputFile}.exe` : outputFile;
      const output = execSync(executablePath, { encoding: 'utf-8' });
      
      expect(output).toContain('✓ BFS traversal works correctly');
      expect(output).toContain('✓ DFS traversal works correctly');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should verify Dijkstra and A* algorithms work', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-graph-test-'));
    const outputFile = path.join(tempDir, 'graph_test');
    
    try {
      const compileCmd = process.platform === 'win32'
        ? `gcc -o "${outputFile}.exe" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`
        : `gcc -o "${outputFile}" "${testCFile}" -I"${path.dirname(runtimeHeader)}" -lm -std=c11`;
      
      execSync(compileCmd, { stdio: 'pipe' });
      
      const executablePath = process.platform === 'win32' ? `${outputFile}.exe` : outputFile;
      const output = execSync(executablePath, { encoding: 'utf-8' });
      
      expect(output).toContain('✓ Dijkstra\'s algorithm works correctly');
      expect(output).toContain('✓ A* algorithm works correctly');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
});
