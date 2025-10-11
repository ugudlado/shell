#!/bin/bash

# commit-msg.sh - Generate semantic commit message from staged changes
# Usage: ./commit-msg.sh

echo "Analyzing staged changes for commit message..."

# Get staged diff
DIFF=$(git diff --staged)

if [ -z "$DIFF" ]; then
    echo "No staged changes found. Stage files with 'git add' first."
    exit 1
fi

# Get list of modified files
FILES=$(git diff --staged --name-only)

# Generate commit message using Claude with Sonnet model
echo "$DIFF" | claude --model sonnet "Generate a conventional commit message for these changes:

Rules:
- Use format: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore
- Keep first line under 50 characters
- Add body if changes are complex (separated by blank line)
- Include 'BREAKING CHANGE:' if applicable
- Reference Linear ticket if found in branch name

Modified files:
$FILES

Output only the commit message, nothing else."