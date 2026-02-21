/**
 * NAMI Runtime Library - C header files
 * These are the C runtime support headers for compiled NAMI programs
 * Requirements: 1.4, 2.1-2.5, 5.1-5.5, 7.1-7.6, 8.1-8.8, 12.4, 14.1-14.5
 */

#ifndef NAMI_RUNTIME_H
#define NAMI_RUNTIME_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <stdarg.h>
#include <math.h>
#include <setjmp.h>

// ── Type Tags ──────────────────────────────────────────

typedef enum {
    NAMI_TYPE_INT,
    NAMI_TYPE_FLOAT,
    NAMI_TYPE_STRING,
    NAMI_TYPE_BOOL,
    NAMI_TYPE_NULL,
    NAMI_TYPE_ARRAY,
    NAMI_TYPE_OBJECT,
    NAMI_TYPE_FUNCTION
} nami_type_tag_t;

// ── Forward Declarations ────────────────────────────────

typedef struct nami_string nami_string_t;
typedef struct nami_array nami_array_t;
typedef struct nami_object nami_object_t;
typedef struct nami_gc_object nami_gc_object_t;
typedef struct nami_gc nami_gc_t;

// ── Value Type (Tagged Union) ───────────────────────────

typedef struct {
    nami_type_tag_t type;
    union {
        int64_t as_int;
        double as_float;
        nami_string_t* as_string;
        bool as_bool;
        nami_array_t* as_array;
        nami_object_t* as_object;
        void* as_function;
    } value;
} nami_value_t;

// Function pointer type
typedef nami_value_t (*nami_function_t)(nami_value_t);
typedef nami_value_t (*nami_function2_t)(nami_value_t, nami_value_t);

// ── Constants ───────────────────────────────────────────

#define NAMI_NULL ((nami_value_t){.type = NAMI_TYPE_NULL, .value = {.as_int = 0}})
#define NAMI_TRUE ((nami_value_t){.type = NAMI_TYPE_BOOL, .value = {.as_bool = true}})
#define NAMI_FALSE ((nami_value_t){.type = NAMI_TYPE_BOOL, .value = {.as_bool = false}})

// ── Value Constructors ──────────────────────────────────

static inline nami_value_t nami_value_int(int64_t v) {
    nami_value_t val;
    val.type = NAMI_TYPE_INT;
    val.value.as_int = v;
    return val;
}

static inline nami_value_t nami_value_float(double v) {
    nami_value_t val;
    val.type = NAMI_TYPE_FLOAT;
    val.value.as_float = v;
    return val;
}

static inline nami_value_t nami_value_bool(bool v) {
    nami_value_t val;
    val.type = NAMI_TYPE_BOOL;
    val.value.as_bool = v;
    return val;
}

// ── String Type ─────────────────────────────────────────

struct nami_string {
    size_t length;
    size_t capacity;
    char data[];
};

// ── Array Type ──────────────────────────────────────────

struct nami_array {
    nami_value_t* items;
    int64_t length;
    int64_t capacity;
};

// ── String Functions ────────────────────────────────────

static inline nami_value_t nami_value_string(const char* s);  // Forward declaration

static inline nami_string_t* nami_string_create(const char* s) {
    size_t len = strlen(s);
    nami_string_t* str = (nami_string_t*)malloc(sizeof(nami_string_t) + len + 1);
    str->length = len;
    str->capacity = len + 1;
    memcpy(str->data, s, len + 1);
    return str;
}

static inline nami_value_t nami_value_string(const char* s) {
    nami_value_t val;
    val.type = NAMI_TYPE_STRING;
    val.value.as_string = nami_string_create(s);
    return val;
}

static inline nami_string_t* nami_string_concat(nami_string_t* a, nami_string_t* b) {
    size_t total = a->length + b->length;
    nami_string_t* result = (nami_string_t*)malloc(sizeof(nami_string_t) + total + 1);
    result->length = total;
    result->capacity = total + 1;
    memcpy(result->data, a->data, a->length);
    memcpy(result->data + a->length, b->data, b->length + 1);
    return result;
}

static inline nami_string_t* nami_string_substring(nami_string_t* str, int64_t start, int64_t end) {
    if (start < 0) start = 0;
    if (end > (int64_t)str->length) end = (int64_t)str->length;
    if (start >= end) return nami_string_create("");
    size_t len = (size_t)(end - start);
    nami_string_t* result = (nami_string_t*)malloc(sizeof(nami_string_t) + len + 1);
    result->length = len;
    result->capacity = len + 1;
    memcpy(result->data, str->data + start, len);
    result->data[len] = '\0';
    return result;
}

static inline int64_t nami_string_index_of(nami_string_t* str, nami_string_t* search) {
    char* found = strstr(str->data, search->data);
    if (found == NULL) return -1;
    return (int64_t)(found - str->data);
}

static inline nami_string_t* nami_string_replace(nami_string_t* str, nami_string_t* search, nami_string_t* replacement) {
    int64_t idx = nami_string_index_of(str, search);
    if (idx < 0) {
        return nami_string_create(str->data);
    }
    size_t new_len = str->length - search->length + replacement->length;
    nami_string_t* result = (nami_string_t*)malloc(sizeof(nami_string_t) + new_len + 1);
    result->length = new_len;
    result->capacity = new_len + 1;
    memcpy(result->data, str->data, (size_t)idx);
    memcpy(result->data + idx, replacement->data, replacement->length);
    memcpy(result->data + idx + replacement->length, str->data + idx + search->length, str->length - (size_t)idx - search->length + 1);
    return result;
}

static inline void nami_string_destroy(nami_string_t* str) {
    if (str != NULL) {
        free(str);
    }
}

// Forward declarations for array functions
static inline nami_array_t* nami_array_create(void);
static inline void nami_array_push(nami_array_t* arr, nami_value_t value);

static inline nami_array_t* nami_string_split(nami_string_t* str, nami_string_t* delimiter) {
    nami_array_t* result = nami_array_create();
    
    if (delimiter->length == 0) {
        // Empty delimiter: split into individual characters
        for (size_t i = 0; i < str->length; i++) {
            nami_string_t* char_str = (nami_string_t*)malloc(sizeof(nami_string_t) + 2);
            char_str->length = 1;
            char_str->capacity = 2;
            char_str->data[0] = str->data[i];
            char_str->data[1] = '\0';
            nami_value_t val;
            val.type = NAMI_TYPE_STRING;
            val.value.as_string = char_str;
            nami_array_push(result, val);
        }
        return result;
    }
    
    const char* current = str->data;
    const char* end = str->data + str->length;
    
    while (current < end) {
        const char* found = strstr(current, delimiter->data);
        
        if (found == NULL) {
            // No more delimiters, add the rest
            size_t remaining = (size_t)(end - current);
            nami_string_t* part = (nami_string_t*)malloc(sizeof(nami_string_t) + remaining + 1);
            part->length = remaining;
            part->capacity = remaining + 1;
            memcpy(part->data, current, remaining);
            part->data[remaining] = '\0';
            nami_value_t val;
            val.type = NAMI_TYPE_STRING;
            val.value.as_string = part;
            nami_array_push(result, val);
            break;
        }
        
        // Add the part before the delimiter
        size_t part_len = (size_t)(found - current);
        nami_string_t* part = (nami_string_t*)malloc(sizeof(nami_string_t) + part_len + 1);
        part->length = part_len;
        part->capacity = part_len + 1;
        memcpy(part->data, current, part_len);
        part->data[part_len] = '\0';
        nami_value_t val;
        val.type = NAMI_TYPE_STRING;
        val.value.as_string = part;
        nami_array_push(result, val);
        
        // Move past the delimiter
        current = found + delimiter->length;
    }
    
    // Handle trailing delimiter case
    if (current == end && str->length > 0) {
        const char* last_delim = str->data + str->length - delimiter->length;
        if (last_delim >= str->data && strncmp(last_delim, delimiter->data, delimiter->length) == 0) {
            nami_value_t val;
            val.type = NAMI_TYPE_STRING;
            val.value.as_string = nami_string_create("");
            nami_array_push(result, val);
        }
    }
    
    return result;
}

static inline nami_string_t* nami_string_join(nami_array_t* arr, nami_string_t* separator) {
    if (arr->length == 0) {
        return nami_string_create("");
    }
    
    // Calculate total length needed
    size_t total_len = 0;
    for (int64_t i = 0; i < arr->length; i++) {
        nami_value_t item = arr->items[i];
        if (item.type == NAMI_TYPE_STRING && item.value.as_string != NULL) {
            total_len += item.value.as_string->length;
        }
        if (i < arr->length - 1) {
            total_len += separator->length;
        }
    }
    
    // Allocate result string
    nami_string_t* result = (nami_string_t*)malloc(sizeof(nami_string_t) + total_len + 1);
    result->length = total_len;
    result->capacity = total_len + 1;
    
    // Build the joined string
    size_t pos = 0;
    for (int64_t i = 0; i < arr->length; i++) {
        nami_value_t item = arr->items[i];
        if (item.type == NAMI_TYPE_STRING && item.value.as_string != NULL) {
            memcpy(result->data + pos, item.value.as_string->data, item.value.as_string->length);
            pos += item.value.as_string->length;
        }
        if (i < arr->length - 1) {
            memcpy(result->data + pos, separator->data, separator->length);
            pos += separator->length;
        }
    }
    result->data[pos] = '\0';
    
    return result;
}

// ── Array Functions ─────────────────────────────────────

static inline nami_array_t* nami_array_create(void) {
    nami_array_t* arr = (nami_array_t*)malloc(sizeof(nami_array_t));
    arr->items = (nami_value_t*)malloc(sizeof(nami_value_t) * 8);
    arr->length = 0;
    arr->capacity = 8;
    return arr;
}

static inline void nami_array_destroy(nami_array_t* arr) {
    if (arr != NULL) {
        if (arr->items != NULL) {
            free(arr->items);
        }
        free(arr);
    }
}

static inline void nami_array_push(nami_array_t* arr, nami_value_t value) {
    if (arr->length >= arr->capacity) {
        arr->capacity *= 2;
        arr->items = (nami_value_t*)realloc(arr->items, sizeof(nami_value_t) * (size_t)arr->capacity);
    }
    arr->items[arr->length++] = value;
}

static inline nami_value_t nami_array_pop(nami_array_t* arr) {
    if (arr->length == 0) return NAMI_NULL;
    return arr->items[--arr->length];
}

static inline nami_value_t nami_array_get(nami_array_t* arr, int64_t index) {
    if (index < 0 || index >= arr->length) return NAMI_NULL;
    return arr->items[index];
}

static inline void nami_array_set(nami_array_t* arr, int64_t index, nami_value_t value) {
    if (index >= 0 && index < arr->length) {
        arr->items[index] = value;
    }
}

static inline nami_array_t* nami_array_slice(nami_array_t* arr, int64_t start, int64_t end) {
    if (start < 0) start = 0;
    if (end > arr->length) end = arr->length;
    nami_array_t* result = nami_array_create();
    for (int64_t i = start; i < end; i++) {
        nami_array_push(result, arr->items[i]);
    }
    return result;
}

static inline nami_array_t* nami_array_map(nami_array_t* arr, nami_function_t fn) {
    nami_array_t* result = nami_array_create();
    for (int64_t i = 0; i < arr->length; i++) {
        nami_array_push(result, fn(arr->items[i]));
    }
    return result;
}

static inline nami_array_t* nami_array_filter(nami_array_t* arr, nami_function_t fn) {
    nami_array_t* result = nami_array_create();
    for (int64_t i = 0; i < arr->length; i++) {
        nami_value_t test = fn(arr->items[i]);
        if (test.type == NAMI_TYPE_BOOL && test.value.as_bool) {
            nami_array_push(result, arr->items[i]);
        }
    }
    return result;
}

