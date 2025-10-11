#!/bin/bash

# code-review.sh - Review code changes for issues
# Usage: git diff | ./code-review.sh
#    or: git diff main | ./code-review.sh
#    or: ./code-review.sh  (reviews staged changes)

# Determine what to review
if [ -t 0 ]; then
    # No pipe input, review staged changes
    echo "Reviewing staged changes..."
    DIFF=$(git diff --staged)
    if [ -z "$DIFF" ]; then
        echo "No staged changes. Reviewing unstaged changes..."
        DIFF=$(git diff)
    fi
else
    # Read from pipe
    echo "Reviewing piped diff..."
    DIFF=$(cat)
fi

if [ -z "$DIFF" ]; then
    echo "No changes to review."
    exit 0
fi

# Send to Claude for review with Sonnet model
echo "$DIFF" | claude --model sonnet "Perform a thorough code review of these changes:

Review for:
1. 🐛 Bugs and logic errors
2. 🔒 Security vulnerabilities
3. ⚡ Performance issues
4. 📝 Code style and best practices
5. 🧪 Missing tests
6. 📚 Documentation needs
7. 🏗️ Architecture concerns

For each issue found:
- Severity: [Critical/High/Medium/Low]
- File and line number
- Issue description
- Suggested fix

Also highlight:
- ✅ Good practices observed
- 💡 Improvement suggestions

Keep it concise but thorough."