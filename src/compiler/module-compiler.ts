/**
 * NAMI Module Compiler
 * Handles multi-module compilation with dependency resolution
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  buildDependencyGraph,
  checkCircularDependencies,
  getTopologicalOrder,
  generateIncludeDirectives,
  ModuleDependencyGraph,
  ModuleNode,
  ModuleResolutionError,
  CircularDependencyError,
} from '../features/module-system';
import { CodeGenerator, GeneratedCode } from '../codegen';
import { SemanticAnalyzer } from '../analyzer';

export interface ModuleCompilationResult {
  success: boolean;
  modules: Map<string, GeneratedCode>; // Module ID -> Generated code
  errors: ModuleCompilationError[];
  graph?: ModuleDependencyGraph;
}

export interface ModuleCompilationError {
  type: 'resolution' | 'circular' | 'semantic' | 'codegen';
  message: string;
  modulePath?: string;
  line?: number;
  column?: number;
}

export interface ModuleCompilerOptions {
  optimization: 'debug' | 'release' | 'max';
  outputDir?: string;
}

const DEFAULT_OPTIONS: ModuleCompilerOptions = {
  optimization: 'debug',
};

export class ModuleCompiler {
  private options: ModuleCompilerOptions;

  constructor(options?: Partial<ModuleCompilerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Compile a NAMI program with all its module dependencies
   * @param entryFile - Path to the entry .nm file
   * @returns Compilation result with generated code for all modules
   */
  compileProgram(entryFile: string): ModuleCompilationResult {
    const errors: ModuleCompilationError[] = [];
    const modules = new Map<string, GeneratedCode>();

    try {
      // Step 1: Build dependency graph
      const graph = buildDependencyGraph(entryFile);

      // Step 2: Check for circular dependencies
      try {
        checkCircularDependencies(graph);
      } catch (error) {
        if (error instanceof CircularDependencyError) {
          errors.push({
            type: 'circular',
            message: error.message,
          });
          return { success: false, modules, errors, graph };
        }
        throw error;
      }

      // Step 3: Get compilation order (topological sort)
      const compilationOrder = getTopologicalOrder(graph);

      // Step 4: Compile each module in order
      for (const moduleId of compilationOrder) {
        const node = graph.nodes.get(moduleId);
        if (!node || node.type !== 'file' || !node.ast) {
          continue; // Skip builtin modules
        }

        try {
          const generatedCode = this.compileModule(node, graph);
          modules.set(moduleId, generatedCode);
        } catch (error) {
          errors.push({
            type: 'codegen',
            message: error instanceof Error ? error.message : String(error),
            modulePath: node.path,
          });
        }
      }

      if (errors.length > 0) {
        return { success: false, modules, errors, graph };
      }

      return { success: true, modules, errors: [], graph };
    } catch (error) {
      if (error instanceof ModuleResolutionError) {
        errors.push({
          type: 'resolution',
          message: error.message,
          modulePath: error.fromFile,
        });
      } else {
        errors.push({
          type: 'resolution',
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return { success: false, modules, errors };
    }
  }

  /**
   * Compile a single module
   */
  private compileModule(node: ModuleNode, graph: ModuleDependencyGraph): GeneratedCode {
    if (!node.ast) {
      throw new Error(`Module ${node.id} has no AST`);
    }

    // Run semantic analysis
    const analyzer = new SemanticAnalyzer();
    const { errors, symbolTable } = analyzer.analyze(node.ast);

    if (errors.length > 0) {
      throw new Error(`Semantic errors in ${node.id}: ${errors[0].message}`);
    }

    // Generate code
    const codegen = new CodeGenerator(this.options.optimization);
    const generated = codegen.generate(node.ast, symbolTable);

    // Enhance header with proper include guards and dependencies
    const fileName = node.path ? path.basename(node.path, '.nm') : 'module';
    const guardName = `NAMI_${fileName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_H`;

    const includes = generateIncludeDirectives(node, graph);

    let enhancedHeader = `#ifndef ${guardName}\n`;
    enhancedHeader += `#define ${guardName}\n\n`;
    enhancedHeader += `#include "nami_runtime.h"\n`;

    for (const include of includes) {
      enhancedHeader += `${include}\n`;
    }

    enhancedHeader += '\n';
    enhancedHeader += generated.headerFile;
    enhancedHeader += `\n#endif // ${guardName}\n`;

    return {
      ...generated,
      headerFile: enhancedHeader,
    };
  }

  /**
   * Write generated code to files
   */
  writeOutput(result: ModuleCompilationResult, outputDir: string): void {
    if (!result.success) {
      throw new Error('Cannot write output for failed compilation');
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write each module's files
    for (const [moduleId, generated] of result.modules) {
      const node = result.graph?.nodes.get(moduleId);
      if (!node || !node.path) continue;

      const baseName = path.basename(node.path, '.nm');
      const headerPath = path.join(outputDir, `${baseName}.h`);
      const sourcePath = path.join(outputDir, `${baseName}.c`);

      fs.writeFileSync(headerPath, generated.headerFile, 'utf-8');
      fs.writeFileSync(sourcePath, generated.sourceFile, 'utf-8');
    }

    // Copy runtime header
    const runtimeHeaderSrc = path.join(__dirname, '../../runtime/nami_runtime.h');
    const runtimeHeaderDest = path.join(outputDir, 'nami_runtime.h');

    if (fs.existsSync(runtimeHeaderSrc)) {
      fs.copyFileSync(runtimeHeaderSrc, runtimeHeaderDest);
    }

    // Copy HTTP stub header
    const httpStubSrc = path.join(__dirname, '../../runtime/nami_http_stub.h');
    const httpStubDest = path.join(outputDir, 'nami_http_stub.h');

    if (fs.existsSync(httpStubSrc)) {
      fs.copyFileSync(httpStubSrc, httpStubDest);
    }

    // Copy HTTP simple header
    const httpSimpleSrc = path.join(__dirname, '../../runtime/nami_http_simple.h');
    const httpSimpleDest = path.join(outputDir, 'nami_http_simple.h');

    if (fs.existsSync(httpSimpleSrc)) {
      fs.copyFileSync(httpSimpleSrc, httpSimpleDest);
    }

    // Copy HTTP mongoose header
    const httpMongooseSrc = path.join(__dirname, '../../runtime/nami_http_mongoose.h');
    const httpMongooseDest = path.join(outputDir, 'nami_http_mongoose.h');

    if (fs.existsSync(httpMongooseSrc)) {
      fs.copyFileSync(httpMongooseSrc, httpMongooseDest);
    }

    // Copy mongoose files if they exist
    const mongooseHSrc = path.join(__dirname, '../../runtime/mongoose.h');
    const mongooseHDest = path.join(outputDir, 'mongoose.h');

    if (fs.existsSync(mongooseHSrc)) {
      fs.copyFileSync(mongooseHSrc, mongooseHDest);
    }

    const mongooseCSrc = path.join(__dirname, '../../runtime/mongoose.c');
    const mongooseCDest = path.join(outputDir, 'mongoose.c');

    if (fs.existsSync(mongooseCSrc)) {
      fs.copyFileSync(mongooseCSrc, mongooseCDest);
    }
  }
}
