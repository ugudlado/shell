---
description: Complete feature development with merge to main and cleanup of worktrees.
model: claude-sonnet-4-5
---

# Model: Sonnet 4.5 (Efficient for systematic completion and merge operations)

# Complete Feature Command

## Linear Ticket

$ARGUMENTS

## Completion Process

Given the Linear ticket ID above, complete the feature development cycle with proper merge and cleanup:

## Phase 1: Pre-Merge Verification

1. **VERIFY FEATURE COMPLETION**:
   ```bash
   # Get main repo and check workflow state
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   cat "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state"
   ```
   - Confirm implementation phase complete
   - Verify review passed (score ≥8)
   - Check memory consolidation done

2. **FINAL VALIDATION** in worktree:
   ```bash
   # Navigate to worktree
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   WORKTREE_PATH=$(grep WORKTREE_PATH "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state" | cut -d= -f2)
   cd "$WORKTREE_PATH"

   # Get list of modified files
   MODIFIED_FILES=$(git diff origin/main --name-only)

   # Run tests for modified components only
   pnpm test -- $(echo "$MODIFIED_FILES" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$')

   # Run pre-commit hooks (includes lint & typecheck on staged files)
   git hook run pre-commit

   # Build to ensure no regressions
   pnpm build
   ```
   - Tests for modified files must pass
   - Pre-commit checks must pass
   - Build must succeed

3. **CHECK GIT STATUS**:
   ```bash
   git status
   git log --oneline -10
   git diff origin/main --stat
   ```
   - No uncommitted changes
   - Clean commit history
   - Review files changed

## Phase 2: Sync with Main

4. **UPDATE FROM MAIN**:
   ```bash
   # In worktree
   git fetch origin
   git rebase origin/main
   ```
   - Resolve any conflicts
   - Re-run tests after rebase
   - Verify functionality intact

5. **REQUEST USER APPROVAL**: Present merge readiness:
   - Show final diff summary
   - Display test results
   - Confirm ready to merge

**Gate:** User approval required to proceed with merge

## Phase 3: Merge to Main

6. **PUSH FEATURE BRANCH**:
   ```bash
   # Push feature branch to remote
   git push -u origin feature/[LINEAR_ID]
   ```

7. **CREATE PULL REQUEST** (if using GitHub):
   ```bash
   gh pr create \
     --title "feat: [LINEAR_ID] [Feature Description]" \
     --body "$(cat <<EOF
## Summary
Implementation of [feature] as specified in Linear ticket [LINEAR_ID]

## Changes
- [List major changes]

## Testing
- All tests passing
- Coverage: X%
- E2E scenarios validated

## Review
- Code review score: X/10
- Security: ✅
- Performance: ✅

## Documentation
- Specs: specs/[LINEAR_ID]/
- Memory patterns documented

Linear: [LINEAR_ID]
EOF
)"
   ```

8. **MERGE STRATEGY** (choose based on project preference):

   ### Option A: Squash Merge (Recommended for features)
   ```bash
   # Navigate to main repository
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   cd "$MAIN_REPO"
   git checkout main
   git pull origin main
   git merge --squash feature/[LINEAR_ID]
   git commit -m "feat: [LINEAR_ID] [Complete feature description]

   Implementation includes:
   - [Key component 1]
   - [Key component 2]
   - [Tests and documentation]

   Co-authored-by: Claude <noreply@anthropic.com>"
   ```

   ### Option B: Regular Merge (For preserving history)
   ```bash
   git checkout main
   git pull origin main
   git merge feature/[LINEAR_ID] --no-ff
   ```

9. **PUSH TO MAIN**:
   ```bash
   git push origin main
   ```

**Gate:** User approval required before pushing to main

## Phase 4: Documentation Archive

10. **ARCHIVE SPECS**: Move specs to completed folder:
    ```bash
    # Navigate to main repo
    MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
    cd "$MAIN_REPO"

    # Archive specs
    mkdir -p specs-completed/$(date +%Y-%m)
    mv specs/[LINEAR_ID] specs-completed/$(date +%Y-%m)/[LINEAR_ID]

    # Create archive summary
    cat > specs-completed/$(date +%Y-%m)/[LINEAR_ID]/ARCHIVE.md <<EOF
    # Archive Summary: [LINEAR_ID]

    - **Feature**: [Description]
    - **Completed**: $(date +%Y-%m-%d)
    - **Developer**: $(git config user.name)
    - **Review Score**: X/10
    - **Memory Patterns Saved**: Y patterns
    - **Branch**: feature/[LINEAR_ID]
    - **Commits**: $(git rev-list --count feature/[LINEAR_ID])
    EOF
    ```

