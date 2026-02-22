/**
 * NAMI HTTP Module - Simple Socket Implementation
 * 
 * Simple HTTP server using POSIX sockets (no external dependencies)
 * This is a minimal implementation for basic HTTP functionality
 */

#ifndef NAMI_HTTP_SIMPLE_H
#define NAMI_HTTP_SIMPLE_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>

// ── HTTP Types ──────────────────────────────────────────

typedef struct nami_http_req nami_http_req_t;
typedef struct nami_http_res nami_http_res_t;
typedef struct nami_http_server nami_http_server_t;
typedef struct nami_http_route nami_http_route_t;
typedef void (*nami_http_handler_t)(nami_http_req_t*, nami_http_res_t*);

struct nami_http_route {
    char* method;
    char* path;
    nami_http_handler_t handler;
    nami_http_route_t* next;
};

struct nami_http_server {
    int port;
    int socket_fd;
    int is_listening;
    nami_http_route_t* routes;
    pthread_t thread;
};

struct nami_http_req {
    nami_value_t body;
    nami_value_t params;
    nami_value_t query;
    nami_value_t headers;
    nami_value_t method;
    nami_value_t path;
    char* raw_request;
};

struct nami_http_res {
    int status_code;
    nami_object_t* headers;
    char* body;
    size_t body_len;
    int sent;
    int client_fd;
};

// ── Route Management ────────────────────────────────────

static inline void nami_http_add_route(nami_http_server_t* server, const char* method, const char* path, nami_http_handler_t handler) {
    nami_http_route_t* route = (nami_http_route_t*)malloc(sizeof(nami_http_route_t));
    route->method = strdup(method);
    route->path = strdup(path);
    route->handler = handler;
    route->next = server->routes;
    server->routes = route;
    
    printf("[ROUTE] Registered %s %s\n", method, path);
}

static inline nami_http_route_t* nami_http_find_route(nami_http_server_t* server, const char* method, const char* path) {
    nami_http_route_t* route = server->routes;
    while (route != NULL) {
        if (strcmp(route->method, method) == 0 && strcmp(route->path, path) == 0) {
            return route;
        }
        route = route->next;
    }
    return NULL;
}

// ── HTTP Parsing ────────────────────────────────────────

static inline void nami_http_parse_request_line(const char* request, char* method, char* path) {
    // Parse: GET /path HTTP/1.1
    sscanf(request, "%s %s", method, path);
}

static inline void nami_http_send_response(int client_fd, int status_code, const char* content_type, const char* body) {
    char response[8192];
    const char* status_text = "OK";
    
    if (status_code == 404) status_text = "Not Found";
    else if (status_code == 500) status_text = "Internal Server Error";
    else if (status_code == 201) status_text = "Created";
    
    int body_len = body ? strlen(body) : 0;
    
    snprintf(response, sizeof(response),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n"
        "\r\n"
        "%s",
        status_code, status_text,
        content_type,
        body_len,
        body ? body : ""
    );
    
    write(client_fd, response, strlen(response));
}

// ── Request Handler ─────────────────────────────────────

static inline void nami_http_handle_request(nami_http_server_t* server, int client_fd, const char* request) {
    char method[16] = {0};
    char path[256] = {0};
    
    nami_http_parse_request_line(request, method, path);
    
    printf("[HTTP] %s %s\n", method, path);
    
    // Find route
    nami_http_route_t* route = nami_http_find_route(server, method, path);
    
    if (route == NULL) {
        nami_http_send_response(client_fd, 404, "application/json", "{\"error\":\"Not Found\"}");
        return;
    }
    
    // Create request object
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
    req.raw_request = (char*)request;
    
    // Create response object
    nami_http_res_t res = {0};
    res.status_code = 200;
    res.headers = nami_object_create_empty();
    res.body = NULL;
    res.sent = 0;
    res.client_fd = client_fd;
    
    // Call handler
    route->handler(&req, &res);
    
    // Send response if not already sent
    if (!res.sent) {
        if (res.body != NULL) {
            nami_http_send_response(client_fd, res.status_code, "application/json", res.body);
            free(res.body);
        } else {
            nami_http_send_response(client_fd, res.status_code, "text/plain", "");
        }
    }
}

// ── Server Thread ───────────────────────────────────────

static void* nami_http_server_thread(void* arg) {
    nami_http_server_t* server = (nami_http_server_t*)arg;
    
    while (server->is_listening) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        
        int client_fd = accept(server->socket_fd, (struct sockaddr*)&client_addr, &client_len);
        if (client_fd < 0) {
            if (server->is_listening) {
                perror("accept failed");
            }
            continue;
        }
        
        // Read request
        char buffer[8192] = {0};
        ssize_t bytes_read = read(client_fd, buffer, sizeof(buffer) - 1);
        
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';
            nami_http_handle_request(server, client_fd, buffer);
        }
        
        close(client_fd);
    }
    
    return NULL;
}

