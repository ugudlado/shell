#!/bin/bash

# log-monitor.sh - Monitor logs for issues in real-time
# Usage: tail -f server.log | ./log-monitor.sh

echo "Starting log monitor... (Ctrl+C to stop)"
echo "Watching for: errors, warnings, security issues, performance problems"
echo "---"

# Use Claude to analyze log streams with Haiku model (faster for real-time)
tail -f "${1:-/dev/stdin}" | claude --model haiku "Monitor these log entries in real-time and alert me when you see:

1. ERROR level messages
2. Security concerns (auth failures, SQL injection attempts, XSS attempts)
3. Performance issues (slow queries, high memory usage, timeouts)
4. Repeated warnings that might indicate a problem
5. Stack traces or exceptions

For each issue found:
- Show the problematic log entry
- Explain what's wrong
- Suggest immediate action if critical
- Keep alerts concise (1-2 lines each)

Format: [LEVEL] Issue: description | Action: what to do"