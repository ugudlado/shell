#!/bin/bash

# error-explain.sh - Explain test failures and suggest fixes
# Usage: pnpm test 2>&1 | ./error-explain.sh

echo "Reading test output for analysis..."

# Read from stdin
TEST_OUTPUT=$(cat)

# Check if there are any failures
if ! echo "$TEST_OUTPUT" | grep -qE "FAIL|Error|failed|✗"; then
    echo "No test failures detected!"
    exit 0
fi

# Extract only error messages and failed tests
ERRORS=$(echo "$TEST_OUTPUT" | grep -A 5 -E "FAIL|Error|failed|✗")

# Send to Claude for analysis with Sonnet model
echo "$ERRORS" | claude --model sonnet "Analyze these test failures and provide:

1. Root cause of each failure
2. Specific fix for each issue
3. Code snippets if helpful
4. Common patterns if multiple failures are related

Keep explanations concise and actionable."