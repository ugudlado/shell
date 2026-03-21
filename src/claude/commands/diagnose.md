---
description: "Analyze error patterns and suggest CLAUDE.md improvements"
gitignored: true
project: true
---

Use the Agent tool to spawn a haiku-agent with the following prompt:

---

# Diagnose — Autonomous Agent Task

Analyze accumulated error patterns, feature metrics, and session data to find recurring issues that should become permanent rules.

## Data Sources

| File | Written By | Contents |
|------|-----------|----------|
| `~/.claude/logs/error-patterns.jsonl` | `session-reflect.sh` hook (SessionEnd) | Per-session error counts by type, hotspot files, feature IDs |
| `~/.claude/logs/feature-metrics.jsonl` | `/complete-feature` step 6c | Per-feature telemetry: task counts, unplanned ratio, spec accuracy |
| `~/.claude/projects/*/memory/auto-lessons.md` | `session-reflect.sh` hook | Session summaries with transcript links, error counts |
| Project `CLAUDE.md` and `MEMORY.md` | Various | Existing rules and lessons to cross-reference |

## Steps

### 1. Read Error Patterns

Read `~/.claude/logs/error-patterns.jsonl`. If it doesn't exist, tell the user no error data has been collected yet (sessions need to complete for the SessionEnd hook to write data).

For each entry, parse the JSON and aggregate:
- **By error type**: Group by `errors.typescript`, `errors.lint`, `errors.test`, `errors.type` — which type dominates?
- **By hotspot file**: Which files appear most frequently in `hotspotFiles` across sessions?
- **By feature**: Group by `featureId` — which features had the most errors?
- **Time clustering**: Are errors concentrated in recent sessions (possible regression) or spread evenly?

### 2. Read Feature Metrics

Read `~/.claude/logs/feature-metrics.jsonl`. If it doesn't exist, skip this step.

Aggregate across features:
- **Average unplanned ratio**: Are specs improving over time? (Compare chronologically)
- **Top unplanned source**: Which category (reviewFixes, signoffFixes, simplificationFixes, verificationBugs) contributes most unplanned tasks across all features?
- **Spec accuracy trend**: Is `hitRate` improving? Are the same files showing up as `surpriseFiles` repeatedly?
- **Review iteration trend**: Are `reviewIterations` and `signoffRounds` decreasing over time?

### 3. Cross-Reference with Existing Rules

Read the project's `CLAUDE.md` and `MEMORY.md`:
- Check if any error pattern is already covered by an existing rule or lesson
- Skip patterns that are already addressed
- Flag rules that may be outdated (if the pattern they address hasn't occurred in recent features)

### 4. Generate Recommendations

Prioritize by frequency and impact:

- **High** (→ CLAUDE.md rules): Patterns occurring in 5+ sessions OR unplanned ratio consistently > 30%
- **Medium** (→ MEMORY.md lessons): Patterns occurring in 3-4 sessions OR spec accuracy issues
- **Low** (→ awareness only): Patterns occurring in 2 sessions

For spec-related findings:
- If the same `surpriseFiles` appear in multiple features → recommend adding them to spec templates
- If one unplanned category dominates → recommend `/specify` improvements for that category
- If unplanned ratio is trending up → flag as urgent

### 5. Present Findings

```
## Diagnosis Report

### Error Patterns (from N sessions)
| Type | Count | Top Files |
|------|-------|-----------|
| TypeScript | N | file1, file2 |
| Lint | N | file1, file2 |
| Test | N | file1, file2 |

### Feature Quality Trends (from N features)
| Metric | Oldest→Newest | Trend |
|--------|--------------|-------|
| Unplanned ratio | X% → Y% | ↑/↓/→ |
| Spec hit rate | X% → Y% | ↑/↓/→ |
| Review iterations | N → N | ↑/↓/→ |
| Top unplanned source | [category] | — |

### Recurring Surprise Files
Files that specs consistently miss:
1. [file] — missed in N features

### High Priority (→ CLAUDE.md rules)
1. [Pattern] — seen N times — Suggested rule: "..."

### Medium Priority (→ MEMORY.md lessons)
1. [Pattern] — seen N times — Suggested lesson: "..."

### Stale Rules (may be outdated)
1. [Rule] — pattern not seen in last N sessions
```

### 6. Apply

Use the `AskUserQuestion` tool to present recommendations and ask which ones to apply, then write them to the appropriate files.

## Notes

- Run this periodically (weekly or after completing a feature)
- Focus on actionable patterns, not noise
- Each recommendation should be a single sentence that prevents the mistake
- The key self-improvement signal is the **unplanned ratio trend** — if it's dropping, specs are getting better