static inline void nami_array_foreach(nami_array_t* arr, nami_function_t fn) {
    for (int64_t i = 0; i < arr->length; i++) {
        fn(arr->items[i]);
    }
}

static inline nami_value_t nami_array_reduce(nami_array_t* arr, nami_function2_t fn, nami_value_t initial) {
    nami_value_t acc = initial;
    for (int64_t i = 0; i < arr->length; i++) {
        acc = fn(acc, arr->items[i]);
    }
    return acc;
}

static inline nami_value_t nami_array_of(int count, ...) {
    nami_array_t* arr = nami_array_create();
    va_list args;
    va_start(args, count);
    for (int i = 0; i < count; i++) {
        nami_array_push(arr, va_arg(args, nami_value_t));
    }
    va_end(args);
    nami_value_t val;
    val.type = NAMI_TYPE_ARRAY;
    val.value.as_array = arr;
    return val;
}

// ── Object Type ─────────────────────────────────────────

typedef struct nami_object_entry {
    char* key;
    nami_value_t value;
} nami_object_entry_t;

struct nami_object {
    nami_object_entry_t* entries;
    int64_t count;
    int64_t capacity;
};

static inline nami_object_t* nami_object_create_empty(void) {
    nami_object_t* obj = (nami_object_t*)malloc(sizeof(nami_object_t));
    obj->entries = (nami_object_entry_t*)malloc(sizeof(nami_object_entry_t) * 8);
    obj->count = 0;
    obj->capacity = 8;
    return obj;
}

static inline void nami_object_set(nami_object_t* obj, const char* key, nami_value_t value) {
    for (int64_t i = 0; i < obj->count; i++) {
        if (strcmp(obj->entries[i].key, key) == 0) {
            obj->entries[i].value = value;
            return;
        }
    }
    if (obj->count >= obj->capacity) {
        obj->capacity *= 2;
        obj->entries = (nami_object_entry_t*)realloc(obj->entries, sizeof(nami_object_entry_t) * (size_t)obj->capacity);
    }
    obj->entries[obj->count].key = strdup(key);
    obj->entries[obj->count].value = value;
    obj->count++;
}

static inline nami_value_t nami_object_get(nami_object_t* obj, const char* key) {
    for (int64_t i = 0; i < obj->count; i++) {
        if (strcmp(obj->entries[i].key, key) == 0) {
            return obj->entries[i].value;
        }
    }
    return NAMI_NULL;
}

static inline nami_value_t nami_object_create(void) {
    nami_value_t val;
    val.type = NAMI_TYPE_OBJECT;
    val.value.as_object = nami_object_create_empty();
    return val;
}

static inline nami_value_t nami_object_of(int count, ...) {
    nami_object_t* obj = nami_object_create_empty();
    va_list args;
    va_start(args, count);
    
    for (int i = 0; i < count; i++) {
        const char* key = va_arg(args, const char*);
        nami_value_t value = va_arg(args, nami_value_t);
        nami_object_set(obj, key, value);
    }
    
    va_end(args);
    
    nami_value_t val;
    val.type = NAMI_TYPE_OBJECT;
    val.value.as_object = obj;
    return val;
}

// ── Garbage Collector ───────────────────────────────────

struct nami_gc_object {
    nami_type_tag_t type;
    bool marked;
    size_t ref_count;
    struct nami_gc_object* next;
    void* data;
};

struct nami_gc {
    nami_gc_object_t* objects;
    size_t num_objects;
    size_t max_objects;
    bool enabled;
};

static inline void nami_gc_init(nami_gc_t* gc) {
    gc->objects = NULL;
    gc->num_objects = 0;
    gc->max_objects = 256;
    gc->enabled = true;
}

static inline void* nami_gc_alloc(nami_gc_t* gc, size_t size, nami_type_tag_t type) {
    nami_gc_object_t* obj = (nami_gc_object_t*)malloc(sizeof(nami_gc_object_t));
    obj->type = type;
    obj->marked = false;
    obj->ref_count = 1;
    obj->data = malloc(size);
    obj->next = gc->objects;
    gc->objects = obj;
    gc->num_objects++;
    return obj->data;
}

// Mark phase: recursively mark reachable objects
static inline void nami_gc_mark(nami_gc_object_t* obj) {
    if (obj == NULL || obj->marked) return;
    obj->marked = true;
    
    // Traverse nested objects based on type
    if (obj->type == NAMI_TYPE_ARRAY) {
        nami_array_t* arr = (nami_array_t*)obj->data;
        for (int64_t i = 0; i < arr->length; i++) {
            nami_value_t item = arr->items[i];
            // Mark nested arrays, objects, strings
            if (item.type == NAMI_TYPE_ARRAY && item.value.as_array) {
                // Find the gc_object for this array (simplified)
            } else if (item.type == NAMI_TYPE_OBJECT && item.value.as_object) {
                // Find the gc_object for this object (simplified)
            } else if (item.type == NAMI_TYPE_STRING && item.value.as_string) {
                // Find the gc_object for this string (simplified)
            }
        }
    } else if (obj->type == NAMI_TYPE_OBJECT) {
        nami_object_t* o = (nami_object_t*)obj->data;
        for (int64_t i = 0; i < o->count; i++) {
            nami_value_t val = o->entries[i].value;
            // Mark nested values (simplified)
        }
    }
}

// Sweep phase: free unmarked objects with zero reference count
static inline void nami_gc_sweep(nami_gc_t* gc) {
    nami_gc_object_t** obj = &gc->objects;
    while (*obj) {
        if (!(*obj)->marked && (*obj)->ref_count == 0) {
            nami_gc_object_t* unreached = *obj;
            *obj = unreached->next;
            free(unreached->data);
            free(unreached);
            gc->num_objects--;
        } else {
            (*obj)->marked = false;
            obj = &(*obj)->next;
        }
    }
}

// Full garbage collection: mark and sweep
static inline void nami_gc_collect(nami_gc_t* gc) {
    if (!gc->enabled) return;
    
    // Mark phase: mark all reachable objects
    // Note: In a real implementation, we would traverse from root objects
    // (stack variables, globals). This is a simplified version.
    nami_gc_object_t* obj = gc->objects;
    while (obj) {
        if (obj->ref_count > 0) {
            nami_gc_mark(obj);
        }
        obj = obj->next;
    }
    
    // Sweep phase: free unmarked objects
    nami_gc_sweep(gc);
}

static inline void nami_gc_retain(nami_gc_object_t* obj) {
    if (obj) obj->ref_count++;
}

static inline void nami_gc_release(nami_gc_object_t* obj) {
    if (obj && obj->ref_count > 0) obj->ref_count--;
}

// Enable/disable garbage collection for performance-critical sections
static inline void nami_gc_disable(nami_gc_t* gc) {
    gc->enabled = false;
}

static inline void nami_gc_enable(nami_gc_t* gc) {
    gc->enabled = true;
}

// ── Infinite Loop Detection ──────────────────────────────

typedef struct {
    uint64_t iteration_count;
    uint64_t max_iterations;
    bool enabled;
    const char* file;
    int line;
    const char* loop_type;
} nami_loop_guard_t;

// Global default loop guard
static nami_loop_guard_t __nami_default_loop_guard = {
    .iteration_count = 0,
    .max_iterations = 1000000,
    .enabled = true,
    .file = NULL,
    .line = 0,
    .loop_type = "unknown"
};

// Initialize a loop guard with location information
static inline void nami_loop_guard_init(nami_loop_guard_t* guard, const char* file, int line, const char* loop_type) {
    guard->iteration_count = 0;
    guard->max_iterations = __nami_default_loop_guard.max_iterations;
    guard->enabled = __nami_default_loop_guard.enabled;
    guard->file = file;
    guard->line = line;
    guard->loop_type = loop_type;
}

// Reset iteration count for a loop guard
static inline void nami_loop_guard_reset(nami_loop_guard_t* guard) {
    guard->iteration_count = 0;
}

// Configure the global iteration threshold
static inline void nami_loop_set_threshold(uint64_t max_iterations) {
    __nami_default_loop_guard.max_iterations = max_iterations;
}

// Get the current iteration threshold
static inline uint64_t nami_loop_get_threshold(void) {
    return __nami_default_loop_guard.max_iterations;
}

// Enable infinite loop detection globally
static inline void nami_loop_enable(void) {
    __nami_default_loop_guard.enabled = true;
}

// Disable infinite loop detection globally
static inline void nami_loop_disable(void) {
    __nami_default_loop_guard.enabled = false;
}

// Check if infinite loop detection is enabled
static inline bool nami_loop_is_enabled(void) {
    return __nami_default_loop_guard.enabled;
}

// Enable/disable for a specific guard
static inline void nami_loop_guard_enable(nami_loop_guard_t* guard) {
    guard->enabled = true;
}

static inline void nami_loop_guard_disable(nami_loop_guard_t* guard) {
    guard->enabled = false;
}

// Macro for loop checking with location information
#define NAMI_LOOP_CHECK(guard) \
    do { \
        if ((guard)->enabled) { \
            (guard)->iteration_count++; \
            if ((guard)->iteration_count > (guard)->max_iterations) { \
                fprintf(stderr, "Error: Infinite loop detected\n"); \
                if ((guard)->file != NULL) { \
                    fprintf(stderr, "  Location: %s:%d\n", (guard)->file, (guard)->line); \
                } \
                fprintf(stderr, "  Loop type: %s\n", (guard)->loop_type); \
                fprintf(stderr, "  Exceeded %llu iterations\n", \
                    (unsigned long long)(guard)->max_iterations); \
                exit(1); \
            } \
        } \
    } while(0)

// Simplified macro that uses default guard (for backward compatibility)
#define NAMI_LOOP_CHECK_SIMPLE() NAMI_LOOP_CHECK(&__nami_default_loop_guard)

// ── Truthiness ──────────────────────────────────────────

static inline bool nami_truthy(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_BOOL: return v.value.as_bool;
        case NAMI_TYPE_INT: return v.value.as_int != 0;
        case NAMI_TYPE_FLOAT: return v.value.as_float != 0.0;
        case NAMI_TYPE_STRING: return v.value.as_string != NULL && v.value.as_string->length > 0;
        case NAMI_TYPE_NULL: return false;
        case NAMI_TYPE_ARRAY: return true;
        case NAMI_TYPE_OBJECT: return true;
        case NAMI_TYPE_FUNCTION: return true;
        default: return false;
    }
}

static inline bool nami_is_null(nami_value_t v) {
    return v.type == NAMI_TYPE_NULL;
}

// ── Arithmetic Operations ───────────────────────────────

static inline double nami_to_number(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_INT: return (double)v.value.as_int;
        case NAMI_TYPE_FLOAT: return v.value.as_float;
        case NAMI_TYPE_BOOL: return v.value.as_bool ? 1.0 : 0.0;
        case NAMI_TYPE_STRING: return atof(v.value.as_string->data);
        default: return 0.0;
    }
}

static inline nami_value_t nami_add(nami_value_t a, nami_value_t b) {
    // String concatenation
    if (a.type == NAMI_TYPE_STRING || b.type == NAMI_TYPE_STRING) {
        // TODO: proper string conversion
        if (a.type == NAMI_TYPE_STRING && b.type == NAMI_TYPE_STRING) {
            nami_value_t val;
            val.type = NAMI_TYPE_STRING;
            val.value.as_string = nami_string_concat(a.value.as_string, b.value.as_string);
            return val;
        }
    }
    // Int + Int
    if (a.type == NAMI_TYPE_INT && b.type == NAMI_TYPE_INT) {
        return nami_value_int(a.value.as_int + b.value.as_int);
    }
    // Float arithmetic
    return nami_value_float(nami_to_number(a) + nami_to_number(b));
}

static inline nami_value_t nami_sub(nami_value_t a, nami_value_t b) {
    if (a.type == NAMI_TYPE_INT && b.type == NAMI_TYPE_INT) {
        return nami_value_int(a.value.as_int - b.value.as_int);
    }
    return nami_value_float(nami_to_number(a) - nami_to_number(b));
}

static inline nami_value_t nami_mul(nami_value_t a, nami_value_t b) {
    if (a.type == NAMI_TYPE_INT && b.type == NAMI_TYPE_INT) {
        return nami_value_int(a.value.as_int * b.value.as_int);
    }
    return nami_value_float(nami_to_number(a) * nami_to_number(b));
}

static inline nami_value_t nami_div(nami_value_t a, nami_value_t b) {
    double bval = nami_to_number(b);
    if (bval == 0.0) {
        fprintf(stderr, "Error: Division by zero\n");
        return NAMI_NULL;
    }
    if (a.type == NAMI_TYPE_INT && b.type == NAMI_TYPE_INT && a.value.as_int % b.value.as_int == 0) {
        return nami_value_int(a.value.as_int / b.value.as_int);
    }
    return nami_value_float(nami_to_number(a) / bval);
}

static inline nami_value_t nami_mod(nami_value_t a, nami_value_t b) {
    if (a.type == NAMI_TYPE_INT && b.type == NAMI_TYPE_INT) {
        if (b.value.as_int == 0) return NAMI_NULL;
        return nami_value_int(a.value.as_int % b.value.as_int);
    }
    return nami_value_float(fmod(nami_to_number(a), nami_to_number(b)));
}

static inline nami_value_t nami_pow(nami_value_t a, nami_value_t b) {
    return nami_value_float(pow(nami_to_number(a), nami_to_number(b)));
}

static inline nami_value_t nami_neg(nami_value_t a) {
    if (a.type == NAMI_TYPE_INT) return nami_value_int(-a.value.as_int);
    return nami_value_float(-nami_to_number(a));
}

static inline nami_value_t nami_pos(nami_value_t a) {
    return nami_value_float(nami_to_number(a));
}

static inline nami_value_t nami_not(nami_value_t a) {
    return nami_value_bool(!nami_truthy(a));
}

static inline nami_value_t nami_bitnot(nami_value_t a) {
    return nami_value_int(~(int64_t)nami_to_number(a));
}

// ── Comparison Operations ───────────────────────────────

static inline bool nami_equals_raw(nami_value_t a, nami_value_t b) {
    if (a.type != b.type) {
        // Loose equality with coercion
        return nami_to_number(a) == nami_to_number(b);
    }
    switch (a.type) {
        case NAMI_TYPE_INT: return a.value.as_int == b.value.as_int;
        case NAMI_TYPE_FLOAT: return a.value.as_float == b.value.as_float;
        case NAMI_TYPE_BOOL: return a.value.as_bool == b.value.as_bool;
        case NAMI_TYPE_NULL: return true;
        case NAMI_TYPE_STRING:
            return strcmp(a.value.as_string->data, b.value.as_string->data) == 0;
        default: return false;
    }
}

static inline nami_value_t nami_eq(nami_value_t a, nami_value_t b) {
    return nami_value_bool(nami_equals_raw(a, b));
}

static inline nami_value_t nami_neq(nami_value_t a, nami_value_t b) {
    return nami_value_bool(!nami_equals_raw(a, b));
}

static inline nami_value_t nami_strict_eq(nami_value_t a, nami_value_t b) {
    if (a.type != b.type) return NAMI_FALSE;
    return nami_eq(a, b);
}

static inline nami_value_t nami_strict_neq(nami_value_t a, nami_value_t b) {
    if (a.type != b.type) return NAMI_TRUE;
    return nami_neq(a, b);
}

static inline nami_value_t nami_lt(nami_value_t a, nami_value_t b) {
    return nami_value_bool(nami_to_number(a) < nami_to_number(b));
}

static inline nami_value_t nami_gt(nami_value_t a, nami_value_t b) {
    return nami_value_bool(nami_to_number(a) > nami_to_number(b));
}

static inline nami_value_t nami_lte(nami_value_t a, nami_value_t b) {
    return nami_value_bool(nami_to_number(a) <= nami_to_number(b));
}

static inline nami_value_t nami_gte(nami_value_t a, nami_value_t b) {
    return nami_value_bool(nami_to_number(a) >= nami_to_number(b));
}

static inline nami_value_t nami_equals(nami_value_t a, nami_value_t b) {
    return nami_eq(a, b);
}

// ── Bitwise Operations ──────────────────────────────────

static inline nami_value_t nami_bitand(nami_value_t a, nami_value_t b) {
    return nami_value_int((int64_t)nami_to_number(a) & (int64_t)nami_to_number(b));
}

static inline nami_value_t nami_bitor(nami_value_t a, nami_value_t b) {
    return nami_value_int((int64_t)nami_to_number(a) | (int64_t)nami_to_number(b));
}

static inline nami_value_t nami_bitxor(nami_value_t a, nami_value_t b) {
    return nami_value_int((int64_t)nami_to_number(a) ^ (int64_t)nami_to_number(b));
}

static inline nami_value_t nami_shl(nami_value_t a, nami_value_t b) {
    return nami_value_int((int64_t)nami_to_number(a) << (int64_t)nami_to_number(b));
}

static inline nami_value_t nami_shr(nami_value_t a, nami_value_t b) {
    return nami_value_int((int64_t)nami_to_number(a) >> (int64_t)nami_to_number(b));
}

// ── I/O Functions ───────────────────────────────────────

/**
 * Print a single value to stdout with appropriate formatting
 * Supports all NAMI data types
/**
 * Print a value for nested contexts (inside arrays/objects)
 * Strings are printed WITHOUT quotes
 */
static inline void nami_print_value_nested(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_INT: 
            printf("%lld", (long long)v.value.as_int); 
            break;
        case NAMI_TYPE_FLOAT: 
            printf("%g", v.value.as_float); 
            break;
        case NAMI_TYPE_STRING: 
            printf("%s", v.value.as_string->data); 
            break;
        case NAMI_TYPE_BOOL: 
            printf("%s", v.value.as_bool ? "true" : "false"); 
            break;
        case NAMI_TYPE_NULL: 
            printf("null"); 
            break;
        case NAMI_TYPE_ARRAY: {
            nami_array_t* arr = v.value.as_array;
            printf("[");
            for (int64_t i = 0; i < arr->length; i++) {
                if (i > 0) printf(",");
                nami_print_value_nested(arr->items[i]);
            }
            printf("]");
            break;
        }
        case NAMI_TYPE_OBJECT: {
            nami_object_t* obj = v.value.as_object;
            printf("{");
            for (int64_t i = 0; i < obj->count; i++) {
                if (i > 0) printf(",");
                printf("%s:", obj->entries[i].key);
                nami_print_value_nested(obj->entries[i].value);
            }
            printf("}");
            break;
        }
        case NAMI_TYPE_FUNCTION: 
            printf("[Function]"); 
            break;
    }
}

/**
 * Print a single value to stdout with appropriate formatting
 * Supports all NAMI data types
 * Strings are printed without quotes (except in nested contexts)
 */
static inline void nami_print_value(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_INT: 
            printf("%lld", (long long)v.value.as_int); 
            break;
        case NAMI_TYPE_FLOAT: 
            printf("%g", v.value.as_float); 
            break;
        case NAMI_TYPE_STRING: 
            printf("%s", v.value.as_string->data); 
            break;
        case NAMI_TYPE_BOOL: 
            printf("%s", v.value.as_bool ? "true" : "false"); 
            break;
        case NAMI_TYPE_NULL: 
            printf("null"); 
            break;
        case NAMI_TYPE_ARRAY: {
            nami_array_t* arr = v.value.as_array;
            printf("[");
            for (int64_t i = 0; i < arr->length; i++) {
                if (i > 0) printf(",");
                nami_print_value_nested(arr->items[i]);
            }
            printf("]");
            break;
        }
        case NAMI_TYPE_OBJECT: {
            nami_object_t* obj = v.value.as_object;
            printf("{");
            for (int64_t i = 0; i < obj->count; i++) {
                if (i > 0) printf(",");
                printf("%s:", obj->entries[i].key);
                nami_print_value_nested(obj->entries[i].value);
            }
            printf("}");
            break;
        }
        case NAMI_TYPE_FUNCTION: 
            printf("[Function]"); 
            break;
    }
}

/**
 * Print a single value to stdout (no newline)
 * Requirements: 2.1, 2.5
 */
static inline void nami_print(nami_value_t v) {
    nami_print_value(v);
    fflush(stdout);
}

/**
 * Print a single value to stdout with newline
 * Requirements: 2.1, 2.5
 */
static inline void nami_println(nami_value_t v) {
    nami_print_value(v);
    printf("\n");
    fflush(stdout);
}

/**
 * Print raw value to stdout (C-style, no formatting)
 * Arrays print space-separated values without brackets
 * Objects print key-value pairs without braces
 */
static inline void nami_printf_value(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_INT: 
            printf("%lld", (long long)v.value.as_int); 
            break;
        case NAMI_TYPE_FLOAT: 
            printf("%g", v.value.as_float); 
            break;
        case NAMI_TYPE_STRING: 
            printf("%s", v.value.as_string->data); 
            break;
        case NAMI_TYPE_BOOL: 
            printf("%s", v.value.as_bool ? "true" : "false"); 
            break;
        case NAMI_TYPE_NULL: 
            printf("null"); 
            break;
        case NAMI_TYPE_ARRAY: {
            nami_array_t* arr = v.value.as_array;
            for (int64_t i = 0; i < arr->length; i++) {
                if (i > 0) printf(" ");
                nami_printf_value(arr->items[i]);
            }
            break;
        }
        case NAMI_TYPE_OBJECT: {
            nami_object_t* obj = v.value.as_object;
            for (int64_t i = 0; i < obj->count; i++) {
                if (i > 0) printf(" ");
                printf("%s:", obj->entries[i].key);
                nami_printf_value(obj->entries[i].value);
            }
            break;
        }
        case NAMI_TYPE_FUNCTION: 
            printf("[Function]"); 
            break;
    }
}

/**
 * Low-level print (C-style, no newline)
 * Arrays/objects show as [Array]/[Object]
 */
static inline void nami_printf(nami_value_t v) {
    nami_printf_value(v);
    fflush(stdout);
}

/**
 * Low-level print with newline (C-style)
 * Arrays/objects show as [Array]/[Object]
 */
static inline void nami_printfln(nami_value_t v) {
    nami_printf_value(v);
    printf("\n");
    fflush(stdout);
}

/**
 * Print multiple values separated by spaces (no newline)
 * Requirements: 2.1, 2.3, 2.5
 * 
 * @param count Number of values to print
 * @param ... Variable number of nami_value_t arguments
 */
static inline void nami_print_multi(int count, ...) {
    va_list args;
    va_start(args, count);
    
    for (int i = 0; i < count; i++) {
        if (i > 0) {
            printf(" ");  // Space separator between values
        }
        nami_value_t v = va_arg(args, nami_value_t);
        nami_print_value(v);
    }
    
    va_end(args);
    fflush(stdout);
}

/**
 * Print multiple values separated by spaces with newline
 * Requirements: 2.1, 2.3, 2.5
 * 
 * @param count Number of values to print
 * @param ... Variable number of nami_value_t arguments
 */
static inline void nami_println_multi(int count, ...) {
    va_list args;
    va_start(args, count);
    
    for (int i = 0; i < count; i++) {
        if (i > 0) {
            printf(" ");  // Space separator between values
        }
        nami_value_t v = va_arg(args, nami_value_t);
        nami_print_value(v);
    }
    
    printf("\n");
    va_end(args);
    fflush(stdout);
}

