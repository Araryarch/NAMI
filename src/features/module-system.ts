/**
 * NAMI Module System
 *
 * Handles resolution and validation of NAMI module imports.
 * Supports:
 * 1. Built-in modules: `import nm`, `import http`
 * 2. File modules: `import { add } from "./math.nm"`
 * 3. Package modules: `import { fetch } from "nami-fetch"` (future)
 */

import * as path from 'path';
import * as fs from 'fs';
import { Program } from '../parser/ast';
import { Parser } from '../parser';
import { Lexer } from '../lexer';

/** Types of modules in NAMI */
export type ModuleType = 'builtin' | 'file' | 'package';

/** Known built-in modules */
export const BUILTIN_MODULES = ['nm', 'http', 'fs', 'math', 'json'] as const;
export type BuiltinModuleName = (typeof BUILTIN_MODULES)[number];

/** Module resolution result */
export interface ResolvedModule {
  type: ModuleType;
  name: string;
  path?: string; // Absolute path for file modules
  exports?: string[]; // Exported symbols (for type checking)
}

/** Module dependency graph node */
export interface ModuleNode {
  id: string; // Absolute path or builtin name
  type: ModuleType;
  path?: string;
  imports: string[]; // IDs of modules this module imports
  exports: string[]; // Exported symbol names
  ast?: Program; // Parsed AST
}

/** Module dependency graph */
export interface ModuleDependencyGraph {
  nodes: Map<string, ModuleNode>;
  entryPoint: string; // ID of the entry module
}

/** Module resolution error */
export class ModuleResolutionError extends Error {
  constructor(
    message: string,
    public moduleName: string,
    public fromFile?: string
  ) {
    super(message);
    this.name = 'ModuleResolutionError';
  }
}

/** Check if a module name is a built-in module */
export function isBuiltinModule(name: string): name is BuiltinModuleName {
  return (BUILTIN_MODULES as readonly string[]).includes(name);
}

/** Resolve a module import
 * @param moduleName - The module name or path
 * @param fromFile - The file that contains the import statement
 * @returns Resolved module info or null if not found
 */
export function resolveModule(moduleName: string, fromFile?: string): ResolvedModule | null {
  // 1. Check built-in modules
  if (isBuiltinModule(moduleName)) {
    return {
      type: 'builtin',
      name: moduleName,
    };
  }

  // 2. Check file modules (.nm files)
  if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
    if (!fromFile) return null;

    const dir = path.dirname(fromFile);
    let resolvedPath = path.resolve(dir, moduleName);

    // Auto-append .nm extension if not present
    if (!resolvedPath.endsWith('.nm')) {
      resolvedPath += '.nm';
    }

    if (fs.existsSync(resolvedPath)) {
      return {
        type: 'file',
        name: moduleName,
        path: resolvedPath,
      };
    }

    // Try as directory with index.nm
    const indexPath = path.resolve(dir, moduleName, 'index.nm');
    if (fs.existsSync(indexPath)) {
      return {
        type: 'file',
        name: moduleName,
        path: indexPath,
      };
    }

    return null;
  }

  // 3. Package modules (future: nami_modules/)
  return {
    type: 'package',
    name: moduleName,
  };
}

/** Generate C include for a module */
export function generateModuleInclude(module: ResolvedModule): string {
  switch (module.type) {
    case 'builtin':
      return `#include "nami_${module.name}.h"`;
    case 'file': {
      const basename = path.basename(module.path || '', '.nm');
      return `#include "${basename}.h"`;
    }
    case 'package':
      return `#include "nami_pkg_${module.name}.h"`;
  }
}

/** Extract export names from a NAMI source file (simple scan) */
export function extractExports(source: string): string[] {
  const exports: string[] = [];
  const exportRegex = /export\s+(?:fn|function|let|const)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(source)) !== null) {
    exports.push(match[1]);
  }
  return exports;
}

/** Extract imports from an AST */
export function extractImports(ast: Program): string[] {
  const imports: string[] = [];

  for (const statement of ast.body) {
    if (statement.type === 'ImportStatement') {
      const importStmt = statement;
      imports.push(importStmt.source.value);
    } else if (statement.type === 'NamiImportStatement') {
      const namiImport = statement;
      imports.push(namiImport.module.name);
    }
  }

  return imports;
}

