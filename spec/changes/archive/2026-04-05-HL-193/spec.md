---
feature-id: auto-commit-after-each-completed-task-in-execute-n
linear-ticket: HL-193
---

# Chore: Auto-commit after each completed task in execute-next-task

## What

Add an auto-commit instruction to the `execute-next-task` step contract (`~/.config/spec/steps/execute-next-task.yaml`). After each task passes verification and is marked `[x]` in tasks.md, the step should commit the changes with a structured message referencing the task ID.

Also update the `/develop` skill's agent prompt construction to ensure developer agents know about the auto-commit behavior.

Files to modify:
- `src/spec/steps/execute-next-task.yaml` — add commit instruction after task completion
- `src/spec/steps/CONVENTIONS.md` — add § Auto-Commit Convention documenting the commit message format

## Why

In longer autopilot runs with 5-8 implementation tasks, commits only happen at phase boundaries. A session interruption mid-implementation loses all completed tasks' work. Per-task auto-commits make long runs resilient — each completed task is durably saved, and resume picks up from the last committed task.

This directly enables the strategic goal of "reliable longer runs" for autopilot.

## Acceptance Criteria

- [ ] `execute-next-task.yaml` instruction includes a commit step after task verification passes
- [ ] Commit message format is deterministic: `chore(<change-id>): complete T-N — <task title>`
- [ ] CONVENTIONS.md has a § Auto-Commit Convention section defining the format
- [ ] The verify section of execute-next-task includes "changes committed" as a post-task check
- [ ] Existing step contract structure (inputs, outputs, rules) is preserved
