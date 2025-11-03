---
description: Create commits in logical groups
gitignored: true
project: true
model: claude-haiku-4-5
---

# Commit Group Command

Create organized commits by grouping related changes logically.

## Your Task

1. **Analyze Current Changes**
   - Run `git status` and `git diff` to see all modified/untracked files
   - Group files by logical purpose (e.g., schema changes, service layer, UI updates, tests, scripts)

2. **Propose Commit Groups**
   - Present user with suggested logical groups
   - For each group, show:
     - Brief description of what the group does
     - Files included
     - Suggested commit message following format: `feat: [LIG-XXX] description` or `refactor: [LIG-XXX] description`
   - Ask user to approve or modify groupings

3. **Create Commits**
   - For each approved group:
     - Stage only those specific files
     - Create commit with the agreed message
     - Include co-author footer:
       ```
       🤖 Generated with [Claude Code](https://claude.com/claude-code)

       Co-Authored-By: Claude <noreply@anthropic.com>
       ```

4. **Summary**
   - After all commits, show `git log --oneline -[n]` where n = number of commits created
   - Confirm all changes are committed with `git status`

## Guidelines

- **Atomic commits**: Each commit should be a single logical change
- **Common groups**:
  - Schema/database changes
  - Service layer changes
  - API/controller changes
  - UI component changes
  - Test additions/updates
  - Scripts/tooling
  - Documentation
- **Commit types**: feat, fix, refactor, test, chore, docs
- **Always reference Linear ticket** in commit message if on feature branch
- **Exclude unrelated changes**: Don't commit files that don't belong to current feature

## Example Groups

```
Group 1: Schema changes (feat)
- packages/schema/src/schema.ts
- packages/schema/src/types.ts

Group 2: Service layer implementation (feat)
- packages/server/src/services/llm-summary.service.ts
- packages/server/src/core/container-setup.ts
- packages/server/src/core/container-tokens.ts

Group 3: Integration into hierarchy service (feat)
- packages/server/src/services/hierarchy-service.ts

Group 4: UI type updates (refactor)
- packages/ui/src/components/nodes/career-transition/wizard/steps/types.ts

Group 5: UI display updates (feat)
- packages/ui/src/pages/career-transition-detail.tsx
- packages/ui/src/pages/interview-chapter-detail.tsx

Group 6: Scripts and utilities (chore)
- packages/server/scripts/*.ts
```

## Notes

- If user provides grouping preferences, follow them
- If changes are small enough, suggest a single commit
- Always use conventional commit format
- Check for pre-commit hooks - if they modify files, be prepared to amend
