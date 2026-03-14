---
description: "Review session mistakes and extract permanent learnings"
gitignored: true
project: true
---

Use the Agent tool to spawn a haiku-agent with the following prompt:

---

# Session Reflection — Autonomous Agent Task

Review past sessions to extract permanent learnings from mistakes.

## Steps

1. **Read the auto-lessons file** for this project at `$MEMORY_DIR/auto-lessons.md` (where `$MEMORY_DIR` is `~/.claude/projects/<project-slug>/memory/`). If it doesn't exist, tell the user no sessions need review.

2. **For each entry marked `needs-review`**:
   - Read the transcript file referenced in the entry
   - Look for these patterns:
     - **User corrections**: Messages where the user said "no", "wrong", "actually", "instead", "don't do X"
     - **Repeated errors**: The same type error, lint failure, or test failure appearing 3+ times
     - **Wasted cycles**: Tool calls that were undone or reverted shortly after
     - **Pattern discoveries**: Approaches that worked well after initial failure

3. **For each finding, decide**:
   - Is this **project-specific**? → Add to project `MEMORY.md` under "Lessons Learned"
   - Is this **general**? → Add to `~/.claude/CLAUDE.md` under a relevant section
   - Is this **already captured**? → Skip (check existing lessons first)
   - Is this **too specific** to one session? → Skip

4. **Format each learning** as:
   ```
   - **[Short title]**: [Concise description of what went wrong and the correct approach]. [Optional: root cause].
   ```

5. **Mark processed entries** as `status: reviewed` in auto-lessons.md

6. **Present a summary** to the user:
   - How many sessions reviewed
   - How many new learnings extracted
   - Where each learning was saved
   - Ask the user to confirm before writing

## Guidelines

- Keep learnings **actionable and concise** — future sessions load these into context
- Prefer updating existing lessons over adding duplicates
- If a lesson contradicts an existing one, replace the old one
- Don't add obvious things ("run tests before committing") — only non-obvious insights
- Maximum 200 chars per learning entry
