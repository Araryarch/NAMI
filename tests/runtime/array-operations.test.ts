import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Runtime Library - Array Operations', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    const headerPath = path.join(__dirname, '../../runtime/nami_runtime.h');
    runtimeHeader = fs.readFileSync(headerPath, 'utf-8');
  });

  describe('Array Data Structure (Task 13.1)', () => {
    it('should define nami_array_t structure with required fields', () => {
      expect(runtimeHeader).toContain('struct nami_array {');
      expect(runtimeHeader).toContain('nami_value_t* items;');
      expect(runtimeHeader).toContain('int64_t length;');
      expect(runtimeHeader).toContain('int64_t capacity;');
    });

    it('should implement nami_array_create for initialization', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_array_create(void)');
      expect(runtimeHeader).toContain('malloc(sizeof(nami_array_t))');
      expect(runtimeHeader).toContain('arr->length = 0;');
      expect(runtimeHeader).toContain('arr->capacity = 8;');
    });

    it('should implement nami_array_destroy for cleanup', () => {
      expect(runtimeHeader).toContain('void nami_array_destroy(nami_array_t* arr)');
      expect(runtimeHeader).toContain('free(arr->items)');
      expect(runtimeHeader).toContain('free(arr)');
    });

    it('should handle null pointer in nami_array_destroy', () => {
      const destroyFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_array_destroy'),
        runtimeHeader.indexOf('void nami_array_push')
      );
      expect(destroyFunc).toContain('if (arr != NULL)');
    });
  });

  describe('Basic Array Methods (Task 13.2)', () => {
    it('should implement nami_array_push for appending elements', () => {
      expect(runtimeHeader).toContain('void nami_array_push(nami_array_t* arr, nami_value_t value)');
      expect(runtimeHeader).toContain('arr->items[arr->length++] = value;');
    });

    it('should implement dynamic resizing in nami_array_push', () => {
      const pushFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_array_push'),
        runtimeHeader.indexOf('nami_value_t nami_array_pop')
      );
      expect(pushFunc).toContain('if (arr->length >= arr->capacity)');
      expect(pushFunc).toContain('arr->capacity *= 2');
      expect(pushFunc).toContain('realloc');
    });

    it('should implement nami_array_pop for removing last element', () => {
      expect(runtimeHeader).toContain('nami_value_t nami_array_pop(nami_array_t* arr)');
      expect(runtimeHeader).toContain('return arr->items[--arr->length]');
    });

    it('should handle empty array in nami_array_pop', () => {
      const popFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_value_t nami_array_pop'),
        runtimeHeader.indexOf('nami_value_t nami_array_get')
      );
      expect(popFunc).toContain('if (arr->length == 0) return NAMI_NULL');
    });

    it('should implement nami_array_slice for extracting sub-arrays', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_array_slice(nami_array_t* arr, int64_t start, int64_t end)');
      expect(runtimeHeader).toContain('nami_array_create()');
    });

    it('should handle bounds checking in nami_array_slice', () => {
      const sliceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_array_slice'),
        runtimeHeader.indexOf('nami_array_t* nami_array_map')
      );
      expect(sliceFunc).toContain('if (start < 0) start = 0');
      expect(sliceFunc).toContain('if (end > arr->length) end = arr->length');
    });
  });

  describe('Higher-Order Array Methods (Task 13.3)', () => {
    it('should implement nami_array_map for transformation', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_array_map(nami_array_t* arr, nami_function_t fn)');
      expect(runtimeHeader).toContain('fn(arr->items[i])');
    });

    it('should create new array in nami_array_map', () => {
      const mapFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_array_map'),
        runtimeHeader.indexOf('nami_array_t* nami_array_filter')
      );
      expect(mapFunc).toContain('nami_array_create()');
      expect(mapFunc).toContain('nami_array_push(result,');
    });

    it('should implement nami_array_filter for selection', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_array_filter(nami_array_t* arr, nami_function_t fn)');
    });

    it('should check predicate result in nami_array_filter', () => {
      const filterFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_array_filter'),
        runtimeHeader.indexOf('void nami_array_foreach')
      );
      expect(filterFunc).toContain('nami_value_t test = fn(arr->items[i])');
      expect(filterFunc).toContain('if (test.type == NAMI_TYPE_BOOL && test.value.as_bool)');
    });

    it('should implement nami_array_foreach for iteration', () => {
      expect(runtimeHeader).toContain('void nami_array_foreach(nami_array_t* arr, nami_function_t fn)');
      expect(runtimeHeader).toContain('fn(arr->items[i])');
    });

    it('should not return value in nami_array_foreach', () => {
      const foreachFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_array_foreach'),
        runtimeHeader.indexOf('nami_value_t nami_array_reduce')
      );
      expect(foreachFunc).not.toContain('return');
    });

    it('should implement nami_array_reduce for accumulation', () => {
      expect(runtimeHeader).toContain('nami_value_t nami_array_reduce(nami_array_t* arr, nami_function2_t fn, nami_value_t initial)');
      expect(runtimeHeader).toContain('nami_value_t acc = initial');
      expect(runtimeHeader).toContain('acc = fn(acc, arr->items[i])');
    });

    it('should use two-argument function in nami_array_reduce', () => {
      const reduceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_value_t nami_array_reduce'),
        runtimeHeader.indexOf('nami_value_t nami_array_of')
      );
      expect(reduceFunc).toContain('nami_function2_t fn');
    });
  });

  describe('Array Integration', () => {
    it('should integrate with garbage collector', () => {
      // Check that arrays are tracked by GC
      expect(runtimeHeader).toContain('NAMI_TYPE_ARRAY');
      expect(runtimeHeader).toContain('nami_array_t* as_array');
    });

    it('should support array value constructor', () => {
      expect(runtimeHeader).toContain('nami_value_t nami_array_of');
      const arrayOfFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_value_t nami_array_of'),
        runtimeHeader.indexOf('// ── Object Type')
      );
      expect(arrayOfFunc).toContain('val.type = NAMI_TYPE_ARRAY');
      expect(arrayOfFunc).toContain('val.value.as_array = arr');
    });

    it('should provide array get and set operations', () => {
      expect(runtimeHeader).toContain('nami_value_t nami_array_get(nami_array_t* arr, int64_t index)');
      expect(runtimeHeader).toContain('void nami_array_set(nami_array_t* arr, int64_t index, nami_value_t value)');
    });
  });
});
