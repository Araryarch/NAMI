import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Runtime Library - String Operations', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    const headerPath = path.join(__dirname, '../../runtime/nami_runtime.h');
    runtimeHeader = fs.readFileSync(headerPath, 'utf-8');
  });

  describe('String Data Structure', () => {
    it('should define nami_string_t structure with length, capacity, and data', () => {
      expect(runtimeHeader).toContain('struct nami_string');
      expect(runtimeHeader).toContain('size_t length');
      expect(runtimeHeader).toContain('size_t capacity');
      expect(runtimeHeader).toContain('char data[]');
    });

    it('should implement nami_string_create function', () => {
      expect(runtimeHeader).toContain('nami_string_t* nami_string_create(const char* s)');
      expect(runtimeHeader).toContain('strlen(s)');
      expect(runtimeHeader).toContain('memcpy(str->data, s,');
    });

    it('should implement nami_string_destroy function', () => {
      expect(runtimeHeader).toContain('void nami_string_destroy(nami_string_t* str)');
      expect(runtimeHeader).toContain('free(str)');
    });
  });

  describe('String Manipulation Functions', () => {
    it('should implement nami_string_concat for concatenation', () => {
      expect(runtimeHeader).toContain('nami_string_t* nami_string_concat(nami_string_t* a, nami_string_t* b)');
      expect(runtimeHeader).toContain('a->length + b->length');
    });

    it('should implement nami_string_substring for extraction', () => {
      expect(runtimeHeader).toContain('nami_string_t* nami_string_substring(nami_string_t* str, int64_t start, int64_t end)');
      expect(runtimeHeader).toContain('if (start < 0) start = 0');
      expect(runtimeHeader).toContain('if (end > (int64_t)str->length)');
    });

    it('should implement nami_string_split for splitting by delimiter', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_string_split(nami_string_t* str, nami_string_t* delimiter)');
      expect(runtimeHeader).toContain('nami_array_create()');
      expect(runtimeHeader).toContain('strstr(current, delimiter->data)');
    });

    it('should implement nami_string_join for joining array with separator', () => {
      expect(runtimeHeader).toContain('nami_string_t* nami_string_join(nami_array_t* arr, nami_string_t* separator)');
      expect(runtimeHeader).toContain('separator->length');
    });

    it('should implement nami_string_index_of for searching', () => {
      expect(runtimeHeader).toContain('int64_t nami_string_index_of(nami_string_t* str, nami_string_t* search)');
      expect(runtimeHeader).toContain('strstr(str->data, search->data)');
      expect(runtimeHeader).toContain('return -1');
    });

    it('should implement nami_string_replace for replacement', () => {
      expect(runtimeHeader).toContain('nami_string_t* nami_string_replace(nami_string_t* str, nami_string_t* search, nami_string_t* replacement)');
      expect(runtimeHeader).toContain('nami_string_index_of(str, search)');
    });
  });

  describe('String Split Edge Cases', () => {
    it('should handle empty delimiter in split (split into characters)', () => {
      const splitFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_string_split'),
        runtimeHeader.indexOf('static inline nami_string_t* nami_string_join')
      );
      expect(splitFunc).toContain('if (delimiter->length == 0)');
      expect(splitFunc).toContain('split into individual characters');
    });

    it('should handle trailing delimiter in split', () => {
      const splitFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_string_split'),
        runtimeHeader.indexOf('static inline nami_string_t* nami_string_join')
      );
      expect(splitFunc).toContain('Handle trailing delimiter');
    });
  });

  describe('String Join Edge Cases', () => {
    it('should handle empty array in join', () => {
      const joinFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_string_t* nami_string_join'),
        runtimeHeader.indexOf('nami_string_t* nami_string_join') + 2000
      );
      expect(joinFunc).toContain('if (arr->length == 0)');
      expect(joinFunc).toContain('return nami_string_create("")');
    });

    it('should only add separator between elements, not after last', () => {
      const joinFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_string_t* nami_string_join'),
        runtimeHeader.indexOf('nami_string_t* nami_string_join') + 2000
      );
      expect(joinFunc).toContain('if (i < arr->length - 1)');
    });
  });
});
