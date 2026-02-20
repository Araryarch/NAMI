/**
 * NAMI HTTP Module (`http`)
 *
 * Provides a simple HTTP server accessible via `import http`:
 * - http.create()                — Create a new server instance
 * - server.get(path, handler)    — Register GET route
 * - server.post(path, handler)   — Register POST route
 * - server.put(path, handler)    — Register PUT route
 * - server.delete(path, handler) — Register DELETE route
 * - server.listen(port, callback?) — Start listening
 * - server.static(dir)           — Serve static files
 *
 * Handler signature: fn(req, res) { ... }
 * - req.body       — Request body
 * - req.params     — URL parameters
 * - req.query      — Query string parameters
 * - req.headers    — Request headers
 * - req.method     — HTTP method
 * - req.path       — Request path
 * - res.send(data) — Send response
 * - res.json(data) — Send JSON response
 * - res.status(code) — Set status code
 * - res.header(key, val) — Set response header
 */

export interface HttpModuleFunction {
  name: string;
  cName: string;
  params: string[];
  returnType: string;
  description: string;
  isMethod: boolean; // Whether called on a server instance
}

/** Functions available in the `http` module */
export const HTTP_MODULE_FUNCTIONS: HttpModuleFunction[] = [
  {
    name: 'create',
    cName: 'nami_http_create',
    params: [],
    returnType: 'nami_http_server_t*',
    description: 'Create a new HTTP server instance',
    isMethod: false,
  },
  {
    name: 'get',
    cName: 'nami_http_get',
    params: ['server', 'path', 'handler'],
    returnType: 'void',
    description: 'Register a GET route handler',
    isMethod: true,
  },
  {
    name: 'post',
    cName: 'nami_http_post',
    params: ['server', 'path', 'handler'],
    returnType: 'void',
    description: 'Register a POST route handler',
    isMethod: true,
  },
  {
    name: 'put',
    cName: 'nami_http_put',
    params: ['server', 'path', 'handler'],
    returnType: 'void',
    description: 'Register a PUT route handler',
    isMethod: true,
  },
  {
    name: 'delete',
    cName: 'nami_http_delete',
    params: ['server', 'path', 'handler'],
    returnType: 'void',
    description: 'Register a DELETE route handler',
    isMethod: true,
  },
  {
    name: 'listen',
    cName: 'nami_http_listen',
    params: ['server', 'port', 'callback'],
    returnType: 'void',
    description: 'Start the HTTP server on the given port',
    isMethod: true,
  },
  {
    name: 'static',
    cName: 'nami_http_static',
    params: ['server', 'dir'],
    returnType: 'void',
    description: 'Serve static files from the given directory',
    isMethod: true,
  },
];

/** HTTP request/response object methods */
export const HTTP_REQUEST_METHODS = ['body', 'params', 'query', 'headers', 'method', 'path'];

export const HTTP_RESPONSE_METHODS: HttpModuleFunction[] = [
  {
    name: 'send',
    cName: 'nami_http_res_send',
    params: ['res', 'data'],
    returnType: 'void',
    description: 'Send a response body',
    isMethod: true,
  },
  {
    name: 'json',
    cName: 'nami_http_res_json',
    params: ['res', 'data'],
    returnType: 'void',
    description: 'Send a JSON response',
    isMethod: true,
  },
  {
    name: 'status',
    cName: 'nami_http_res_status',
    params: ['res', 'code'],
    returnType: 'nami_http_res_t*',
    description: 'Set the HTTP status code',
    isMethod: true,
  },
  {
    name: 'header',
    cName: 'nami_http_res_header',
    params: ['res', 'key', 'value'],
    returnType: 'nami_http_res_t*',
    description: 'Set a response header',
    isMethod: true,
  },
];

/** Resolve an http module function call */
export function resolveHttpMethod(methodName: string): HttpModuleFunction | null {
  return HTTP_MODULE_FUNCTIONS.find((f) => f.name === methodName) || null;
}

/** Resolve an http response method call */
export function resolveHttpResponseMethod(methodName: string): HttpModuleFunction | null {
  return HTTP_RESPONSE_METHODS.find((f) => f.name === methodName) || null;
}

/** Generate C runtime declarations for the http module */
export function generateHttpRuntimeHeader(): string {
  const lines: string[] = [
    '// ── http module (NAMI HTTP server) ────────────────────',
    '',
    'typedef struct nami_http_server nami_http_server_t;',
    'typedef struct nami_http_req nami_http_req_t;',
    'typedef struct nami_http_res nami_http_res_t;',
    'typedef void (*nami_http_handler_t)(nami_http_req_t*, nami_http_res_t*);',
    '',
  ];

  for (const fn of HTTP_MODULE_FUNCTIONS) {
    const params =
      fn.params
        .map((p) => {
          if (p === 'server') return 'nami_http_server_t* server';
          if (p === 'handler') return 'nami_http_handler_t handler';
          if (p === 'callback') return 'nami_http_handler_t callback';
          return `nami_value_t ${p}`;
        })
        .join(', ') || 'void';
    lines.push(`${fn.returnType} ${fn.cName}(${params});`);
  }

  lines.push('');

  // Response methods
  for (const fn of HTTP_RESPONSE_METHODS) {
    const params = fn.params
      .map((p) => {
        if (p === 'res') return 'nami_http_res_t* res';
        return `nami_value_t ${p}`;
      })
      .join(', ');
    lines.push(`${fn.returnType} ${fn.cName}(${params});`);
  }

  // Request property getters
  lines.push('');
  lines.push('// Request property getters');
  for (const prop of HTTP_REQUEST_METHODS) {
    lines.push(`nami_value_t nami_http_req_${prop}(nami_http_req_t* req);`);
  }

  lines.push('');
  return lines.join('\n');
}
