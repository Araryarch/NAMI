/**
 * Integration tests for NAMI module system
 * Tests module resolution, circular dependency detection, and code generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  buildDependencyGraph,
  checkCircularDependencies,
  detectCircularDependencies,
  getTopologicalOrder,
  ModuleResolutionError,
  CircularDependencyError,
} from '../../src/features/module-system';
import { ModuleCompiler } from '../../src/compiler/module-compiler';

describe('Module System', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Module Resolution', () => {
    test('should resolve simple module import', () => {
      // Create test files
      const mathFile = path.join(tempDir, 'math.nm');
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        mathFile,
        `
export function add(a, b) {
  return a + b;
}
      `.trim()
      );

      fs.writeFileSync(
        mainFile,
        `
import { add } from "./math.nm";

let result = add(1, 2);
print(result);
      `.trim()
      );

      const graph = buildDependencyGraph(mainFile);

      expect(graph.nodes.size).toBeGreaterThanOrEqual(1);
      expect(graph.entryPoint).toBe(path.resolve(mainFile));
    });

    test('should resolve nested module imports', () => {
      // Create test files
      const utilsFile = path.join(tempDir, 'utils.nm');
      const mathFile = path.join(tempDir, 'math.nm');
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        utilsFile,
        `
export function helper() {
  return 42;
}
      `.trim()
      );

      fs.writeFileSync(
        mathFile,
        `
import { helper } from "./utils.nm";

export function add(a, b) {
  return a + b + helper();
}
      `.trim()
      );

      fs.writeFileSync(
        mainFile,
        `
import { add } from "./math.nm";

let result = add(1, 2);
print(result);
      `.trim()
      );

      const graph = buildDependencyGraph(mainFile);

      expect(graph.nodes.size).toBeGreaterThanOrEqual(2);

      // Check that all modules are in the graph
      const mainNode = graph.nodes.get(path.resolve(mainFile));
      expect(mainNode).toBeDefined();
      expect(mainNode?.imports.length).toBeGreaterThan(0);
    });

    test('should throw error for missing module', () => {
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        mainFile,
        `
import { add } from "./nonexistent.nm";

let result = add(1, 2);
      `.trim()
      );

      expect(() => {
        buildDependencyGraph(mainFile);
      }).toThrow(ModuleResolutionError);
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should detect simple circular dependency', () => {
      // Create circular dependency: a.nm -> b.nm -> a.nm
      const aFile = path.join(tempDir, 'a.nm');
      const bFile = path.join(tempDir, 'b.nm');

      fs.writeFileSync(
        aFile,
        `
import { funcB } from "./b.nm";

export function funcA() {
  return funcB();
}
      `.trim()
      );

      fs.writeFileSync(
        bFile,
        `
import { funcA } from "./a.nm";

export function funcB() {
  return funcA();
}
      `.trim()
      );

      const graph = buildDependencyGraph(aFile);
      const cycles = detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);
    });

    test('should throw error when checking circular dependencies', () => {
      // Create circular dependency
      const aFile = path.join(tempDir, 'a.nm');
      const bFile = path.join(tempDir, 'b.nm');

      fs.writeFileSync(
        aFile,
        `
import { funcB } from "./b.nm";

export function funcA() {
  return funcB();
}
      `.trim()
      );

      fs.writeFileSync(
        bFile,
        `
import { funcA } from "./a.nm";

export function funcB() {
  return funcA();
}
      `.trim()
      );

      const graph = buildDependencyGraph(aFile);

      expect(() => {
        checkCircularDependencies(graph);
      }).toThrow(CircularDependencyError);
    });

    test('should not detect circular dependency in valid graph', () => {
      const utilsFile = path.join(tempDir, 'utils.nm');
      const mathFile = path.join(tempDir, 'math.nm');
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        utilsFile,
        `
export function helper() {
  return 42;
}
      `.trim()
      );

      fs.writeFileSync(
        mathFile,
        `
import { helper } from "./utils.nm";

export function add(a, b) {
  return a + b + helper();
}
      `.trim()
      );

      fs.writeFileSync(
        mainFile,
        `
import { add } from "./math.nm";

let result = add(1, 2);
      `.trim()
      );

      const graph = buildDependencyGraph(mainFile);

      expect(() => {
        checkCircularDependencies(graph);
      }).not.toThrow();
    });
  });

  describe('Topological Ordering', () => {
    test('should return modules in dependency order', () => {
      const utilsFile = path.join(tempDir, 'utils.nm');
      const mathFile = path.join(tempDir, 'math.nm');
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        utilsFile,
        `
export function helper() {
  return 42;
}
      `.trim()
      );

      fs.writeFileSync(
        mathFile,
        `
import { helper } from "./utils.nm";

export function add(a, b) {
  return a + b;
}
      `.trim()
      );

      fs.writeFileSync(
        mainFile,
        `
import { add } from "./math.nm";

let result = add(1, 2);
      `.trim()
      );

      const graph = buildDependencyGraph(mainFile);
      const order = getTopologicalOrder(graph);

      expect(order.length).toBeGreaterThan(0);

      // Main file should be last (depends on others)
      expect(order[order.length - 1]).toBe(path.resolve(mainFile));
    });
  });

  describe('Module Compiler', () => {
    test('should compile single module program', () => {
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        mainFile,
        `
function add(a, b) {
  return a + b;
}

let result = add(1, 2);
print(result);
      `.trim()
      );

      const compiler = new ModuleCompiler({ optimization: 'debug' });
      const result = compiler.compileProgram(mainFile);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.modules.size).toBeGreaterThan(0);
    });

    test('should compile multi-module program', () => {
      const mathFile = path.join(tempDir, 'math.nm');
      const mainFile = path.join(tempDir, 'main.nm');

      fs.writeFileSync(
        mathFile,
        `
export function add(a, b) {
  return a + b;
}
      `.trim()
      );

      fs.writeFileSync(
        mainFile,
        `
import { add } from "./math.nm";

let result = add(1, 2);
print(result);
      `.trim()
      );

      const compiler = new ModuleCompiler({ optimization: 'debug' });
      const result = compiler.compileProgram(mainFile);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.modules.size).toBeGreaterThanOrEqual(1);
    });

    test('should fail compilation with circular dependency', () => {
      const aFile = path.join(tempDir, 'a.nm');
      const bFile = path.join(tempDir, 'b.nm');

      fs.writeFileSync(
        aFile,
        `
import { funcB } from "./b.nm";

export function funcA() {
  return funcB();
}
      `.trim()
      );

      fs.writeFileSync(
        bFile,
        `
import { funcA } from "./a.nm";

export function funcB() {
  return funcA();
}
      `.trim()
      );

      const compiler = new ModuleCompiler({ optimization: 'debug' });
      const result = compiler.compileProgram(aFile);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('circular');
    });
  });
});
