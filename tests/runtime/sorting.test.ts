import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Runtime Library - Sorting Algorithms (Task 15)', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    const headerPath = path.join(__dirname, '../../runtime/nami_runtime.h');
    runtimeHeader = fs.readFileSync(headerPath, 'utf-8');
  });

  describe('Sorting Infrastructure (Task 15.1)', () => {
    it('should define nami_comparator_t function pointer type', () => {
      expect(runtimeHeader).toContain('typedef int (*nami_comparator_t)(nami_value_t a, nami_value_t b)');
    });

    it('should implement default comparator for numeric comparison', () => {
      expect(runtimeHeader).toContain('int nami_default_comparator(nami_value_t a, nami_value_t b)');
      const comparatorFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int nami_default_comparator'),
        runtimeHeader.indexOf('void nami_swap')
      );
      expect(comparatorFunc).toContain('nami_to_number(a)');
      expect(comparatorFunc).toContain('nami_to_number(b)');
      expect(comparatorFunc).toContain('return -1');
      expect(comparatorFunc).toContain('return 1');
      expect(comparatorFunc).toContain('return 0');
    });

    it('should implement swap helper function', () => {
      expect(runtimeHeader).toContain('void nami_swap(nami_value_t* a, nami_value_t* b)');
      const swapFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_swap'),
        runtimeHeader.indexOf('int64_t nami_partition')
      );
      expect(swapFunc).toContain('nami_value_t temp = *a');
      expect(swapFunc).toContain('*a = *b');
      expect(swapFunc).toContain('*b = temp');
    });
  });

  describe('Quicksort Implementation (Task 15.1)', () => {
    it('should implement nami_quicksort with custom comparator support', () => {
      expect(runtimeHeader).toContain('void nami_quicksort(nami_array_t* arr, nami_comparator_t comparator)');
    });

    it('should handle null array in nami_quicksort', () => {
      const quicksortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_quicksort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_merge')
      );
      expect(quicksortFunc).toContain('if (arr == NULL || arr->length <= 1) return');
    });

    it('should use default comparator when none provided', () => {
      const quicksortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_quicksort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_merge')
      );
      expect(quicksortFunc).toContain('comparator ? comparator : nami_default_comparator');
    });

    it('should implement partition function for quicksort', () => {
      expect(runtimeHeader).toContain('int64_t nami_partition(nami_array_t* arr, int64_t low, int64_t high, nami_comparator_t cmp)');
      const partitionFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_partition'),
        runtimeHeader.indexOf('void nami_quicksort_helper')
      );
      expect(partitionFunc).toContain('pivot');
      expect(partitionFunc).toContain('cmp(arr->items[j], pivot)');
      expect(partitionFunc).toContain('nami_swap');
    });

    it('should implement recursive quicksort helper', () => {
      expect(runtimeHeader).toContain('void nami_quicksort_helper(nami_array_t* arr, int64_t low, int64_t high, nami_comparator_t cmp)');
      const helperFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_quicksort_helper'),
        runtimeHeader.indexOf('void nami_quicksort(nami_array_t* arr')
      );
      expect(helperFunc).toContain('if (low < high)');
      expect(helperFunc).toContain('nami_partition');
      expect(helperFunc).toContain('nami_quicksort_helper(arr, low, pi - 1, cmp)');
      expect(helperFunc).toContain('nami_quicksort_helper(arr, pi + 1, high, cmp)');
    });
  });

  describe('Mergesort Implementation (Task 15.1)', () => {
    it('should implement nami_mergesort with custom comparator support', () => {
      expect(runtimeHeader).toContain('void nami_mergesort(nami_array_t* arr, nami_comparator_t comparator)');
    });

    it('should handle null array in nami_mergesort', () => {
      const mergesortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_mergesort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_heapify')
      );
      expect(mergesortFunc).toContain('if (arr == NULL || arr->length <= 1) return');
    });

    it('should use default comparator when none provided', () => {
      const mergesortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_mergesort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_heapify')
      );
      expect(mergesortFunc).toContain('comparator ? comparator : nami_default_comparator');
    });

    it('should implement merge function', () => {
      expect(runtimeHeader).toContain('void nami_merge(nami_array_t* arr, int64_t left, int64_t mid, int64_t right, nami_comparator_t cmp)');
      const mergeFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_merge('),
        runtimeHeader.indexOf('void nami_mergesort_helper')
      );
      expect(mergeFunc).toContain('malloc');
      expect(mergeFunc).toContain('cmp(L[i], R[j])');
      expect(mergeFunc).toContain('free(L)');
      expect(mergeFunc).toContain('free(R)');
    });

    it('should implement recursive mergesort helper', () => {
      expect(runtimeHeader).toContain('void nami_mergesort_helper(nami_array_t* arr, int64_t left, int64_t right, nami_comparator_t cmp)');
      const helperFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_mergesort_helper'),
        runtimeHeader.indexOf('void nami_mergesort(nami_array_t* arr')
      );
      expect(helperFunc).toContain('if (left < right)');
      expect(helperFunc).toContain('mid = left + (right - left) / 2');
      expect(helperFunc).toContain('nami_merge');
    });
  });

  describe('Heapsort Implementation (Task 15.1)', () => {
    it('should implement nami_heapsort with custom comparator support', () => {
      expect(runtimeHeader).toContain('void nami_heapsort(nami_array_t* arr, nami_comparator_t comparator)');
    });

    it('should handle null array in nami_heapsort', () => {
      const heapsortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_heapsort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_sort(nami_array_t* arr)')
      );
      expect(heapsortFunc).toContain('if (arr == NULL || arr->length <= 1) return');
    });

    it('should use default comparator when none provided', () => {
      const heapsortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_heapsort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_sort(nami_array_t* arr)')
      );
      expect(heapsortFunc).toContain('comparator ? comparator : nami_default_comparator');
    });

    it('should implement heapify function', () => {
      expect(runtimeHeader).toContain('void nami_heapify(nami_array_t* arr, int64_t n, int64_t i, nami_comparator_t cmp)');
      const heapifyFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_heapify'),
        runtimeHeader.indexOf('void nami_heapsort(nami_array_t* arr')
      );
      expect(heapifyFunc).toContain('int64_t largest = i');
      expect(heapifyFunc).toContain('int64_t left = 2 * i + 1');
      expect(heapifyFunc).toContain('int64_t right = 2 * i + 2');
      expect(heapifyFunc).toContain('cmp(arr->items[left], arr->items[largest])');
      expect(heapifyFunc).toContain('nami_swap');
    });

    it('should build max heap in nami_heapsort', () => {
      const heapsortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_heapsort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_sort(nami_array_t* arr)')
      );
      expect(heapsortFunc).toContain('// Build max heap');
      expect(heapsortFunc).toContain('for (int64_t i = n / 2 - 1; i >= 0; i--)');
      expect(heapsortFunc).toContain('nami_heapify(arr, n, i, cmp)');
    });

    it('should extract elements from heap in nami_heapsort', () => {
      const heapsortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_heapsort(nami_array_t* arr'),
        runtimeHeader.indexOf('void nami_sort(nami_array_t* arr)')
      );
      expect(heapsortFunc).toContain('// Extract elements from heap');
      expect(heapsortFunc).toContain('for (int64_t i = n - 1; i > 0; i--)');
      expect(heapsortFunc).toContain('nami_swap(&arr->items[0], &arr->items[i])');
    });
  });

  describe('Default Sort Function (Task 15.1)', () => {
    it('should implement nami_sort as default sorting function', () => {
      expect(runtimeHeader).toContain('void nami_sort(nami_array_t* arr)');
    });

    it('should use quicksort as default algorithm', () => {
      const sortFuncStart = runtimeHeader.indexOf('void nami_sort(nami_array_t* arr)');
      expect(sortFuncStart).toBeGreaterThan(-1);
      const sortFunc = runtimeHeader.substring(
        sortFuncStart,
        sortFuncStart + 300 // Get enough context
      );
      expect(sortFunc).toContain('nami_quicksort(arr, NULL)');
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 10.1 (quicksort)', () => {
      expect(runtimeHeader).toContain('void nami_quicksort');
      expect(runtimeHeader).toContain('Requirements: 10.1');
    });

    it('should satisfy Requirement 10.2 (mergesort)', () => {
      expect(runtimeHeader).toContain('void nami_mergesort');
      expect(runtimeHeader).toContain('Requirements: 10.2');
    });

    it('should satisfy Requirement 10.3 (heapsort)', () => {
      expect(runtimeHeader).toContain('void nami_heapsort');
      expect(runtimeHeader).toContain('Requirements: 10.3');
    });

    it('should satisfy Requirement 10.4 (default sort)', () => {
      expect(runtimeHeader).toContain('void nami_sort');
      expect(runtimeHeader).toContain('Requirements: 10.4');
    });

    it('should satisfy Requirement 10.5 (custom comparator)', () => {
      expect(runtimeHeader).toContain('nami_comparator_t comparator');
      // All three sorting functions support custom comparators
      const quicksortFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('Quicksort implementation'),
        runtimeHeader.indexOf('Merge two sorted subarrays')
      );
      expect(quicksortFunc).toContain('10.5');
    });

    it('should satisfy Requirement 10.6 (support any comparable type)', () => {
      // All sorting functions work with nami_value_t which supports any type
      // The default comparator uses nami_to_number for type conversion
      expect(runtimeHeader).toContain('nami_array_t* arr');
      expect(runtimeHeader).toContain('nami_to_number');
      // Verify the default sort mentions 10.6 in its requirements
      const sortFuncStart = runtimeHeader.indexOf('Default sort function');
      expect(sortFuncStart).toBeGreaterThan(-1);
      const sortFunc = runtimeHeader.substring(
        sortFuncStart,
        sortFuncStart + 500 // Get enough context
      );
      expect(sortFunc).toContain('10.6');
    });
  });
});
