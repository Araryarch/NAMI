#!/bin/bash

# NAMI Examples Test Runner
# Tests all examples and compares output with expected results

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

# Test results array
declare -a RESULTS

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         NAMI Language - Examples Test Suite               ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Create temp directory for outputs
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Function to run a single test
run_test() {
    local example_file=$1
    local example_name=$(basename "$example_file" .nm)
    local expected_file="examples/.expected/${example_name}.txt"
    local output_file="$TEMP_DIR/${example_name}.out"
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "Testing ${example_name}... "
    
    # Check if expected output exists
    if [ ! -f "$expected_file" ]; then
        echo -e "${YELLOW}SKIP${NC} (no expected output)"
        SKIPPED=$((SKIPPED + 1))
        RESULTS+=("${YELLOW}⊘${NC} ${example_name} - SKIPPED (no expected output)")
        return
    fi
    
    # Run the example and capture output
    if timeout 5s nami run "$example_file" 2>&1 | grep -A 1000 "^─" | tail -n +2 | head -n -1 > "$output_file" 2>&1; then
        # Compare output with expected
        if diff -q "$expected_file" "$output_file" > /dev/null 2>&1; then
            echo -e "${GREEN}PASS${NC}"
            PASSED=$((PASSED + 1))
            RESULTS+=("${GREEN}✓${NC} ${example_name} - PASSED")
        else
            echo -e "${RED}FAIL${NC} (output mismatch)"
            FAILED=$((FAILED + 1))
            RESULTS+=("${RED}✗${NC} ${example_name} - FAILED (output mismatch)")
            
            # Show diff
            echo -e "${YELLOW}  Expected:${NC}"
            head -5 "$expected_file" | sed 's/^/    /'
            echo -e "${YELLOW}  Got:${NC}"
            head -5 "$output_file" | sed 's/^/    /'
            if [ $(wc -l < "$expected_file") -gt 5 ] || [ $(wc -l < "$output_file") -gt 5 ]; then
                echo "    ..."
            fi
        fi
    else
        echo -e "${RED}FAIL${NC} (compilation/runtime error)"
        FAILED=$((FAILED + 1))
        RESULTS+=("${RED}✗${NC} ${example_name} - FAILED (error)")
    fi
}

# Find all .nm files in examples directory (excluding subdirectories)
for example in examples/*.nm; do
    if [ -f "$example" ]; then
        run_test "$example"
    fi
done

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Test Summary                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Print all results
for result in "${RESULTS[@]}"; do
    echo -e "  $result"
done

echo ""
echo -e "Total:   ${TOTAL}"
echo -e "Passed:  ${GREEN}${PASSED}${NC}"
echo -e "Failed:  ${RED}${FAILED}${NC}"
echo -e "Skipped: ${YELLOW}${SKIPPED}${NC}"
echo ""

# Calculate percentage
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo -e "Success Rate: ${PERCENTAGE}%"
fi

echo ""

# Exit with error if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi
