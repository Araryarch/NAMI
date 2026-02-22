/**
 * NAMI HTTP Module - Stub Implementation
 *
 * This is a STUB implementation that provides the function signatures
 * but does not actually implement HTTP server functionality.
 *
 * To make Robin Framework work, this needs to be replaced with a real
 * HTTP server implementation using:
 * - POSIX sockets (Linux/Mac) or Winsock (Windows)
 * - HTTP request parsing
 * - HTTP response formatting
 * - Route matching and dispatching
 *
 * For now, this stub allows code to compile but will print warnings
 * when HTTP functions are called.
 */

#ifndef NAMI_HTTP_STUB_H
#define NAMI_HTTP_STUB_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ── HTTP Types ──────────────────────────────────────────

/**
 * HTTP server structure
 */
typedef struct nami_http_server {
  int port;
  int is_listening;
  // TODO: Add route table, socket fd, etc.
} nami_http_server_t;

/**
 * HTTP request structure
 */
typedef struct nami_http_req {
  nami_value_t body;
  nami_value_t params;
  nami_value_t query;
  nami_value_t headers;
  nami_value_t method;
  nami_value_t path;
} nami_http_req_t;

/**
 * HTTP response structure
 */
typedef struct nami_http_res {
  int status_code;
  nami_object_t *headers;
  nami_value_t body;
  int sent;
} nami_http_res_t;

/**
 * HTTP handler function type
 */
typedef void (*nami_http_handler_t)(nami_http_req_t *, nami_http_res_t *);

// ── Global HTTP State ─────────────────────────────────────
static nami_http_server_t *__nami_global_server = NULL;
static nami_http_req_t *__current_req = NULL;
static nami_http_res_t *__current_res = NULL;

// ── HTTP Response Methods ───────────────────────────────

static nami_value_t __wrap_res_send(nami_value_t data) {
  if (__current_res && !__current_res->sent) {
    fprintf(stderr, "[STUB] Response send: ");
    nami_print_value(data);
    fprintf(stderr, "\n");
    __current_res->sent = 1;
  }
  return NAMI_NULL;
}

static nami_value_t __wrap_res_json(nami_value_t data) {
  if (__current_res && !__current_res->sent) {
    fprintf(stderr, "[STUB] Response JSON: ");
    nami_print_value(data);
    fprintf(stderr, "\n");
    __current_res->sent = 1;
  }
  return NAMI_NULL;
}

static nami_value_t __cached_res_obj = NAMI_NULL;
static nami_value_t nami_value_object_from_current_res(void);

static nami_value_t __wrap_res_status(nami_value_t code) {
  if (__current_res && code.type == NAMI_TYPE_INT) {
    __current_res->status_code = (int)code.value.as_int;
    fprintf(stderr, "[STUB] Response status: %d\n", __current_res->status_code);
  }
  // Need to return `res` object for chaining.
  return nami_value_object_from_current_res(); // implementation below
}

// Helper to provide the object
static nami_value_t nami_value_object_from_current_res(void) {
  return __cached_res_obj;
}

// ── HTTP Server Methods ─────────────────────────────────

static nami_value_t __cached_server_obj = NAMI_NULL;

static nami_value_t __wrap_server_get(nami_value_t path, nami_value_t handler) {
  if (path.type == NAMI_TYPE_STRING) {
    fprintf(stderr, "[STUB] Registering GET %s\n", path.value.as_string->data);
  }
  return __cached_server_obj;
}

static nami_value_t __wrap_server_post(nami_value_t path,
                                       nami_value_t handler) {
  if (path.type == NAMI_TYPE_STRING) {
    fprintf(stderr, "[STUB] Registering POST %s\n", path.value.as_string->data);
  }
  return __cached_server_obj;
}

static nami_value_t __wrap_server_put(nami_value_t path, nami_value_t handler) {
  if (path.type == NAMI_TYPE_STRING) {
    fprintf(stderr, "[STUB] Registering PUT %s\n", path.value.as_string->data);
  }
  return __cached_server_obj;
}

