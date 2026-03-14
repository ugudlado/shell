# Tasks: Multi-Agent Team Pipeline

## Phase 1: Agent Definitions

- [x] T-1: Create architect agent definition
  - **Why**: F1 — Core agent that drives specification and validates implementation
  - **Files**: `src/claude/agents/architect.md`
  - **Verify**: File exists with correct frontmatter (model: opus, tools: ["*"])

- [x] T-2: Create researcher agent definition
  - **Why**: F1 — Research agent that supports architect with codebase/docs exploration
  - **Files**: `src/claude/agents/researcher.md`
  - **Verify**: File exists with correct frontmatter (model: sonnet, tools: ["*"])

- [x] T-3: Create implementer agent definition
  - **Why**: F1 — Code writing agent for task execution
  - **Files**: `src/claude/agents/implementer.md`
  - **Verify**: File exists with correct frontmatter (model: sonnet, tools: ["*"])

- [x] T-4: Create reviewer agent definition
  - **Why**: F1 — Per-task code review agent
  - **Files**: `src/claude/agents/reviewer.md`
  - **Verify**: File exists with correct frontmatter (model: sonnet, tools: ["*"])

- [x] T-5: Create verifier agent definition
  - **Why**: F1 — Per-task and signoff verification agent
  - **Files**: `src/claude/agents/verifier.md`
  - **Verify**: File exists with correct frontmatter (model: sonnet, tools: ["*"])

- [x] T-6: Review checkpoint (phase gate)
  - **Verify**: All 5 agent files exist in `src/claude/agents/`, each with valid YAML frontmatter

## Phase 2: Command Updates

- [x] T-7: Update `/specify` command to use Architect+Researcher team
  - **Why**: F2 — Replace solo opus execution with team-based artifact creation
  - **Files**: `src/claude/commands/specify.md`
  - **Verify**: Command references architect and researcher agents, uses TeamCreate/SendMessage pattern
  - **depends**: T-1, T-2

- [x] T-8: Merge `/continue-feature` into `/implement` command
  - **Why**: F3 — Single command that auto-detects fresh start vs resume
  - **Files**: `src/claude/commands/implement.md`, `src/claude/commands/continue-feature.md`
  - **Verify**: `/implement` loads context when resuming; `/continue-feature` redirects to `/implement`

- [x] T-9: Add Implementer→Reviewer→Verifier per-task loop to `/implement`
  - **Why**: F4 — Per-task quality loop with feedback cycles
  - **Files**: `src/claude/commands/implement.md`
  - **Verify**: Command references all 3 agents, includes max 3 iteration guard, uses SendMessage
  - **depends**: T-3, T-4, T-5, T-8

- [x] T-10: Add Architect+Verifier signoff gate to `/implement`
  - **Why**: F5, F6, AC7 — Automatic signoff after all tasks, with gap task generation and user approval gate
  - **Files**: `src/claude/commands/implement.md`
  - **Verify**: Signoff section references architect and verifier, includes task append logic, max 2 rounds, uses AskUserQuestion for user approval before marking feature ready for /complete-feature
  - **depends**: T-9

- [x] T-11: Review checkpoint (phase gate)
  - **Verify**: All command files are syntactically valid markdown with correct YAML frontmatter

## Phase 3: Integration & Documentation

- [x] T-12: Update global CLAUDE.md with team pipeline documentation
  - **Why**: Critical Standards and Core Workflow tables need to reflect new pipeline
  - **Files**: `~/.claude/CLAUDE.md`
  - **Verify**: CLAUDE.md references team pipeline agents and updated command behavior

- [x] T-13: Update project CLAUDE.md with agent inventory
  - **Why**: Project structure section should list new agents
  - **Files**: `CLAUDE.md`
  - **Verify**: Project structure shows 5 new agents alongside existing 3

- [x] T-14: Verify existing agents are unchanged
  - **Why**: F7 — Confirm no regression to opus-agent, sonnet-agent, haiku-agent
  - **Files**: `src/claude/agents/opus-agent.md`, `src/claude/agents/sonnet-agent.md`, `src/claude/agents/haiku-agent.md`
  - **Verify**: `git diff` shows no changes to these 3 files

- [x] T-15: Review checkpoint (phase gate)
  - **Verify**: Full git diff review, all files consistent, no orphaned references

<!-- Status markers: [ ] pending, [→] in-progress, [x] done, [~] skipped -->
<!-- [P] = parallelizable, (depends: T-xxx) = dependency -->
<!-- No test requirements — tests are optional -->

<!-- VERIFICATION BUGS: If verification reveals new issues, add them as tasks -->
<!-- in the current phase before proceeding. Do NOT skip to the next phase. -->