/** Build module dependency graph starting from an entry file */
export function buildDependencyGraph(
  entryFile: string,
  visited: Set<string> = new Set()
): ModuleDependencyGraph {
  const graph: ModuleDependencyGraph = {
    nodes: new Map(),
    entryPoint: path.resolve(entryFile),
  };

  // Recursive function to process a module and its dependencies
  function processModule(filePath: string): void {
    const absolutePath = path.resolve(filePath);

    // Avoid processing the same module twice
    if (visited.has(absolutePath)) {
      return;
    }
    visited.add(absolutePath);

    // Read and parse the module
    let source: string;
    try {
      source = fs.readFileSync(absolutePath, 'utf-8');
    } catch (error) {
      throw new ModuleResolutionError(`Failed to read module: ${error}`, absolutePath);
    }

    // Parse the module
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(
      undefined,
      tokens.filter((t) => t.type !== 'COMMENT' && t.type !== 'BLOCK_COMMENT')
    );
    const ast = parser.parse();

    if (parser.getErrors().length > 0) {
      throw new ModuleResolutionError(
        `Failed to parse module: ${parser.getErrors()[0].message}`,
        absolutePath
      );
    }

    // Extract imports and exports
    const importNames = extractImports(ast);
    const exportNames = extractExports(source);

    // Resolve import paths
    const resolvedImports: string[] = [];
    for (const importName of importNames) {
      const resolved = resolveModule(importName, absolutePath);
      if (!resolved) {
        throw new ModuleResolutionError(
          `Cannot resolve module '${importName}'`,
          importName,
          absolutePath
        );
      }

      // Get the ID for this import
      let importId: string;
      if (resolved.type === 'builtin') {
        importId = `builtin:${resolved.name}`;
      } else if (resolved.type === 'file' && resolved.path) {
        importId = resolved.path;
      } else {
        importId = `package:${resolved.name}`;
      }

      resolvedImports.push(importId);

      // Recursively process file modules
      if (resolved.type === 'file' && resolved.path) {
        processModule(resolved.path);
      } else if (resolved.type === 'builtin') {
        // Add builtin module node if not already present
        if (!graph.nodes.has(importId)) {
          graph.nodes.set(importId, {
            id: importId,
            type: 'builtin',
            imports: [],
            exports: [], // Builtins have predefined exports
          });
        }
      }
    }

    // Add this module to the graph
    graph.nodes.set(absolutePath, {
      id: absolutePath,
      type: 'file',
      path: absolutePath,
      imports: resolvedImports,
      exports: exportNames,
      ast,
    });
  }

  // Start processing from the entry file
  processModule(entryFile);

  return graph;
}

/** Get all modules in topological order (dependencies before dependents) */
export function getTopologicalOrder(graph: ModuleDependencyGraph): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(nodeId: string): void {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) {
      // Circular dependency detected - will be handled by separate check
      return;
    }

    visiting.add(nodeId);
    const node = graph.nodes.get(nodeId);
    if (node) {
      for (const importId of node.imports) {
        visit(importId);
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    order.push(nodeId);
  }

  // Visit all nodes starting from entry point
  visit(graph.entryPoint);

  return order;
}

/** Circular dependency error with full cycle path */
export class CircularDependencyError extends Error {
  constructor(
    message: string,
    public cycle: string[]
  ) {
    super(message);
    this.name = 'CircularDependencyError';
  }
}

/** Detect circular dependencies in the module graph using DFS */
export function detectCircularDependencies(graph: ModuleDependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack: string[] = [];
  const inStack = new Set<string>();

  function dfs(nodeId: string): void {
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.push(nodeId);
    inStack.add(nodeId);

    const node = graph.nodes.get(nodeId);
    if (node) {
      for (const importId of node.imports) {
        if (!visited.has(importId)) {
          dfs(importId);
        } else if (inStack.has(importId)) {
          // Found a cycle - extract the cycle path
          const cycleStartIndex = recursionStack.indexOf(importId);
          const cycle = recursionStack.slice(cycleStartIndex);
          cycle.push(importId); // Complete the cycle
          cycles.push(cycle);
        }
      }
    }

    recursionStack.pop();
    inStack.delete(nodeId);
  }

  // Check all nodes in the graph
  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }

  return cycles;
}