## Phase 5: Cleanup

11. **REQUEST CLEANUP APPROVAL**: Show what will be removed:
    ```bash
    WORKTREE_PATH=$(grep WORKTREE_PATH "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state" | cut -d= -f2)
    echo "Will remove:"
    echo "  - Worktree: $WORKTREE_PATH"
    echo "  - Local branch: feature/[LINEAR_ID]"
    echo "  - Remote branch: origin/feature/[LINEAR_ID]"
    ```

**Gate:** User approval required for cleanup

**Note**: Worktree is automatically removed from Claude's workspace since feature_worktrees/ parent directory is in workspace.

12. **REMOVE WORKTREE**:
    ```bash
    # Navigate to main repo
    MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
    cd "$MAIN_REPO"

    # Get worktree path and remove
    WORKTREE_PATH=$(grep WORKTREE_PATH "specs-completed/$(date +%Y-%m)/[LINEAR_ID]/.workflow-state" | cut -d= -f2)
    git worktree remove "$WORKTREE_PATH"

    # Prune worktree refs
    git worktree prune
    ```

13. **DELETE FEATURE BRANCH**:
    ```bash
    # Delete local branch
    git branch -d feature/[LINEAR_ID]

    # Delete remote branch (after confirmation)
    git push origin --delete feature/[LINEAR_ID]
    ```

14. **UPDATE LINEAR**: Mark as completed:
    - Status: Done
    - Add merge commit SHA
    - Link to archived specs
    - Close ticket

## Phase 6: Final Report

15. **GENERATE COMPLETION REPORT**:
    ```markdown
    # Feature Completion: [LINEAR_ID]

    ## Summary
    ✅ Feature successfully merged to main
    ✅ Tests passing: 100%
    ✅ Code review: X/10
    ✅ Documentation archived
    ✅ Worktree cleaned up
    ✅ Branches deleted

    ## Metrics
    - Development time: X days
    - Commits: Y
    - Files changed: Z
    - Lines added: A
    - Lines removed: B
    - Test coverage: C%

    ## Memory Patterns Saved
    - Global: X patterns
    - Project: Y patterns
    - Team: Z items

    ## Linear Ticket
    - ID: [LINEAR_ID]
    - Status: Completed
    - Merge commit: [SHA]

    ## Archive Location
    specs-completed/YYYY-MM/[LINEAR_ID]/
    ```

## Error Recovery

### Merge Conflicts
```bash
# If conflicts during rebase
git status
# Resolve conflicts in editor
git add .
git rebase --continue
```

### Failed Tests After Rebase
```bash
# Create fix commit
git add .
git commit -m "fix: [LINEAR_ID] Resolve merge conflicts"
# Re-run validation
```

### Worktree Removal Failed
```bash
# Force removal if needed
git worktree remove --force ../feature_worktrees/[LINEAR_ID]
# Manual cleanup
rm -rf ../feature_worktrees/[LINEAR_ID]
git worktree prune
```

## Rollback Procedures

### If Merge Causes Issues
```bash
# Revert the merge
git checkout main
git revert -m 1 [merge-commit-sha]
git push origin main

# Recreate worktree to fix
git worktree add ../feature_worktrees/[LINEAR_ID]-fix feature/[LINEAR_ID]
```

## Best Practices

1. **Always run full test suite** before merging
2. **Archive specs before cleanup** for future reference
3. **Get explicit approval** at each phase
4. **Keep Linear updated** throughout process
5. **Document any issues** in archive

## Quick Winddown (All Steps)
```bash
# For experienced users who want single command
/winddown [LINEAR_ID] --auto-approve

# Runs all steps with minimal interaction
# Still requires approval at critical gates
```

## Partial Winddown Options
```bash
# Just merge, keep worktree
/winddown [LINEAR_ID] --merge-only

# Just cleanup, already merged
/winddown [LINEAR_ID] --cleanup-only

# Archive specs only
/winddown [LINEAR_ID] --archive-only
```

Note: This command ensures proper completion of feature development with full cleanup and documentation preservation. All specs and learnings are archived before removal for future reference.