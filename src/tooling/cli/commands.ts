/**
 * CLI Command Handlers
 *
 * Provides command implementations for the enhanced CLI interface.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { NamiCLI, CLIError, CLIConfig } from './cli';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Command result
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * CLI Commands
 *
 * Provides high-level command handlers that integrate with NamiCLI.
 */
export class CLICommands {
  private cli: NamiCLI;

  constructor(config: CLIConfig = {}) {
    this.cli = new NamiCLI(config);
  }

  /**
   * Handle help command
   * Requirements: 1.1
   */
  help(): CommandResult {
    const helpText = NamiCLI.showHelp();
    console.log(helpText);
    return { success: true, message: helpText };
  }

  /**
   * Handle version command
   * Requirements: 1.2
   */
  version(): CommandResult {
    const versionText = NamiCLI.showVersion();
    console.log(versionText);
    return { success: true, message: versionText };
  }

  /**
   * Handle check command
   * Requirements: 1.5
   */
  check(filePath: string): CommandResult {
    try {
      const result = this.cli.checkSyntax(filePath);
      return {
        success: result.success,
        message: result.success ? 'Syntax check passed' : 'Syntax check failed',
        data: result,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle format command
   * Requirements: 1.6
   */
  format(filePath: string, options: { inPlace?: boolean; output?: string } = {}): CommandResult {
    try {
      const formatted = this.cli.formatFile(filePath, { inPlace: options.inPlace });

      if (options.output && !options.inPlace) {
        fs.writeFileSync(options.output, formatted, 'utf-8');
        console.log(`✓ Formatted output written to ${options.output}`);
      } else if (!options.inPlace) {
        console.log(formatted);
      }

      return {
        success: true,
        message: 'Format successful',
        data: { formatted },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle verbose compilation
   * Requirements: 1.3
   */
  compileVerbose(filePath: string): CommandResult {
    try {
      const result = this.cli.compileVerbose(filePath);
      return {
        success: true,
        message: 'Compilation successful',
        data: result,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle debug compilation
   * Requirements: 1.4
   */
  compileDebug(filePath: string): CommandResult {
    try {
      const result = this.cli.compileDebug(filePath);
      return {
        success: true,
        message: 'Debug compilation successful',
        data: result,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Load configuration file
   * Requirements: 7.4
   */
  loadConfig(configPath: string): CommandResult {
    try {
      this.cli.loadConfigFile(configPath);
      return {
        success: true,
        message: `Configuration loaded from ${configPath}`,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors with helpful messages
   * Requirements: 1.7
   */
  private handleError(error: unknown): CommandResult {
    if (error instanceof CLIError) {
      console.error(`\n❌ Error: ${error.message}`);

      if (error.suggestions.length > 0) {
        console.error(`\nSuggestions:`);
        for (const suggestion of error.suggestions) {
          console.error(`  • ${suggestion}`);
        }
      }

      return {
        success: false,
        message: error.message,
        data: { code: error.code, suggestions: error.suggestions },
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Unexpected error: ${errorMessage}`);
    console.error(`\nSuggestions:`);
    console.error(`  • Check the command syntax`);
    console.error(`  • Run "nami --help" for usage information`);
    console.error(`  • Report this issue if it persists`);

    return {
      success: false,
      message: errorMessage,
      data: { suggestions: ['Check command syntax', 'Run "nami --help"'] },
    };
  }

  /**
   * Validate command arguments
   * Requirements: 1.7
   */
  static validateArgs(args: string[], minArgs: number, command: string): void {
    if (args.length < minArgs) {
      throw new CLIError(`Insufficient arguments for command "${command}"`, 'INVALID_ARGS', [
        `Expected at least ${minArgs} argument(s)`,
        `Run "nami --help" for usage information`,
        `Example: nami ${command} <file>`,
      ]);
    }
  }

  /**
   * Validate file exists
   * Requirements: 1.7
   */
  static validateFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      const suggestions = ['Check the file path for typos', 'Ensure the file exists'];

      // Suggest similar files in the directory
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.nm'));
        if (files.length > 0) {
          suggestions.push(`Did you mean one of: ${files.slice(0, 3).join(', ')}?`);
        }
      }

      throw new CLIError(`File not found: ${filePath}`, 'FILE_NOT_FOUND', suggestions);
    }
  }

  /**
   * Parse optimization level
   * Requirements: 1.7
   */
  static parseOptimizationLevel(level: string): 'debug' | 'release' | 'max' {
    const normalized = level.toLowerCase();
    if (normalized === 'debug' || normalized === 'release' || normalized === 'max') {
      return normalized;
    }

    throw new CLIError(`Invalid optimization level: ${level}`, 'INVALID_OPTIMIZATION', [
      'Valid levels are: debug, release, max',
      'Example: --optimization release',
      'Use "debug" for development, "release" for production',
    ]);
  }

  /**
   * Get CLI instance
   */
  getCLI(): NamiCLI {
    return this.cli;
  }
}
