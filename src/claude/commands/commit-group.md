---
description: Create commits in logical groups
gitignored: true
project: true
---

Use the Agent tool to spawn a haiku-agent with the following prompt:

---

# Commit Group — Autonomous Agent Task

Create organized commits by grouping related changes logically.

## Your Task

1. **Analyze Current Changes**
   - Run `git status` and `git diff --name-status` to see all modified/untracked files
   - Run `git log --oneline -5` to match commit message style
   - Group files by logical purpose (e.g., schema changes, service layer, UI updates, tests, scripts)

2. **Plan Commit Groups**
   - Determine logical groups silently
   - Each group gets a commit message following conventional commit format: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`
   - Reference Linear ticket in commit message if on a feature branch

3. **Create Commits** (no approval needed — commit immediately)
   - For each group:
     - Stage only those specific files
     - Create commit with a HEREDOC message:
       ```
       git commit -m "$(cat <<'EOF'
       type: description

       Co-Authored-By: Claude <noreply@anthropic.com>
       EOF
       )"
       ```

4. **Summary**
   - After all commits, show `git log --oneline -[n]` where n = number of commits created
   - Confirm all changes are committed with `git status`

## Guidelines

- **Atomic commits**: Each commit should be a single logical change
- **Commit types**: feat, fix, refactor, test, chore, docs
- **Exclude unrelated changes**: Don't commit files that don't belong to current feature
- If changes are small enough, suggest a single commit
- Check for pre-commit hooks — if they modify files, re-stage and create a NEW commit (never amend)
