/**
 * Main Optimizer - Coordinates all optimization passes
 * Requirements: 17.1, 17.2, 17.3, 17.5
 */

import { Program } from '../parser/ast';
import { DeadCodeEliminator, DeadCodeStats } from './dead-code-eliminator';
import { FunctionInliner, InliningStats, InliningOptions } from './function-inliner';

/**
 * Optimization levels
 * - debug: No optimization, preserve debug info
 * - release: Standard optimizations (dead code elimination)
 * - max: Aggressive optimizations (dead code + function inlining)
 */
export type OptimizationLevel = 'debug' | 'release' | 'max';

export interface OptimizerOptions {
  /** Optimization level */
  level: OptimizationLevel;
  /** Function inlining options (only used for 'max' level) */
  inlining?: Partial<InliningOptions>;
}

export interface OptimizationStats {
  level: OptimizationLevel;
  deadCode?: DeadCodeStats;
  inlining?: InliningStats;
}

const DEFAULT_OPTIONS: OptimizerOptions = {
  level: 'debug',
};

export class Optimizer {
  private options: OptimizerOptions;
  private deadCodeEliminator: DeadCodeEliminator;
  private functionInliner: FunctionInliner;

  constructor(options?: Partial<OptimizerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.deadCodeEliminator = new DeadCodeEliminator();
    this.functionInliner = new FunctionInliner(this.options.inlining);
  }

  /**
   * Optimize the program based on the configured optimization level
   */
  optimize(program: Program): Program {
    let optimized = program;

    switch (this.options.level) {
      case 'debug':
        // No optimization in debug mode
        break;

      case 'release':
        // Standard optimizations: dead code elimination
        optimized = this.deadCodeEliminator.eliminate(optimized);
        break;

      case 'max':
        // Aggressive optimizations: dead code + function inlining
        // Run inlining first, then dead code elimination
        optimized = this.functionInliner.inline(optimized);
        optimized = this.deadCodeEliminator.eliminate(optimized);
        break;
    }

    return optimized;
  }

  /**
   * Get optimization statistics
   */
  getStats(): OptimizationStats {
    const stats: OptimizationStats = {
      level: this.options.level,
    };

    if (this.options.level === 'release' || this.options.level === 'max') {
      stats.deadCode = this.deadCodeEliminator.getStats();
    }

    if (this.options.level === 'max') {
      stats.inlining = this.functionInliner.getStats();
    }

    return stats;
  }

  /**
   * Set optimization level
   */
  setLevel(level: OptimizationLevel): void {
    this.options.level = level;
  }

  /**
   * Get current optimization level
   */
  getLevel(): OptimizationLevel {
    return this.options.level;
  }
}
