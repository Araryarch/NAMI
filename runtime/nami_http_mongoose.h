/**
 * NAMI HTTP Module - Mongoose Implementation
 * 
 * This implementation uses Mongoose embedded web server library.
 * Mongoose is a single-file library that provides HTTP server functionality.
 * 
 * Download mongoose.h and mongoose.c from:
 * https://github.com/cesanta/mongoose/releases
 * 
 * Or use the provided download script:
 * ./download-mongoose.sh
 * 
 * To compile with mongoose:
 * gcc -o program program.c runtime/mongoose.c -Iruntime -lm -lpthread
 */

#ifndef NAMI_HTTP_MONGOOSE_H
#define NAMI_HTTP_MONGOOSE_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>

// Check if mongoose.h is available
#ifdef NAMI_USE_MONGOOSE
#include "mongoose.h"
#endif

// ── HTTP Types ──────────────────────────────────────────

// Forward declarations
typedef struct nami_http_req nami_http_req_t;
typedef struct nami_http_res nami_http_res_t;
typedef struct nami_http_server nami_http_server_t;
typedef struct nami_http_route nami_http_route_t;

/**
 * HTTP handler function type
 */
typedef void (*nami_http_handler_t)(nami_http_req_t*, nami_http_res_t*);

/**
 * Route handler entry
 */
struct nami_http_route {
    char* method;
    char* path;
    nami_http_handler_t handler;
    nami_http_route_t* next;
};

/**
 * HTTP server structure
 */
struct nami_http_server {
    int port;
    int is_listening;
    nami_http_route_t* routes;
    pthread_t thread;
#ifdef NAMI_USE_MONGOOSE
    struct mg_mgr mgr;
#endif
};

/**
 * HTTP request structure
 */
struct nami_http_req {
    nami_value_t body;
    nami_value_t params;
    nami_value_t query;
    nami_value_t headers;
    nami_value_t method;
    nami_value_t path;
#ifdef NAMI_USE_MONGOOSE
    struct mg_http_message* mg_req;
#endif
};

/**
 * HTTP response structure
 */
struct nami_http_res {
    int status_code;
    nami_object_t* headers;
    char* body;
    size_t body_len;
    int sent;
#ifdef NAMI_USE_MONGOOSE
    struct mg_connection* mg_conn;
#endif
};

// ── Route Management ────────────────────────────────────

/**
 * Add a route to the server
 */
static inline void nami_http_add_route(nami_http_server_t* server, const char* method, const char* path, nami_http_handler_t handler) {
    nami_http_route_t* route = (nami_http_route_t*)malloc(sizeof(nami_http_route_t));
    route->method = strdup(method);
    route->path = strdup(path);
    route->handler = handler;
    route->next = server->routes;
    server->routes = route;
}

/**
 * Find a matching route
 */
static inline nami_http_route_t* nami_http_find_route(nami_http_server_t* server, const char* method, const char* path) {
    nami_http_route_t* route = server->routes;
    while (route != NULL) {
        // Simple exact match for now
        // TODO: Add pattern matching for :id params
        if (strcmp(route->method, method) == 0 && strcmp(route->path, path) == 0) {
            return route;
        }
        route = route->next;
    }
    return NULL;
}

// ── Mongoose Integration ────────────────────────────────

#ifdef NAMI_USE_MONGOOSE

/**
 * Parse URL parameters from path
 * Example: /users/:id matches /users/123 -> params.id = "123"
 */
static inline nami_object_t* nami_http_parse_params(const char* pattern, const char* path) {
    nami_object_t* params = nami_object_create_empty();
    
    // Simple implementation: split by '/' and match
    char* pattern_copy = strdup(pattern);
    char* path_copy = strdup(path);
    
    char* pattern_token = strtok(pattern_copy, "/");
    char* path_token = strtok(path_copy, "/");
    
    while (pattern_token != NULL && path_token != NULL) {
        if (pattern_token[0] == ':') {
            // This is a parameter
            const char* param_name = pattern_token + 1;
            nami_object_set(params, param_name, nami_value_string(path_token));
        }
        pattern_token = strtok(NULL, "/");
        path_token = strtok(NULL, "/");
    }
    
    free(pattern_copy);
    free(path_copy);
    
    return params;
}

