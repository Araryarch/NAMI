/**
 * Optimizer Module
 * Exports all optimization components
 */

export { Optimizer, OptimizationLevel, OptimizerOptions, OptimizationStats } from './optimizer';
export {
  DeadCodeEliminator,
  DeadCodeStats,
} from './dead-code-eliminator';
export {
  FunctionInliner,
  InliningStats,
  InliningOptions,
} from './function-inliner';