/**
 * Read a line from stdin and return as string (strips newline)
 * Requirements: 2.2, 2.4
 * 
 * @return String value containing the input line without trailing newline
 */
static inline nami_value_t nami_input(void) {
    char buffer[4096];
    if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        size_t len = strlen(buffer);
        // Strip trailing newline character
        if (len > 0 && buffer[len - 1] == '\n') {
            buffer[len - 1] = '\0';
            len--;
        }
        // Also strip carriage return (Windows line endings)
        if (len > 0 && buffer[len - 1] == '\r') {
            buffer[len - 1] = '\0';
        }
        nami_value_t result;
        result.type = NAMI_TYPE_STRING;
        result.value.as_string = nami_string_create(buffer);
        return result;
    }
    return NAMI_NULL;
}

/**
 * Alias for nami_input() - reads a line from stdin
 * Requirements: 2.2, 2.4
 */
static inline nami_value_t nami_input_line(void) {
    return nami_input();
}

// ── Graph Data Structure ────────────────────────────────

/**
 * Graph edge structure for weighted edges
 */
typedef struct nami_graph_edge {
    int64_t to;
    double weight;
} nami_graph_edge_t;

/**
 * Graph structure with adjacency list representation
 * Requirements: 9.1, 9.6
 */
typedef struct nami_graph {
    int64_t num_vertices;
    nami_array_t** adjacency_list;
} nami_graph_t;

/**
 * Create a new graph with specified number of vertices
 * Requirements: 9.1, 9.6
 * 
 * @param num_vertices Number of vertices in the graph
 * @return Pointer to newly created graph
 */
static inline nami_graph_t* nami_graph_create(int64_t num_vertices) {
    nami_graph_t* graph = (nami_graph_t*)malloc(sizeof(nami_graph_t));
    graph->num_vertices = num_vertices;
    graph->adjacency_list = (nami_array_t**)malloc(sizeof(nami_array_t*) * (size_t)num_vertices);
    
    for (int64_t i = 0; i < num_vertices; i++) {
        graph->adjacency_list[i] = nami_array_create();
    }
    
    return graph;
}

/**
 * Destroy a graph and free its memory
 * 
 * @param graph Graph to destroy
 */
static inline void nami_graph_destroy(nami_graph_t* graph) {
    if (graph != NULL) {
        if (graph->adjacency_list != NULL) {
            for (int64_t i = 0; i < graph->num_vertices; i++) {
                nami_array_destroy(graph->adjacency_list[i]);
            }
            free(graph->adjacency_list);
        }
        free(graph);
    }
}

/**
 * Add a weighted edge to the graph
 * Requirements: 9.1, 9.6
 * 
 * @param graph Graph to add edge to
 * @param from Source vertex
 * @param to Destination vertex
 * @param weight Edge weight
 */
static inline void nami_graph_add_edge(nami_graph_t* graph, int64_t from, int64_t to, double weight) {
    if (from < 0 || from >= graph->num_vertices || to < 0 || to >= graph->num_vertices) {
        return;  // Invalid vertex indices
    }
    
    // Create edge object
    nami_object_t* edge = nami_object_create_empty();
    nami_object_set(edge, "to", nami_value_int(to));
    nami_object_set(edge, "weight", nami_value_float(weight));
    
    nami_value_t edge_val;
    edge_val.type = NAMI_TYPE_OBJECT;
    edge_val.value.as_object = edge;
    
    nami_array_push(graph->adjacency_list[from], edge_val);
}

/**
 * Breadth-First Search traversal
 * Requirements: 9.4
 * 
 * @param graph Graph to traverse
 * @param start Starting vertex
 * @return Array of vertices in BFS order
 */
static inline nami_array_t* nami_graph_bfs(nami_graph_t* graph, int64_t start) {
    if (start < 0 || start >= graph->num_vertices) {
        return nami_array_create();  // Return empty array for invalid start
    }
    
    nami_array_t* result = nami_array_create();
    bool* visited = (bool*)calloc((size_t)graph->num_vertices, sizeof(bool));
    nami_array_t* queue = nami_array_create();
    
    // Enqueue start vertex
    nami_array_push(queue, nami_value_int(start));
    visited[start] = true;
    
    while (queue->length > 0) {
        // Dequeue (remove from front)
        nami_value_t current_val = queue->items[0];
        for (int64_t i = 0; i < queue->length - 1; i++) {
            queue->items[i] = queue->items[i + 1];
        }
        queue->length--;
        
        int64_t current = current_val.value.as_int;
        nami_array_push(result, current_val);
        
        // Visit all neighbors
        nami_array_t* neighbors = graph->adjacency_list[current];
        for (int64_t i = 0; i < neighbors->length; i++) {
            nami_value_t edge_val = neighbors->items[i];
            if (edge_val.type == NAMI_TYPE_OBJECT) {
                nami_value_t to_val = nami_object_get(edge_val.value.as_object, "to");
                if (to_val.type == NAMI_TYPE_INT) {
                    int64_t neighbor = to_val.value.as_int;
                    if (!visited[neighbor]) {
                        visited[neighbor] = true;
                        nami_array_push(queue, nami_value_int(neighbor));
                    }
                }
            }
        }
    }
    
    free(visited);
    nami_array_destroy(queue);
    return result;
}

/**
 * Depth-First Search traversal (iterative implementation)
 * Requirements: 9.5
 * 
 * @param graph Graph to traverse
 * @param start Starting vertex
 * @return Array of vertices in DFS order
 */
static inline nami_array_t* nami_graph_dfs(nami_graph_t* graph, int64_t start) {
    if (start < 0 || start >= graph->num_vertices) {
        return nami_array_create();  // Return empty array for invalid start
    }
    
    nami_array_t* result = nami_array_create();
    bool* visited = (bool*)calloc((size_t)graph->num_vertices, sizeof(bool));
    nami_array_t* stack = nami_array_create();
    
    // Push start vertex
    nami_array_push(stack, nami_value_int(start));
    
    while (stack->length > 0) {
        // Pop from stack
        nami_value_t current_val = nami_array_pop(stack);
        int64_t current = current_val.value.as_int;
        
        if (visited[current]) {
            continue;
        }
        
        visited[current] = true;
        nami_array_push(result, current_val);
        
        // Push all unvisited neighbors (in reverse order for correct DFS order)
        nami_array_t* neighbors = graph->adjacency_list[current];
        for (int64_t i = neighbors->length - 1; i >= 0; i--) {
            nami_value_t edge_val = neighbors->items[i];
            if (edge_val.type == NAMI_TYPE_OBJECT) {
                nami_value_t to_val = nami_object_get(edge_val.value.as_object, "to");
                if (to_val.type == NAMI_TYPE_INT) {
                    int64_t neighbor = to_val.value.as_int;
                    if (!visited[neighbor]) {
                        nami_array_push(stack, nami_value_int(neighbor));
                    }
                }
            }
        }
    }
    
    free(visited);
    nami_array_destroy(stack);
    return result;
}

/**
 * Dijkstra's shortest path algorithm
 * Requirements: 9.2
 * 
 * @param graph Graph to search
 * @param start Starting vertex
 * @param end Ending vertex
 * @return Object containing 'path' array and 'distances' array
 */
static inline nami_object_t* nami_graph_dijkstra(nami_graph_t* graph, int64_t start, int64_t end) {
    if (start < 0 || start >= graph->num_vertices || end < 0 || end >= graph->num_vertices) {
        nami_object_t* result = nami_object_create_empty();
        nami_object_set(result, "path", nami_array_of(0));
        nami_object_set(result, "distances", nami_array_of(0));
        return result;
    }
    
    double* distances = (double*)malloc(sizeof(double) * (size_t)graph->num_vertices);
    int64_t* previous = (int64_t*)malloc(sizeof(int64_t) * (size_t)graph->num_vertices);
    bool* visited = (bool*)calloc((size_t)graph->num_vertices, sizeof(bool));
    
    // Initialize distances
    for (int64_t i = 0; i < graph->num_vertices; i++) {
        distances[i] = INFINITY;
        previous[i] = -1;
    }
    distances[start] = 0.0;
    
    // Dijkstra's algorithm
    for (int64_t count = 0; count < graph->num_vertices; count++) {
        // Find minimum distance vertex
        double min_dist = INFINITY;
        int64_t min_vertex = -1;
        for (int64_t v = 0; v < graph->num_vertices; v++) {
            if (!visited[v] && distances[v] < min_dist) {
                min_dist = distances[v];
                min_vertex = v;
            }
        }
        
        if (min_vertex == -1) break;  // No more reachable vertices
        
        visited[min_vertex] = true;
        
        // Update distances to neighbors
        nami_array_t* neighbors = graph->adjacency_list[min_vertex];
        for (int64_t i = 0; i < neighbors->length; i++) {
            nami_value_t edge_val = neighbors->items[i];
            if (edge_val.type == NAMI_TYPE_OBJECT) {
                nami_value_t to_val = nami_object_get(edge_val.value.as_object, "to");
                nami_value_t weight_val = nami_object_get(edge_val.value.as_object, "weight");
                
                if (to_val.type == NAMI_TYPE_INT && weight_val.type == NAMI_TYPE_FLOAT) {
                    int64_t neighbor = to_val.value.as_int;
                    double weight = weight_val.value.as_float;
                    double new_dist = distances[min_vertex] + weight;
                    
                    if (new_dist < distances[neighbor]) {
                        distances[neighbor] = new_dist;
                        previous[neighbor] = min_vertex;
                    }
                }
            }
        }
    }
    
    // Reconstruct path
    nami_array_t* path = nami_array_create();
    if (distances[end] != INFINITY) {
        int64_t current = end;
        while (current != -1) {
            nami_array_push(path, nami_value_int(current));
            current = previous[current];
        }
        
        // Reverse path
        for (int64_t i = 0; i < path->length / 2; i++) {
            nami_value_t temp = path->items[i];
            path->items[i] = path->items[path->length - 1 - i];
            path->items[path->length - 1 - i] = temp;
        }
    }
    
    // Create distances array
    nami_array_t* dist_array = nami_array_create();
    for (int64_t i = 0; i < graph->num_vertices; i++) {
        nami_array_push(dist_array, nami_value_float(distances[i]));
    }
    
    // Create result object
    nami_object_t* result = nami_object_create_empty();
    nami_value_t path_val;
    path_val.type = NAMI_TYPE_ARRAY;
    path_val.value.as_array = path;
    nami_object_set(result, "path", path_val);
    
    nami_value_t dist_val;
    dist_val.type = NAMI_TYPE_ARRAY;
    dist_val.value.as_array = dist_array;
    nami_object_set(result, "distances", dist_val);
    
    free(distances);
    free(previous);
    free(visited);
    
    return result;
}

/**
 * A* pathfinding algorithm with heuristic function
 * Requirements: 9.3
 * 
 * @param graph Graph to search
 * @param start Starting vertex
 * @param end Ending vertex
 * @param heuristic Heuristic function that estimates distance to goal
 * @return Array representing the path from start to end
 */
