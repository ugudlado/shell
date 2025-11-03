---
description: Create Linear ticket and feature specification from natural language description
model: claude-opus-4-1
---

> **🤖 Model**: Using Opus 4.1 for deep requirement analysis
> **🔌 Plugins**: Will invoke feature-dev code-explorer agents for codebase exploration
> **⚙️ Hybrid**: Combines Zen ThinkDeep (GPT-5) + Plugin agents for comprehensive analysis

## Feature Description

$ARGUMENTS

## Specification Process

Given the feature description above, do this:

1. **CHECK EXISTING MEMORY**: Search Memory MCP for relevant patterns:
   - Use `mcp__memory__search_nodes` to find project-specific and global patterns
   - Search for: similar features, architecture decisions, relevant patterns
   - Categories: Project-specific (e.g., `lighthouse_journey`) + global patterns
   - Build on existing knowledge before starting analysis

2. **EXPLORE CODEBASE WITH PLUGIN AGENTS**: Launch feature-dev plugin code-explorer agents in parallel for comprehensive codebase understanding:

   - Use the code-explorer subagent to find features similar to this request
   - Use the code-explorer subagent to map the architecture for the relevant area

   Wait for both exploration tasks to complete before proceeding.

3. **ANALYZE REQUIREMENTS WITH ZEN**: Use `mcp__zen__thinkdeep` with `model: "gpt5"` to systematically break down the feature request and identify:
   - Key components and functionality (incorporating code exploration findings)
   - Scope boundaries and constraints
   - Potential ambiguities requiring clarification
   - Dependencies on existing systems identified by explorers

   The Zen ThinkDeep tool will:
   - Provide systematic step-by-step analysis
   - Question assumptions and validate reasoning
   - Identify edge cases and potential failure modes
   - Document uncertainty with [NEEDS CLARIFICATION] markers

4. **SYNTHESIZE FINDINGS**: Combine insights from multiple sources:
   - Code exploration (from plugin code-explorer agents)
   - Zen ThinkDeep analysis (GPT-5 reasoning)
   - Memory patterns (existing knowledge)
   - CLAUDE.md and project documentation

   Create a comprehensive understanding before specification

5. **CREATE LINEAR TICKET**: Use `mcp__linear-server__create_issue` to create:
   - Title: "Feature: [extracted concise title from description]"
   - Description: Include user requirements and research findings
   - Team: Read from project's CLAUDE.md (e.g., LighthouseAI for this project)
   - Labels: ["feature", "needs-spec"]
   - Extract the Linear ID (e.g., LIG-456) for subsequent steps

   **Note**: Linear team configuration is project-specific. Read the team name from the project's CLAUDE.md file in the "LINEAR INTEGRATION" section.

6. **PREPARE SPECS DIRECTORY**: Create specs in main repository:
   ```bash
   # Get main repo path (works from anywhere - first worktree is always main)
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

   # Create specs structure in main repo
   mkdir -p "$MAIN_REPO/specs/[LINEAR_ID]"
   touch "$MAIN_REPO/specs/[LINEAR_ID]/spec.md"
   touch "$MAIN_REPO/specs/[LINEAR_ID]/memory.md"
   touch "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state"

   # Save repo path in workflow state
   echo "MAIN_REPO=$MAIN_REPO" > "$MAIN_REPO/specs/[LINEAR_ID]/.workflow-state"
   ```
   Note:
   - Specs remain in main repo for persistence across worktrees
   - Feature worktrees for implementation will be created in ~/code/feature_worktrees/ during /plan or /implement
   - Do NOT create worktrees during specification phase

7. **LOAD TEMPLATE**: Read `~/.claude/templates/spec-template.md` to understand structure.

8. **WRITE SPECIFICATION**: Write detailed spec to SPEC_FILE using template structure:
   - Replace [LINEAR_ID] with actual ticket ID
   - Fill user scenarios from the description
   - Generate functional requirements
   - Mark any ambiguities with [NEEDS CLARIFICATION: specific question]
   - Include memory findings in context

9. **UPDATE LINEAR TICKET**: Update the Linear ticket with link to spec file location.

10. **DOCUMENT LEARNINGS**: Store learnings in feature memory.md and Memory MCP:

   **A. Create `specs/[LINEAR_ID]/memory.md`** with feature-specific context:
   - **Patterns Found**: Similar implementations and approaches discovered
   - **Technical Insights**: Key decisions and rationale
   - **Project Context**: Project-specific considerations
   - **Reusable Knowledge**: Patterns that could apply to other features
   - **Questions Resolved**: Clarifications made during specification
   - **Progress Tracking**: Current status and next steps

   **B. Update Memory MCP** for persistent knowledge:
   - Use `mcp__memory__create_entities` and `mcp__memory__add_observations`
   - Store project-specific patterns (entity type: project name)
   - Store global reusable patterns (entity types: `architecture_patterns`, `testing_patterns`, etc.)
   - Link related concepts for future reference

11. **REQUEST USER APPROVAL**: Present the specification and ask user to review and approve before proceeding to planning phase.

12. **REPORT**: Output the Linear ticket ID, spec file location, memory.md path, and await user approval for planning.

## Implementation Notes

- **Hybrid Approach**: Combines feature-dev plugin code-explorer agents + Zen ThinkDeep (GPT-5)
- **Plugin Integration**: Leverages code-explorer for comprehensive codebase understanding
- **Zen Analysis**: Uses GPT-5 for deep requirement analysis and systematic thinking
- **Memory Strategy**: Feature memory.md + Memory MCP (project-specific + global patterns)
- **Linear Config**: Reads team info from project's CLAUDE.md
- **Model**: Opus 4.1 for deep analysis capability
- **Next Command**: Use `/plan [LINEAR_ID]` to generate implementation plan and task list
