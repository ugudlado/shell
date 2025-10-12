---
description: Create Linear ticket and feature specification from natural language description.
model: claude-sonnet-4-5
---

# Analysis Strategy: Use Zen ThinkDeep with GPT-5 for systematic requirement analysis

## Feature Description

$ARGUMENTS

## Specification Process

Given the feature description above, do this:

1. **CHECK EXISTING MEMORY**: View memory directory first to leverage past learnings:
   - Use memory tool to view `/memories` directory
   - Search for related patterns, similar features, or relevant decisions
   - Build on existing knowledge before starting analysis

2. **ANALYZE REQUIREMENTS WITH ZEN**: Use `mcp__zen__thinkdeep` with `model: "gpt5"` to systematically break down the feature request and identify:
   - Key components and functionality needed
   - Scope boundaries and constraints
   - Potential ambiguities requiring clarification
   - Dependencies on existing systems

   The Zen ThinkDeep tool will:
   - Provide systematic step-by-step analysis
   - Question assumptions and validate reasoning
   - Identify edge cases and potential failure modes
   - Document uncertainty with [NEEDS CLARIFICATION] markers

3. **RESEARCH EXISTING PATTERNS**: Search codebase for similar features:
   - Use Grep and Read tools to find related implementations
   - Check CLAUDE.md and project documentation for patterns
   - Review similar features in the timeline system
   - Check memory tool for documented implementation patterns

4. **CREATE LINEAR TICKET**: Use Linear web interface or CLI to create:
   - Title: "Feature: [extracted concise title from description]"
   - Description: Include user requirements and research findings
   - Team: "BOK"
   - Labels: ["feature", "needs-spec"]
   - Extract the Linear ID (e.g., BOK-456) for subsequent steps

5. **PREPARE SPECS DIRECTORY**: Create specs in main repository:
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

6. **LOAD TEMPLATE**: Read `~/.claude/templates/spec-template.md` to understand structure.

7. **WRITE SPECIFICATION**: Write detailed spec to SPEC_FILE using template structure:
   - Replace [LINEAR_ID] with actual ticket ID
   - Fill user scenarios from the description
   - Generate functional requirements
   - Mark any ambiguities with [NEEDS CLARIFICATION: specific question]
   - Include memory findings in context

8. **UPDATE LINEAR TICKET**: Update the Linear ticket with link to spec file location.

9. **DOCUMENT LEARNINGS**: Store learnings in both memory.md and memory tool:

   **A. Create `specs/[LINEAR_ID]/memory.md`** with feature-specific context:
   - **Patterns Found**: Similar implementations and approaches discovered
   - **Technical Insights**: Key decisions and rationale
   - **Project Context**: Lighthouse-specific considerations
   - **Reusable Knowledge**: Patterns that could apply to other features
   - **Questions Resolved**: Clarifications made during specification
   - **Progress Tracking**: Current status and next steps

   **B. Update memory tool** for persistent cross-project knowledge:
   - Use memory tool `create` operation to store reusable patterns
   - Document project-agnostic solutions in `/memories` directory
   - Link related concepts and decisions for future reference

10. **REQUEST USER APPROVAL**: Present the specification and ask user to review and approve before proceeding to planning phase.

11. **REPORT**: Output the Linear ticket ID, spec file location, memory.md path, and await user approval for planning.

## Implementation Notes

- **Zen Integration**: Uses `mcp__zen__thinkdeep` with GPT-5 for deep requirement analysis and systematic thinking
- **Memory Strategy**: Maintains feature-specific memory.md + persistent cross-project memory tool
- **Next Command**: Use `/plan [LINEAR_ID]` to generate implementation plan and task list
- **Model Choice**: GPT-5 provides superior reasoning for specification and ambiguity detection