static inline nami_array_t* nami_graph_astar(nami_graph_t* graph, int64_t start, int64_t end, nami_function_t heuristic) {
    if (start < 0 || start >= graph->num_vertices || end < 0 || end >= graph->num_vertices) {
        return nami_array_create();
    }
    
    double* g_score = (double*)malloc(sizeof(double) * (size_t)graph->num_vertices);
    double* f_score = (double*)malloc(sizeof(double) * (size_t)graph->num_vertices);
    int64_t* previous = (int64_t*)malloc(sizeof(int64_t) * (size_t)graph->num_vertices);
    bool* in_open_set = (bool*)calloc((size_t)graph->num_vertices, sizeof(bool));
    bool* in_closed_set = (bool*)calloc((size_t)graph->num_vertices, sizeof(bool));
    
    // Initialize scores
    for (int64_t i = 0; i < graph->num_vertices; i++) {
        g_score[i] = INFINITY;
        f_score[i] = INFINITY;
        previous[i] = -1;
    }
    
    g_score[start] = 0.0;
    nami_value_t h_start = heuristic(nami_value_int(start));
    f_score[start] = nami_to_number(h_start);
    in_open_set[start] = true;
    
    // A* algorithm
    while (true) {
        // Find vertex in open set with lowest f_score
        double min_f = INFINITY;
        int64_t current = -1;
        for (int64_t v = 0; v < graph->num_vertices; v++) {
            if (in_open_set[v] && f_score[v] < min_f) {
                min_f = f_score[v];
                current = v;
            }
        }
        
        if (current == -1) break;  // Open set is empty
        
        if (current == end) {
            // Reconstruct path
            nami_array_t* path = nami_array_create();
            int64_t node = end;
            while (node != -1) {
                nami_array_push(path, nami_value_int(node));
                node = previous[node];
            }
            
            // Reverse path
            for (int64_t i = 0; i < path->length / 2; i++) {
                nami_value_t temp = path->items[i];
                path->items[i] = path->items[path->length - 1 - i];
                path->items[path->length - 1 - i] = temp;
            }
            
            free(g_score);
            free(f_score);
            free(previous);
            free(in_open_set);
            free(in_closed_set);
            
            return path;
        }
        
        in_open_set[current] = false;
        in_closed_set[current] = true;
        
        // Check all neighbors
        nami_array_t* neighbors = graph->adjacency_list[current];
        for (int64_t i = 0; i < neighbors->length; i++) {
            nami_value_t edge_val = neighbors->items[i];
            if (edge_val.type == NAMI_TYPE_OBJECT) {
                nami_value_t to_val = nami_object_get(edge_val.value.as_object, "to");
                nami_value_t weight_val = nami_object_get(edge_val.value.as_object, "weight");
                
                if (to_val.type == NAMI_TYPE_INT && weight_val.type == NAMI_TYPE_FLOAT) {
                    int64_t neighbor = to_val.value.as_int;
                    
                    if (in_closed_set[neighbor]) continue;
                    
                    double weight = weight_val.value.as_float;
                    double tentative_g = g_score[current] + weight;
                    
                    if (tentative_g < g_score[neighbor]) {
                        previous[neighbor] = current;
                        g_score[neighbor] = tentative_g;
                        nami_value_t h_neighbor = heuristic(nami_value_int(neighbor));
                        f_score[neighbor] = tentative_g + nami_to_number(h_neighbor);
                        in_open_set[neighbor] = true;
                    }
                }
            }
        }
    }
    
    // No path found
    free(g_score);
    free(f_score);
    free(previous);
    free(in_open_set);
    free(in_closed_set);
    
    return nami_array_create();
}

// ── Type Query ──────────────────────────────────────────

static inline nami_value_t nami_typeof(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_INT:
        case NAMI_TYPE_FLOAT: return nami_value_string("number");
        case NAMI_TYPE_STRING: return nami_value_string("string");
        case NAMI_TYPE_BOOL: return nami_value_string("boolean");
        case NAMI_TYPE_NULL: return nami_value_string("null");
        case NAMI_TYPE_ARRAY: return nami_value_string("array");
        case NAMI_TYPE_OBJECT: return nami_value_string("object");
        case NAMI_TYPE_FUNCTION: return nami_value_string("function");
        default: return nami_value_string("undefined");
    }
}

static inline nami_value_t nami_length(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_STRING: return nami_value_int((int64_t)v.value.as_string->length);
        case NAMI_TYPE_ARRAY: return nami_value_int(v.value.as_array->length);
        default: return nami_value_int(0);
    }
}

// ── Error Handling (setjmp/longjmp) ──────────────────────

/**
 * Standard error types
 * Requirements: 15.1, 15.4
 */
typedef enum {
    NAMI_ERROR_GENERIC,
    NAMI_ERROR_TYPE,
    NAMI_ERROR_REFERENCE,
    NAMI_ERROR_SYNTAX,
    NAMI_ERROR_RANGE,
    NAMI_ERROR_NULL_POINTER,
    NAMI_ERROR_DIVISION_BY_ZERO,
    NAMI_ERROR_OUT_OF_MEMORY,
    NAMI_ERROR_IO,
    NAMI_ERROR_ASSERTION
} nami_error_type_t;

/**
 * Error location information
 * Requirements: 15.4
 */
typedef struct {
    const char* file;
    int line;
    const char* function;
} nami_error_location_t;

/**
 * Error structure with message, type, and location
 * Requirements: 15.1, 15.4
 */
typedef struct {
    char* message;
    nami_error_type_t type;
    nami_error_location_t location;
} nami_error_t;

/**
 * Error context for try-catch-finally blocks
 * Uses setjmp/longjmp for exception handling
 * Requirements: 15.1, 15.2, 15.3
 */
typedef struct nami_error_context {
    jmp_buf jmp;
    nami_error_t* error;
    struct nami_error_context* prev;
    bool has_finally;
    void (*finally_block)(void*);
    void* finally_context;
} nami_error_context_t;

static nami_error_context_t* __nami_error_stack = NULL;

/**
 * Create a new error object
 * Requirements: 15.1, 15.4
 * 
 * @param message Error message
 * @param type Error type
 * @param file Source file where error occurred
 * @param line Line number where error occurred
 * @param function Function name where error occurred
 * @return Pointer to newly created error
 */
static inline nami_error_t* nami_error_create(const char* message, nami_error_type_t type, 
                                               const char* file, int line, const char* function) {
    nami_error_t* error = (nami_error_t*)malloc(sizeof(nami_error_t));
    error->message = strdup(message);
    error->type = type;
    error->location.file = file;
    error->location.line = line;
    error->location.function = function;
    return error;
}

/**
 * Destroy an error object and free its memory
 * 
 * @param error Error to destroy
 */
static inline void nami_error_destroy(nami_error_t* error) {
    if (error != NULL) {
        if (error->message != NULL) {
            free(error->message);
        }
        free(error);
    }
}

/**
 * Get error type name as string
 * 
 * @param type Error type
 * @return String representation of error type
 */
static inline const char* nami_error_type_name(nami_error_type_t type) {
    switch (type) {
        case NAMI_ERROR_GENERIC: return "Error";
        case NAMI_ERROR_TYPE: return "TypeError";
        case NAMI_ERROR_REFERENCE: return "ReferenceError";
        case NAMI_ERROR_SYNTAX: return "SyntaxError";
        case NAMI_ERROR_RANGE: return "RangeError";
        case NAMI_ERROR_NULL_POINTER: return "NullPointerError";
        case NAMI_ERROR_DIVISION_BY_ZERO: return "DivisionByZeroError";
        case NAMI_ERROR_OUT_OF_MEMORY: return "OutOfMemoryError";
        case NAMI_ERROR_IO: return "IOError";
        case NAMI_ERROR_ASSERTION: return "AssertionError";
        default: return "UnknownError";
    }
}

/**
 * Begin a try block by setting up error context
 * Requirements: 15.2
 * 
 * @param ctx Error context to initialize
 * @return 0 on first call (entering try block), non-zero when returning from longjmp (error caught)
 */
static inline int nami_try_begin(nami_error_context_t* ctx) {
    ctx->error = NULL;
    ctx->prev = __nami_error_stack;
    ctx->has_finally = false;
    ctx->finally_block = NULL;
    ctx->finally_context = NULL;
    __nami_error_stack = ctx;
    return setjmp(ctx->jmp);
}

/**
 * Pop the current error context from the stack
 * 
 * @return The error that was caught (NULL if no error)
 */
static inline nami_error_t* nami_try_end(void) {
    if (__nami_error_stack) {
        nami_error_context_t* ctx = __nami_error_stack;
        nami_error_t* error = ctx->error;
        __nami_error_stack = ctx->prev;
        return error;
    }
    return NULL;
}

/**
 * Throw an error (transfers control to catch block)
 * Requirements: 15.2
 * 
 * @param error Error to throw
 */
static inline void nami_throw_error(nami_error_t* error) {
    if (__nami_error_stack) {
        __nami_error_stack->error = error;
        
        // Execute finally block if present before unwinding
        if (__nami_error_stack->has_finally && __nami_error_stack->finally_block) {
            __nami_error_stack->finally_block(__nami_error_stack->finally_context);
        }
        
        longjmp(__nami_error_stack->jmp, 1);
    } else {
        // Unhandled error - print and exit
        fprintf(stderr, "Unhandled %s: %s\n", 
                nami_error_type_name(error->type), 
                error->message);
        if (error->location.file != NULL) {
            fprintf(stderr, "  at %s:%d", error->location.file, error->location.line);
            if (error->location.function != NULL) {
                fprintf(stderr, " in %s()", error->location.function);
            }
            fprintf(stderr, "\n");
        }
        nami_error_destroy(error);
        exit(1);
    }
}

/**
 * Throw an error with a simple message (creates error object)
 * Requirements: 15.2
 * 
 * @param message Error message
 */
static inline void nami_throw(const char* message) {
    nami_error_t* error = nami_error_create(message, NAMI_ERROR_GENERIC, NULL, 0, NULL);
    nami_throw_error(error);
}

/**
 * Throw an error with location information (macro for convenience)
 * Requirements: 15.2, 15.4
 */
#define NAMI_THROW(message, type) \
    nami_throw_error(nami_error_create(message, type, __FILE__, __LINE__, __func__))

/**
 * Catch an error from the current context
 * Requirements: 15.2
 * 
 * @return The caught error (NULL if no error)
 */
static inline nami_error_t* nami_catch(void) {
    if (__nami_error_stack && __nami_error_stack->error) {
        return __nami_error_stack->error;
    }
    return NULL;
}

/**
 * Register a finally block to be executed regardless of errors
 * Requirements: 15.3
 * 
 * @param finally_fn Function to execute in finally block
 * @param context Context data to pass to finally function
 */
static inline void nami_finally(void (*finally_fn)(void*), void* context) {
    if (__nami_error_stack) {
        __nami_error_stack->has_finally = true;
        __nami_error_stack->finally_block = finally_fn;
        __nami_error_stack->finally_context = context;
    }
}

/**
 * Execute finally block and clean up error context
 * Requirements: 15.3
 * 
 * Should be called at the end of try-catch-finally
 */
static inline void nami_finally_execute(void) {
    if (__nami_error_stack) {
        if (__nami_error_stack->has_finally && __nami_error_stack->finally_block) {
            __nami_error_stack->finally_block(__nami_error_stack->finally_context);
        }
    }
}

/**
 * Legacy compatibility: throw a nami_value_t as error
 * Converts value to error message
 */
static inline void nami_throw_value(nami_value_t error_val) {
    char message[256];
    
    switch (error_val.type) {
        case NAMI_TYPE_STRING:
            nami_throw(error_val.value.as_string->data);
            break;
        case NAMI_TYPE_INT:
            snprintf(message, sizeof(message), "Error code: %lld", (long long)error_val.value.as_int);
            nami_throw(message);
            break;
        case NAMI_TYPE_FLOAT:
            snprintf(message, sizeof(message), "Error code: %g", error_val.value.as_float);
            nami_throw(message);
            break;
        default:
            nami_throw("Unknown error");
            break;
    }
}

// ── Parsing Functions ───────────────────────────────────

static inline nami_value_t nami_parse_int(nami_value_t v) {
    if (v.type == NAMI_TYPE_INT) return v;
    if (v.type == NAMI_TYPE_FLOAT) return nami_value_int((int64_t)v.value.as_float);
    if (v.type == NAMI_TYPE_STRING) return nami_value_int(atoll(v.value.as_string->data));
    return nami_value_int(0);
}

