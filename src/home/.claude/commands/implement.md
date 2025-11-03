---
description: Execute implementation tasks from Linear ticket and task list
model: claude-sonnet-4-5
---

> **🤖 Model**: Using Sonnet 4.5 for efficient TDD implementation
> **🔌 Plugins**: Will invoke PR Review Toolkit agents after each phase
> **⚠️ Need deeper reasoning?** Use `/model claude-opus-4-1`

## Linear Ticket

$ARGUMENTS

## Implementation Process

Given the Linear ticket ID above (e.g., BOK-456), do this:

1. **FETCH LINEAR CONTEXT**: Get ticket details from Linear web interface or CLI.

2. **CHECK EXISTING MEMORY**: Search Memory MCP for implementation patterns:
   - Use `mcp__memory__search_nodes` for project-specific and global patterns
   - Search for: implementation patterns, coding solutions, testing strategies
   - Categories: Project-specific + `testing_patterns`, `code_conventions`
   - Build on existing implementation knowledge

3. **NAVIGATE TO WORKTREE**: Change to the feature worktree directory:
   ```bash
   # Read worktree path from workflow state
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   WORKTREE_PATH=$(grep WORKTREE_PATH "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state" | cut -d= -f2)
   cd "$WORKTREE_PATH"
   ```

4. **LOAD TASK LIST**: Read specs from main repository:
   ```bash
   # Use symlink or main repo path
   cat specs-link/tasks.md

   # Or directly from main repo
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   cat "$MAIN_REPO/specs/[LINEAR_ID]/tasks.md"
   ```

5. **RESEARCH IMPLEMENTATION**: Search codebase for patterns and solutions:
   - Use Grep and Read tools to find similar implementations
   - Review existing code patterns in the codebase
   - Check memory.md from specs folder for documented insights
   - Check Memory MCP for documented implementation patterns

6. **EXECUTE TASKS IN ORDER**: For each task in the task list:

   a. **PLAN IMPLEMENTATION**: Analyze the task requirements:
      - Understand task requirements and acceptance criteria
      - Consider edge cases and error handling
      - Plan testing approach based on existing patterns
      - Review memory.md for relevant insights

   b. **IMPLEMENT**: Write the code/tests according to task specifications:
      - Follow project conventions and patterns
      - Ensure code quality and error handling
      - Write tests first for TDD tasks

   c. **VALIDATE**: Use smart validation for efficiency:
      ```bash
      # Source smart validation
      source ~/.claude/commands/smart-validation.sh

      # Quick validation of changes
      smart_validate
      ```
      - Tests for modified files pass
      - Code compiles successfully
      - Task acceptance criteria met
      - Coverage ≥90%

   d. **PHASE REVIEW GATE** (after completing a logical phase/group of related tasks):

      Invoke PR Review Toolkit agents in parallel for comprehensive quality check:

      - Use the pr-review-toolkit code-reviewer subagent to check code quality and conventions
      - Use the pr-review-toolkit pr-test-analyzer subagent to validate test coverage
      - Use the pr-review-toolkit silent-failure-hunter subagent to check error handling
      - Use the pr-review-toolkit type-design-analyzer subagent to review type design

      **Quality Gate**: All review agents must score ≥9/10 to proceed to commit.

      If reviews fail:
      - Address feedback from reviewers
      - Fix identified issues
      - Re-run validation and reviews
      - Only proceed to commit after passing ≥9/10

   e. **REVIEW CHANGES**: Present changes to user for review before committing:
      - Show git diff of changes
      - Explain what was implemented and why
      - Ask for user approval

   e. **COMMIT**: After user approval, create logical commits grouped by related functionality:
      ```
      git add [related-files]
      git commit -m "feat: [LINEAR_ID] [logical-group-description]"
      ```

   f. **UPDATE MEMORY**: Document learnings in feature memory.md and Memory MCP:

      **Update memory.md** in main repo's specs:
      ```bash
      # Get main repo path and update memory
      MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
      echo "learnings" >> "$MAIN_REPO/specs/[LINEAR_ID]/memory.md"
      ```
      Document:
      - **Implementation Solutions**: Effective approaches discovered
      - **Problem-Solution Mappings**: Challenges faced and how they were solved
      - **Code Patterns**: Reusable implementation patterns found
      - **Testing Insights**: Effective testing strategies
      - **Integration Learnings**: How components integrate with the project
      - **Progress Updates**: Task completion status and next steps

      **Also update Memory MCP** for persistent implementation knowledge:
      - Use `mcp__memory__create_entities` and `mcp__memory__add_observations`
      - Store project-specific code patterns and solutions
      - Store global patterns in `testing_patterns`, `code_conventions`
      - Document problem-solution mappings for future reference

   g. **UPDATE LINEAR**: Update Linear ticket with progress via web interface or CLI

6. **PARALLEL TASK HANDLING**: For tasks marked [P]:
   - Can be implemented simultaneously if working in different files
   - Coordinate commits to avoid conflicts

7. **FINAL VALIDATION**: After all tasks complete:
   - Run test suite for modified components
   - Build project to ensure no regressions
   - Verify all acceptance criteria met
   - Pre-commit hooks will handle linting/type checking

8. **UPDATE LINEAR TICKET**: Mark ticket as ready for review with summary of changes.

9. **FINALIZE MEMORY**: Complete the memory documentation in memory.md and Memory MCP:

   **Finalize memory.md** with comprehensive feature context:
   - **Feature Summary**: What was built and key decisions
   - **Learnings Summary**: Most important insights for future reference
   - **Reusable Patterns**: Patterns that should be saved to Memory MCP
   - **Project Evolution**: How this feature advances the codebase
   - **Implementation Timeline**: Key milestones and progress

   **Update Memory MCP** with final implementation knowledge:
   - Use `mcp__memory__create_entities` and `mcp__memory__add_observations`
   - Store complete solution patterns (project-specific + global)
   - Document architectural insights
   - Link implementation to planning decisions

10. **PRESENT FOR USER APPROVAL**: Show user the completed feature and memory documentation:
   - Demonstrate functionality and test results
   - Present memory documentation learnings and ask for approval
   - Request feedback on what should be saved to persistent memory

11. **FINALIZE PERSISTENT MEMORY** (after user approval): Use memory.md as reference to update Memory MCP:
   - Use `mcp__memory__create_entities` and `mcp__memory__add_observations`
   - **Cross-Project Patterns**: Save globally reusable patterns (`testing_patterns`, `code_conventions`)
   - **Project-Specific Knowledge**: Save project-specific learnings (entity type: project name)
   - Reference the comprehensive memory.md for complete context

12. **REPORT**: Output summary of:
   - Tasks completed
   - Commits created
   - Test results
   - Memory learnings documented in memory.md and Memory MCP
   - Any issues or blockers encountered

## Implementation Notes

- **Model Choice**: Sonnet 4.5 optimized for code implementation, testing, and debugging
- **Plugin Integration**: PR Review Toolkit agents invoked after each phase for quality gates
- **Quality Standards**: ≥9/10 review scores + ≥90% test coverage required
- **Memory Strategy**: Feature memory.md + Memory MCP (project-specific + global patterns)
- **TDD Workflow**: Tests written first, implementation makes tests pass
- **Progress Tracking**: Continuous memory updates throughout implementation
- **Smart Validation**: Uses smart validation scripts for efficient testing
- **Commit Strategy**: Logical commits grouped by functionality with Linear ticket references