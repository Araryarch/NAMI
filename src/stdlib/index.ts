/**
 * NAMI Standard Library - Sorting, Graph, and Tree implementations
 * These are TypeScript wrappers that generate the appropriate C code
 * Requirements: 9.1-9.7, 10.1-10.6, 11.1-11.6
 */

// ── Sorting Algorithms ─────────────────────────────────

export interface SortResult {
  sorted: number[];
  algorithm: string;
}

/** Quicksort implementation (for testing/simulation) */
export function quicksort<T>(arr: T[], comparator?: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return [...arr];
  const result = [...arr];
  const compare = comparator || ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));
  quicksortHelper(result, 0, result.length - 1, compare);
  return result;
}

function quicksortHelper<T>(
  arr: T[],
  low: number,
  high: number,
  compare: (a: T, b: T) => number
): void {
  if (low < high) {
    const pivot = partition(arr, low, high, compare);
    quicksortHelper(arr, low, pivot - 1, compare);
    quicksortHelper(arr, pivot + 1, high, compare);
  }
}

function partition<T>(
  arr: T[],
  low: number,
  high: number,
  compare: (a: T, b: T) => number
): number {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (compare(arr[j], pivot) <= 0) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

/** Mergesort implementation */
export function mergesort<T>(arr: T[], comparator?: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return [...arr];
  const compare = comparator || ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));
  return mergesortHelper([...arr], compare);
}

function mergesortHelper<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergesortHelper(arr.slice(0, mid), compare);
  const right = mergesortHelper(arr.slice(mid), compare);
  return merge(left, right, compare);
}

function merge<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
  const result: T[] = [];
  let i = 0,
    j = 0;
  while (i < left.length && j < right.length) {
    if (compare(left[i], right[j]) <= 0) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  return result.concat(left.slice(i), right.slice(j));
}

/** Heapsort implementation */
export function heapsort<T>(arr: T[], comparator?: (a: T, b: T) => number): T[] {
  const result = [...arr];
  const compare = comparator || ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));
  const n = result.length;

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(result, n, i, compare);
  }

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [result[0], result[i]] = [result[i], result[0]];
    heapify(result, i, 0, compare);
  }

  return result;
}

function heapify<T>(arr: T[], n: number, i: number, compare: (a: T, b: T) => number): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && compare(arr[left], arr[largest]) > 0) largest = left;
  if (right < n && compare(arr[right], arr[largest]) > 0) largest = right;

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest, compare);
  }
}

/** Default sort (uses quicksort) */
export function sort<T>(arr: T[], comparator?: (a: T, b: T) => number): T[] {
  return quicksort(arr, comparator);
}

// ── Graph Data Structure ────────────────────────────────

export interface GraphEdge {
  to: number;
  weight: number;
}

export class Graph {
  private adjacencyList: Map<number, GraphEdge[]>;
  private numVertices: number;

  constructor(numVertices: number) {
    this.numVertices = numVertices;
    this.adjacencyList = new Map();
    for (let i = 0; i < numVertices; i++) {
      this.adjacencyList.set(i, []);
    }
  }

  addEdge(from: number, to: number, weight = 1): void {
    this.adjacencyList.get(from)?.push({ to, weight });
  }

  addUndirectedEdge(from: number, to: number, weight = 1): void {
    this.addEdge(from, to, weight);
    this.addEdge(to, from, weight);
  }

  getNeighbors(vertex: number): GraphEdge[] {
    return this.adjacencyList.get(vertex) || [];
  }

  getVertexCount(): number {
    return this.numVertices;
  }

  /** BFS traversal */
  bfs(start: number): number[] {
    const visited = new Set<number>();
    const result: number[] = [];
    const queue: number[] = [start];
    visited.add(start);

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      result.push(vertex);

      for (const edge of this.getNeighbors(vertex)) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
    }

    return result;
  }

  /** DFS traversal */
  dfs(start: number): number[] {
    const visited = new Set<number>();
    const result: number[] = [];

    const dfsHelper = (vertex: number): void => {
      visited.add(vertex);
      result.push(vertex);
      for (const edge of this.getNeighbors(vertex)) {
        if (!visited.has(edge.to)) {
          dfsHelper(edge.to);
        }
      }
    };

    dfsHelper(start);
    return result;
  }

  /** Dijkstra's shortest path */
  dijkstra(start: number, end: number): { path: number[]; distance: number } {
    const distances = new Map<number, number>();
    const previous = new Map<number, number | null>();
    const unvisited = new Set<number>();

    for (let i = 0; i < this.numVertices; i++) {
      distances.set(i, Infinity);
      previous.set(i, null);
      unvisited.add(i);
    }
    distances.set(start, 0);

    while (unvisited.size > 0) {
      // Find min distance unvisited vertex
      let current = -1;
      let minDist = Infinity;
      for (const v of unvisited) {
        const d = distances.get(v)!;
        if (d < minDist) {
          minDist = d;
          current = v;
        }
      }

      if (current === -1 || current === end) break;
      unvisited.delete(current);

      for (const edge of this.getNeighbors(current)) {
        if (!unvisited.has(edge.to)) continue;
        const alt = distances.get(current)! + edge.weight;
        if (alt < distances.get(edge.to)!) {
          distances.set(edge.to, alt);
          previous.set(edge.to, current);
        }
      }
    }

    // Reconstruct path
    const path: number[] = [];
    let current: number | null = end;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) ?? null;
    }

    return {
      path: path[0] === start ? path : [],
      distance: distances.get(end) ?? Infinity,
    };
  }

  /** A* pathfinding */
  astar(
    start: number,
    end: number,
    heuristic: (vertex: number) => number
  ): { path: number[]; distance: number } {
    const openSet = new Set<number>([start]);
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    const fScore = new Map<number, number>();

    for (let i = 0; i < this.numVertices; i++) {
      gScore.set(i, Infinity);
      fScore.set(i, Infinity);
    }
    gScore.set(start, 0);
    fScore.set(start, heuristic(start));

    while (openSet.size > 0) {
      // Get vertex with lowest fScore
      let current = -1;
      let minF = Infinity;
      for (const v of openSet) {
        const f = fScore.get(v)!;
        if (f < minF) {
          minF = f;
          current = v;
        }
      }

      if (current === end) {
        // Reconstruct path
        const path: number[] = [current];
        let c = current;
        while (cameFrom.has(c)) {
          c = cameFrom.get(c)!;
          path.unshift(c);
        }
        return { path, distance: gScore.get(end)! };
      }

      openSet.delete(current);

      for (const edge of this.getNeighbors(current)) {
        const tentativeG = gScore.get(current)! + edge.weight;
        if (tentativeG < gScore.get(edge.to)!) {
          cameFrom.set(edge.to, current);
          gScore.set(edge.to, tentativeG);
          fScore.set(edge.to, tentativeG + heuristic(edge.to));
          openSet.add(edge.to);
        }
      }
    }

    return { path: [], distance: Infinity };
  }
}

