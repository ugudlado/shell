---
description: Generate implementation plan from Linear ticket and specification
model: claude-opus-4-1
---

> **🤖 Model**: Using Opus 4.1 for architectural design and strategic planning
> **🔌 Plugins**: Will invoke feature-dev code-architect agents for multiple approaches
> **⚙️ Hybrid**: Combines Zen Planner (GPT-5) + Plugin agents for comprehensive design

## Linear Ticket

$ARGUMENTS

## Planning Process

Given the Linear ticket ID above (e.g., LIG-456), do this:

1. **FETCH LINEAR CONTEXT**: Use `mcp__linear-server__get_issue` with ticket ID.

2. **CHECK EXISTING MEMORY**: Search Memory MCP for architectural patterns:
   - Use `mcp__memory__search_nodes` for project-specific and global architecture patterns
   - Search for: similar architecture decisions, implementation approaches, trade-offs
   - Categories: Project-specific + `architecture_patterns`, `development_workflow`

3. **FIND SPECS**: Locate specification in main repository:
   ```bash
   # Get main repo path dynamically
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

   # Read specs from main repo
   cat "$MAIN_REPO/specs/[LINEAR_ID]/spec.md"
   ```

4. **DESIGN ARCHITECTURE WITH PLUGIN AGENTS**: Launch feature-dev plugin code-architect agents in parallel to explore different approaches:

   - Use the code-architect subagent to design a minimal-changes approach
   - Use the code-architect subagent to design a clean-architecture approach
   - Use the code-architect subagent to design a pragmatic-balance approach

   Wait for all three architecture designs to complete.

5. **ANALYZE WITH ZEN PLANNER**: Use `mcp__zen__planner` with `model: "gpt5"` to systematically evaluate and synthesize:
   - Analyze the three architecture options from plugin agents
   - Assess technical complexity and scope
   - Integration points with existing Lighthouse systems
   - Performance and scalability considerations
   - Risk factors and mitigation strategies
   - Awilix DI container integration patterns

   The Zen Planner tool will:
   - Break down complex tasks through sequential planning
   - Provide revision and branching capabilities for approach exploration
   - Document technical decisions and rationale systematically

6. **SYNTHESIZE & PRESENT OPTIONS**: Present to user:
   - Summary of each approach (from code-architect agents)
   - Trade-offs comparison
   - Zen Planner analysis and recommendation

   Wait for user approval of selected approach before proceeding.

7. **REVIEW PROJECT CONSTRAINTS**: Check project documentation:
   - Read CLAUDE.md for development guidelines
   - Review shared/schema.ts for data model constraints
   - Check existing patterns in timeline node system

8. **LOAD PLAN TEMPLATE**: Read `~/.claude/templates/plan-template.md` for structure.

9. **GENERATE IMPLEMENTATION PLAN**: Based on selected approach, create comprehensive plan at `specs/[LINEAR_ID]/plan.md`:
   - Technical Context: Language, dependencies, testing framework, performance goals
   - Constitution Check: Verify approach aligns with project principles
   - Phase 0: Research and technical decisions → `research.md`
   - Phase 1: Design artifacts → `data-model.md`, `contracts/`, `quickstart.md`
   - Phase 2: Task generation → `tasks.md` (executed in this command, not deferred)
   - Include thinking rationale and architecture decisions

10. **CREATE DESIGN ARTIFACTS**:
   - **research.md**: Technical decisions, library choices, approach rationale
   - **data-model.md**: Entity definitions, relationships, validation rules (if applicable)
   - **contracts/**: API endpoint definitions, request/response schemas (if applicable)
   - **quickstart.md**: Test scenarios and acceptance criteria

11. **GENERATE TASK LIST** (Phase 2): Create `specs/[LINEAR_ID]/tasks.md` using the tasks template:
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

12. **UPDATE LINEAR TICKET**: Add implementation approach and technical details to Linear ticket description.

13. **UPDATE MEMORY.MD**: Add to `specs/[LINEAR_ID]/memory.md`:
    - **Architecture Decisions**: Key technical choices and rationale
    - **Integration Patterns**: How feature integrates with Lighthouse systems
    - **Design Trade-offs**: Decisions made and alternatives considered
    - **Lighthouse Patterns**: Project-specific implementation approaches
    - **Reusable Architecture**: Patterns applicable to other features
    - **Progress Tracking**: Planning phase complete, ready for implementation

   **Also update Memory MCP** for persistent architectural knowledge:
   - Use `mcp__memory__create_entities` and `mcp__memory__add_observations`
   - Store project-specific architecture decisions
   - Store global reusable patterns in `architecture_patterns`
   - Link architectural concepts for future reference

14. **REQUEST USER APPROVAL**: Present the complete implementation plan with task list and ask user to review and approve before proceeding to worktree setup.

15. **CREATE WORKTREE** (after approval): Set up isolated feature environment:
   ```bash
   # Get main repo and create worktree
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
   cd "$MAIN_REPO"

   # Create worktree in fixed location
   WORKTREE_PATH="$HOME/code/feature_worktrees/[LINEAR_ID]"
   mkdir -p "$HOME/code/feature_worktrees"
   git worktree add "$WORKTREE_PATH" -b feature/[LINEAR_ID]

   # Setup worktree
   cd "$WORKTREE_PATH"
   pnpm install

   # Create symlink to specs in main repo for easy access
   ln -s "$MAIN_REPO/specs/[LINEAR_ID]" specs-link

   # Create symlinks for config
   ln -s "$MAIN_REPO/.envrc" ./.envrc
   ln -s "$MAIN_REPO/.mcp.json" ./.mcp.json

   # Update workflow state with paths
   echo "WORKTREE_PATH=$WORKTREE_PATH" >> "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state"
   ```

16. **REPORT**: Output Linear ticket ID, worktree path, generated artifacts (plan.md, research.md, data-model.md, contracts/, quickstart.md, **tasks.md**), and readiness for implementation.

   **Note**: If this is the first feature, remind user to add feature_worktrees directory to workspace once:
   ```
   /add-dir ~/code/feature_worktrees
   ```
   This makes all current and future worktrees automatically accessible without per-feature setup.

## Implementation Notes

- **Hybrid Approach**: Combines feature-dev plugin code-architect agents + Zen Planner (GPT-5)
- **Plugin Integration**: Leverages code-architect for multi-approach architecture exploration
- **Zen Planning**: Uses GPT-5 for systematic planning and task breakdown
- **Phase 2 Execution**: This command now **generates tasks.md** directly (no longer needs separate /tasks command)
- **Memory Strategy**: Feature memory.md + Memory MCP (project-specific + global architecture patterns)
- **Complete Output**: plan.md + design docs + tasks.md all generated in one command
- **Model**: Opus 4.1 for deep architectural design capability
- **Next Command**: Use `/implement [LINEAR_ID]` to execute the generated task list