static nami_value_t __wrap_server_delete(nami_value_t path,
                                         nami_value_t handler) {
  if (path.type == NAMI_TYPE_STRING) {
    fprintf(stderr, "[STUB] Registering DELETE %s\n",
            path.value.as_string->data);
  }
  return __cached_server_obj;
}

static nami_value_t __wrap_server_listen(nami_value_t port,
                                         nami_value_t callback) {
  if (port.type == NAMI_TYPE_INT) {
    fprintf(stderr, "[STUB] HTTP server would listen on port %lld\n",
            (long long)port.value.as_int);
  }

  if (callback.type == NAMI_TYPE_FUNCTION &&
      callback.value.as_function != NULL) {
    typedef nami_value_t (*f0_t)(void);
    f0_t f = (f0_t)callback.value.as_function;
    f();
  }
  return __cached_server_obj;
}

static nami_value_t __wrap_server_use(nami_value_t middleware) {
  fprintf(stderr, "[STUB] Registering middleware\n");
  return __cached_server_obj;
}

// ── Main Create Wrapper ─────────────────────────────────

static inline nami_value_t nami_http_create(void) {
  fprintf(stderr,
          "[STUB] nami_http_create() called - HTTP module not implemented\n");

  if (__nami_global_server == NULL) {
    __nami_global_server =
        (nami_http_server_t *)malloc(sizeof(nami_http_server_t));
    __nami_global_server->port = 0;
    __nami_global_server->is_listening = 0;
  }

  nami_value_t obj = nami_object_create();
  nami_object_set(obj.value.as_object, "get",
                  nami_value_function(__wrap_server_get));
  nami_object_set(obj.value.as_object, "post",
                  nami_value_function(__wrap_server_post));
  nami_object_set(obj.value.as_object, "put",
                  nami_value_function(__wrap_server_put));
  nami_object_set(obj.value.as_object, "delete",
                  nami_value_function(__wrap_server_delete));
  nami_object_set(obj.value.as_object, "listen",
                  nami_value_function(__wrap_server_listen));
  nami_object_set(obj.value.as_object, "use",
                  nami_value_function(__wrap_server_use));

  __cached_server_obj = obj;
  return obj;
}

// To allow mock route triggering for tests
static inline void nami_http_stub_trigger_route(nami_value_t handler,
                                                const char *path,
                                                const char *method) {
  // Generate req, res
  __current_req = (nami_http_req_t *)malloc(sizeof(nami_http_req_t));
  __current_res = (nami_http_res_t *)malloc(sizeof(nami_http_res_t));
  __current_res->sent = 0;
  __current_res->status_code = 200;

  nami_value_t req_obj = nami_object_create();
  nami_object_set(req_obj.value.as_object, "path", nami_value_string(path));
  nami_object_set(req_obj.value.as_object, "method", nami_value_string(method));
  nami_object_set(req_obj.value.as_object, "params", nami_object_create());
  nami_object_set(req_obj.value.as_object, "query", nami_object_create());
  nami_object_set(req_obj.value.as_object, "body", nami_object_create());

  nami_value_t res_obj = nami_object_create();
  nami_object_set(res_obj.value.as_object, "send",
                  nami_value_function(__wrap_res_send));
  nami_object_set(res_obj.value.as_object, "json",
                  nami_value_function(__wrap_res_json));
  nami_object_set(res_obj.value.as_object, "status",
                  nami_value_function(__wrap_res_status));
  __cached_res_obj = res_obj;

  if (handler.type == NAMI_TYPE_FUNCTION && handler.value.as_function != NULL) {
    typedef nami_value_t (*f2_t)(nami_value_t, nami_value_t);
    f2_t f = (f2_t)handler.value.as_function;
    f(req_obj, res_obj);
  }

  free(__current_req);
  free(__current_res);
  __current_req = NULL;
  __current_res = NULL;
}

#endif // NAMI_HTTP_STUB_H
