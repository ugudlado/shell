---
description: Generate implementation plan from Linear ticket and specification.
model: claude-sonnet-4-5
---

# Planning Strategy: Use Zen Planner with GPT-5 for systematic architectural design

## Linear Ticket

$ARGUMENTS

## Planning Process

Given the Linear ticket ID above (e.g., BOK-456), do this:

1. **FETCH LINEAR CONTEXT**: Get ticket details from Linear web interface or CLI.

2. **CHECK EXISTING MEMORY**: View memory directory for architectural patterns:
   - Use memory tool to view `/memories` directory
   - Search for similar architecture decisions and patterns
   - Review past implementation approaches and trade-offs
   - Build on existing architectural knowledge

3. **ANALYZE TECHNICAL APPROACH WITH ZEN**: Use `mcp__zen__planner` with `model: "gpt5"` to systematically plan the implementation strategy:
   - Technical complexity and scope
   - Integration points with existing Lighthouse systems
   - Performance and scalability considerations
   - Risk factors and mitigation strategies
   - Awilix DI container integration patterns

   The Zen Planner tool will:
   - Break down complex tasks through sequential planning
   - Provide revision and branching capabilities for approach exploration
   - Document technical decisions and rationale systematically

4. **FIND SPECS**: Locate specification in main repository:
   ```bash
   # Get main repo path dynamically
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

   # Read specs from main repo
   cat "$MAIN_REPO/specs/[LINEAR_ID]/spec.md"
   ```

5. **RESEARCH ARCHITECTURE**: Search codebase for relevant patterns:
   - Use Grep to find similar controller/service implementations
   - Review existing Awilix DI patterns in server/core/container-setup.ts
   - Check timeline node patterns in server/controllers/hierarchy-controller.ts
   - Study authentication middleware patterns
   - Check memory tool for documented architectural patterns

6. **REVIEW PROJECT CONSTRAINTS**: Check project documentation:
   - Read CLAUDE.md for development guidelines
   - Review shared/schema.ts for data model constraints
   - Check existing patterns in timeline node system

7. **LOAD PLAN TEMPLATE**: Read `~/.claude/templates/plan-template.md` for structure.

8. **GENERATE IMPLEMENTATION PLAN**: Create comprehensive plan at `specs/[LINEAR_ID]/plan.md`:
   - Technical Context: Language, dependencies, testing framework, performance goals
   - Constitution Check: Verify approach aligns with project principles
   - Phase 0: Research and technical decisions → `research.md`
   - Phase 1: Design artifacts → `data-model.md`, `contracts/`, `quickstart.md`
   - Phase 2: Task generation → `tasks.md` (executed in this command, not deferred)
   - Include thinking rationale and architecture decisions

9. **CREATE DESIGN ARTIFACTS**:
   - **research.md**: Technical decisions, library choices, approach rationale
   - **data-model.md**: Entity definitions, relationships, validation rules (if applicable)
   - **contracts/**: API endpoint definitions, request/response schemas (if applicable)
   - **quickstart.md**: Test scenarios and acceptance criteria

10. **GENERATE TASK LIST** (Phase 2): Create `specs/[LINEAR_ID]/tasks.md` using the tasks template:
   - Load `~/.claude/templates/tasks-template.md` as structure
   - Generate TDD-ordered tasks from design artifacts:
     - Each contract → contract test task [P]
     - Each entity → model creation task [P]
     - Each user story → integration test task
     - Implementation tasks to make tests pass
   - Mark parallelizable tasks with [P] (different files, no dependencies)
   - Order: Setup → Tests → Models → Services → Endpoints → Polish
   - Number tasks sequentially (T001, T002, etc.)
   - Include exact file paths and acceptance criteria

11. **UPDATE LINEAR TICKET**: Add implementation approach and technical details to Linear ticket description.

12. **UPDATE MEMORY.MD**: Add to `specs/[LINEAR_ID]/memory.md`:
    - **Architecture Decisions**: Key technical choices and rationale
    - **Integration Patterns**: How feature integrates with Lighthouse systems
    - **Design Trade-offs**: Decisions made and alternatives considered
    - **Lighthouse Patterns**: Project-specific implementation approaches
    - **Reusable Architecture**: Patterns applicable to other features
    - **Progress Tracking**: Planning phase complete, ready for implementation

   **Also update memory tool** for persistent architectural knowledge:
   - Use memory tool `create` operation to store reusable architecture patterns
   - Document design decisions and trade-offs
   - Link architectural concepts for future reference

13. **REQUEST USER APPROVAL**: Present the complete implementation plan with task list and ask user to review and approve before proceeding to worktree setup.

14. **CREATE WORKTREE** (after approval): Set up isolated feature environment:
   ```bash
   # Get main repo and create worktree
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   cd "$MAIN_REPO"

   # Create worktree in parent directory
   WORKTREE_PATH="$(dirname "$MAIN_REPO")/feature_worktrees/[LINEAR_ID]"
   git worktree add "$WORKTREE_PATH" -b feature/[LINEAR_ID]

   # Setup worktree
   cd "$WORKTREE_PATH"
   pnpm install

   # Create symlink to specs in main repo for easy access
   ln -s "$MAIN_REPO/specs/[LINEAR_ID]" specs-link

   # Update workflow state with paths
   echo "WORKTREE_PATH=$WORKTREE_PATH" >> "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state"
   ```

15. **REPORT**: Output Linear ticket ID, worktree path, generated artifacts (plan.md, research.md, data-model.md, contracts/, quickstart.md, **tasks.md**), and readiness for implementation.

   **Note**: If this is the first feature, remind user to add feature_worktrees directory to workspace once:
   ```
   /add-dir ../feature_worktrees
   ```
   This makes all current and future worktrees automatically accessible without per-feature setup.

## Implementation Notes

- **Zen Integration**: Uses `mcp__zen__planner` with GPT-5 for systematic architectural planning and task breakdown
- **Phase 2 Execution**: This command now **generates tasks.md** directly (no longer needs separate /tasks command)
- **Memory Strategy**: Maintains feature-specific memory.md + persistent cross-project memory tool for architecture patterns
- **Complete Output**: plan.md + design docs + tasks.md all generated in one command
- **Next Command**: Use `/implement [LINEAR_ID]` to execute the generated task list
- **Model Choice**: GPT-5 provides superior reasoning for architectural decisions and complex planning
