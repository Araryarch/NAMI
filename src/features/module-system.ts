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
