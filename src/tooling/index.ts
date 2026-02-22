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
export type {
  ToolingConfig,
  CLIConfig as SharedCLIConfig,
  LSPConfig,
  DiagnosticsConfig,
  FormattingConfig,
  TraceLevel,
  DiagnosticSeverityLevel,
} from './shared/config';

export { DEFAULT_CONFIG, loadConfig, validateConfig } from './shared/config';

// Import for internal use
import type { ToolingConfig } from './shared/config';
import { loadConfig, validateConfig } from './shared/config';

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
export function initializeTooling(workspaceRoot?: string): ToolingConfig {
  // This will be implemented as components are added
  console.log(`Initializing Nami Developer Tooling v${TOOLING_VERSION}`);

  // Load and validate configuration
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const config: ToolingConfig = loadConfig(workspaceRoot);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const errors: string[] = validateConfig(config);

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }

  return config;
}
