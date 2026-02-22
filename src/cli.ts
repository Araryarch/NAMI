#!/usr/bin/env node

/**
 * NAMI Language CLI
 * Command-line interface for compiling and running NAMI programs
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { Command } from 'commander';
import { version } from './version';
import { Compiler } from './compiler';

/**
 * Optimization levels for the compiler
 */
export enum OptimizationLevel {
  Debug = 'debug',
  Release = 'release',
  MaxOptimization = 'max',
}

/**
 * Common options for compilation commands
 */
interface CompileOptions {
  output?: string;
  optimization?: OptimizationLevel;
  debug?: boolean;
}

/**
 * Find available C compiler (gcc or clang)
 */
function findCCompiler(): string | null {
  const compilers = ['gcc', 'clang', 'cc'];

  for (const compiler of compilers) {
    try {
      execSync(`${compiler} --version`, { stdio: 'ignore' });
      return compiler;
    } catch {
      // Compiler not found, try next
    }
  }

  return null;
}

/**
 * Compile C source to executable
 */
function compileCToExecutable(
  sourceFile: string,
  outputFile: string,
  includeDir: string,
  optimization: OptimizationLevel = OptimizationLevel.Debug
): void {
  const compiler = findCCompiler();

  if (!compiler) {
    console.error('\x1b[31mError: No C compiler found (gcc, clang, or cc required)\x1b[0m');
    console.error('Please install a C compiler to use this command.');
    process.exit(1);
  }

  // Build compiler flags based on optimization level
  let optFlags = '';
  if (optimization === OptimizationLevel.Release) {
    optFlags = '-O2';
  } else if (optimization === OptimizationLevel.MaxOptimization) {
    optFlags = '-O3 -march=native';
  } else {
    optFlags = '-g'; // Debug mode
  }

  const command = `${compiler} ${optFlags} -o "${outputFile}" "${sourceFile}" -I"${includeDir}" -lm`;

  try {
    execSync(command, { stdio: 'pipe' });
  } catch (error: any) {
    console.error('\x1b[31mError: C compilation failed\x1b[0m');
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Execute a binary and capture output
 */
function executeProgram(executablePath: string): void {
  try {
    execSync(`"${executablePath}"`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
  } catch (error: any) {
    // Program executed but may have exited with non-zero status
    // This is okay - we still want to show the output
    if (error.status !== undefined) {
      process.exit(error.status);
    }
  }
}

/**
 * Clean up temporary files and directories
 */
function cleanupTempFiles(dir: string): void {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}
function compileSource(
  filePath: string,
  options: CompileOptions = {}
): { success: boolean; output?: any; errors: any[] } {
  if (!fs.existsSync(filePath)) {
    console.error(`\x1b[31mError: File not found: ${filePath}\x1b[0m`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const compiler = new Compiler();

  // Apply optimization level if specified
  if (options.optimization) {
    // TODO: Pass optimization level to compiler when implemented
    // For now, just store it for future use
  }

  const result = compiler.compile(source);

  if (!result.success) {
    console.error(
      `\x1b[1m\x1b[31mCompilation failed with ${result.errors.length} error(s):\x1b[0m\n`
    );
    for (const err of result.errors) {
      const loc = err.line ? `[${filePath}:${err.line}:${err.column}]` : `[${filePath}]`;
      const type = err.type.toUpperCase();
      console.error(`  \x1b[31m${type} ${loc}\x1b[0m: ${err.message}`);
    }
    process.exit(1);
  }

  return result;
}

/**
 * Create the CLI program with all commands
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('nami')
    .description('NAMI Language Compiler - JavaScript-like syntax compiling to C')
    .version(version, '-v, --version', 'Display version information');

  // Run command
  program
    .command('run')
    .description('Compile and execute a NAMI program')
    .argument('<file>', 'NAMI source file (.nm)')
    .option('-O, --optimization <level>', 'Optimization level (debug, release, max)', 'debug')
    .option('--debug', 'Enable debug mode', false)
    .option('--keep-temp', 'Keep temporary build files', false)
    .action((file: string, options: CompileOptions & { keepTemp?: boolean }) => {
      const result = compileSource(file, options);

      // Create temporary directory for build
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nami-'));

      try {
        const baseName = path.basename(file, path.extname(file));
        const sourceFile = path.join(tmpDir, `${baseName}.c`);
        const headerFile = path.join(tmpDir, 'nami_generated.h');
        const executableFile = path.join(
          tmpDir,
          baseName + (os.platform() === 'win32' ? '.exe' : '')
        );

        // Write generated C files
        fs.writeFileSync(sourceFile, result.output!.sourceFile);
        fs.writeFileSync(headerFile, result.output!.headerFile);

        // Copy runtime library header if it exists
        const runtimeHeader = path.join(__dirname, '..', 'runtime', 'nami_runtime.h');
        if (fs.existsSync(runtimeHeader)) {
          const destRuntimeHeader = path.join(tmpDir, 'nami_runtime.h');
          fs.copyFileSync(runtimeHeader, destRuntimeHeader);
        }

        console.log(`\x1b[32m✓ Compiled successfully.\x1b[0m`);

        // Compile C to executable
        console.log('Compiling to native binary...');
        const optLevel = (options.optimization as OptimizationLevel) || OptimizationLevel.Debug;
        compileCToExecutable(sourceFile, executableFile, tmpDir, optLevel);

        console.log(`\x1b[32m✓ Build successful.\x1b[0m`);
        console.log('\nExecuting program:');
        console.log('─'.repeat(60));

        // Execute the program
        executeProgram(executableFile);

        console.log('─'.repeat(60));
      } finally {
        // Clean up temporary files unless --keep-temp is specified
        if (!options.keepTemp) {
          cleanupTempFiles(tmpDir);
        } else {
          console.log(`\nTemporary files kept in: ${tmpDir}`);
        }
      }
    });

  // Build command
  program
    .command('build')
    .description('Compile NAMI source to C code')
    .argument('<file>', 'NAMI source file (.nm)')
    .option('-o, --output <dir>', 'Output directory for generated C files')
    .option('-O, --optimization <level>', 'Optimization level (debug, release, max)', 'debug')
    .option('--debug', 'Enable debug mode', false)
    .action((file: string, options: CompileOptions) => {
      const result = compileSource(file, options);

      const outputDir = options.output || path.join(path.dirname(file), 'build');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const baseName = path.basename(file, path.extname(file));
      const sourceFile = path.join(outputDir, `${baseName}.c`);
      const headerFile = path.join(outputDir, `${baseName}.h`);

      fs.writeFileSync(sourceFile, result.output!.sourceFile);
      fs.writeFileSync(headerFile, result.output!.headerFile);

      // Copy runtime library header if it exists
      const runtimeHeader = path.join(__dirname, '..', 'runtime', 'nami_runtime.h');
      if (fs.existsSync(runtimeHeader)) {
        const destRuntimeHeader = path.join(outputDir, 'nami_runtime.h');
        fs.copyFileSync(runtimeHeader, destRuntimeHeader);
        console.log(`  Runtime: ${destRuntimeHeader}`);
      }

      console.log(`\x1b[32m✓ Build successful!\x1b[0m`);
      console.log(`  Source: ${sourceFile}`);
      console.log(`  Header: ${headerFile}`);
      console.log(`\nTo compile to native binary:`);
      console.log(`  gcc -o ${baseName} ${sourceFile} -I${outputDir} -lm`);
    });

  // Compile command
  program
    .command('compile')
    .description('Compile NAMI source to executable (requires gcc/clang)')
    .argument('<file>', 'NAMI source file (.nm)')
    .option('-o, --output <file>', 'Output executable file')
    .option('-O, --optimization <level>', 'Optimization level (debug, release, max)', 'release')
    .option('--debug', 'Enable debug mode', false)
    .action((file: string, options: CompileOptions) => {
      const result = compileSource(file, options);

      // Write C files to temp dir
      const tmpDir = path.join(path.dirname(file), '.nami-build');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const baseName = path.basename(file, path.extname(file));
      const sourceFile = path.join(tmpDir, `${baseName}.c`);
      const headerFile = path.join(tmpDir, 'nami_generated.h');
      const outputFile =
        options.output ||
        path.join(path.dirname(file), baseName + (os.platform() === 'win32' ? '.exe' : ''));

      fs.writeFileSync(sourceFile, result.output!.sourceFile);
      fs.writeFileSync(headerFile, result.output!.headerFile);

      // Copy runtime library header if it exists
      const runtimeHeader = path.join(__dirname, '..', 'runtime', 'nami_runtime.h');
      if (fs.existsSync(runtimeHeader)) {
        const destRuntimeHeader = path.join(tmpDir, 'nami_runtime.h');
        fs.copyFileSync(runtimeHeader, destRuntimeHeader);
      }

      console.log(`\x1b[32m✓ NAMI compilation successful.\x1b[0m`);

      // Compile C to executable
      console.log('Compiling to native binary...');
      const optLevel = (options.optimization as OptimizationLevel) || OptimizationLevel.Release;
      compileCToExecutable(sourceFile, outputFile, tmpDir, optLevel);

      console.log(`\x1b[32m✓ Compilation successful!\x1b[0m`);
      console.log(`  Executable: ${outputFile}`);
      console.log(`\nRun your program:`);
      console.log(`  ${outputFile}`);
    });

  // Check command
  program
    .command('check')
    .description('Check NAMI source for errors without compiling')
    .argument('<file>', 'NAMI source file (.nm)')
    .action((file: string) => {
      if (!fs.existsSync(file)) {
        console.error(`\x1b[31mError: File not found: ${file}\x1b[0m`);
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler();
      const { ast, errors } = compiler.parse(source);

      if (errors.length > 0) {
        console.error(`\x1b[1m\x1b[31mFound ${errors.length} error(s):\x1b[0m\n`);
        for (const err of errors) {
          const loc = err.line ? `[${file}:${err.line}:${err.column}]` : `[${file}]`;
          const type = err.type.toUpperCase();
          console.error(`  \x1b[31m${type} ${loc}\x1b[0m: ${err.message}`);
        }
        process.exit(1);
      }

      console.log(`\x1b[32m✓ No errors found in ${file}\x1b[0m`);
      console.log(`  Statements: ${ast.body.length}`);
    });

  // AST command
  program
    .command('ast')
    .description('Print the AST of a NAMI source file')
    .argument('<file>', 'NAMI source file (.nm)')
    .action((file: string) => {
      if (!fs.existsSync(file)) {
        console.error(`\x1b[31mError: File not found: ${file}\x1b[0m`);
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler();
      const { ast, errors } = compiler.parse(source);

      if (errors.length > 0) {
        for (const err of errors) {
          console.error(`Error: ${err.message}`);
        }
        process.exit(1);
      }

      console.log(JSON.stringify(ast, null, 2));
    });

  return program;
}

/**
 * Main entry point
 */
function main() {
  const program = createProgram();

  // Parse command line arguments
  program.parse(process.argv);

  // If no command provided, show help
  if (process.argv.length <= 2) {
    program.outputHelp();
  }
}

main();
