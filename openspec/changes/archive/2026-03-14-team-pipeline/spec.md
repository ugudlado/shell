---
feature-id: 2026-03-15-team-pipeline
linear-ticket: none
---

# Specification: Multi-Agent Team Pipeline

## Motivation

Current workflow dispatches isolated subagents per task with no inter-agent communication. Each agent works independently — the architect who designed the spec never validates the implementation, the reviewer can't ask the implementer for clarification, and verification happens as an afterthought. This leads to spec drift, late-stage rework, and no quality feedback loop.

## What Changes

Introduce 5 specialized agents that work as coordinated teams across the feature lifecycle:

- **Specify phase**: Architect (opus) + Researcher (sonnet) collaborate via SendMessage to produce spec/design/tasks artifacts
- **Implement phase**: Implementer (sonnet) → Reviewer (sonnet) → Verifier (sonnet) per-task loop with feedback cycles
- **Signoff phase**: Architect + Verifier validate the complete feature against spec before completion
- `/implement` and `/continue-feature` merged into a single command

## Requirements

### Functional

1. **F1**: Create 5 new agent definitions: architect, researcher, implementer, reviewer, verifier
2. **F2**: `/specify` command orchestrates Architect+Researcher team for artifact creation
3. **F3**: `/implement` command merges `/continue-feature` functionality (auto-detect fresh vs resume)
4. **F4**: `/implement` runs Implementer→Reviewer→Verifier loop per task
5. **F5**: Automatic Architect+Verifier signoff after all tasks complete
6. **F6**: Signoff failures append new tasks to tasks.md and re-enter the implement loop
7. **F7**: Existing agents (opus-agent, sonnet-agent, haiku-agent) remain unchanged

### Non-Functional

1. **NF1**: Agent definitions use `tools: ["*"]` for universal tool access
2. **NF2**: All user interactions use `AskUserQuestion` tool
3. **NF3**: Team communication via `SendMessage` tool between named agents

## Architecture

```
/specify                          /implement
┌──────────────────┐              ┌──────────────────────────────────────┐
│ TeamCreate       │              │ TeamCreate                          │
│                  │              │                                     │
│ ┌────────────┐   │              │ For each task:                      │
│ │ Architect  │◄─►│SendMessage   │ ┌─────────┐  ┌────────┐  ┌───────┐ │
│ │ (opus)     │   │              │ │Implement │─►│Reviewer│─►│Verify │ │
│ └──────┬─────┘   │              │ │(sonnet)  │  │(sonnet)│  │(sonnet│ │
│        │         │              │ └────┬─────┘  └───┬────┘  └──┬────┘ │
│ ┌──────▼─────┐   │              │      ▲            │          │      │
│ │ Researcher │   │              │      └────────────┘──────────┘      │
│ │ (sonnet)   │   │              │         (loop on failure)           │
│ └────────────┘   │              │                                     │
└──────────────────┘              │ After all tasks:                    │
                                  │ ┌──────────┐  ┌────────┐           │
                                  │ │Architect │─►│Verifier│           │
                                  │ │(signoff) │  │(signoff│           │
                                  │ └──────────┘  └────────┘           │
                                  │   gaps? → append tasks → re-loop   │
                                  └──────────────────────────────────────┘
```

## Acceptance Criteria

1. **AC1**: Running `/specify "add auth"` creates a team with architect + researcher agents that collaborate to produce spec.md, design.md, tasks.md
2. **AC2**: Running `/implement FEATURE-ID` on a fresh feature loads context and begins implementation loop
3. **AC3**: Running `/implement FEATURE-ID` on a resumed feature detects in-progress tasks and continues
4. **AC4**: Each task goes through Implementer→Reviewer→Verifier before marking [x]
5. **AC5**: After all tasks complete, Architect+Verifier signoff runs automatically
6. **AC6**: Signoff gaps generate new tasks appended to tasks.md, implementation loop resumes
7. **AC7**: After clean signoff, user is asked to approve via AskUserQuestion before `/complete-feature` can proceed
8. **AC8**: Existing `/complete-feature` workflow continues to work unchanged but requires prior signoff approval

## Alternatives Considered

1. **Single orchestrator agent**: One agent manages all phases. Rejected — loses the benefits of specialized roles and inter-agent feedback.
2. **Per-phase review only (current)**: Review at phase boundaries, not per-task. Rejected — per-task review was chosen to catch issues early and prevent compounding errors.
3. **Persistent team across commands**: Keep team alive from `/specify` through `/implement`. Rejected — teams are session-scoped, and commands run in separate sessions.

## Impact

- `/continue-feature` command becomes a no-op redirect to `/implement` (backward compatible)
- Existing agents (opus-agent, sonnet-agent, haiku-agent) are untouched
- Token cost increases due to per-task review, offset by fewer late-stage rewrites
- All existing hooks (subagent-task-context, subagent-gate, task-complete-check) continue to work

## Decisions

1. **Reviewer model = Sonnet**: Opus architect handles deep analysis in signoff; sonnet is sufficient for per-task code review
2. **Merge /implement + /continue-feature**: Single command, auto-detect mode. Simpler UX.
3. **Per-task review**: Catches issues early despite higher token cost
4. **Automatic signoff + user approval**: Signoff runs automatically after all tasks, but user must approve via AskUserQuestion before `/complete-feature` can proceed
5. **tools: ["*"]**: All 5 agents get full tool access for maximum flexibility
