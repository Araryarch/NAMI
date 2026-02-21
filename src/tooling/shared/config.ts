/**
 * Configuration models and parsing for Nami Developer Tooling
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Main tooling configuration
 */
export interface ToolingConfig {
  lsp: LSPConfig;
  formatting: FormattingConfig;
  diagnostics: DiagnosticsConfig;
  cli: CLIConfig;
}

/**
 * LSP server configuration
 */
export interface LSPConfig {
  serverPath?: string;
  initializationOptions: Record<string, any>;
  trace: TraceLevel;
  maxDiagnosticsPerFile: number;
  completionTriggerCharacters: string[];
}

/**
 * Code formatting configuration
 */
export interface FormattingConfig {
  indentSize: number;
  useTabs: boolean;
  maxLineLength: number;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
}

/**
 * Diagnostics configuration
 */
export interface DiagnosticsConfig {
  enableUnusedVariableWarnings: boolean;
  enableUnreachableCodeWarnings: boolean;
  maxDiagnosticsPerFile: number;
  severityLevels: Record<string, DiagnosticSeverityLevel>;
}

/**
 * CLI configuration
 */
export interface CLIConfig {
  defaultOptimizationLevel: number;
  verboseOutput: boolean;
  debugOutput: boolean;
  outputDirectory: string;
}

/**
 * LSP trace levels
 */
export enum TraceLevel {
  Off = 'off',
  Messages = 'messages',
  Verbose = 'verbose'
}

/**
 * Diagnostic severity levels for configuration
 */
export enum DiagnosticSeverityLevel {
  Error = 'error',
  Warning = 'warning',
  Information = 'information',
  Hint = 'hint',
  Disabled = 'disabled'
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ToolingConfig = {
  lsp: {
    initializationOptions: {},
    trace: TraceLevel.Off,
    maxDiagnosticsPerFile: 100,
    completionTriggerCharacters: ['.', '(', '[']
  },
  formatting: {
    indentSize: 2,
    useTabs: false,
    maxLineLength: 100,
    insertFinalNewline: true,
    trimTrailingWhitespace: true
  },
  diagnostics: {
    enableUnusedVariableWarnings: true,
    enableUnreachableCodeWarnings: true,
    maxDiagnosticsPerFile: 100,
    severityLevels: {
      'unused-variable': DiagnosticSeverityLevel.Warning,
      'unreachable-code': DiagnosticSeverityLevel.Warning,
      'syntax-error': DiagnosticSeverityLevel.Error,
      'semantic-error': DiagnosticSeverityLevel.Error
    }
  },
  cli: {
    defaultOptimizationLevel: 0,
    verboseOutput: false,
    debugOutput: false,
    outputDirectory: './output'
  }
};

/**
 * Configuration file names to search for
 */
const CONFIG_FILES = [
  'nami.config.json',
  '.namirc.json',
  '.nami/config.json'
];

/**
 * Load configuration from file system
 */
export function loadConfig(workspaceRoot?: string): ToolingConfig {
  const config = { ...DEFAULT_CONFIG };
  
  // Search for configuration files
  const searchPaths = workspaceRoot ? [workspaceRoot] : [process.cwd()];
  
  for (const searchPath of searchPaths) {
    for (const configFile of CONFIG_FILES) {
      const configPath = join(searchPath, configFile);
      
      if (existsSync(configPath)) {
        try {
          const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
          mergeConfig(config, fileConfig);
          break;
        } catch (error) {
          console.warn(`Failed to parse config file ${configPath}:`, error);
        }
      }
    }
  }
  
  return config;
}

/**
 * Merge user configuration with defaults
 */
function mergeConfig(target: ToolingConfig, source: Partial<ToolingConfig>): void {
  if (source.lsp) {
    Object.assign(target.lsp, source.lsp);
  }
  if (source.formatting) {
    Object.assign(target.formatting, source.formatting);
  }
  if (source.diagnostics) {
    Object.assign(target.diagnostics, source.diagnostics);
  }
  if (source.cli) {
    Object.assign(target.cli, source.cli);
  }
}

/**
 * Validate configuration values
 */
export function validateConfig(config: ToolingConfig): string[] {
  const errors: string[] = [];
  
  // Validate formatting config
  if (config.formatting.indentSize < 1 || config.formatting.indentSize > 8) {
    errors.push('formatting.indentSize must be between 1 and 8');
  }
  
  if (config.formatting.maxLineLength < 40 || config.formatting.maxLineLength > 200) {
    errors.push('formatting.maxLineLength must be between 40 and 200');
  }
  
  // Validate diagnostics config
  if (config.diagnostics.maxDiagnosticsPerFile < 1 || config.diagnostics.maxDiagnosticsPerFile > 1000) {
    errors.push('diagnostics.maxDiagnosticsPerFile must be between 1 and 1000');
  }
  
  // Validate CLI config
  if (config.cli.defaultOptimizationLevel < 0 || config.cli.defaultOptimizationLevel > 3) {
    errors.push('cli.defaultOptimizationLevel must be between 0 and 3');
  }
  
  return errors;
}