static inline nami_value_t nami_parse_float(nami_value_t v) {
    if (v.type == NAMI_TYPE_FLOAT) return v;
    if (v.type == NAMI_TYPE_INT) return nami_value_float((double)v.value.as_int);
    if (v.type == NAMI_TYPE_STRING) return nami_value_float(atof(v.value.as_string->data));
    return nami_value_float(0.0);
}

// ── Math Functions ──────────────────────────────────────

static inline nami_value_t nami_math_floor(nami_value_t v) {
    return nami_value_int((int64_t)floor(nami_to_number(v)));
}

static inline nami_value_t nami_math_ceil(nami_value_t v) {
    return nami_value_int((int64_t)ceil(nami_to_number(v)));
}

static inline nami_value_t nami_math_round(nami_value_t v) {
    return nami_value_int((int64_t)round(nami_to_number(v)));
}

static inline nami_value_t nami_math_abs(nami_value_t v) {
    double n = nami_to_number(v);
    return nami_value_float(fabs(n));
}

static inline nami_value_t nami_math_sqrt(nami_value_t v) {
    return nami_value_float(sqrt(nami_to_number(v)));
}

static inline nami_value_t nami_math_max(nami_value_t a, nami_value_t b) {
    double na = nami_to_number(a);
    double nb = nami_to_number(b);
    return nami_value_float(fmax(na, nb));
}

static inline nami_value_t nami_math_min(nami_value_t a, nami_value_t b) {
    double na = nami_to_number(a);
    double nb = nami_to_number(b);
    return nami_value_float(fmin(na, nb));
}

static inline nami_value_t nami_math_random(void) {
    return nami_value_float((double)rand() / RAND_MAX);
}

// ── Increment/Decrement ─────────────────────────────────

static inline nami_value_t nami_inc(nami_value_t* v) {
    if (v->type == NAMI_TYPE_INT) { v->value.as_int++; return *v; }
    double n = nami_to_number(*v) + 1.0;
    *v = nami_value_float(n);
    return *v;
}

static inline nami_value_t nami_dec(nami_value_t* v) {
    if (v->type == NAMI_TYPE_INT) { v->value.as_int--; return *v; }
    double n = nami_to_number(*v) - 1.0;
    *v = nami_value_float(n);
    return *v;
}

static inline nami_value_t nami_inc_post(nami_value_t* v) {
    nami_value_t old = *v;
    nami_inc(v);
    return old;
}

static inline nami_value_t nami_dec_post(nami_value_t* v) {
    nami_value_t old = *v;
    nami_dec(v);
    return old;
}

// ── Property Access ─────────────────────────────────────

static inline nami_value_t nami_get(nami_value_t obj, nami_value_t key) {
    if (obj.type == NAMI_TYPE_ARRAY && key.type == NAMI_TYPE_INT) {
        return nami_array_get(obj.value.as_array, key.value.as_int);
    }
    if (obj.type == NAMI_TYPE_OBJECT && key.type == NAMI_TYPE_STRING) {
        return nami_object_get(obj.value.as_object, key.value.as_string->data);
    }
    return NAMI_NULL;
}

static inline nami_value_t nami_get_prop(nami_value_t obj, const char* key) {
    if (obj.type == NAMI_TYPE_OBJECT) {
        return nami_object_get(obj.value.as_object, key);
    }
    return NAMI_NULL;
}

static inline void nami_set(nami_value_t obj, nami_value_t key, nami_value_t value) {
    if (obj.type == NAMI_TYPE_ARRAY && key.type == NAMI_TYPE_INT) {
        nami_array_set(obj.value.as_array, key.value.as_int, value);
    } else if (obj.type == NAMI_TYPE_OBJECT && key.type == NAMI_TYPE_STRING) {
        nami_object_set(obj.value.as_object, key.value.as_string->data, value);
    }
}

static inline void nami_set_prop(nami_value_t obj, const char* key, nami_value_t value) {
    if (obj.type == NAMI_TYPE_OBJECT) {
        nami_object_set(obj.value.as_object, key, value);
    }
}

// ── Sorting Algorithms ──────────────────────────────────

/**
 * Comparator function type for sorting
 * Returns: negative if a < b, 0 if a == b, positive if a > b
 */
typedef int (*nami_comparator_t)(nami_value_t a, nami_value_t b);

/**
 * Default comparator: numeric comparison
 */
static inline int nami_default_comparator(nami_value_t a, nami_value_t b) {
    double a_num = nami_to_number(a);
    double b_num = nami_to_number(b);
    if (a_num < b_num) return -1;
    if (a_num > b_num) return 1;
    return 0;
}

/**
 * Swap two elements in an array
 */
static inline void nami_swap(nami_value_t* a, nami_value_t* b) {
    nami_value_t temp = *a;
    *a = *b;
    *b = temp;
}

/**
 * Partition function for quicksort
 */
static inline int64_t nami_partition(nami_array_t* arr, int64_t low, int64_t high, nami_comparator_t cmp) {
    nami_value_t pivot = arr->items[high];
    int64_t i = low - 1;
    
    for (int64_t j = low; j < high; j++) {
        if (cmp(arr->items[j], pivot) <= 0) {
            i++;
            nami_swap(&arr->items[i], &arr->items[j]);
        }
    }
    nami_swap(&arr->items[i + 1], &arr->items[high]);
    return i + 1;
}

/**
 * Quicksort recursive helper
 */
static inline void nami_quicksort_helper(nami_array_t* arr, int64_t low, int64_t high, nami_comparator_t cmp) {
    if (low < high) {
        int64_t pi = nami_partition(arr, low, high, cmp);
        nami_quicksort_helper(arr, low, pi - 1, cmp);
        nami_quicksort_helper(arr, pi + 1, high, cmp);
    }
}

/**
 * Quicksort implementation with custom comparator support
 * Requirements: 10.1, 10.5
 * 
 * @param arr Array to sort (modified in-place)
 * @param comparator Custom comparison function (NULL for default)
 */
static inline void nami_quicksort(nami_array_t* arr, nami_comparator_t comparator) {
    if (arr == NULL || arr->length <= 1) return;
    
    nami_comparator_t cmp = comparator ? comparator : nami_default_comparator;
    nami_quicksort_helper(arr, 0, arr->length - 1, cmp);
}

/**
 * Merge two sorted subarrays
 */
static inline void nami_merge(nami_array_t* arr, int64_t left, int64_t mid, int64_t right, nami_comparator_t cmp) {
    int64_t n1 = mid - left + 1;
    int64_t n2 = right - mid;
    
    // Create temporary arrays
    nami_value_t* L = (nami_value_t*)malloc(sizeof(nami_value_t) * (size_t)n1);
    nami_value_t* R = (nami_value_t*)malloc(sizeof(nami_value_t) * (size_t)n2);
    
    // Copy data to temporary arrays
    for (int64_t i = 0; i < n1; i++) {
        L[i] = arr->items[left + i];
    }
    for (int64_t j = 0; j < n2; j++) {
        R[j] = arr->items[mid + 1 + j];
    }
    
    // Merge the temporary arrays back
    int64_t i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (cmp(L[i], R[j]) <= 0) {
            arr->items[k++] = L[i++];
        } else {
            arr->items[k++] = R[j++];
        }
    }
    
    // Copy remaining elements
    while (i < n1) {
        arr->items[k++] = L[i++];
    }
    while (j < n2) {
        arr->items[k++] = R[j++];
    }
    
    free(L);
    free(R);
}

/**
 * Mergesort recursive helper
 */
static inline void nami_mergesort_helper(nami_array_t* arr, int64_t left, int64_t right, nami_comparator_t cmp) {
    if (left < right) {
        int64_t mid = left + (right - left) / 2;
        nami_mergesort_helper(arr, left, mid, cmp);
        nami_mergesort_helper(arr, mid + 1, right, cmp);
        nami_merge(arr, left, mid, right, cmp);
    }
}

/**
 * Mergesort implementation with custom comparator support
 * Requirements: 10.2, 10.5
 * 
 * @param arr Array to sort (modified in-place)
 * @param comparator Custom comparison function (NULL for default)
 */
static inline void nami_mergesort(nami_array_t* arr, nami_comparator_t comparator) {
    if (arr == NULL || arr->length <= 1) return;
    
    nami_comparator_t cmp = comparator ? comparator : nami_default_comparator;
    nami_mergesort_helper(arr, 0, arr->length - 1, cmp);
}

/**
 * Heapify a subtree rooted at index i
 */
static inline void nami_heapify(nami_array_t* arr, int64_t n, int64_t i, nami_comparator_t cmp) {
    int64_t largest = i;
    int64_t left = 2 * i + 1;
    int64_t right = 2 * i + 2;
    
    if (left < n && cmp(arr->items[left], arr->items[largest]) > 0) {
        largest = left;
    }
    
    if (right < n && cmp(arr->items[right], arr->items[largest]) > 0) {
        largest = right;
    }
    
    if (largest != i) {
        nami_swap(&arr->items[i], &arr->items[largest]);
        nami_heapify(arr, n, largest, cmp);
    }
}

/**
 * Heapsort implementation with custom comparator support
 * Requirements: 10.3, 10.5
 * 
 * @param arr Array to sort (modified in-place)
 * @param comparator Custom comparison function (NULL for default)
 */
static inline void nami_heapsort(nami_array_t* arr, nami_comparator_t comparator) {
    if (arr == NULL || arr->length <= 1) return;
    
    nami_comparator_t cmp = comparator ? comparator : nami_default_comparator;
    int64_t n = arr->length;
    
    // Build max heap
    for (int64_t i = n / 2 - 1; i >= 0; i--) {
        nami_heapify(arr, n, i, cmp);
    }
    
    // Extract elements from heap one by one
    for (int64_t i = n - 1; i > 0; i--) {
        nami_swap(&arr->items[0], &arr->items[i]);
        nami_heapify(arr, i, 0, cmp);
    }
}

/**
 * Default sort function (uses quicksort)
 * Requirements: 10.4, 10.6
 * 
 * Supports sorting arrays of any comparable type through nami_to_number conversion.
 * 
 * @param arr Array to sort (modified in-place)
 */
static inline void nami_sort(nami_array_t* arr) {
    nami_quicksort(arr, NULL);
}

// ── Tree Data Structure ─────────────────────────────────

/**
 * Binary tree node structure
 * Requirements: 11.1
 */
typedef struct nami_tree_node {
    nami_value_t value;
    struct nami_tree_node* left;
    struct nami_tree_node* right;
    int64_t height;  // For AVL balancing
} nami_tree_node_t;

/**
 * Binary tree structure
 * Requirements: 11.1
 */
typedef struct nami_tree {
    nami_tree_node_t* root;
    int64_t size;
} nami_tree_t;

/**
 * Create a new empty binary tree
 * Requirements: 11.1
 * 
 * @return Pointer to newly created tree
 */
static inline nami_tree_t* nami_tree_create(void) {
    nami_tree_t* tree = (nami_tree_t*)malloc(sizeof(nami_tree_t));
    tree->root = NULL;
    tree->size = 0;
    return tree;
}

/**
 * Create a new tree node
 * 
 * @param value Value to store in the node
 * @return Pointer to newly created node
 */
static inline nami_tree_node_t* nami_tree_node_create(nami_value_t value) {
    nami_tree_node_t* node = (nami_tree_node_t*)malloc(sizeof(nami_tree_node_t));
    node->value = value;
    node->left = NULL;
    node->right = NULL;
    node->height = 1;
    return node;
}

/**
 * Get the height of a node (0 for NULL)
 * 
 * @param node Node to get height of
 * @return Height of the node
 */
static inline int64_t nami_tree_node_height(nami_tree_node_t* node) {
    return node ? node->height : 0;
}

/**
 * Get the balance factor of a node
 * Requirements: 11.4
 * 
 * @param node Node to get balance factor of
 * @return Balance factor (left height - right height)
 */