// ── Tree Data Structure ─────────────────────────────────

export class TreeNode<T = number> {
  value: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;
  height = 1; // For AVL balancing

  constructor(value: T) {
    this.value = value;
  }
}

export class BinarySearchTree<T = number> {
  root: TreeNode<T> | null = null;
  private _size = 0;
  private comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this.comparator = comparator || ((a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0));
  }

  get size(): number {
    return this._size;
  }

  /** Insert a value (AVL balanced) */
  insert(value: T): void {
    this.root = this.insertNode(this.root, value);
    this._size++;
  }

  private insertNode(node: TreeNode<T> | null, value: T): TreeNode<T> {
    if (node === null) return new TreeNode(value);

    const cmp = this.comparator(value, node.value);
    if (cmp < 0) {
      node.left = this.insertNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.insertNode(node.right, value);
    } else {
      return node; // Duplicate
    }

    // Update height
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));

    // Balance
    const balance = this.getBalance(node);

    // Left Left
    if (balance > 1 && node.left && this.comparator(value, node.left.value) < 0) {
      return this.rotateRight(node);
    }

    // Right Right
    if (balance < -1 && node.right && this.comparator(value, node.right.value) > 0) {
      return this.rotateLeft(node);
    }

    // Left Right
    if (balance > 1 && node.left && this.comparator(value, node.left.value) > 0) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }

    // Right Left
    if (balance < -1 && node.right && this.comparator(value, node.right.value) < 0) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }

    return node;
  }

  /** Search for a value */
  search(value: T): boolean {
    return this.searchNode(this.root, value);
  }

  private searchNode(node: TreeNode<T> | null, value: T): boolean {
    if (node === null) return false;
    const cmp = this.comparator(value, node.value);
    if (cmp === 0) return true;
    if (cmp < 0) return this.searchNode(node.left, value);
    return this.searchNode(node.right, value);
  }

  /** Inorder traversal (left, root, right) */
  inorder(): T[] {
    const result: T[] = [];
    this.inorderHelper(this.root, result);
    return result;
  }

  private inorderHelper(node: TreeNode<T> | null, result: T[]): void {
    if (node === null) return;
    this.inorderHelper(node.left, result);
    result.push(node.value);
    this.inorderHelper(node.right, result);
  }

  /** Preorder traversal (root, left, right) */
  preorder(): T[] {
    const result: T[] = [];
    this.preorderHelper(this.root, result);
    return result;
  }

  private preorderHelper(node: TreeNode<T> | null, result: T[]): void {
    if (node === null) return;
    result.push(node.value);
    this.preorderHelper(node.left, result);
    this.preorderHelper(node.right, result);
  }

  /** Postorder traversal (left, right, root) */
  postorder(): T[] {
    const result: T[] = [];
    this.postorderHelper(this.root, result);
    return result;
  }

  private postorderHelper(node: TreeNode<T> | null, result: T[]): void {
    if (node === null) return;
    this.postorderHelper(node.left, result);
    this.postorderHelper(node.right, result);
    result.push(node.value);
  }

  /** Get tree height */
  height(): number {
    return this.getHeight(this.root);
  }

  private getHeight(node: TreeNode<T> | null): number {
    if (node === null) return 0;
    return node.height;
  }

  private getBalance(node: TreeNode<T> | null): number {
    if (node === null) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  /** Check if tree is balanced (AVL invariant: |balance| <= 1) */
  isBalanced(): boolean {
    return this.checkBalance(this.root);
  }

  private checkBalance(node: TreeNode<T> | null): boolean {
    if (node === null) return true;
    const balance = this.getBalance(node);
    if (Math.abs(balance) > 1) return false;
    return this.checkBalance(node.left) && this.checkBalance(node.right);
  }

  // ── AVL Rotations ────────────────────────────────────

  private rotateRight(y: TreeNode<T>): TreeNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.height = 1 + Math.max(this.getHeight(y.left), this.getHeight(y.right));
    x.height = 1 + Math.max(this.getHeight(x.left), this.getHeight(x.right));

    return x;
  }

  private rotateLeft(x: TreeNode<T>): TreeNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.height = 1 + Math.max(this.getHeight(x.left), this.getHeight(x.right));
    y.height = 1 + Math.max(this.getHeight(y.left), this.getHeight(y.right));

    return y;
  }
}
