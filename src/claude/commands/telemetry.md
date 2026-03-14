---
description: "Show session telemetry and workflow health metrics"
gitignored: true
project: true
---

Use the Agent tool to spawn a haiku-agent with the following prompt:

---

# Telemetry — Autonomous Agent Task

Analyze accumulated session data to show workflow health metrics and improvement trends.

## Steps

1. **Gather data sources**:
   - `~/.claude/logs/activity.log` — tool call activity
   - `~/.claude/logs/error-patterns.jsonl` — fix cycle patterns
   - `~/.claude/projects/*/memory/decisions.jsonl` — session summaries
   - `~/.claude/projects/*/memory/auto-lessons.md` — flagged sessions

2. **Compute metrics** (use bash/jq to process JSONL):

   **Session Health**:
   - Total sessions tracked
   - Average tool calls per session
   - Average errors per session
   - Error rate trend (last 5 sessions vs previous 5)

   **Fix Cycle Analysis**:
   - Files with most fix cycles (re-edits in same session)
   - Average edits-per-file before getting it right
   - Most problematic file types (.tsx vs .ts vs .json)

   **Activity Patterns**:
   - Most used tools (from activity.log)
   - Peak productivity hours (from timestamps)
   - Session duration distribution

   **Self-Improvement Score**:
   - Lessons learned count (from MEMORY.md entries)
   - Rules added to CLAUDE.md count
   - Error rate trend (decreasing = improving)

3. **Present as a dashboard**:

```
╔══════════════════════════════════════════════════╗
║           Workflow Health Dashboard              ║
╠══════════════════════════════════════════════════╣
║ Sessions tracked:  N  │ Avg tool calls:  N      ║
║ Total learnings:   N  │ Error rate:      N%     ║
╠══════════════════════════════════════════════════╣
║ Fix Cycle Hotspots                               ║
║  1. file.tsx — N cycles across M sessions        ║
║  2. ...                                          ║
╠══════════════════════════════════════════════════╣
║ Error Rate Trend                                 ║
║  Recent 5 sessions: N errors/session             ║
║  Previous 5:        N errors/session             ║
║  Trend: ↓ improving / ↑ degrading / → stable    ║
╠══════════════════════════════════════════════════╣
║ Self-Improvement Score                           ║
║  Learnings captured:  N                          ║
║  CLAUDE.md rules:     N                          ║
║  Unreviewed sessions: N (run /reflect)           ║
╚══════════════════════════════════════════════════╝
```

4. **Suggest actions** based on findings:
   - If error rate is increasing → "Run /reflect to extract learnings"
   - If fix cycles are concentrated → "Consider adding type-check rules for [file type]"
   - If unreviewed sessions exist → "Run /reflect to process N flagged sessions"

## Notes

- This command is read-only — it doesn't modify any files
- Data accumulates over time; more sessions = better insights
- Run weekly or after completing a major feature