static inline int64_t nami_tree_node_balance(nami_tree_node_t* node) {
    if (node == NULL) return 0;
    return nami_tree_node_height(node->left) - nami_tree_node_height(node->right);
}

/**
 * Update the height of a node based on its children
 * 
 * @param node Node to update
 */
static inline void nami_tree_node_update_height(nami_tree_node_t* node) {
    if (node == NULL) return;
    int64_t left_height = nami_tree_node_height(node->left);
    int64_t right_height = nami_tree_node_height(node->right);
    node->height = 1 + (left_height > right_height ? left_height : right_height);
}

/**
 * Right rotation for AVL balancing
 * Requirements: 11.4, 11.6
 * 
 * @param y Node to rotate
 * @return New root after rotation
 */
static inline nami_tree_node_t* nami_tree_rotate_right(nami_tree_node_t* y) {
    nami_tree_node_t* x = y->left;
    nami_tree_node_t* T2 = x->right;
    
    // Perform rotation
    x->right = y;
    y->left = T2;
    
    // Update heights
    nami_tree_node_update_height(y);
    nami_tree_node_update_height(x);
    
    return x;
}

/**
 * Left rotation for AVL balancing
 * Requirements: 11.4, 11.6
 * 
 * @param x Node to rotate
 * @return New root after rotation
 */
static inline nami_tree_node_t* nami_tree_rotate_left(nami_tree_node_t* x) {
    nami_tree_node_t* y = x->right;
    nami_tree_node_t* T2 = y->left;
    
    // Perform rotation
    y->left = x;
    x->right = T2;
    
    // Update heights
    nami_tree_node_update_height(x);
    nami_tree_node_update_height(y);
    
    return y;
}

/**
 * Balance a node using AVL rotations
 * Requirements: 11.4, 11.6
 * 
 * @param node Node to balance
 * @return Balanced node (may be different from input)
 */
static inline nami_tree_node_t* nami_tree_balance_node(nami_tree_node_t* node) {
    if (node == NULL) return NULL;
    
    nami_tree_node_update_height(node);
    int64_t balance = nami_tree_node_balance(node);
    
    // Left-heavy
    if (balance > 1) {
        // Left-Right case
        if (nami_tree_node_balance(node->left) < 0) {
            node->left = nami_tree_rotate_left(node->left);
        }
        // Left-Left case
        return nami_tree_rotate_right(node);
    }
    
    // Right-heavy
    if (balance < -1) {
        // Right-Left case
        if (nami_tree_node_balance(node->right) > 0) {
            node->right = nami_tree_rotate_right(node->right);
        }
        // Right-Right case
        return nami_tree_rotate_left(node);
    }
    
    return node;
}

/**
 * Insert a value into a BST subtree (recursive helper)
 * Requirements: 11.1, 11.3, 11.4
 * 
 * @param node Root of subtree
 * @param value Value to insert
 * @return New root of subtree after insertion
 */
static inline nami_tree_node_t* nami_tree_insert_helper(nami_tree_node_t* node, nami_value_t value) {
    // Base case: empty tree
    if (node == NULL) {
        return nami_tree_node_create(value);
    }
    
    // BST insertion: compare values
    double node_val = nami_to_number(node->value);
    double insert_val = nami_to_number(value);
    
    if (insert_val < node_val) {
        node->left = nami_tree_insert_helper(node->left, value);
    } else if (insert_val > node_val) {
        node->right = nami_tree_insert_helper(node->right, value);
    } else {
        // Duplicate value: don't insert
        return node;
    }
    
    // Balance the node after insertion (AVL)
    return nami_tree_balance_node(node);
}

/**
 * Insert a value into the binary search tree
 * Requirements: 11.1, 11.3
 * 
 * Maintains BST ordering invariant and AVL balance invariants.
 * 
 * @param tree Tree to insert into
 * @param value Value to insert
 */
static inline void nami_tree_insert(nami_tree_t* tree, nami_value_t value) {
    if (tree == NULL) return;
    
    tree->root = nami_tree_insert_helper(tree->root, value);
    tree->size++;
}

/**
 * Search for a value in a BST (recursive helper)
 * Requirements: 11.3
 * 
 * @param node Root of subtree to search
 * @param value Value to search for
 * @return true if value is found, false otherwise
 */
static inline bool nami_tree_search_helper(nami_tree_node_t* node, nami_value_t value) {
    if (node == NULL) return false;
    
    double node_val = nami_to_number(node->value);
    double search_val = nami_to_number(value);
    
    if (search_val == node_val) {
        return true;
    } else if (search_val < node_val) {
        return nami_tree_search_helper(node->left, value);
    } else {
        return nami_tree_search_helper(node->right, value);
    }
}

/**
 * Search for a value in the binary search tree
 * Requirements: 11.3
 * 
 * @param tree Tree to search
 * @param value Value to search for
 * @return true if value is found, false otherwise
 */
static inline bool nami_tree_search(nami_tree_t* tree, nami_value_t value) {
    if (tree == NULL) return false;
    return nami_tree_search_helper(tree->root, value);
}

/**
 * Inorder traversal helper (left-root-right)
 * Requirements: 11.2
 * 
 * @param node Current node
 * @param result Array to append values to
 */
static inline void nami_tree_inorder_helper(nami_tree_node_t* node, nami_array_t* result) {
    if (node == NULL) return;
    
    nami_tree_inorder_helper(node->left, result);
    nami_array_push(result, node->value);
    nami_tree_inorder_helper(node->right, result);
}

/**
 * Inorder traversal (left-root-right)
 * Requirements: 11.2
 * 
 * @param tree Tree to traverse
 * @return Array of values in inorder
 */
static inline nami_array_t* nami_tree_inorder(nami_tree_t* tree) {
    nami_array_t* result = nami_array_create();
    if (tree != NULL) {
        nami_tree_inorder_helper(tree->root, result);
    }
    return result;
}

/**
 * Preorder traversal helper (root-left-right)
 * Requirements: 11.2
 * 
 * @param node Current node
 * @param result Array to append values to
 */
static inline void nami_tree_preorder_helper(nami_tree_node_t* node, nami_array_t* result) {
    if (node == NULL) return;
    
    nami_array_push(result, node->value);
    nami_tree_preorder_helper(node->left, result);
    nami_tree_preorder_helper(node->right, result);
}

/**
 * Preorder traversal (root-left-right)
 * Requirements: 11.2
 * 
 * @param tree Tree to traverse
 * @return Array of values in preorder
 */
static inline nami_array_t* nami_tree_preorder(nami_tree_t* tree) {
    nami_array_t* result = nami_array_create();
    if (tree != NULL) {
        nami_tree_preorder_helper(tree->root, result);
    }
    return result;
}

/**
 * Postorder traversal helper (left-right-root)
 * Requirements: 11.2
 * 
 * @param node Current node
 * @param result Array to append values to
 */
static inline void nami_tree_postorder_helper(nami_tree_node_t* node, nami_array_t* result) {
    if (node == NULL) return;
    
    nami_tree_postorder_helper(node->left, result);
    nami_tree_postorder_helper(node->right, result);
    nami_array_push(result, node->value);
}

/**
 * Postorder traversal (left-right-root)
 * Requirements: 11.2
 * 
 * @param tree Tree to traverse
 * @return Array of values in postorder
 */
static inline nami_array_t* nami_tree_postorder(nami_tree_t* tree) {
    nami_array_t* result = nami_array_create();
    if (tree != NULL) {
        nami_tree_postorder_helper(tree->root, result);
    }
    return result;
}

/**
 * Calculate the height of the tree
 * Requirements: 11.5
 * 
 * @param tree Tree to calculate height of
 * @return Height of the tree (0 for empty tree)
 */
static inline int64_t nami_tree_height(nami_tree_t* tree) {
    if (tree == NULL || tree->root == NULL) return 0;
    return tree->root->height;
}

/**
 * Get the size (number of nodes) of the tree
 * Requirements: 11.5
 * 
 * @param tree Tree to get size of
 * @return Number of nodes in the tree
 */
static inline int64_t nami_tree_size(nami_tree_t* tree) {
    if (tree == NULL) return 0;
    return tree->size;
}

/**
 * Destroy a tree node and all its descendants (recursive)
 * 
 * @param node Node to destroy
 */
static inline void nami_tree_node_destroy(nami_tree_node_t* node) {
    if (node == NULL) return;
    
    nami_tree_node_destroy(node->left);
    nami_tree_node_destroy(node->right);
    free(node);
}

/**
 * Destroy a tree and free its memory
 * 
 * @param tree Tree to destroy
 */
static inline void nami_tree_destroy(nami_tree_t* tree) {
    if (tree != NULL) {
        nami_tree_node_destroy(tree->root);
        free(tree);
    }
}

// ── Async/Await Runtime System ──────────────────────────

/**
 * Async state enumeration
 * Requirements: 6.3
 * 
 * Represents the state of an asynchronous operation:
 * - PENDING: Operation is in progress
 * - RESOLVED: Operation completed successfully
 * - REJECTED: Operation failed with an error
 */
typedef enum {
    NAMI_ASYNC_PENDING,
    NAMI_ASYNC_RESOLVED,
    NAMI_ASYNC_REJECTED
} nami_async_state_t;

/**
 * Promise data structure
 * Requirements: 6.3
 * 
 * Represents a promise-like object for async operations.
 * Uses a state machine approach with continuations for async/await.
 */
typedef struct nami_promise {
    nami_async_state_t state;      // Current state of the promise
    nami_value_t result;            // Result value (when resolved) or error (when rejected)
    void (*continuation)(void*);    // Continuation callback to execute when promise resolves
    void* context;                  // Context data passed to continuation
} nami_promise_t;

/**
 * Create a new promise in pending state
 * Requirements: 6.3, 6.4
 * 
 * @return Pointer to newly created promise
 */
static inline nami_promise_t* nami_async_create(void) {
    nami_promise_t* promise = (nami_promise_t*)malloc(sizeof(nami_promise_t));
    promise->state = NAMI_ASYNC_PENDING;
    promise->result = NAMI_NULL;
    promise->continuation = NULL;
    promise->context = NULL;
    return promise;
}

/**
 * Resolve a promise with a value
 * Requirements: 6.3, 6.4
 * 
 * Transitions the promise from PENDING to RESOLVED state and stores the result.
 * If a continuation callback is registered, it will be invoked.
 * 
 * @param promise Promise to resolve
 * @param value Result value to store in the promise
 */
static inline void nami_async_resolve(nami_promise_t* promise, nami_value_t value) {
    if (promise == NULL) return;
    
    // Only resolve if currently pending
    if (promise->state == NAMI_ASYNC_PENDING) {
        promise->state = NAMI_ASYNC_RESOLVED;
        promise->result = value;
        
        // Execute continuation if registered
        if (promise->continuation != NULL) {
            promise->continuation(promise->context);
        }
    }
}

/**
 * Reject a promise with an error
 * Requirements: 6.3, 6.4
 * 
 * Transitions the promise from PENDING to REJECTED state and stores the error.
 * If a continuation callback is registered, it will be invoked.
 * 
 * @param promise Promise to reject
 * @param error Error value to store in the promise
 */
static inline void nami_async_reject(nami_promise_t* promise, nami_value_t error) {
    if (promise == NULL) return;
    
    // Only reject if currently pending
    if (promise->state == NAMI_ASYNC_PENDING) {
        promise->state = NAMI_ASYNC_REJECTED;
        promise->result = error;
        
        // Execute continuation if registered
        if (promise->continuation != NULL) {
            promise->continuation(promise->context);
        }
    }
}

