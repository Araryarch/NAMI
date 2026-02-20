/**
 * NAMI Features - Barrel Export
 *
 * All NAMI-specific language features that differentiate it from JavaScript.
 */

// Standard module (nm)
export { resolveNmMethod, generateNmRuntimeHeader, NM_MODULE_FUNCTIONS } from './nm-module';
export type { NmModuleFunction } from './nm-module';

// HTTP module
export {
  resolveHttpMethod,
  resolveHttpResponseMethod,
  generateHttpRuntimeHeader,
  HTTP_MODULE_FUNCTIONS,
  HTTP_REQUEST_METHODS,
  HTTP_RESPONSE_METHODS,
} from './http-module';
export type { HttpModuleFunction } from './http-module';

// Module system
export {
  isBuiltinModule,
  resolveModule,
  generateModuleInclude,
  extractExports,
  BUILTIN_MODULES,
} from './module-system';
export type { ModuleType, ResolvedModule, BuiltinModuleName } from './module-system';

// Modern loops
export {
  generateRangeLoop,
  generateForOfLoop,
  generateInfiniteLoop,
  isRangeBasedLoop,
} from './loops';
