import { readFileSync } from 'fs';
import { join } from 'path';

describe('Runtime Library - Infinite Loop Detection', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    runtimeHeader = readFileSync(
      join(__dirname, '../../runtime/nami_runtime.h'),
      'utf-8'
    );
  });

  describe('Task 9.1: Core Infrastructure', () => {
    test('should define nami_type_tag_t enum', () => {
      expect(runtimeHeader).toContain('typedef enum');
      expect(runtimeHeader).toContain('NAMI_TYPE_INT');
      expect(runtimeHeader).toContain('NAMI_TYPE_FLOAT');
      expect(runtimeHeader).toContain('NAMI_TYPE_STRING');
      expect(runtimeHeader).toContain('NAMI_TYPE_BOOL');
      expect(runtimeHeader).toContain('NAMI_TYPE_NULL');
      expect(runtimeHeader).toContain('NAMI_TYPE_ARRAY');
      expect(runtimeHeader).toContain('NAMI_TYPE_OBJECT');
      expect(runtimeHeader).toContain('NAMI_TYPE_FUNCTION');
      expect(runtimeHeader).toContain('} nami_type_tag_t;');
    });

    test('should define nami_value_t tagged union structure', () => {
      expect(runtimeHeader).toContain('typedef struct');
      expect(runtimeHeader).toContain('nami_type_tag_t type;');
      expect(runtimeHeader).toContain('union {');
      expect(runtimeHeader).toContain('int64_t as_int;');
      expect(runtimeHeader).toContain('double as_float;');
      expect(runtimeHeader).toContain('nami_string_t* as_string;');
      expect(runtimeHeader).toContain('bool as_bool;');
      expect(runtimeHeader).toContain('nami_array_t* as_array;');
      expect(runtimeHeader).toContain('nami_object_t* as_object;');
      expect(runtimeHeader).toContain('void* as_function;');
      expect(runtimeHeader).toContain('} value;');
      expect(runtimeHeader).toContain('} nami_value_t;');
    });

    test('should have runtime directory structure', () => {
      expect(runtimeHeader).toContain('NAMI_RUNTIME_H');
      expect(runtimeHeader).toContain('#ifndef NAMI_RUNTIME_H');
      expect(runtimeHeader).toContain('#define NAMI_RUNTIME_H');
      expect(runtimeHeader).toContain('#endif // NAMI_RUNTIME_H');
    });
  });

  describe('Task 9.2: Infinite Loop Detection System', () => {
    test('should define nami_loop_guard_t structure with required fields', () => {
      expect(runtimeHeader).toContain('typedef struct');
      expect(runtimeHeader).toContain('uint64_t iteration_count;');
      expect(runtimeHeader).toContain('uint64_t max_iterations;');
      expect(runtimeHeader).toContain('bool enabled;');
      expect(runtimeHeader).toContain('const char* file;');
      expect(runtimeHeader).toContain('int line;');
      expect(runtimeHeader).toContain('const char* loop_type;');
      expect(runtimeHeader).toContain('} nami_loop_guard_t;');
    });

    test('should implement NAMI_LOOP_CHECK() macro', () => {
      expect(runtimeHeader).toContain('#define NAMI_LOOP_CHECK(guard)');
      expect(runtimeHeader).toContain('(guard)->iteration_count++');
      expect(runtimeHeader).toContain('(guard)->max_iterations');
      expect(runtimeHeader).toContain('Infinite loop detected');
    });

    test('should provide configuration functions for threshold', () => {
      expect(runtimeHeader).toContain('nami_loop_set_threshold');
      expect(runtimeHeader).toContain('nami_loop_get_threshold');
      expect(runtimeHeader).toContain('uint64_t max_iterations');
    });

    test('should provide enable/disable functions', () => {
      expect(runtimeHeader).toContain('nami_loop_enable');
      expect(runtimeHeader).toContain('nami_loop_disable');
      expect(runtimeHeader).toContain('nami_loop_is_enabled');
      expect(runtimeHeader).toContain('nami_loop_guard_enable');
      expect(runtimeHeader).toContain('nami_loop_guard_disable');
    });

    test('should provide initialization function with location info', () => {
      expect(runtimeHeader).toContain('nami_loop_guard_init');
      expect(runtimeHeader).toContain('const char* file');
      expect(runtimeHeader).toContain('int line');
      expect(runtimeHeader).toContain('const char* loop_type');
    });

    test('should provide reset function', () => {
      expect(runtimeHeader).toContain('nami_loop_guard_reset');
      expect(runtimeHeader).toContain('iteration_count = 0');
    });

    test('should include error reporting with file location and loop type', () => {
      const loopCheckMacro = runtimeHeader.substring(
        runtimeHeader.indexOf('#define NAMI_LOOP_CHECK(guard)'),
        runtimeHeader.indexOf('#define NAMI_LOOP_CHECK_SIMPLE')
      );
      
      expect(loopCheckMacro).toContain('Location:');
      expect(loopCheckMacro).toContain('(guard)->file');
      expect(loopCheckMacro).toContain('(guard)->line');
      expect(loopCheckMacro).toContain('Loop type:');
      expect(loopCheckMacro).toContain('(guard)->loop_type');
      expect(loopCheckMacro).toContain('Exceeded');
      expect(loopCheckMacro).toContain('iterations');
    });

    test('should have a global default loop guard', () => {
      expect(runtimeHeader).toContain('__nami_default_loop_guard');
      expect(runtimeHeader).toContain('.iteration_count = 0');
      expect(runtimeHeader).toContain('.max_iterations = 1000000');
      expect(runtimeHeader).toContain('.enabled = true');
    });
  });

  describe('Requirements Validation', () => {
    test('Requirements 1.4: Runtime type definitions', () => {
      // Core type system is defined
      expect(runtimeHeader).toContain('nami_type_tag_t');
      expect(runtimeHeader).toContain('nami_value_t');
    });

    test('Requirements 12.3: Runtime type tags', () => {
      // Type tags for dynamic typing
      expect(runtimeHeader).toContain('NAMI_TYPE_INT');
      expect(runtimeHeader).toContain('NAMI_TYPE_FLOAT');
      expect(runtimeHeader).toContain('NAMI_TYPE_STRING');
    });

    test('Requirements 12.4: Type mapping', () => {
      // Tagged union for type mapping
      expect(runtimeHeader).toContain('as_int');
      expect(runtimeHeader).toContain('as_float');
      expect(runtimeHeader).toContain('as_string');
      expect(runtimeHeader).toContain('as_bool');
    });

    test('Requirements 5.1: Track iteration counts', () => {
      expect(runtimeHeader).toContain('iteration_count');
      expect(runtimeHeader).toContain('(guard)->iteration_count++');
    });

    test('Requirements 5.2: Configurable threshold', () => {
      expect(runtimeHeader).toContain('max_iterations');
      expect(runtimeHeader).toContain('nami_loop_set_threshold');
      expect(runtimeHeader).toContain('nami_loop_get_threshold');
    });

    test('Requirements 5.3: Disable mechanism', () => {
      expect(runtimeHeader).toContain('nami_loop_disable');
      expect(runtimeHeader).toContain('nami_loop_enable');
      expect(runtimeHeader).toContain('if ((guard)->enabled)');
    });

    test('Requirements 5.4: Error location reporting', () => {
      const loopCheckMacro = runtimeHeader.substring(
        runtimeHeader.indexOf('#define NAMI_LOOP_CHECK(guard)'),
        runtimeHeader.indexOf('#define NAMI_LOOP_CHECK_SIMPLE')
      );
      
      expect(loopCheckMacro).toContain('(guard)->file');
      expect(loopCheckMacro).toContain('(guard)->line');
      expect(loopCheckMacro).toContain('Location:');
    });

    test('Requirements 5.5: Loop type reporting', () => {
      const loopCheckMacro = runtimeHeader.substring(
        runtimeHeader.indexOf('#define NAMI_LOOP_CHECK(guard)'),
        runtimeHeader.indexOf('#define NAMI_LOOP_CHECK_SIMPLE')
      );
      
      expect(loopCheckMacro).toContain('(guard)->loop_type');
      expect(loopCheckMacro).toContain('Loop type:');
    });
  });
});