/**
 * Await a promise (suspend execution until promise resolves)
 * Requirements: 6.3, 6.4
 * 
 * This is a simplified synchronous implementation that blocks until the promise
 * is resolved or rejected. In a real async implementation, this would use
 * cooperative multitasking or event loops.
 * 
 * For the state machine approach used in code generation, this function serves
 * as a placeholder. The actual await behavior is implemented through generated
 * state machine code that suspends and resumes execution.
 * 
 * @param promise Promise to await
 * @return Result value if resolved, error value if rejected
 */
static inline nami_value_t nami_async_await(nami_promise_t* promise) {
    if (promise == NULL) return NAMI_NULL;
    
    // In a real implementation, this would yield control and resume later.
    // For now, we implement a simple busy-wait (not recommended for production).
    // The code generator should use state machines instead of calling this directly.
    
    // Simple polling loop (for demonstration purposes)
    // In production, this would be replaced by proper event loop integration
    while (promise->state == NAMI_ASYNC_PENDING) {
        // Yield CPU (in a real implementation, this would be an event loop tick)
        // For now, we just continue checking
    }
    
    return promise->result;
}

/**
 * Register a continuation callback for a promise
 * Requirements: 6.3, 6.4
 * 
 * The continuation will be called when the promise is resolved or rejected.
 * This is used by the code generator to implement async/await state machines.
 * 
 * @param promise Promise to attach continuation to
 * @param continuation Callback function to execute when promise settles
 * @param context Context data to pass to the continuation
 */
static inline void nami_async_then(nami_promise_t* promise, void (*continuation)(void*), void* context) {
    if (promise == NULL) return;
    
    promise->continuation = continuation;
    promise->context = context;
    
    // If promise is already settled, execute continuation immediately
    if (promise->state != NAMI_ASYNC_PENDING && continuation != NULL) {
        continuation(context);
    }
}

/**
 * Destroy a promise and free its memory
 * 
 * @param promise Promise to destroy
 */
static inline void nami_async_destroy(nami_promise_t* promise) {
    if (promise != NULL) {
        free(promise);
    }
}

// ── Pointer Operations Runtime Support ──────────────────

/**
 * Pointer metadata structure for bounds tracking
 * Requirements: 13.5
 * 
 * Tracks allocation bounds for pointer safety checks in debug mode.
 * Each allocated memory region has associated metadata that records
 * the base address and size for bounds validation.
 */
typedef struct nami_pointer_metadata {
    void* base_address;              // Base address of the allocated memory
    size_t size;                     // Size of the allocated memory in bytes
    bool is_nullable;                // Whether the pointer can be null
    struct nami_pointer_metadata* next;  // Next metadata in the linked list
} nami_pointer_metadata_t;

/**
 * Global pointer metadata registry
 * 
 * Maintains a linked list of all tracked pointer allocations.
 * Only used in debug mode for bounds checking.
 */
typedef struct {
    nami_pointer_metadata_t* head;
    bool enabled;                    // Whether bounds checking is enabled
} nami_pointer_registry_t;

// Global pointer registry (initialized on first use)
static nami_pointer_registry_t __nami_pointer_registry = {
    .head = NULL,
    .enabled = true  // Enabled by default in debug mode
};

/**
 * Enable pointer bounds checking
 * Requirements: 13.5
 * 
 * Enables runtime bounds checking for pointer operations.
 * This should be enabled in debug builds and disabled in release builds
 * for performance.
 */
static inline void nami_pointer_enable_bounds_checking(void) {
    __nami_pointer_registry.enabled = true;
}

/**
 * Disable pointer bounds checking
 * Requirements: 13.5
 * 
 * Disables runtime bounds checking for pointer operations.
 * Use this in performance-critical sections or release builds.
 */
static inline void nami_pointer_disable_bounds_checking(void) {
    __nami_pointer_registry.enabled = false;
}

/**
 * Check if pointer bounds checking is enabled
 * Requirements: 13.5
 * 
 * @return true if bounds checking is enabled, false otherwise
 */
static inline bool nami_pointer_is_bounds_checking_enabled(void) {
    return __nami_pointer_registry.enabled;
}

/**
 * Register a pointer allocation for bounds tracking
 * Requirements: 13.5
 * 
 * Records metadata about an allocated memory region for later bounds checking.
 * This function should be called after every memory allocation that needs
 * bounds checking.
 * 
 * @param ptr Base address of the allocated memory
 * @param size Size of the allocated memory in bytes
 * @param is_nullable Whether the pointer can be null
 */
static inline void nami_pointer_register(void* ptr, size_t size, bool is_nullable) {
    if (!__nami_pointer_registry.enabled || ptr == NULL) return;
    
    nami_pointer_metadata_t* metadata = (nami_pointer_metadata_t*)malloc(sizeof(nami_pointer_metadata_t));
    metadata->base_address = ptr;
    metadata->size = size;
    metadata->is_nullable = is_nullable;
    metadata->next = __nami_pointer_registry.head;
    __nami_pointer_registry.head = metadata;
}

/**
 * Unregister a pointer allocation
 * Requirements: 13.5
 * 
 * Removes metadata for a pointer that is being freed.
 * This should be called before freeing memory to keep the registry clean.
 * 
 * @param ptr Pointer to unregister
 */
static inline void nami_pointer_unregister(void* ptr) {
    if (!__nami_pointer_registry.enabled || ptr == NULL) return;
    
    nami_pointer_metadata_t** current = &__nami_pointer_registry.head;
    while (*current != NULL) {
        if ((*current)->base_address == ptr) {
            nami_pointer_metadata_t* to_free = *current;
            *current = (*current)->next;
            free(to_free);
            return;
        }
        current = &(*current)->next;
    }
}

/**
 * Find metadata for a pointer
 * Requirements: 13.5
 * 
 * Searches the registry for metadata associated with a pointer.
 * The pointer can be anywhere within the allocated region.
 * 
 * @param ptr Pointer to find metadata for
 * @return Metadata if found, NULL otherwise
 */
static inline nami_pointer_metadata_t* nami_pointer_find_metadata(void* ptr) {
    if (ptr == NULL) return NULL;
    
    nami_pointer_metadata_t* current = __nami_pointer_registry.head;
    while (current != NULL) {
        // Check if ptr is within the allocated region
        uintptr_t base = (uintptr_t)current->base_address;
        uintptr_t ptr_addr = (uintptr_t)ptr;
        uintptr_t end = base + current->size;
        
        if (ptr_addr >= base && ptr_addr < end) {
            return current;
        }
        
        current = current->next;
    }
    
    return NULL;
}

/**
 * Check if a pointer access is within bounds
 * Requirements: 13.5
 * 
 * Validates that a pointer dereference or access is within the allocated
 * memory region. Reports an error and terminates if out of bounds.
 * 
 * This function should be called before dereferencing pointers in debug mode.
 * 
 * @param ptr Pointer to check
 * @param access_size Size of the access in bytes (e.g., sizeof(int))
 * @param file Source file where the check is performed (for error reporting)
 * @param line Line number where the check is performed (for error reporting)
 */
static inline void nami_pointer_check_bounds(void* ptr, size_t access_size, const char* file, int line) {
    if (!__nami_pointer_registry.enabled) return;
    
    // Null pointer check
    if (ptr == NULL) {
        fprintf(stderr, "Error: Null pointer dereference\n");
        if (file != NULL) {
            fprintf(stderr, "  Location: %s:%d\n", file, line);
        }
        exit(1);
    }
    
    // Find metadata for this pointer
    nami_pointer_metadata_t* metadata = nami_pointer_find_metadata(ptr);
    
    if (metadata == NULL) {
        fprintf(stderr, "Error: Pointer bounds check failed - pointer not tracked\n");
        fprintf(stderr, "  Pointer: %p\n", ptr);
        if (file != NULL) {
            fprintf(stderr, "  Location: %s:%d\n", file, line);
        }
        fprintf(stderr, "  Note: This pointer may not have been allocated through tracked allocation\n");
        exit(1);
    }
    
    // Check if access is within bounds
    uintptr_t base = (uintptr_t)metadata->base_address;
    uintptr_t ptr_addr = (uintptr_t)ptr;
    uintptr_t end = base + metadata->size;
    uintptr_t access_end = ptr_addr + access_size;
    
    if (access_end > end) {
        fprintf(stderr, "Error: Out-of-bounds pointer access\n");
        fprintf(stderr, "  Pointer: %p\n", ptr);
        fprintf(stderr, "  Base address: %p\n", metadata->base_address);
        fprintf(stderr, "  Allocation size: %zu bytes\n", metadata->size);
        fprintf(stderr, "  Access size: %zu bytes\n", access_size);
        fprintf(stderr, "  Out of bounds by: %zu bytes\n", (size_t)(access_end - end));
        if (file != NULL) {
            fprintf(stderr, "  Location: %s:%d\n", file, line);
        }
        exit(1);
    }
}

/**
 * Check if a pointer is null when it should not be
 * Requirements: 13.6
 * 
 * Validates that a non-nullable pointer is not null.
 * Reports an error and terminates if a non-nullable pointer is null.
 * 
 * This function should be called when dereferencing pointers that are
 * declared as non-nullable in the type system.
 * 
 * @param ptr Pointer to check
 * @param is_nullable Whether the pointer is allowed to be null
 * @param file Source file where the check is performed (for error reporting)
 * @param line Line number where the check is performed (for error reporting)
 */
static inline void nami_pointer_check_null(void* ptr, bool is_nullable, const char* file, int line) {
    if (!__nami_pointer_registry.enabled) return;
    
    // If pointer is nullable, null is allowed
    if (is_nullable) return;
    
    // Non-nullable pointer must not be null
    if (ptr == NULL) {
        fprintf(stderr, "Error: Null pointer dereference on non-nullable pointer\n");
        if (file != NULL) {
            fprintf(stderr, "  Location: %s:%d\n", file, line);
        }
        fprintf(stderr, "  Note: This pointer was declared as non-nullable\n");
        exit(1);
    }
}

/**
 * Allocate memory with bounds tracking
 * Requirements: 13.5
 * 
 * Allocates memory and registers it for bounds checking.
 * This is a wrapper around malloc that adds bounds tracking.
 * 
 * @param size Size of memory to allocate in bytes
 * @param is_nullable Whether the resulting pointer can be null
 * @return Pointer to allocated memory, or NULL on failure
 */
static inline void* nami_pointer_alloc(size_t size, bool is_nullable) {
    void* ptr = malloc(size);
    if (ptr != NULL && __nami_pointer_registry.enabled) {
        nami_pointer_register(ptr, size, is_nullable);
    }
    return ptr;
}

/**
 * Free memory and unregister from bounds tracking
 * Requirements: 13.5
 * 
 * Frees memory and removes it from the bounds checking registry.
 * This is a wrapper around free that removes bounds tracking.
 * 
 * @param ptr Pointer to free
 */
static inline void nami_pointer_free(void* ptr) {
    if (ptr != NULL) {
        if (__nami_pointer_registry.enabled) {
            nami_pointer_unregister(ptr);
        }
        free(ptr);
    }
}

/**
 * Clean up the pointer registry
 * 
 * Frees all metadata in the pointer registry.
 * This should be called at program exit to prevent memory leaks.
 */
static inline void nami_pointer_cleanup_registry(void) {
    nami_pointer_metadata_t* current = __nami_pointer_registry.head;
    while (current != NULL) {
        nami_pointer_metadata_t* next = current->next;
        free(current);
        current = next;
    }
    __nami_pointer_registry.head = NULL;
}

// Convenience macros for pointer checking with automatic file/line information
#define NAMI_CHECK_BOUNDS(ptr, size) nami_pointer_check_bounds(ptr, size, __FILE__, __LINE__)
#define NAMI_CHECK_NULL(ptr, is_nullable) nami_pointer_check_null(ptr, is_nullable, __FILE__, __LINE__)

#endif // NAMI_RUNTIME_H
