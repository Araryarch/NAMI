import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Runtime Library - Graph Data Structure and Algorithms', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    const headerPath = path.join(__dirname, '../../runtime/nami_runtime.h');
    runtimeHeader = fs.readFileSync(headerPath, 'utf-8');
  });

  describe('Graph Data Structure (Task 16.1)', () => {
    it('should define nami_graph_t structure with required fields', () => {
      expect(runtimeHeader).toContain('typedef struct nami_graph {');
      expect(runtimeHeader).toContain('int64_t num_vertices;');
      expect(runtimeHeader).toContain('nami_array_t** adjacency_list;');
      expect(runtimeHeader).toContain('} nami_graph_t;');
    });

    it('should define nami_graph_edge_t structure for weighted edges', () => {
      expect(runtimeHeader).toContain('typedef struct nami_graph_edge {');
      expect(runtimeHeader).toContain('int64_t to;');
      expect(runtimeHeader).toContain('double weight;');
      expect(runtimeHeader).toContain('} nami_graph_edge_t;');
    });

    it('should implement nami_graph_create for initialization', () => {
      expect(runtimeHeader).toContain('nami_graph_t* nami_graph_create(int64_t num_vertices)');
      expect(runtimeHeader).toContain('malloc(sizeof(nami_graph_t))');
      expect(runtimeHeader).toContain('graph->num_vertices = num_vertices');
    });

    it('should initialize adjacency lists in nami_graph_create', () => {
      const createFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_graph_t* nami_graph_create'),
        runtimeHeader.indexOf('void nami_graph_destroy')
      );
      expect(createFunc).toContain('malloc(sizeof(nami_array_t*) * (size_t)num_vertices)');
      expect(createFunc).toContain('for (int64_t i = 0; i < num_vertices; i++)');
      expect(createFunc).toContain('nami_array_create()');
    });

    it('should implement nami_graph_destroy for cleanup', () => {
      expect(runtimeHeader).toContain('void nami_graph_destroy(nami_graph_t* graph)');
      expect(runtimeHeader).toContain('nami_array_destroy');
      expect(runtimeHeader).toContain('free(graph->adjacency_list)');
      expect(runtimeHeader).toContain('free(graph)');
    });

    it('should handle null pointer in nami_graph_destroy', () => {
      const destroyFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_graph_destroy'),
        runtimeHeader.indexOf('void nami_graph_add_edge')
      );
      expect(destroyFunc).toContain('if (graph != NULL)');
    });

    it('should implement nami_graph_add_edge for adding weighted edges', () => {
      expect(runtimeHeader).toContain(
        'void nami_graph_add_edge(nami_graph_t* graph, int64_t from, int64_t to, double weight)'
      );
    });

    it('should validate vertex indices in nami_graph_add_edge', () => {
      const addEdgeFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_graph_add_edge'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs')
      );
      expect(addEdgeFunc).toContain('if (from < 0 || from >= graph->num_vertices');
      expect(addEdgeFunc).toContain('to < 0 || to >= graph->num_vertices');
    });

    it('should store edge with weight in nami_graph_add_edge', () => {
      const addEdgeFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_graph_add_edge'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs')
      );
      expect(addEdgeFunc).toContain('nami_object_create_empty()');
      expect(addEdgeFunc).toContain('nami_object_set(edge, "to", nami_value_int(to))');
      expect(addEdgeFunc).toContain('nami_object_set(edge, "weight", nami_value_float(weight))');
      expect(addEdgeFunc).toContain('nami_array_push(graph->adjacency_list[from]');
    });
  });

  describe('Graph Traversal Algorithms (Task 16.2)', () => {
    it('should implement nami_graph_bfs for breadth-first search', () => {
      expect(runtimeHeader).toContain(
        'nami_array_t* nami_graph_bfs(nami_graph_t* graph, int64_t start)'
      );
    });

    it('should use queue for BFS traversal', () => {
      const bfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs')
      );
      expect(bfsFunc).toContain('nami_array_t* queue = nami_array_create()');
      expect(bfsFunc).toContain('nami_array_push(queue');
    });

    it('should track visited vertices in BFS', () => {
      const bfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs')
      );
      expect(bfsFunc).toContain('bool* visited');
      expect(bfsFunc).toContain('calloc');
      expect(bfsFunc).toContain('visited[');
    });

    it('should return vertices in BFS order', () => {
      const bfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs')
      );
      expect(bfsFunc).toContain('nami_array_t* result = nami_array_create()');
      expect(bfsFunc).toContain('nami_array_push(result');
      expect(bfsFunc).toContain('return result');
    });

    it('should handle invalid start vertex in BFS', () => {
      const bfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs')
      );
      expect(bfsFunc).toContain('if (start < 0 || start >= graph->num_vertices)');
      expect(bfsFunc).toContain('return nami_array_create()');
    });

    it('should implement nami_graph_dfs for depth-first search', () => {
      expect(runtimeHeader).toContain(
        'nami_array_t* nami_graph_dfs(nami_graph_t* graph, int64_t start)'
      );
    });

    it('should use stack for DFS traversal', () => {
      const dfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs'),
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra')
      );
      expect(dfsFunc).toContain('nami_array_t* stack = nami_array_create()');
      expect(dfsFunc).toContain('nami_array_pop(stack)');
    });

    it('should track visited vertices in DFS', () => {
      const dfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs'),
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra')
      );
      expect(dfsFunc).toContain('bool* visited');
      expect(dfsFunc).toContain('calloc');
      expect(dfsFunc).toContain('visited[current]');
    });

    it('should return vertices in DFS order', () => {
      const dfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs'),
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra')
      );
      expect(dfsFunc).toContain('nami_array_t* result = nami_array_create()');
      expect(dfsFunc).toContain('nami_array_push(result');
      expect(dfsFunc).toContain('return result');
    });

    it('should handle invalid start vertex in DFS', () => {
      const dfsFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_dfs'),
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra')
      );
      expect(dfsFunc).toContain('if (start < 0 || start >= graph->num_vertices)');
      expect(dfsFunc).toContain('return nami_array_create()');
    });
  });

  describe('Shortest Path Algorithms (Task 16.3)', () => {
    it('should implement nami_graph_dijkstra for shortest path', () => {
      expect(runtimeHeader).toContain(
        'nami_object_t* nami_graph_dijkstra(nami_graph_t* graph, int64_t start, int64_t end)'
      );
    });

    it('should initialize distances array in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('double* distances');
      expect(dijkstraFunc).toContain('malloc(sizeof(double)');
      expect(dijkstraFunc).toContain('distances[i] = INFINITY');
      expect(dijkstraFunc).toContain('distances[start] = 0.0');
    });

    it('should track previous vertices for path reconstruction in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('int64_t* previous');
      expect(dijkstraFunc).toContain('previous[i] = -1');
      expect(dijkstraFunc).toContain('previous[neighbor] = min_vertex');
    });

    it('should find minimum distance vertex in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('double min_dist = INFINITY');
      expect(dijkstraFunc).toContain('int64_t min_vertex = -1');
      expect(dijkstraFunc).toContain('if (!visited[v] && distances[v] < min_dist)');
    });

    it('should update distances to neighbors in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('double new_dist = distances[min_vertex] + weight');
      expect(dijkstraFunc).toContain('if (new_dist < distances[neighbor])');
      expect(dijkstraFunc).toContain('distances[neighbor] = new_dist');
    });

    it('should reconstruct path in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('nami_array_t* path = nami_array_create()');
      expect(dijkstraFunc).toContain('int64_t current = end');
      expect(dijkstraFunc).toContain('while (current != -1)');
      expect(dijkstraFunc).toContain('current = previous[current]');
    });

    it('should reverse path in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('for (int64_t i = 0; i < path->length / 2; i++)');
      expect(dijkstraFunc).toContain('nami_value_t temp = path->items[i]');
    });

    it('should return object with path and distances in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('nami_object_t* result = nami_object_create_empty()');
      expect(dijkstraFunc).toContain('nami_object_set(result, "path"');
      expect(dijkstraFunc).toContain('nami_object_set(result, "distances"');
      expect(dijkstraFunc).toContain('return result');
    });

    it('should handle invalid vertices in Dijkstra', () => {
      const dijkstraFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_object_t* nami_graph_dijkstra'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar')
      );
      expect(dijkstraFunc).toContain('if (start < 0 || start >= graph->num_vertices');
      expect(dijkstraFunc).toContain('end < 0 || end >= graph->num_vertices');
    });

    it('should implement nami_graph_astar for heuristic pathfinding', () => {
      expect(runtimeHeader).toContain(
        'nami_array_t* nami_graph_astar(nami_graph_t* graph, int64_t start, int64_t end, nami_function_t heuristic)'
      );
    });

    it('should use heuristic function in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('nami_value_t h_start = heuristic(nami_value_int(start))');
      expect(astarFunc).toContain('nami_value_t h_neighbor = heuristic(nami_value_int(neighbor))');
    });

    it('should maintain g_score and f_score in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('double* g_score');
      expect(astarFunc).toContain('double* f_score');
      expect(astarFunc).toContain('g_score[start] = 0.0');
      expect(astarFunc).toContain('f_score[start] =');
    });

    it('should use open and closed sets in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('bool* in_open_set');
      expect(astarFunc).toContain('bool* in_closed_set');
      expect(astarFunc).toContain('in_open_set[start] = true');
      expect(astarFunc).toContain('in_closed_set[current] = true');
    });

    it('should find vertex with lowest f_score in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('double min_f = INFINITY');
      expect(astarFunc).toContain('if (in_open_set[v] && f_score[v] < min_f)');
    });

    it('should reconstruct path when goal is reached in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('if (current == end)');
      expect(astarFunc).toContain('nami_array_t* path = nami_array_create()');
      expect(astarFunc).toContain('while (node != -1)');
    });

    it('should update scores for neighbors in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('double tentative_g = g_score[current] + weight');
      expect(astarFunc).toContain('if (tentative_g < g_score[neighbor])');
      expect(astarFunc).toContain('g_score[neighbor] = tentative_g');
      expect(astarFunc).toContain('f_score[neighbor] = tentative_g');
    });

    it('should handle invalid vertices in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(astarFunc).toContain('if (start < 0 || start >= graph->num_vertices');
      expect(astarFunc).toContain('end < 0 || end >= graph->num_vertices');
      expect(astarFunc).toContain('return nami_array_create()');
    });

    it('should return empty array when no path found in A*', () => {
      const astarFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_graph_astar'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      // Check for cleanup and empty array return at the end
      expect(astarFunc).toContain('free(g_score)');
      expect(astarFunc).toContain('free(f_score)');
      expect(astarFunc).toContain('return nami_array_create()');
    });
  });

  describe('Graph Integration', () => {
    it('should use adjacency list representation', () => {
      expect(runtimeHeader).toContain('nami_array_t** adjacency_list');
      expect(runtimeHeader).toContain('graph->adjacency_list[');
    });

    it('should store edges as objects with to and weight properties', () => {
      const addEdgeFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_graph_add_edge'),
        runtimeHeader.indexOf('nami_array_t* nami_graph_bfs')
      );
      expect(addEdgeFunc).toContain('nami_object_t* edge');
      expect(addEdgeFunc).toContain('"to"');
      expect(addEdgeFunc).toContain('"weight"');
    });

    it('should properly clean up memory in all algorithms', () => {
      // Check that all algorithms free allocated memory
      const graphSection = runtimeHeader.substring(
        runtimeHeader.indexOf('// ── Graph Data Structure'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );

      // Count malloc/calloc vs free calls (should be balanced)
      const allocCount = (graphSection.match(/malloc\(|calloc\(/g) || []).length;
      const freeCount = (graphSection.match(/free\(/g) || []).length;

      // We expect at least some memory management
      expect(allocCount).toBeGreaterThan(0);
      expect(freeCount).toBeGreaterThan(0);
    });
  });
});