/**
 * Parse query string
 * Example: ?name=John&age=30 -> query.name = "John", query.age = "30"
 */
static inline nami_object_t* nami_http_parse_query(const char* query_string) {
    nami_object_t* query = nami_object_create_empty();
    
    if (query_string == NULL || strlen(query_string) == 0) {
        return query;
    }
    
    char* query_copy = strdup(query_string);
    char* token = strtok(query_copy, "&");
    
    while (token != NULL) {
        char* eq = strchr(token, '=');
        if (eq != NULL) {
            *eq = '\0';
            const char* key = token;
            const char* value = eq + 1;
            nami_object_set(query, key, nami_value_string(value));
        }
        token = strtok(NULL, "&");
    }
    
    free(query_copy);
    return query;
}

/**
 * Mongoose event handler
 */
static void nami_http_mongoose_handler(struct mg_connection* c, int ev, void* ev_data, void* fn_data) {
    if (ev != MG_EV_HTTP_MSG) return;
    
    nami_http_server_t* server = (nami_http_server_t*)fn_data;
    struct mg_http_message* hm = (struct mg_http_message*)ev_data;
    
    // Extract method and path
    char method[16] = {0};
    char path[256] = {0};
    snprintf(method, sizeof(method), "%.*s", (int)hm->method.len, hm->method.ptr);
    snprintf(path, sizeof(path), "%.*s", (int)hm->uri.len, hm->uri.ptr);
    
    printf("[HTTP] %s %s\n", method, path);
    
    // Find matching route (exact match only for now)
    nami_http_route_t* route = server->routes;
    nami_http_route_t* matched_route = NULL;
    
    while (route != NULL) {
        if (strcmp(route->method, method) == 0 && strcmp(route->path, path) == 0) {
            matched_route = route;
            break;
        }
        route = route->next;
    }
    
    if (matched_route == NULL) {
        // 404 Not Found
        mg_http_reply(c, 404, "Content-Type: application/json\r\n", "{\"error\":\"Not Found\"}");
        return;
    }
    
    // Create request object (simplified)
    nami_http_req_t req = {0};
    req.method = nami_value_string(method);
    req.path = nami_value_string(path);
    req.body = nami_object_create();
    req.params.type = NAMI_TYPE_OBJECT;
    req.params.value.as_object = nami_object_create_empty();
    req.query.type = NAMI_TYPE_OBJECT;
    req.query.value.as_object = nami_object_create_empty();
    req.headers.type = NAMI_TYPE_OBJECT;
    req.headers.value.as_object = nami_object_create_empty();
    req.mg_req = hm;
    
    // Create response object
    nami_http_res_t res = {0};
    res.status_code = 200;
    res.headers = nami_object_create_empty();
    res.body = NULL;
    res.body_len = 0;
    res.sent = 0;
    res.mg_conn = c;
    
    // Call handler
    matched_route->handler(&req, &res);
    
    // Send response if not already sent
    if (!res.sent) {
        if (res.body != NULL) {
            mg_http_reply(c, res.status_code, "Content-Type: application/json\r\n", "%s", res.body);
            free(res.body);
        } else {
            mg_http_reply(c, res.status_code, "", "");
        }
    }
}

/**
 * Server thread function
 */
static void* nami_http_server_thread(void* arg) {
    nami_http_server_t* server = (nami_http_server_t*)arg;
    // Event loop
    while (server->is_listening) {
        mg_mgr_poll(&server->mgr, 1000);
    }
    
    return NULL;
}

#endif // NAMI_USE_MONGOOSE

// ── HTTP Server Functions ───────────────────────────────

/**
 * Create a new HTTP server instance
 */
