---
name: requirements
description: Generate OpenSpec specs from user-provided ideas (fast path — no ideation/research). Use when the user has concrete ideas and wants specs written fast, or says "requirements", "write specs", "spec these ideas", "generate specs". Unlike /ideate which does autonomous discovery.
user-invocable: true
args:
  - name: ideas
    description: Ideas to generate specs for (inline text, or --from-backlog to process existing lightweight specs)
    required: false
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
OPENSPEC_CHANGES_DIR=~/.config/openspec/changes/$REPO_NAME

## Requirements Generator

$ARGUMENTS

## Overview

`/requirements` is the fast path for turning ideas into OpenSpec change specs. Unlike `/ideate` (which autonomously discovers and researches ideas), this command takes ideas you already have and generates structured specs for each — in parallel when possible.

**Use `/ideate` when**: you want autonomous discovery, web research, and prioritization.
**Use `/requirements` when**: you already know what you want to build and need specs written fast.

## Input Formats

`/requirements` accepts ideas in several forms:

### Inline (in $ARGUMENTS)
```
/requirements "improve homepage nav" "add code walkthrough" "enhance real-world examples"
```

### Conversational (no arguments)
If `$ARGUMENTS` is empty or just a topic, ask the user to describe their ideas. Parse numbered lists, bullet points, or freeform descriptions.

### From backlog
```
/requirements --from-backlog
```
Reads `$OPENSPEC_CHANGES_DIR/*/spec.md` where status is `proposed` and the spec is lightweight (< 20 lines), then fleshes them out into full specs.

## Process

### 1. Parse Ideas

Extract individual ideas from `$ARGUMENTS` or conversation. For each idea, identify:
- **Title**: short descriptive name
- **ID**: date-prefixed slug (e.g., `2026-03-28-algoviz-homepage-nav`)
- **Schema**: infer from description — `feature-tdd` (algorithms, data structures), `feature-rapid` (UI, UX, tooling), `quickfix` (small fixes), `bugfix` (bugs)
- **Scope hint**: what areas of the codebase this touches

### 2. Gather Context (fast)

Read the project's CLAUDE.md and scan the codebase relevant to the ideas. This is a quick targeted scan — not the deep analysis that `/ideate` does:
- Read CLAUDE.md for architecture rules and patterns
- Glob for files relevant to each idea
- Read existing OpenSpec changes to avoid duplicates
- Read BACKLOG.md or similar if it exists

### 3. Generate Specs (parallel)

For each idea, generate a full `spec.md` in the OpenSpec change directory. Use subagents to parallelize when there are 2+ ideas.

Each spec follows this structure:

```markdown
---
feature-id: [ID]
linear-ticket: none
schema: [schema]
---

# Specification: [Title]

## Problem
[What's wrong or missing — grounded in actual codebase state]

## Summary
[2-3 sentences — what this change delivers]

## Design
[How it works — concrete enough for /develop to build from]

## Acceptance Criteria
1. [Specific, testable]
2. [...]

## Implementation Strategy
[Phased approach if complex, or single-phase if simple]

## Scope
[What's in, what's explicitly out]
```

**Quality bar**: Each spec should be detailed enough that `/develop` can pick it up and build it without asking clarifying questions. Include concrete examples, data structures, and UI descriptions where relevant.

### 4. Create OpenSpec Artifacts

For each spec:

```bash
mkdir -p $OPENSPEC_CHANGES_DIR/[ID]
```

Write `spec.md` with the full specification.

Write `.openspec.yaml`:
```yaml
schema: [feature-tdd|feature-rapid|quickfix|bugfix]
feature-id: [ID]
status: proposed
category: [new-feature|improvement|bugfix|simplification]
source: user-request
created: [YYYY-MM-DD]
```

### 5. Report

```
## Requirements Created

| # | Feature ID | Schema | Category |
|---|-----------|--------|----------|
| 1 | [id] | [schema] | [category] |
| 2 | [id] | [schema] | [category] |

Specs written to `$OPENSPEC_CHANGES_DIR/[id]/spec.md`

Next: `/develop [id]` to build, or `/requirements --review` to refine specs.
```

## Flags

| Flag | Effect |
|------|--------|
| (none) | Parse ideas from arguments or conversation, generate specs |
| `--from-backlog` | Flesh out lightweight existing specs into full specs |
| `--review` | Read and critique existing specs, suggest improvements |
| `--design-ideas N` | Generate N design alternatives in each spec (default: 1) |

## Tips

- For UI/UX changes, use `--design-ideas 3` to get multiple approaches in the spec
- Specs are intentionally detailed — `/develop` works better with rich specs than sparse ones
- Each spec is independent — you can `/develop` them in any order
- If an idea is too large, the spec should propose phases and suggest splitting into multiple changes
