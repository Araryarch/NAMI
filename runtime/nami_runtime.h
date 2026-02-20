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

static inline nami_value_t nami_value_string(const char* s) {
    nami_value_t val;
    val.type = NAMI_TYPE_STRING;
    nami_string_t* str = (nami_string_t*)malloc(sizeof(nami_string_t) + strlen(s) + 1);
    // String implementation details below
    val.value.as_string = str;
    return val;
}

// ── String Type ─────────────────────────────────────────

struct nami_string {
    size_t length;
    size_t capacity;
    char data[];
};

static inline nami_string_t* nami_string_create(const char* s) {
    size_t len = strlen(s);
    nami_string_t* str = (nami_string_t*)malloc(sizeof(nami_string_t) + len + 1);
    str->length = len;
    str->capacity = len + 1;
    memcpy(str->data, s, len + 1);
    return str;
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

// ── Array Type ──────────────────────────────────────────

struct nami_array {
    nami_value_t* items;
    int64_t length;
    int64_t capacity;
};

static inline nami_array_t* nami_array_create(void) {
    nami_array_t* arr = (nami_array_t*)malloc(sizeof(nami_array_t));
    arr->items = (nami_value_t*)malloc(sizeof(nami_value_t) * 8);
    arr->length = 0;
    arr->capacity = 8;
    return arr;
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

static inline void nami_gc_mark(nami_gc_object_t* obj) {
    if (obj == NULL || obj->marked) return;
    obj->marked = true;
}

static inline void nami_gc_collect(nami_gc_t* gc) {
    if (!gc->enabled) return;
    // Sweep phase
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

static inline void nami_gc_retain(nami_gc_object_t* obj) {
    if (obj) obj->ref_count++;
}

static inline void nami_gc_release(nami_gc_object_t* obj) {
    if (obj && obj->ref_count > 0) obj->ref_count--;
}

// ── Infinite Loop Detection ──────────────────────────────

typedef struct {
    uint64_t iteration_count;
    uint64_t max_iterations;
    bool enabled;
} nami_loop_guard_t;

#define NAMI_LOOP_CHECK(guard) \
    do { \
        if ((guard)->enabled) { \
            (guard)->iteration_count++; \
            if ((guard)->iteration_count > (guard)->max_iterations) { \
                fprintf(stderr, "Error: Infinite loop detected (exceeded %llu iterations)\n", \
                    (unsigned long long)(guard)->max_iterations); \
                exit(1); \
            } \
        } \
    } while(0)

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

static inline void nami_print_value(nami_value_t v) {
    switch (v.type) {
        case NAMI_TYPE_INT: printf("%lld", (long long)v.value.as_int); break;
        case NAMI_TYPE_FLOAT: printf("%g", v.value.as_float); break;
        case NAMI_TYPE_STRING: printf("%s", v.value.as_string->data); break;
        case NAMI_TYPE_BOOL: printf("%s", v.value.as_bool ? "true" : "false"); break;
        case NAMI_TYPE_NULL: printf("null"); break;
        case NAMI_TYPE_ARRAY: printf("[Array]"); break;
        case NAMI_TYPE_OBJECT: printf("[Object]"); break;
        case NAMI_TYPE_FUNCTION: printf("[Function]"); break;
    }
}

static inline void nami_print(nami_value_t v) {
    nami_print_value(v);
}

static inline void nami_println(nami_value_t v) {
    nami_print_value(v);
    printf("\n");
}

static inline nami_value_t nami_input(void) {
    char buffer[4096];
    if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        size_t len = strlen(buffer);
        if (len > 0 && buffer[len - 1] == '\n') {
            buffer[len - 1] = '\0';
        }
        return nami_value_string(buffer);
    }
    return NAMI_NULL;
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

typedef struct nami_error_context {
    jmp_buf jmp;
    nami_value_t error;
    struct nami_error_context* prev;
} nami_error_context_t;

static nami_error_context_t* __nami_error_stack = NULL;

static inline void nami_push_error_context(nami_error_context_t* ctx) {
    ctx->prev = __nami_error_stack;
    __nami_error_stack = ctx;
}

static inline void nami_pop_error_context(void) {
    if (__nami_error_stack) {
        __nami_error_stack = __nami_error_stack->prev;
    }
}

static inline void nami_throw(nami_value_t error) {
    if (__nami_error_stack) {
        __nami_error_stack->error = error;
        longjmp(__nami_error_stack->jmp, 1);
    } else {
        fprintf(stderr, "Unhandled error: ");
        nami_print_value(error);
        fprintf(stderr, "\n");
        exit(1);
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

// ── Async Support ───────────────────────────────────────

typedef enum {
    NAMI_ASYNC_PENDING,
    NAMI_ASYNC_RESOLVED,
    NAMI_ASYNC_REJECTED
} nami_async_state_t;

typedef struct {
    nami_async_state_t state;
    nami_value_t result;
    void (*continuation)(void*);
    void* context;
} nami_promise_t;

static inline nami_promise_t* nami_async_create(void) {
    nami_promise_t* p = (nami_promise_t*)malloc(sizeof(nami_promise_t));
    p->state = NAMI_ASYNC_PENDING;
    p->result = NAMI_NULL;
    p->continuation = NULL;
    p->context = NULL;
    return p;
}

static inline void nami_async_resolve(nami_promise_t* p, nami_value_t value) {
    p->state = NAMI_ASYNC_RESOLVED;
    p->result = value;
    if (p->continuation) {
        p->continuation(p->context);
    }
}

static inline nami_value_t nami_async_await(nami_value_t v) {
    // Simplified: just return the value
    return v;
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

#endif // NAMI_RUNTIME_H
