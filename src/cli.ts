#!/usr/bin/env node

/**
 * NAMI Language CLI
 * Command-line interface for compiling and running NAMI programs
 */

import * as fs from 'fs';
import * as path from 'path';
import { version } from './version';
import { Compiler } from './compiler';

interface CliCommand {
  name: string;
  description: string;
  execute: (args: string[]) => void;
}

function parseFlags(args: string[]): {
  file: string;
  output?: string;
  flags: Record<string, string>;
} {
  let file = '';
  let output: string | undefined;
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' || args[i] === '--output') {
      output = args[++i];
    } else if (args[i].startsWith('--')) {
      const [key, val] = args[i].slice(2).split('=');
      flags[key] = val || 'true';
    } else if (!file) {
      file = args[i];
    }
  }

  return { file, output, flags };
}

const commands: CliCommand[] = [
  {
    name: 'run',
    description: 'Compile and execute a NAMI program',
    execute: (args: string[]) => {
      const { file } = parseFlags(args);
      if (!file) {
        console.error('Error: No input file specified');
        console.error('Usage: nami run <file.nm> [args...]');
        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler();
      const result = compiler.compile(source);

      if (!result.success) {
        console.error(
          `\x1b[1m\x1b[31mCompilation failed with ${result.errors.length} error(s):\x1b[0m\n`
        );
        for (const err of result.errors) {
          const loc = err.line ? `[${err.line}:${err.column}]` : '';
          const type = err.type.toUpperCase();
          console.error(`  \x1b[31m${type} ${loc}\x1b[0m: ${err.message}`);
        }
        process.exit(1);
      }

      console.log(`\x1b[32m✓ Compiled successfully.\x1b[0m`);
      console.log('\nGenerated C source:');
      console.log('─'.repeat(60));
      console.log(result.output!.sourceFile);
      console.log('─'.repeat(60));
      console.log('\nNote: Run `nami build` to generate C files, then compile with gcc/clang.');
    },
  },
  {
    name: 'build',
    description: 'Compile NAMI source to C code',
    execute: (args: string[]) => {
      const { file, output } = parseFlags(args);
      if (!file) {
        console.error('Error: No input file specified');
        console.error('Usage: nami build <file.nm> [-o output_dir]');
        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler();
      const result = compiler.compile(source);

      if (!result.success) {
        console.error(
          `\x1b[1m\x1b[31mCompilation failed with ${result.errors.length} error(s):\x1b[0m\n`
        );
        for (const err of result.errors) {
          const loc = err.line ? `[${err.line}:${err.column}]` : '';
          const type = err.type.toUpperCase();
          console.error(`  \x1b[31m${type} ${loc}\x1b[0m: ${err.message}`);
        }
        process.exit(1);
      }

      const outputDir = output || path.join(path.dirname(file), 'build');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const baseName = path.basename(file, path.extname(file));
      const sourceFile = path.join(outputDir, `${baseName}.c`);
      const headerFile = path.join(outputDir, `${baseName}.h`);

      fs.writeFileSync(sourceFile, result.output!.sourceFile);
      fs.writeFileSync(headerFile, result.output!.headerFile);

      console.log(`\x1b[32m✓ Build successful!\x1b[0m`);
      console.log(`  Source: ${sourceFile}`);
      console.log(`  Header: ${headerFile}`);
      console.log(`\nTo compile to native binary:`);
      console.log(`  gcc -o ${baseName} ${sourceFile} -I${outputDir} -lm`);
    },
  },
  {
    name: 'compile',
    description: 'Compile NAMI source to executable (requires gcc/clang)',
    execute: (args: string[]) => {
      const { file, output } = parseFlags(args);
      if (!file) {
        console.error('Error: No input file specified');
        console.error('Usage: nami compile <file.nm> [-o output_file]');
        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      // First build
      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler();
      const result = compiler.compile(source);

      if (!result.success) {
        console.error(
          `\x1b[1m\x1b[31mCompilation failed with ${result.errors.length} error(s):\x1b[0m\n`
        );
        for (const err of result.errors) {
          const loc = err.line ? `[${err.line}:${err.column}]` : '';
          const type = err.type.toUpperCase();
          console.error(`  \x1b[31m${type} ${loc}\x1b[0m: ${err.message}`);
        }
        process.exit(1);
      }

      // Write C files to temp dir
      const tmpDir = path.join(path.dirname(file), '.nami-build');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const baseName = path.basename(file, path.extname(file));
      const sourceFile = path.join(tmpDir, `${baseName}.c`);
      const headerFile = path.join(tmpDir, `nami_generated.h`);
      const outputFile = output || path.join(path.dirname(file), baseName);

      fs.writeFileSync(sourceFile, result.output!.sourceFile);
      fs.writeFileSync(headerFile, result.output!.headerFile);

      console.log(`\x1b[32m✓ NAMI compilation successful.\x1b[0m`);
      console.log(`\nRun the following to produce a native binary:`);
      console.log(`  gcc -o ${outputFile} ${sourceFile} -I${tmpDir} -lm`);
    },
  },
  {
    name: 'check',
    description: 'Check NAMI source for errors without compiling',
    execute: (args: string[]) => {
      const { file } = parseFlags(args);
      if (!file) {
        console.error('Error: No input file specified');
        console.error('Usage: nami check <file.nm>');
        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler();
      const { ast, errors } = compiler.parse(source);

      if (errors.length > 0) {
        console.error(`\x1b[1m\x1b[31mFound ${errors.length} error(s):\x1b[0m\n`);
        for (const err of errors) {
          const loc = err.line ? `[${err.line}:${err.column}]` : '';
          const type = err.type.toUpperCase();
          console.error(`  \x1b[31m${type} ${loc}\x1b[0m: ${err.message}`);
        }
        process.exit(1);
      }

      console.log(`\x1b[32m✓ No errors found in ${file}\x1b[0m`);
      console.log(`  Statements: ${ast.body.length}`);
    },
  },
  {
    name: 'ast',
    description: 'Print the AST of a NAMI source file',
    execute: (args: string[]) => {
      const { file } = parseFlags(args);
      if (!file) {
        console.error('Error: No input file specified');
        console.error('Usage: nami ast <file.nm>');
        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
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
    },
  },
];

function showVersion(): void {
  console.log(`NAMI Language Compiler v${version}`);
}

function showHelp(): void {
  console.log(`\x1b[1mNAMI Language Compiler v${version}\x1b[0m`);
  console.log('');
  console.log('Usage: nami <command> [options]');
  console.log('');
  console.log('Commands:');
  commands.forEach((cmd) => {
    console.log(`  \x1b[36m${cmd.name.padEnd(12)}\x1b[0m ${cmd.description}`);
  });
  console.log('');
  console.log('Options:');
  console.log('  -o, --output  Specify output file or directory');
  console.log('  --version     Show version information');
  console.log('  --help        Show this help message');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    showVersion();
    return;
  }

  const commandName = args[0];
  const command = commands.find((cmd) => cmd.name === commandName);

  if (!command) {
    console.error(`Error: Unknown command '${commandName}'`);
    console.error('Run "nami --help" for usage information');
    process.exit(1);
  }

  try {
    command.execute(args.slice(1));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
