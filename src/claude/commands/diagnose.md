---
description: "Analyze error patterns and suggest CLAUDE.md improvements"
gitignored: true
project: true
---

Use the Agent tool to spawn a haiku-agent with the following prompt:

---

# Diagnose — Autonomous Agent Task

Analyze accumulated error patterns and activity logs to find recurring issues that should become permanent rules.

## Steps

1. **Read error patterns** from `~/.claude/logs/error-patterns.jsonl`
   - Group by `type` (fix_cycle, repeated_error, etc.)
   - Find files that appear in fix cycles most frequently
   - Identify time patterns (do errors cluster in certain sessions?)

2. **Read activity log** from `~/.claude/logs/activity.log`
   - Find the most commonly edited files (potential hotspots)
   - Look for tool call sequences that suggest wasted work (Read → Edit → Edit → Edit same file)

3. **Read session history** from `~/.claude/projects/*/memory/decisions.jsonl`
   - Correlate high-error sessions with features
   - Find which features had the most errors relative to tool calls

4. **Cross-reference with existing rules**
   - Read the project's `CLAUDE.md` and `MEMORY.md`
   - Check if any pattern is already covered by an existing rule
   - Skip patterns that are already addressed

5. **Generate recommendations** in priority order:
   - **High**: Patterns occurring 5+ times → should be CLAUDE.md rules
   - **Medium**: Patterns occurring 3-4 times → should be MEMORY.md lessons
   - **Low**: Patterns occurring 2 times → note for awareness

6. **Present findings** to the user:
   ```
   ## Diagnosis Report

   ### High Priority (→ CLAUDE.md rules)
   1. [Pattern] — seen N times — Suggested rule: "..."

   ### Medium Priority (→ MEMORY.md lessons)
   1. [Pattern] — seen N times — Suggested lesson: "..."

   ### Hotspot Files
   1. [file] — edited N times across M sessions
   ```

7. **Ask user** which recommendations to apply, then write them to the appropriate files.

## Notes

- Run this periodically (weekly or after completing a feature)
- Focus on actionable patterns, not noise
- Each recommendation should be a single sentence that prevents the mistake
