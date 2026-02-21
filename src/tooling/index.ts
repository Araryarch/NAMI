/**
 * Nami Developer Tooling - Main Entry Point
 * 
 * This module provides the main exports for all Nami developer tooling components.
 */

// Shared utilities and types
export * from './shared/errors';
export * from './shared/types';
export * from './shared/test-utils';

// Export config with explicit naming to avoid conflicts
export { 
  ToolingConfig,
  CLIConfig as SharedCLIConfig,
  LSPConfig,
  DiagnosticsConfig,
  FormattingConfig,
  TraceLevel,
  DiagnosticSeverityLevel,
  DEFAULT_CONFIG,
  loadConfig,
  validateConfig
} from './shared/config';

// Core services (will be implemented in subsequent tasks)
export * from './token-provider';
export * from './diagnostic';

// Higher-level tools (will be implemented in subsequent tasks)
export * from './cli';
export * from './lsp';
export * from './syntax-highlighting';

/**
 * Version information for the tooling package
 */
export const TOOLING_VERSION = '0.1.0';

/**
 * Initialize the tooling system with configuration
 */
export function initializeTooling(workspaceRoot?: string) {
  // This will be implemented as components are added
  console.log(`Initializing Nami Developer Tooling v${TOOLING_VERSION}`);
  
  // Load configuration
  const config = require('./shared/config').loadConfig(workspaceRoot);
  
  // Validate configuration
  const errors = require('./shared/config').validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
  
  return config;
}