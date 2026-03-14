---
description: Load feature context (spec and tasks) into the current session
argument-hint: "[feature-id] — optional feature ID (auto-detected from worktree/branch if omitted)"
---

# Continue Feature Development

Resume work on a feature by loading its OpenSpec change context into the current session. Auto-detects the feature from your current worktree or git branch, or specify a feature ID manually.

## Steps

1. **Parse Arguments**
   - If `$ARGUMENTS` is empty: auto-detect feature ID from:
     1. Worktree name: `~/code/feature_worktrees/[FEATURE-ID]`
     2. Current git branch: `feature/[FEATURE-ID]`
   - If `$ARGUMENTS` provided: use it as the feature ID directly

2. **Locate OpenSpec Change**
   - Check for change directory: `openspec/changes/[FEATURE-ID]/`
   - Read metadata: `openspec/changes/[FEATURE-ID]/.openspec.yaml`
   - If not found in current directory, try parent directory (for feature branches)

3. **Get OpenSpec Status**
   ```bash
   openspec status --change "[FEATURE-ID]" --json
   ```
   Parse artifact states (BLOCKED/READY/DONE) and task progress.

4. **Report Status**
   - If change found:

     ```
     Feature: [FEATURE-ID]
     Mode:    [tdd/non-tdd]
     Linear:  [HL-XXX or none]
     Change:  openspec/changes/[FEATURE-ID]/
     ```

     Show artifact status (spec, design, tasks) and task progress.

     Then output the full content of spec.md, design.md, and tasks.md.

   - If not found:
     ```
     No OpenSpec change found for: [FEATURE-ID]
     Checked: openspec/changes/[FEATURE-ID]/
     ```

5. **Output Content**
   - Display the full spec, design, and tasks file contents so Claude can review requirements and track progress

## Usage Examples

```bash
# Auto-detect from current worktree/branch
/continue-feature

# Specify a feature ID manually
/continue-feature 2026-03-05-auto-resolve-daemon
/continue-feature HL-84-custom-feature
```

## Notes

- Auto-detection works both in feature worktrees (`~/code/feature_worktrees/[ID]`) and on feature branches in the main repo
- The SessionStart hook also runs this automatically when sessions begin
- Use this command to refresh context if you've lost track of requirements or task status