/** Check for circular dependencies and throw error if found */
export function checkCircularDependencies(graph: ModuleDependencyGraph): void {
  const cycles = detectCircularDependencies(graph);

  if (cycles.length > 0) {
    // Format the first cycle for error message
    const cycle = cycles[0];
    const cycleNames = cycle.map((id) => {
      if (id.startsWith('builtin:')) {
        return id.substring(8);
      } else if (id.startsWith('package:')) {
        return id.substring(8);
      } else {
        return path.basename(id);
      }
    });

    const cycleStr = cycleNames.join(' → ');
    throw new CircularDependencyError(`Circular dependency detected: ${cycleStr}`, cycle);
  }
}

/** Module code generation result */
export interface ModuleCodeGeneration {
  headerFile: string; // .h file content
  sourceFile: string; // .c file content
  fileName: string; // Base name without extension
}

/** Generate C header file for a module */
export function generateModuleHeader(node: ModuleNode): string {
  const fileName = node.path ? path.basename(node.path, '.nm') : node.id;
  const guardName = `NAMI_${fileName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_H`;

  let header = '';

  // Include guard
  header += `#ifndef ${guardName}\n`;
  header += `#define ${guardName}\n\n`;

  // Standard includes
  header += `#include "nami_runtime.h"\n\n`;

  // Include dependencies
  for (const importId of node.imports) {
    if (importId.startsWith('builtin:')) {
      const builtinName = importId.substring(8);
      header += `#include "nami_${builtinName}.h"\n`;
    } else if (!importId.startsWith('package:')) {
      const importFileName = path.basename(importId, '.nm');
      header += `#include "${importFileName}.h"\n`;
    }
  }

  if (node.imports.length > 0) {
    header += '\n';
  }

  // Function declarations for exports
  if (node.exports.length > 0) {
    header += `// Exported functions\n`;
    for (const exportName of node.exports) {
      // Generate function prototype (simplified - actual types would come from AST)
      header += `nami_value_t ${exportName}(/* parameters */);\n`;
    }
    header += '\n';
  }

  // Close include guard
  header += `#endif // ${guardName}\n`;

  return header;
}

/** Generate C source file for a module */
export function generateModuleSource(_node: ModuleNode, headerFileName: string): string {
  let source = '';

  // Include the module's own header
  source += `#include "${headerFileName}"\n\n`;

  // The actual implementation would be generated by CodeGenerator
  // This is a placeholder that shows the structure
  source += `// Module implementation\n`;
  source += `// Generated by NAMI compiler\n\n`;

  return source;
}

/** Generate all module files from dependency graph */
export function generateModuleFiles(
  graph: ModuleDependencyGraph
): Map<string, ModuleCodeGeneration> {
  const generated = new Map<string, ModuleCodeGeneration>();

  // Get modules in topological order
  const order = getTopologicalOrder(graph);

  for (const nodeId of order) {
    const node = graph.nodes.get(nodeId);
    if (!node || node.type !== 'file') {
      continue; // Skip builtin and package modules
    }

    const fileName = path.basename(node.path!, '.nm');
    const headerFile = generateModuleHeader(node);
    const sourceFile = generateModuleSource(node, `${fileName}.h`);

    generated.set(nodeId, {
      headerFile,
      sourceFile,
      fileName,
    });
  }

  return generated;
}

/** Generate include directives for a module's imports */
export function generateIncludeDirectives(
  node: ModuleNode,
  graph: ModuleDependencyGraph
): string[] {
  const includes: string[] = [];

  for (const importId of node.imports) {
    if (importId.startsWith('builtin:')) {
      const builtinName = importId.substring(8);
      includes.push(`#include "nami_${builtinName}.h"`);
    } else if (importId.startsWith('package:')) {
      const packageName = importId.substring(8);
      includes.push(`#include "nami_pkg_${packageName}.h"`);
    } else {
      // File module
      const importNode = graph.nodes.get(importId);
      if (importNode && importNode.path) {
        const importFileName = path.basename(importNode.path, '.nm');
        includes.push(`#include "${importFileName}.h"`);
      }
    }
  }

  return includes;
}
