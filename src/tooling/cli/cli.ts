/**
 * Enhanced CLI Interface for Nami Developer Tooling
 * 
 * Provides comprehensive command-line tools for compilation, debugging,
 * and code formatting with improved developer experience.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 7.4
 */

import * as fs from 'fs';
import { Compiler, CompilerOptions } from '../../compiler/compiler';
import { TokenProvider } from '../token-provider/token-provider';
import { DiagnosticEngine } from '../diagnostic/diagnostic-engine';
import { PrettyPrinter } from '../../printer/pretty-printer';
import { version } from '../../version';

/**
 * CLI configuration options
 */
export interface CLIConfig {
  verbose?: boolean;
  debug?: boolean;
  checkOnly?: boolean;
  format?: boolean;
  outputFile?: string;
  optimization?: 'debug' | 'release' | 'max';
}

/**
 * CLI error types
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly suggestions: string[] = []
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

/**
 * Enhanced CLI for Nami Developer Tooling
 * 
 * Provides improved command-line interface with better help, debugging options,
 * and development tools.
 */
export class NamiCLI {
  private config: CLIConfig;

  constructor(config: CLIConfig = {}) {
    this.config = config;
  }

  /**
   * Load configuration from file
   * Requirements: 7.4
   */
  loadConfigFile(configPath: string): void {
    try {
      if (!fs.existsSync(configPath)) {
        throw new CLIError(
          `Configuration file not found: ${configPath}`,
          'CONFIG_NOT_FOUND',
          ['Create a nami.config.json file', 'Check the file path']
        );
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const fileConfig = JSON.parse(configContent);
      
      // Merge file config with existing config (CLI args take precedence)
      this.config = { ...fileConfig, ...this.config };
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      throw new CLIError(
        `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
        'CONFIG_LOAD_ERROR',
        ['Check JSON syntax', 'Verify file permissions']
      );
    }
  }

  /**
   * Display comprehensive help information
   * Requirements: 1.1
   */
  static showHelp(): string {
    return `
Nami Developer Tooling - Enhanced CLI

USAGE:
  nami [OPTIONS] <command> [ARGS]

COMMANDS:
  run <file>              Compile and execute a Nami program
  build <file>            Compile Nami source to C code
  compile <file>          Compile Nami source to executable
  check <file>            Validate syntax without compilation
  format <file>           Format Nami source file
  ast <file>              Print the AST of a Nami source file

OPTIONS:
  -h, --help              Display this help information
  -v, --version           Display version information
  --verbose               Output detailed compilation information
  --debug                 Output debug information (AST and tokens)
  -o, --output <file>     Specify output file or directory
  -O, --optimization <level>  Set optimization level (debug, release, max)
  --config <file>         Load configuration from file

EXAMPLES:
  nami run program.nm                    # Run a Nami program
  nami check program.nm --verbose        # Check syntax with details
  nami format program.nm                 # Format source code
  nami compile program.nm -O release     # Compile with optimizations
  nami --debug run program.nm            # Run with debug output

For more information, visit: https://github.com/nami-lang/nami
`;
  }

  /**
   * Display version information
   * Requirements: 1.2
   */
  static showVersion(): string {
    return `Nami Developer Tooling v${version}`;
  }

  /**
   * Check syntax without compilation
   * Requirements: 1.5
   */
  checkSyntax(filePath: string): { success: boolean; errors: any[] } {
    try {
      if (!fs.existsSync(filePath)) {
        throw new CLIError(
          `File not found: ${filePath}`,
          'FILE_NOT_FOUND',
          ['Check the file path', 'Ensure the file exists']
        );
      }

      const source = fs.readFileSync(filePath, 'utf-8');
      
      // Use diagnostic engine for comprehensive checking
      const diagnosticEngine = new DiagnosticEngine();
      const diagnostics = diagnosticEngine.analyze(source, filePath);

      if (this.config.verbose) {
        console.log(`\n=== Syntax Check: ${filePath} ===`);
        console.log(`Source length: ${source.length} characters`);
        console.log(`Diagnostics found: ${diagnostics.length}`);
      }

      const errors = diagnostics.filter(d => d.severity === 1); // Error severity
      const warnings = diagnostics.filter(d => d.severity === 2); // Warning severity

      if (errors.length > 0) {
        console.error(`\n❌ Found ${errors.length} error(s):\n`);
        for (const error of errors) {
          const loc = `[${filePath}:${error.range.start.line}:${error.range.start.column}]`;
          console.error(`  ${loc} ${error.message}`);
          if (error.quickFixes.length > 0 && this.config.verbose) {
            console.error(`    Suggestions:`);
            for (const fix of error.quickFixes) {
              console.error(`      - ${fix.title}`);
            }
          }
        }
        return { success: false, errors: diagnostics };
      }

      if (warnings.length > 0 && this.config.verbose) {
        console.warn(`\n⚠️  Found ${warnings.length} warning(s):\n`);
        for (const warning of warnings) {
          const loc = `[${filePath}:${warning.range.start.line}:${warning.range.start.column}]`;
          console.warn(`  ${loc} ${warning.message}`);
        }
      }

      console.log(`\n✓ No errors found in ${filePath}`);
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      throw new CLIError(
        `Syntax check failed: ${error instanceof Error ? error.message : String(error)}`,
        'CHECK_ERROR'
      );
    }
  }

  /**
   * Format Nami source file
   * Requirements: 1.6
   */
  formatFile(filePath: string, options: { inPlace?: boolean } = {}): string {
    try {
      if (!fs.existsSync(filePath)) {
        throw new CLIError(
          `File not found: ${filePath}`,
          'FILE_NOT_FOUND',
          ['Check the file path', 'Ensure the file exists']
        );
      }

      const source = fs.readFileSync(filePath, 'utf-8');
      
      // Parse the source
      const compiler = new Compiler();
      const { ast, errors } = compiler.parse(source);

      if (errors.length > 0) {
        throw new CLIError(
          `Cannot format file with syntax errors`,
          'FORMAT_ERROR',
          ['Fix syntax errors first', 'Run "nami check" to see errors']
        );
      }

      // Format using pretty printer
      const printer = new PrettyPrinter();
      const formatted = printer.print(ast);

      if (this.config.verbose) {
        console.log(`\n=== Format: ${filePath} ===`);
        console.log(`Original length: ${source.length} characters`);
        console.log(`Formatted length: ${formatted.length} characters`);
      }

      // Write back if in-place
      if (options.inPlace) {
        fs.writeFileSync(filePath, formatted, 'utf-8');
        console.log(`✓ Formatted ${filePath}`);
      }

      return formatted;
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      throw new CLIError(
        `Format failed: ${error instanceof Error ? error.message : String(error)}`,
        'FORMAT_ERROR'
      );
    }
  }

  /**
   * Compile with verbose output
   * Requirements: 1.3
   */
  compileVerbose(filePath: string): any {
    if (!fs.existsSync(filePath)) {
      throw new CLIError(
        `File not found: ${filePath}`,
        'FILE_NOT_FOUND',
        ['Check the file path', 'Ensure the file exists']
      );
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n=== Compilation: ${filePath} ===`);
    console.log(`Source length: ${source.length} characters`);
    
    // Step 1: Tokenization
    console.log(`\n[1/4] Tokenization...`);
    const tokenProvider = new TokenProvider();
    const tokens = tokenProvider.tokenize(source);
    console.log(`  ✓ Generated ${tokens.length} tokens`);
    
    // Step 2: Parsing
    console.log(`\n[2/4] Parsing...`);
    const compiler = new Compiler();
    const { ast, errors: parseErrors } = compiler.parse(source);
    
    if (parseErrors.length > 0) {
      console.error(`  ✗ Parse errors found: ${parseErrors.length}`);
      for (const error of parseErrors) {
        console.error(`    ${error.message}`);
      }
      throw new CLIError('Compilation failed', 'COMPILE_ERROR');
    }
    console.log(`  ✓ AST generated with ${ast.body.length} statements`);
    
    // Step 3: Semantic Analysis
    console.log(`\n[3/4] Semantic Analysis...`);
    const diagnosticEngine = new DiagnosticEngine();
    const diagnostics = diagnosticEngine.analyze(source, filePath);
    const errors = diagnostics.filter(d => d.severity === 1);
    
    if (errors.length > 0) {
      console.error(`  ✗ Semantic errors found: ${errors.length}`);
      for (const error of errors) {
        console.error(`    ${error.message}`);
      }
      throw new CLIError('Compilation failed', 'COMPILE_ERROR');
    }
    console.log(`  ✓ Semantic analysis passed`);
    
    // Step 4: Code Generation
    console.log(`\n[4/4] Code Generation...`);
    const compilerOptions: Partial<CompilerOptions> = {
      optimization: this.config.optimization || 'debug'
    };
    const fullCompiler = new Compiler(compilerOptions);
    const result = fullCompiler.compile(source);
    
    if (!result.success) {
      console.error(`  ✗ Code generation failed`);
      throw new CLIError('Compilation failed', 'COMPILE_ERROR');
    }
    console.log(`  ✓ C code generated`);
    console.log(`\n=== Compilation Successful ===`);
    
    return result;
  }

  /**
   * Compile with debug output (AST and tokens)
   * Requirements: 1.4
   */
  compileDebug(filePath: string): any {
    if (!fs.existsSync(filePath)) {
      throw new CLIError(
        `File not found: ${filePath}`,
        'FILE_NOT_FOUND',
        ['Check the file path', 'Ensure the file exists']
      );
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n=== Debug Compilation: ${filePath} ===`);
    
    // Show tokens
    console.log(`\n--- TOKENS ---`);
    const tokenProvider = new TokenProvider();
    const tokens = tokenProvider.tokenize(source);
    
    for (let i = 0; i < Math.min(tokens.length, 50); i++) {
      const token = tokens[i];
      const pos = `${token.position.start.line}:${token.position.start.column}`;
      console.log(`  [${i}] ${token.kind.padEnd(15)} "${token.text}" at ${pos}`);
    }
    
    if (tokens.length > 50) {
      console.log(`  ... and ${tokens.length - 50} more tokens`);
    }
    
    // Show AST
    console.log(`\n--- AST ---`);
    const compiler = new Compiler();
    const { ast, errors } = compiler.parse(source);
    
    if (errors.length > 0) {
      console.error(`Parse errors:`);
      for (const error of errors) {
        console.error(`  ${error.message}`);
      }
      throw new CLIError('Compilation failed', 'COMPILE_ERROR');
    }
    
    console.log(JSON.stringify(ast, null, 2));
    
    // Continue with compilation
    console.log(`\n--- COMPILATION ---`);
    const result = compiler.compile(source);
    
    if (!result.success) {
      console.error(`Compilation failed with ${result.errors.length} error(s)`);
      for (const error of result.errors) {
        console.error(`  ${error.message}`);
      }
      throw new CLIError('Compilation failed', 'COMPILE_ERROR');
    }
    
    console.log(`✓ Compilation successful`);
    
    return result;
  }

  /**
   * Get current configuration
   */
  getConfig(): CLIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
