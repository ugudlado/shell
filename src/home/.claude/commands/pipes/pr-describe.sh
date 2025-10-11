#!/bin/bash

# pr-describe.sh - Generate PR description from commits
# Usage: ./pr-describe.sh
#    or: git log origin/main.. | ./pr-describe.sh

# Get Linear ticket from branch name
BRANCH=$(git branch --show-current)
LINEAR_ID=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+')

# Get commits
if [ -t 0 ]; then
    # No pipe input, get commits from branch
    COMMITS=$(git log origin/main..HEAD --oneline)
    FILES_CHANGED=$(git diff origin/main --name-only | wc -l | tr -d ' ')
    INSERTIONS=$(git diff origin/main --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
    DELETIONS=$(git diff origin/main --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo "0")
else
    COMMITS=$(cat)
    FILES_CHANGED="N/A"
    INSERTIONS="N/A"
    DELETIONS="N/A"
fi

# Generate PR description with Sonnet model
echo "$COMMITS" | claude --model sonnet "Generate a pull request description based on these commits:

Include:
## Summary
Brief overview of changes (2-3 sentences)

## Changes
- Bullet points of key changes
- Group related changes together

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- How to test these changes
- What was tested

## Screenshots
(if applicable)

## Linear Ticket
${LINEAR_ID:-No ticket found}

## Stats
- Files changed: $FILES_CHANGED
- Lines added: $INSERTIONS
- Lines removed: $DELETIONS

Keep it professional but informative."