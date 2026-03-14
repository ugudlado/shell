# Design: Multi-Agent Team Pipeline

## Context

The Claude Code Agent tool supports team mode via `TeamCreate` and `SendMessage` tools. Teams allow named agents to communicate bidirectionally during a session. The `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag is already enabled in settings.json. This project is a dotfiles repo — changes are markdown agent definitions and command files, not application code.

## Goals / Non-Goals

### Goals

- Define 5 specialized agents with clear roles and system prompts
- Modify `/specify` to orchestrate Architect+Researcher team
- Merge `/implement` + `/continue-feature` with Implementer→Reviewer→Verifier loop
- Add automatic Architect+Verifier signoff gate after all tasks

### Non-Goals

- Changing the existing opus-agent, sonnet-agent, haiku-agent definitions
- Adding new hooks (existing hooks already cover subagent lifecycle)
- Modifying the OpenSpec schema or templates
- Implementing persistent cross-session teams (not supported)

## Approaches Considered

### A. Team Mode with SendMessage (Selected)

Agents spawned with `name` parameter, communicate via `SendMessage({to: "agent-name"})`. Orchestrator command creates team, assigns roles, agents collaborate.

**Pros**: Real-time coordination, agents can ask each other questions, natural feedback loops
**Cons**: More complex orchestration in command files, potential for chatty exchanges

### B. Pipeline with Isolated Subagents

Sequential dispatch: implementer runs → output passed to reviewer → output passed to verifier. No direct communication.

**Pros**: Simpler orchestration, predictable token cost
**Cons**: No feedback loop — reviewer can't ask implementer to clarify intent, verifier can't suggest fixes

### C. Single Agent with Multiple Passes

One agent implements, then self-reviews, then self-verifies.

**Pros**: Simplest, lowest token cost
**Cons**: Same agent reviewing its own work — confirmation bias, misses its own blind spots

### Selected Approach

**Approach A** — Team Mode with SendMessage. The feedback loop between agents is the key differentiator. A reviewer that can ask the implementer "why did you use X pattern here?" produces better outcomes than one working from code alone. The architect signoff with access to both spec and implementation catches spec drift that isolated agents miss.

## High-Level Design

### Architecture Overview

```
Command Layer (specify.md, implement.md)
    │
    ▼
Team Orchestration (TeamCreate + Agent spawning)
    │
    ▼
Agent Definitions (src/claude/agents/)
    ├── architect.md    (opus)
    ├── researcher.md   (sonnet)
    ├── implementer.md  (sonnet)
    ├── reviewer.md     (sonnet)
    └── verifier.md     (sonnet)
    │
    ▼
Inter-Agent Communication (SendMessage)
```

### Key Abstractions

1. **Team Topology**: Each command creates a purpose-specific team. `/specify` creates a "specify-team", `/implement` creates an "implement-team".

2. **Role-Based Agents**: Each agent has a focused system prompt defining its responsibilities, what it owns, and how it communicates with peers.

3. **Task State Machine**: `[ ] → [→] → [x]` transitions are owned by the orchestrator (implement.md), not individual agents. Agents report completion; the orchestrator updates tasks.md.

4. **Signoff Gate**: A verification checkpoint after all tasks where the architect re-reads the spec and implementation, and the verifier runs comprehensive checks. Failures produce new tasks.

## Low-Level Design

### Components

#### 1. Architect Agent (`src/claude/agents/architect.md`)
- **Model**: Opus
- **Role**: Designs specifications, reviews implementations against spec
- **In /specify**: Drives artifact creation, delegates research to Researcher
- **In /implement signoff**: Reviews full implementation against spec.md, checks coding practices, identifies gaps
- **Outputs**: spec.md, design.md, tasks.md (specify); gap tasks (signoff)

#### 2. Researcher Agent (`src/claude/agents/researcher.md`)
- **Model**: Sonnet
- **Role**: Explores codebase, fetches docs, investigates prior art
- **In /specify**: Responds to Architect's research requests via SendMessage
- **Tools emphasis**: Grep, Glob, Read, context7, WebSearch, claude-mem
- **Outputs**: Research findings sent back to Architect

#### 3. Implementer Agent (`src/claude/agents/implementer.md`)
- **Model**: Sonnet
- **Role**: Writes code for a single task
- **In /implement**: Receives task + spec context, implements, self-tests
- **Owns**: Code files listed in task's "Files" section
- **Outputs**: Implemented code, sends "task done" to Reviewer

#### 4. Reviewer Agent (`src/claude/agents/reviewer.md`)
- **Model**: Sonnet
- **Role**: Reviews code changes for a single task
- **In /implement**: Receives notification from Implementer, reviews against spec + coding standards
- **Checks**: Bugs, style, spec adherence, security, simplicity
- **Outputs**: Approve (sends to Verifier) or reject with feedback (sends back to Implementer)

#### 5. Verifier Agent (`src/claude/agents/verifier.md`)
- **Model**: Sonnet
- **Role**: Runs verification for a single task
- **In /implement**: Runs tests, type-check, build, manual verification steps from task's "Verify" section
- **In signoff**: Runs comprehensive feature-level verification
- **Outputs**: Pass (task marked [x]) or fail with details (sends back to Implementer)

### Data Flow

#### /specify Flow
```
1. Command creates team: architect + researcher
2. Architect reads feature description
3. Architect → SendMessage(researcher, "investigate X in codebase")
4. Researcher → explores → SendMessage(architect, "found Y pattern")
5. Architect synthesizes → writes spec.md
6. Architect → SendMessage(researcher, "validate feasibility of Z")
7. Researcher → validates → SendMessage(architect, "feasible, note W constraint")
8. Architect writes design.md, tasks.md
9. Command presents artifacts to user via AskUserQuestion
```

#### /implement Flow
```
1. Command loads context (spec, design, tasks)
2. For each pending task:
   a. Command spawns implementer with task context
   b. Implementer writes code
   c. Implementer → SendMessage(reviewer, "task T-N ready for review")
   d. Reviewer reviews → approve/reject
   e. If rejected: Reviewer → SendMessage(implementer, feedback) → goto (b)
   f. If approved: Reviewer → SendMessage(verifier, "T-N approved, verify")
   g. Verifier runs checks → pass/fail
   h. If failed: Verifier → SendMessage(implementer, failure details) → goto (b)
   i. If passed: Command marks task [x]
