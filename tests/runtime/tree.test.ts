import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Runtime Library - Tree Data Structure', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    const headerPath = path.join(__dirname, '../../runtime/nami_runtime.h');
    runtimeHeader = fs.readFileSync(headerPath, 'utf-8');
  });

  describe('Binary Tree Data Structure (Task 17.1)', () => {
    it('should define nami_tree_node_t structure with required fields', () => {
      expect(runtimeHeader).toContain('typedef struct nami_tree_node {');
      expect(runtimeHeader).toContain('nami_value_t value;');
      expect(runtimeHeader).toContain('struct nami_tree_node* left;');
      expect(runtimeHeader).toContain('struct nami_tree_node* right;');
      expect(runtimeHeader).toContain('} nami_tree_node_t;');
    });

    it('should include height field for AVL balancing', () => {
      const nodeStruct = runtimeHeader.substring(
        runtimeHeader.indexOf('typedef struct nami_tree_node {'),
        runtimeHeader.indexOf('} nami_tree_node_t;')
      );
      expect(nodeStruct).toContain('int64_t height');
    });

    it('should define nami_tree_t structure with root and size', () => {
      expect(runtimeHeader).toContain('typedef struct nami_tree {');
      expect(runtimeHeader).toContain('nami_tree_node_t* root;');
      expect(runtimeHeader).toContain('int64_t size;');
      expect(runtimeHeader).toContain('} nami_tree_t;');
    });

    it('should implement nami_tree_create for initialization', () => {
      expect(runtimeHeader).toContain('nami_tree_t* nami_tree_create(void)');
      expect(runtimeHeader).toContain('malloc(sizeof(nami_tree_t))');
    });

    it('should initialize tree with NULL root and zero size', () => {
      const createFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_t* nami_tree_create'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_node_create')
      );
      expect(createFunc).toContain('tree->root = NULL');
      expect(createFunc).toContain('tree->size = 0');
    });

    it('should implement nami_tree_node_create helper', () => {
      expect(runtimeHeader).toContain(
        'nami_tree_node_t* nami_tree_node_create(nami_value_t value)'
      );
      expect(runtimeHeader).toContain('malloc(sizeof(nami_tree_node_t))');
    });

    it('should initialize node with NULL children and height 1', () => {
      const nodeCreateFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_node_create'),
        runtimeHeader.indexOf('int64_t nami_tree_node_height')
      );
      expect(nodeCreateFunc).toContain('node->left = NULL');
      expect(nodeCreateFunc).toContain('node->right = NULL');
      expect(nodeCreateFunc).toContain('node->height = 1');
    });

    it('should implement nami_tree_insert for adding nodes', () => {
      expect(runtimeHeader).toContain(
        'void nami_tree_insert(nami_tree_t* tree, nami_value_t value)'
      );
    });

    it('should increment size when inserting', () => {
      const insertFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_insert(nami_tree_t* tree'),
        runtimeHeader.indexOf('bool nami_tree_search_helper')
      );
      expect(insertFunc).toContain('tree->size++');
    });

    it('should implement nami_tree_destroy for cleanup', () => {
      expect(runtimeHeader).toContain('void nami_tree_destroy(nami_tree_t* tree)');
      expect(runtimeHeader).toContain('nami_tree_node_destroy');
      expect(runtimeHeader).toContain('free(tree)');
    });

    it('should handle null pointer in nami_tree_destroy', () => {
      const destroyFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_destroy'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(destroyFunc).toContain('if (tree != NULL)');
    });
  });

  describe('Tree Traversal Methods (Task 17.2)', () => {
    it('should implement nami_tree_inorder for left-root-right traversal', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_tree_inorder(nami_tree_t* tree)');
    });

    it('should implement inorder helper with correct traversal order', () => {
      expect(runtimeHeader).toContain(
        'void nami_tree_inorder_helper(nami_tree_node_t* node, nami_array_t* result)'
      );
      const inorderHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_inorder_helper'),
        runtimeHeader.indexOf('nami_array_t* nami_tree_inorder(nami_tree_t* tree)')
      );
      // Check order: left, root, right
      const leftPos = inorderHelper.indexOf('nami_tree_inorder_helper(node->left');
      const pushPos = inorderHelper.indexOf('nami_array_push(result, node->value)');
      const rightPos = inorderHelper.indexOf('nami_tree_inorder_helper(node->right');
      expect(leftPos).toBeLessThan(pushPos);
      expect(pushPos).toBeLessThan(rightPos);
    });

    it('should return array from nami_tree_inorder', () => {
      const inorderFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_tree_inorder(nami_tree_t* tree)'),
        runtimeHeader.indexOf('void nami_tree_preorder_helper')
      );
      expect(inorderFunc).toContain('nami_array_t* result = nami_array_create()');
      expect(inorderFunc).toContain('return result');
    });

    it('should implement nami_tree_preorder for root-left-right traversal', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_tree_preorder(nami_tree_t* tree)');
    });

    it('should implement preorder helper with correct traversal order', () => {
      expect(runtimeHeader).toContain(
        'void nami_tree_preorder_helper(nami_tree_node_t* node, nami_array_t* result)'
      );
      const preorderHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_preorder_helper'),
        runtimeHeader.indexOf('nami_array_t* nami_tree_preorder(nami_tree_t* tree)')
      );
      // Check order: root, left, right
      const pushPos = preorderHelper.indexOf('nami_array_push(result, node->value)');
      const leftPos = preorderHelper.indexOf('nami_tree_preorder_helper(node->left');
      const rightPos = preorderHelper.indexOf('nami_tree_preorder_helper(node->right');
      expect(pushPos).toBeLessThan(leftPos);
      expect(leftPos).toBeLessThan(rightPos);
    });

    it('should return array from nami_tree_preorder', () => {
      const preorderFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_tree_preorder(nami_tree_t* tree)'),
        runtimeHeader.indexOf('void nami_tree_postorder_helper')
      );
      expect(preorderFunc).toContain('nami_array_t* result = nami_array_create()');
      expect(preorderFunc).toContain('return result');
    });

    it('should implement nami_tree_postorder for left-right-root traversal', () => {
      expect(runtimeHeader).toContain('nami_array_t* nami_tree_postorder(nami_tree_t* tree)');
    });

    it('should implement postorder helper with correct traversal order', () => {
      expect(runtimeHeader).toContain(
        'void nami_tree_postorder_helper(nami_tree_node_t* node, nami_array_t* result)'
      );
      const postorderHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_postorder_helper'),
        runtimeHeader.indexOf('nami_array_t* nami_tree_postorder(nami_tree_t* tree)')
      );
      // Check order: left, right, root
      const leftPos = postorderHelper.indexOf('nami_tree_postorder_helper(node->left');
      const rightPos = postorderHelper.indexOf('nami_tree_postorder_helper(node->right');
      const pushPos = postorderHelper.indexOf('nami_array_push(result, node->value)');
      expect(leftPos).toBeLessThan(rightPos);
      expect(rightPos).toBeLessThan(pushPos);
    });

    it('should return array from nami_tree_postorder', () => {
      const postorderFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_tree_postorder(nami_tree_t* tree)'),
        runtimeHeader.indexOf('int64_t nami_tree_height')
      );
      expect(postorderFunc).toContain('nami_array_t* result = nami_array_create()');
      expect(postorderFunc).toContain('return result');
    });

    it('should handle NULL tree in traversal methods', () => {
      const inorderFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_array_t* nami_tree_inorder(nami_tree_t* tree)'),
        runtimeHeader.indexOf('void nami_tree_preorder_helper')
      );
      expect(inorderFunc).toContain('if (tree != NULL)');
    });
  });

  describe('BST Operations (Task 17.3)', () => {
    it('should implement nami_tree_search for finding values', () => {
      expect(runtimeHeader).toContain(
        'bool nami_tree_search(nami_tree_t* tree, nami_value_t value)'
      );
    });

    it('should implement search helper with BST logic', () => {
      expect(runtimeHeader).toContain(
        'bool nami_tree_search_helper(nami_tree_node_t* node, nami_value_t value)'
      );
      const searchHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('bool nami_tree_search_helper'),
        runtimeHeader.indexOf('bool nami_tree_search(nami_tree_t* tree')
      );
      expect(searchHelper).toContain('if (node == NULL) return false');
      expect(searchHelper).toContain('nami_to_number');
      expect(searchHelper).toContain('if (search_val == node_val)');
      expect(searchHelper).toContain('return true');
    });

    it('should search left subtree for smaller values', () => {
      const searchHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('bool nami_tree_search_helper'),
        runtimeHeader.indexOf('bool nami_tree_search(nami_tree_t* tree')
      );
      expect(searchHelper).toContain('if (search_val < node_val)');
      expect(searchHelper).toContain('return nami_tree_search_helper(node->left, value)');
    });

    it('should search right subtree for larger values', () => {
      const searchHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('bool nami_tree_search_helper'),
        runtimeHeader.indexOf('bool nami_tree_search(nami_tree_t* tree')
      );
      expect(searchHelper).toContain('return nami_tree_search_helper(node->right, value)');
    });

    it('should maintain BST ordering invariant during insertion', () => {
      expect(runtimeHeader).toContain(
        'nami_tree_node_t* nami_tree_insert_helper(nami_tree_node_t* node, nami_value_t value)'
      );
      const insertHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper'),
        runtimeHeader.indexOf('void nami_tree_insert(nami_tree_t* tree')
      );
      expect(insertHelper).toContain('nami_to_number');
      expect(insertHelper).toContain('if (insert_val < node_val)');
      expect(insertHelper).toContain('node->left = nami_tree_insert_helper(node->left, value)');
      expect(insertHelper).toContain('else if (insert_val > node_val)');
      expect(insertHelper).toContain('node->right = nami_tree_insert_helper(node->right, value)');
    });

    it('should handle duplicate values in insertion', () => {
      const insertHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper'),
        runtimeHeader.indexOf('void nami_tree_insert(nami_tree_t* tree')
      );
      expect(insertHelper).toContain('return node');
    });

    it('should create new node for empty tree in insertion', () => {
      const insertHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper'),
        runtimeHeader.indexOf('void nami_tree_insert(nami_tree_t* tree')
      );
      expect(insertHelper).toContain('if (node == NULL)');
      expect(insertHelper).toContain('return nami_tree_node_create(value)');
    });
  });

  describe('Tree Balancing (AVL) (Task 17.4)', () => {
    it('should implement nami_tree_node_height helper', () => {
      expect(runtimeHeader).toContain('int64_t nami_tree_node_height(nami_tree_node_t* node)');
      const heightFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_tree_node_height'),
        runtimeHeader.indexOf('int64_t nami_tree_node_balance')
      );
      expect(heightFunc).toContain('return node ? node->height : 0');
    });

    it('should implement nami_tree_node_balance for balance factor', () => {
      expect(runtimeHeader).toContain('int64_t nami_tree_node_balance(nami_tree_node_t* node)');
      const balanceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_tree_node_balance'),
        runtimeHeader.indexOf('void nami_tree_node_update_height')
      );
      expect(balanceFunc).toContain('if (node == NULL) return 0');
      expect(balanceFunc).toContain(
        'nami_tree_node_height(node->left) - nami_tree_node_height(node->right)'
      );
    });

    it('should implement nami_tree_node_update_height', () => {
      expect(runtimeHeader).toContain('void nami_tree_node_update_height(nami_tree_node_t* node)');
      const updateFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_node_update_height'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_rotate_right')
      );
      expect(updateFunc).toContain('nami_tree_node_height(node->left)');
      expect(updateFunc).toContain('nami_tree_node_height(node->right)');
      expect(updateFunc).toContain('node->height = 1 +');
    });

    it('should implement right rotation', () => {
      expect(runtimeHeader).toContain(
        'nami_tree_node_t* nami_tree_rotate_right(nami_tree_node_t* y)'
      );
      const rotateFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_rotate_right'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_rotate_left')
      );
      expect(rotateFunc).toContain('nami_tree_node_t* x = y->left');
      expect(rotateFunc).toContain('x->right = y');
      expect(rotateFunc).toContain('y->left = T2');
      expect(rotateFunc).toContain('nami_tree_node_update_height');
      expect(rotateFunc).toContain('return x');
    });

    it('should implement left rotation', () => {
      expect(runtimeHeader).toContain(
        'nami_tree_node_t* nami_tree_rotate_left(nami_tree_node_t* x)'
      );
      const rotateFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_rotate_left'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_balance_node')
      );
      expect(rotateFunc).toContain('nami_tree_node_t* y = x->right');
      expect(rotateFunc).toContain('y->left = x');
      expect(rotateFunc).toContain('x->right = T2');
      expect(rotateFunc).toContain('nami_tree_node_update_height');
      expect(rotateFunc).toContain('return y');
    });

    it('should implement nami_tree_balance_node', () => {
      expect(runtimeHeader).toContain(
        'nami_tree_node_t* nami_tree_balance_node(nami_tree_node_t* node)'
      );
    });

    it('should handle left-heavy case (balance > 1)', () => {
      const balanceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_balance_node'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper')
      );
      expect(balanceFunc).toContain('if (balance > 1)');
      expect(balanceFunc).toContain('nami_tree_rotate_right');
    });

    it('should handle left-right case', () => {
      const balanceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_balance_node'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper')
      );
      expect(balanceFunc).toContain('if (nami_tree_node_balance(node->left) < 0)');
      expect(balanceFunc).toContain('node->left = nami_tree_rotate_left(node->left)');
    });

    it('should handle right-heavy case (balance < -1)', () => {
      const balanceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_balance_node'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper')
      );
      expect(balanceFunc).toContain('if (balance < -1)');
      expect(balanceFunc).toContain('nami_tree_rotate_left');
    });

    it('should handle right-left case', () => {
      const balanceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_balance_node'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper')
      );
      expect(balanceFunc).toContain('if (nami_tree_node_balance(node->right) > 0)');
      expect(balanceFunc).toContain('node->right = nami_tree_rotate_right(node->right)');
    });

    it('should balance node after insertion', () => {
      const insertHelper = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper'),
        runtimeHeader.indexOf('void nami_tree_insert(nami_tree_t* tree')
      );
      expect(insertHelper).toContain('return nami_tree_balance_node(node)');
    });

    it('should update height in balance_node', () => {
      const balanceFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_balance_node'),
        runtimeHeader.indexOf('nami_tree_node_t* nami_tree_insert_helper')
      );
      expect(balanceFunc).toContain('nami_tree_node_update_height(node)');
    });
  });

  describe('Tree Utility Functions (Task 17.5)', () => {
    it('should implement nami_tree_height', () => {
      expect(runtimeHeader).toContain('int64_t nami_tree_height(nami_tree_t* tree)');
    });

    it('should return 0 for empty tree in nami_tree_height', () => {
      const heightFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_tree_height(nami_tree_t* tree)'),
        runtimeHeader.indexOf('int64_t nami_tree_size')
      );
      expect(heightFunc).toContain('if (tree == NULL || tree->root == NULL) return 0');
    });

    it('should return root height for non-empty tree', () => {
      const heightFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_tree_height(nami_tree_t* tree)'),
        runtimeHeader.indexOf('int64_t nami_tree_size')
      );
      expect(heightFunc).toContain('return tree->root->height');
    });

    it('should implement nami_tree_size', () => {
      expect(runtimeHeader).toContain('int64_t nami_tree_size(nami_tree_t* tree)');
    });

    it('should return 0 for NULL tree in nami_tree_size', () => {
      const sizeFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_tree_size(nami_tree_t* tree)'),
        runtimeHeader.indexOf('void nami_tree_node_destroy')
      );
      expect(sizeFunc).toContain('if (tree == NULL) return 0');
    });

    it('should return cached size field', () => {
      const sizeFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('int64_t nami_tree_size(nami_tree_t* tree)'),
        runtimeHeader.indexOf('void nami_tree_node_destroy')
      );
      expect(sizeFunc).toContain('return tree->size');
    });
  });

  describe('Tree Integration', () => {
    it('should use nami_value_t for node values', () => {
      const nodeStruct = runtimeHeader.substring(
        runtimeHeader.indexOf('typedef struct nami_tree_node {'),
        runtimeHeader.indexOf('} nami_tree_node_t;')
      );
      expect(nodeStruct).toContain('nami_value_t value');
    });

    it('should use nami_to_number for value comparison', () => {
      const treeSection = runtimeHeader.substring(
        runtimeHeader.indexOf('// ── Tree Data Structure'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );
      expect(treeSection).toContain('nami_to_number');
    });

    it('should properly clean up memory in tree_node_destroy', () => {
      expect(runtimeHeader).toContain('void nami_tree_node_destroy(nami_tree_node_t* node)');
      const destroyFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('void nami_tree_node_destroy'),
        runtimeHeader.indexOf('void nami_tree_destroy')
      );
      expect(destroyFunc).toContain('if (node == NULL) return');
      expect(destroyFunc).toContain('nami_tree_node_destroy(node->left)');
      expect(destroyFunc).toContain('nami_tree_node_destroy(node->right)');
      expect(destroyFunc).toContain('free(node)');
    });

    it('should have balanced memory allocation and deallocation', () => {
      const treeSection = runtimeHeader.substring(
        runtimeHeader.indexOf('// ── Tree Data Structure'),
        runtimeHeader.indexOf('#endif // NAMI_RUNTIME_H')
      );

      // Count malloc vs free calls
      const allocCount = (treeSection.match(/malloc\(/g) || []).length;
      const freeCount = (treeSection.match(/free\(/g) || []).length;

      expect(allocCount).toBeGreaterThan(0);
      expect(freeCount).toBeGreaterThan(0);
    });
  });
});