// ── HTTP Server Functions ───────────────────────────────

static inline nami_http_server_t* nami_http_create(void) {
    nami_http_server_t* server = (nami_http_server_t*)malloc(sizeof(nami_http_server_t));
    server->port = 0;
    server->socket_fd = -1;
    server->is_listening = 0;
    server->routes = NULL;
    return server;
}

static inline void nami_http_get(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "GET", path.value.as_string->data, handler);
    }
}

static inline void nami_http_post(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "POST", path.value.as_string->data, handler);
    }
}

static inline void nami_http_put(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "PUT", path.value.as_string->data, handler);
    }
}

static inline void nami_http_delete(nami_http_server_t* server, nami_value_t path, nami_http_handler_t handler) {
    if (path.type == NAMI_TYPE_STRING) {
        nami_http_add_route(server, "DELETE", path.value.as_string->data, handler);
    }
}

static inline void nami_http_listen(nami_http_server_t* server, nami_value_t port, nami_http_handler_t callback) {
    if (port.type != NAMI_TYPE_INT) return;
    
    server->port = (int)port.value.as_int;
    
    // Create socket
    server->socket_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server->socket_fd < 0) {
        perror("socket creation failed");
        return;
    }
    
    // Set socket options
    int opt = 1;
    setsockopt(server->socket_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    // Bind
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(server->port);
    
    if (bind(server->socket_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind failed");
        close(server->socket_fd);
        return;
    }
    
    // Listen
    if (listen(server->socket_fd, 10) < 0) {
        perror("listen failed");
        close(server->socket_fd);
        return;
    }
    
    server->is_listening = 1;
    
    // Call callback
    if (callback != NULL) {
        nami_http_req_t req = {0};
        nami_http_res_t res = {0};
        callback(&req, &res);
    }
    
    // Start server thread
    pthread_create(&server->thread, NULL, nami_http_server_thread, server);
    
    // Wait for thread (blocking)
    pthread_join(server->thread, NULL);
}

static inline void nami_http_static(nami_http_server_t* server, nami_value_t dir) {
    (void)server;
    (void)dir;
    fprintf(stderr, "[TODO] Static file serving not implemented\n");
}

// ── HTTP Response Functions ─────────────────────────────

static inline void nami_http_res_send(nami_http_res_t* res, nami_value_t data) {
    if (res->sent) return;
    
    if (data.type == NAMI_TYPE_STRING) {
        res->body = strdup(data.value.as_string->data);
    } else {
        res->body = strdup("");
    }
    
    nami_http_send_response(res->client_fd, res->status_code, "text/plain", res->body);
    res->sent = 1;
}

static inline void nami_http_res_json(nami_http_res_t* res, nami_value_t data) {
    if (res->sent) return;
    
    // Simple JSON conversion
    char buffer[4096] = {0};
    
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
            } else if (val.type == NAMI_TYPE_BOOL) {
                strcat(buffer, val.value.as_bool ? "true" : "false");
            }
        }
        strcat(buffer, "}");
    } else if (data.type == NAMI_TYPE_ARRAY) {
        strcat(buffer, "[");
        nami_array_t* arr = data.value.as_array;
        for (int64_t i = 0; i < arr->length; i++) {
            if (i > 0) strcat(buffer, ",");
            // Simplified - just handle objects in array
            if (arr->items[i].type == NAMI_TYPE_OBJECT) {
                strcat(buffer, "{");
                nami_object_t* obj = arr->items[i].value.as_object;
                for (int64_t j = 0; j < obj->count; j++) {
                    if (j > 0) strcat(buffer, ",");
                    strcat(buffer, "\"");
                    strcat(buffer, obj->entries[j].key);
                    strcat(buffer, "\":");
                    
                    nami_value_t val = obj->entries[j].value;
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
                strcat(buffer, "}");
            }
        }
        strcat(buffer, "]");
    }
    
    res->body = strdup(buffer);
    nami_http_send_response(res->client_fd, res->status_code, "application/json", res->body);
    res->sent = 1;
}

static inline nami_http_res_t* nami_http_res_status(nami_http_res_t* res, nami_value_t code) {
    if (code.type == NAMI_TYPE_INT) {
        res->status_code = (int)code.value.as_int;
    }
    return res;
}

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

#endif // NAMI_HTTP_SIMPLE_H