3. After all tasks: Signoff phase
   a. Command spawns architect + verifier
   b. Architect reviews full impl against spec
   c. Verifier runs comprehensive checks
   d. If gaps: Architect appends new tasks to tasks.md → goto (2)
   e. If clean: Use AskUserQuestion to present signoff summary and ask user to approve
   f. User approves → Feature ready for /complete-feature
```

### State Management

- **Task state**: Managed in `tasks.md` via `[ ]`, `[→]`, `[x]`, `[~]` markers
- **Team state**: Session-scoped, created fresh per command invocation
- **Agent context**: Injected via system prompt + SendMessage payloads
- **Signoff iteration count**: Tracked by orchestrator, max 2 signoff rounds

### Error Handling

- **Implementer fails 3 times on same review feedback**: Escalate to user via AskUserQuestion
- **Verifier fails 3 times on same check**: Invoke `systematic-debugging` skill, then escalate
- **Signoff finds > 5 gaps**: Present gaps to user via AskUserQuestion for prioritization before creating tasks
- **Clean signoff**: User must approve via AskUserQuestion before `/complete-feature` can proceed
- **Agent crashes**: Existing `subagent-gate.sh` hook handles quality gate; orchestrator retries once

## Constraints

- Teams are session-scoped — cannot persist across `/specify` and `/implement` invocations
- SendMessage requires agents to be spawned with `name` parameter
- Agent definitions are markdown files in `src/claude/agents/` with YAML frontmatter
- Commands are markdown files in `src/claude/commands/` with YAML frontmatter

## Trade-offs

- **Token cost vs quality**: Per-task review costs more tokens but catches issues before they compound. Acceptable because late-stage rework costs even more.
- **Complexity vs capability**: Team orchestration in command files is more complex than isolated dispatch. Acceptable because the feedback loops produce better outcomes.
- **Opus for architect vs sonnet**: Opus costs more but architectural decisions and spec validation benefit from deeper reasoning.

## Decisions

1. **Orchestrator stays in command file** → Agent definitions are role-focused; the command file manages team lifecycle, task transitions, and signoff logic.
2. **Max 3 review iterations per task** → Prevents infinite loops. Escalate to user after 3 rejections.
3. **Max 2 signoff rounds** → If architect finds gaps twice, present remaining gaps to user for judgment.
4. **Researcher is passive** → Only responds to Architect requests; doesn't proactively investigate. This keeps the Architect in control of the design direction.
5. **Verifier in signoff** → Added alongside Architect to validate functionality, not just spec adherence.

## Open Questions

1. Should the Researcher agent also be available during `/implement` for investigating unfamiliar code patterns? (Currently specify-only)
2. Should signoff Architect be the same agent instance as specify Architect, or a fresh one? (Currently fresh — no cross-session persistence)
