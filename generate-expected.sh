#!/bin/bash

# Generate expected output files for examples
# Usage: ./generate-expected.sh <example-name>
# Or: ./generate-expected.sh all (to generate all)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p examples/.expected

generate_expected() {
    local example_file=$1
    local example_name=$(basename "$example_file" .nm)
    local expected_file="examples/.expected/${example_name}.txt"
    
    echo -n "Generating expected output for ${example_name}... "
    
    # Run the example and capture output (with timeout)
    if timeout 5s nami run "$example_file" 2>&1 | grep -A 1000 "^─" | tail -n +2 | head -n -1 > "$expected_file" 2>&1; then
        echo -e "${GREEN}✓${NC}"
        echo "  Saved to: $expected_file"
    else
        echo -e "${YELLOW}⚠${NC} (error or timeout)"
        rm -f "$expected_file"
    fi
}

if [ "$1" == "all" ]; then
    echo "Generating expected outputs for all examples..."
    echo ""
    for example in examples/*.nm; do
        if [ -f "$example" ]; then
            generate_expected "$example"
        fi
    done
elif [ -n "$1" ]; then
    example_file="examples/${1}.nm"
    if [ ! -f "$example_file" ]; then
        echo "Error: $example_file not found"
        exit 1
    fi
    generate_expected "$example_file"
else
    echo "Usage: $0 <example-name> | all"
    echo ""
    echo "Examples:"
    echo "  $0 hello"
    echo "  $0 all"
    exit 1
fi