static inline nami_http_server_t* nami_http_create(void) {
    nami_http_server_t* server = (nami_http_server_t*)malloc(sizeof(nami_http_server_t));
    server->port = 0;
    server->is_listening = 0;
    server->routes = NULL;
    
#ifdef NAMI_USE_MONGOOSE
    mg_mgr_init(&server->mgr);
#else
    fprintf(stderr, "[WARNING] HTTP module compiled without Mongoose support\n");
    fprintf(stderr, "[WARNING] Download mongoose.h and mongoose.c from:\n");
    fprintf(stderr, "[WARNING] https://github.com/cesanta/mongoose/releases\n");
    fprintf(stderr, "[WARNING] Then compile with: -DNAMI_USE_MONGOOSE\n");
#endif
    
    return server;
}

/**
 * Register a GET route handler
 */
static inline void nami_http_get(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "GET", path.value.as_string->data, handler);
    }
}

/**
 * Register a POST route handler
 */
static inline void nami_http_post(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "POST", path.value.as_string->data, handler);
    }
}

/**
 * Register a PUT route handler
 */
static inline void nami_http_put(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "PUT", path.value.as_string->data, handler);
    }
}

/**
 * Register a DELETE route handler
 */
static inline void nami_http_delete(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "DELETE", path.value.as_string->data, handler);
    }
}

/**
 * Start the HTTP server on the given port
 */
static inline void nami_http_listen(nami_http_server_t* server, nami_value_t port, nami_http_handler_t callback) {
    if (port.type == NAMI_TYPE_INT) {
        server->port = (int)port.value.as_int;
        
#ifdef NAMI_USE_MONGOOSE
        char addr[64];
        snprintf(addr, sizeof(addr), "http://0.0.0.0:%d", server->port);
        
        mg_http_listen(&server->mgr, addr, nami_http_mongoose_handler, server);
        
        server->is_listening = 1;
        
        // Call callback if provided
        if (callback != NULL) {
            // Create dummy req/res for callback
            nami_http_req_t req = {0};
            nami_http_res_t res = {0};
            callback(&req, &res);
        }
        
        // Start server thread
        pthread_create(&server->thread, NULL, nami_http_server_thread, server);
        
        // Wait for thread (blocking)
        pthread_join(server->thread, NULL);
#else
        fprintf(stderr, "[ERROR] HTTP server cannot start - Mongoose not available\n");
        fprintf(stderr, "[ERROR] Compile with -DNAMI_USE_MONGOOSE and link mongoose.c\n");
#endif
    }
}

/**
 * Serve static files from a directory
 */
static inline void nami_http_static(nami_http_server_t* server, nami_value_t dir) {
    if (dir.type == NAMI_TYPE_STRING) {
        fprintf(stderr, "[TODO] Static file serving not yet implemented\n");
    }
}

// ── HTTP Response Functions ─────────────────────────────

/**
 * Send a response body
 */
static inline void nami_http_res_send(nami_http_res_t* res, nami_value_t data) {
    if (res->sent) return;
    
    if (data.type == NAMI_TYPE_STRING) {
        res->body = strdup(data.value.as_string->data);
        res->body_len = data.value.as_string->length;
    } else {
        // Convert to string
        char buffer[256];
        if (data.type == NAMI_TYPE_INT) {
            snprintf(buffer, sizeof(buffer), "%lld", (long long)data.value.as_int);
        } else if (data.type == NAMI_TYPE_FLOAT) {
            snprintf(buffer, sizeof(buffer), "%g", data.value.as_float);
        } else {
            snprintf(buffer, sizeof(buffer), "null");
        }
        res->body = strdup(buffer);
        res->body_len = strlen(buffer);
    }
    
#ifdef NAMI_USE_MONGOOSE
    if (res->mg_conn != NULL) {
        mg_http_reply(res->mg_conn, res->status_code, "", "%s", res->body);
        res->sent = 1;
    }
#endif
}

/**
 * Send a JSON response
 */
static inline void nami_http_res_json(nami_http_res_t* res, nami_value_t data) {
    if (res->sent) return;
    
    // Convert value to JSON string
    char buffer[4096];
    buffer[0] = '\0';
    
    if (data.type == NAMI_TYPE_OBJECT) {
        strcat(buffer, "{");
        nami_object_t* obj = data.value.as_object;
        for (int64_t i = 0; i < obj->count; i++) {
            if (i > 0) strcat(buffer, ",");
            strcat(buffer, "\"");
            strcat(buffer, obj->entries[i].key);
            strcat(buffer, "\":");
            
            nami_value_t val = obj->entries[i].value;
            if (val.type == NAMI_TYPE_STRING) {
                strcat(buffer, "\"");
                strcat(buffer, val.value.as_string->data);
                strcat(buffer, "\"");
            } else if (val.type == NAMI_TYPE_INT) {
                char num[32];
                snprintf(num, sizeof(num), "%lld", (long long)val.value.as_int);
                strcat(buffer, num);
            } else if (val.type == NAMI_TYPE_FLOAT) {
                char num[32];
                snprintf(num, sizeof(num), "%g", val.value.as_float);
                strcat(buffer, num);
            } else if (val.type == NAMI_TYPE_BOOL) {
                strcat(buffer, val.value.as_bool ? "true" : "false");
            } else {
                strcat(buffer, "null");
            }
        }
        strcat(buffer, "}");
    } else if (data.type == NAMI_TYPE_ARRAY) {
        strcat(buffer, "[");
        nami_array_t* arr = data.value.as_array;
        for (int64_t i = 0; i < arr->length; i++) {
            if (i > 0) strcat(buffer, ",");
            nami_value_t val = arr->items[i];
            if (val.type == NAMI_TYPE_STRING) {
                strcat(buffer, "\"");
                strcat(buffer, val.value.as_string->data);
                strcat(buffer, "\"");
            } else if (val.type == NAMI_TYPE_INT) {
                char num[32];
                snprintf(num, sizeof(num), "%lld", (long long)val.value.as_int);
                strcat(buffer, num);
            }
        }
        strcat(buffer, "]");
    }
    
    res->body = strdup(buffer);
    res->body_len = strlen(buffer);
    
#ifdef NAMI_USE_MONGOOSE
    if (res->mg_conn != NULL) {
        mg_http_reply(res->mg_conn, res->status_code, "Content-Type: application/json\r\n", "%s", res->body);
        res->sent = 1;
    }
#endif
}

/**
 * Set the HTTP status code
 */
static inline nami_http_res_t* nami_http_res_status(nami_http_res_t* res, nami_value_t code) {
    if (code.type == NAMI_TYPE_INT) {
        res->status_code = (int)code.value.as_int;
    }
    return res;
}

/**
 * Set a response header
 */
static inline nami_http_res_t* nami_http_res_header(nami_http_res_t* res, nami_value_t key, nami_value_t value) {
    if (key.type == NAMI_TYPE_STRING && value.type == NAMI_TYPE_STRING) {
        if (res->headers == NULL) {
            res->headers = nami_object_create_empty();
        }
        nami_object_set(res->headers, key.value.as_string->data, value);
    }
    return res;
}

// ── HTTP Request Property Getters ───────────────────────

static inline nami_value_t nami_http_req_body(nami_http_req_t* req) {
    return req ? req->body : nami_object_create();
}

static inline nami_value_t nami_http_req_params(nami_http_req_t* req) {
    return req ? req->params : nami_object_create();
}

static inline nami_value_t nami_http_req_query(nami_http_req_t* req) {
    return req ? req->query : nami_object_create();
}

static inline nami_value_t nami_http_req_headers(nami_http_req_t* req) {
    return req ? req->headers : nami_object_create();
}

static inline nami_value_t nami_http_req_method(nami_http_req_t* req) {
    return req ? req->method : nami_value_string("GET");
}

static inline nami_value_t nami_http_req_path(nami_http_req_t* req) {
    return req ? req->path : nami_value_string("/");
}

#endif // NAMI_HTTP_MONGOOSE_H
