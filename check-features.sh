#!/bin/bash

# NAMI Feature Checker
# Shows which language features are working

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              NAMI Language - Feature Status                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if example passes
check_feature() {
    local example=$1
    local feature=$2
    local expected="examples/.expected/${example}.txt"
    
    if [ ! -f "examples/${example}.nm" ]; then
        echo -e "  ${YELLOW}?${NC} ${feature} - Example not found"
        return
    fi
    
    if [ ! -f "$expected" ]; then
        echo -e "  ${YELLOW}⊘${NC} ${feature} - Not tested"
        return
    fi
    
    local output=$(mktemp)
    if timeout 5s nami run "examples/${example}.nm" 2>&1 | grep -A 1000 "^─" | tail -n +2 | head -n -1 > "$output" 2>&1; then
        if diff -q "$expected" "$output" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} ${feature}"
        else
            echo -e "  ${RED}✗${NC} ${feature} - Output mismatch"
        fi
    else
        echo -e "  ${RED}✗${NC} ${feature} - Runtime error"
    fi
    rm -f "$output"
}

echo "Core Language Features:"
echo ""
check_feature "variables" "Variables (let, const)"
check_feature "operators" "Arithmetic Operators (+, -, *, /)"
check_feature "operators" "Comparison Operators (==, !=, <, >)"
check_feature "hello" "String Literals"
check_feature "variables" "Boolean Literals"
check_feature "variables" "Number Literals (int, float)"

echo ""
echo "Control Flow:"
echo ""
check_feature "hello" "If/Else Statements"
check_feature "hello" "For Loops"
check_feature "control-flow" "While Loops"
check_feature "control-flow" "Do-While Loops"
check_feature "control-flow" "Break/Continue"
check_feature "control-flow" "Switch Statements"

echo ""
echo "Functions:"
echo ""
check_feature "functions" "Function Declarations"
check_feature "functions" "Function Parameters"
check_feature "functions" "Return Values"
check_feature "functions" "Recursion"
check_feature "functions" "Arrow Functions"
check_feature "functions" "Closures"

echo ""
echo "Data Structures:"
echo ""
check_feature "arrays" "Array Literals"
check_feature "arrays" "Array Indexing"
check_feature "arrays" "Array Methods (push, pop)"
check_feature "arrays" "Array Methods (map, filter)"
check_feature "objects" "Object Literals"
check_feature "objects" "Object Properties"
check_feature "objects" "Object Methods"

echo ""
echo "Built-in Functions:"
echo ""
check_feature "hello" "println()"
check_feature "functions" "print()"
check_feature "io-operations" "input()"
check_feature "operators" "Math operations"

echo ""
echo "Advanced Features:"
echo ""
check_feature "error-handling" "Try/Catch/Finally"
check_feature "error-handling" "Throw Statements"
check_feature "nami-features" "Async/Await"
check_feature "nami-features" "Promises"
check_feature "nami-features" "Modules (import/export)"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Legend:"
echo -e "  ${GREEN}✓${NC} - Feature working"
echo -e "  ${RED}✗${NC} - Feature broken"
echo -e "  ${YELLOW}⊘${NC} - Not tested yet"
echo -e "  ${YELLOW}?${NC} - Example missing"
echo ""
echo "To test a feature:"
echo "  1. Create example: examples/feature-name.nm"
echo "  2. Generate expected: ./generate-expected.sh feature-name"
echo "  3. Run this script again"
echo ""
