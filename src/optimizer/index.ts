/**
 * Optimizer Module
 * Exports all optimization components
 */

export { Optimizer } from './optimizer';
export type { OptimizationLevel, OptimizerOptions, OptimizationStats } from './optimizer';
export { DeadCodeEliminator } from './dead-code-eliminator';
export type { DeadCodeStats } from './dead-code-eliminator';
export { FunctionInliner } from './function-inliner';
export type { InliningStats, InliningOptions } from './function-inliner';
