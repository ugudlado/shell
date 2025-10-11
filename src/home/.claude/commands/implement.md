---
description: Execute implementation tasks from Linear ticket and task list.
model: claude-sonnet-4-5
---

# Model: Sonnet 4.5 (Optimized for coding, implementation, and test execution)

Given the Linear ticket ID (e.g., BOK-456) provided as an argument, do this:

1. **FETCH LINEAR CONTEXT**: Get ticket details from Linear web interface or CLI.

2. **CHECK EXISTING MEMORY**: View memory directory for implementation patterns:
   - Use memory tool to view `/memories` directory
   - Search for related implementation patterns and solutions
   - Review coding patterns and best practices
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
   - Review existing code patterns in the Lighthouse codebase
   - Check memory.md from specs folder for documented insights
   - Check memory tool for documented implementation patterns

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

   d. **REVIEW CHANGES**: Present changes to user for review before committing:
      - Show git diff of changes
      - Explain what was implemented and why
      - Ask for user approval

   e. **COMMIT**: After user approval, create logical commits grouped by related functionality:
      ```
      git add [related-files]
      git commit -m "feat: [LINEAR_ID] [logical-group-description]"
      ```

   f. **UPDATE MEMORY**: Document learnings in both memory.md and memory tool:

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
      - **Integration Learnings**: How components integrate with Lighthouse
      - **Progress Updates**: Task completion status and next steps

      **Also update memory tool** for persistent implementation knowledge:
      - Use memory tool `create` or `str_replace` operations
      - Store reusable code patterns and solutions
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

9. **FINALIZE MEMORY**: Complete the memory documentation in both memory.md and memory tool:

   **Finalize memory.md** with comprehensive feature context:
   - **Feature Summary**: What was built and key decisions
   - **Learnings Summary**: Most important insights for future reference
   - **Reusable Patterns**: Patterns that should be saved to global memory
   - **Project Evolution**: How this feature advances the Lighthouse codebase
   - **Implementation Timeline**: Key milestones and progress

   **Update memory tool** with final implementation knowledge:
   - Store complete solution patterns
   - Document architectural insights
   - Link implementation to planning decisions

10. **PRESENT FOR USER APPROVAL**: Show user the completed feature and memory documentation:
   - Demonstrate functionality and test results
   - Present memory documentation learnings and ask for approval
   - Request feedback on what should be saved to persistent memory

11. **FINALIZE PERSISTENT MEMORY** (after user approval): Use memory.md as reference to update memory tool:
   - Use memory tool operations (`create`, `str_replace`) to store learnings
   - **Cross-Project Patterns**: Save broadly reusable patterns and insights
   - **Project-Specific Knowledge**: Save Lighthouse-specific learnings
   - Reference the comprehensive memory.md for complete context

12. **REPORT**: Output summary of:
   - Tasks completed
   - Commits created
   - Test results
   - Memory learnings documented and saved to both memory.md and memory tool
   - Any issues or blockers encountered

## Implementation Notes

- **Model Choice**: Sonnet 4.5 optimized for code implementation, testing, and debugging
- **Memory Strategy**: Maintains feature-specific memory.md + persistent cross-project memory tool
- **TDD Workflow**: Tests written first, implementation makes tests pass
- **Progress Tracking**: Continuous memory updates throughout implementation
- **Smart Validation**: Uses smart validation scripts for efficient testing
- **Commit Strategy**: Logical commits grouped by functionality with Linear ticket references