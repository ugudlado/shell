---
name: ideate
description: "Brainstorm ideas, explore designs via playground/frontend-design, and build a prioritized backlog. Use when the user wants new feature ideas, backlog management, or says \"ideate\", \"generate ideas\", \"brainstorm\", \"backlog\", \"what should we build\"."
user-invocable: true
args:
  - name: topic
    description: Topic or area to ideate on (defaults to analyzing project for opportunities)
    required: false
  - name: --next
    description: Skip research, pick next idea from existing backlog
    type: flag
  - name: --refresh
    description: Re-scan project state, update priorities, no new ideas
    type: flag
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
SPEC_HOME=${SPEC_HOME:-$HOME/.config/spec}
SPEC_CHANGES_DIR=$SPEC_HOME/changes/$REPO_NAME

## Creative Exploration & Backlog

$ARGUMENTS

## Overview

`/ideate` spawns the ideator agent to explore the project, brainstorm ideas, and build a prioritized backlog. Unlike `/develop` which builds, `/ideate` generates *things worth trying* — with visual prototypes where possible.

## Process

### 1. Parse Flags

Check `$ARGUMENTS` for:
- `--refresh`: re-scan project and existing changes, update priorities, no new ideas
- `--next`: output the highest-priority pending change ID and stop
- Topic text: focus exploration on a specific area
- No flags: full ideation cycle

### 2. Find Project Root

Walk up from cwd to find the nearest directory with a CLAUDE.md file.

### 3. Spawn Ideator Agent

**For full cycle (no flags or topic):**
> Read the project CLAUDE.md at `[project-root]/CLAUDE.md`. Scan existing changes at `$SPEC_CHANGES_DIR/`. Explore the codebase for opportunities. Research trends. Generate 5-8 ideas with prototypes (use playground and frontend-design skills for visual ideas). Create backlog entries.

**For topic-focused:**
> Read the project CLAUDE.md. Focus exploration on: [topic]. Generate 3-5 ideas specifically about this area, with prototypes where applicable. Create backlog entries.

**For --refresh:**
> Read the project CLAUDE.md and scan `$SPEC_CHANGES_DIR/`. Re-read the codebase. Update priorities in existing `.spec.yaml` files. Do NOT create new changes or use web search.

**For --next:**
> Read Product Vision from `[project-root]/CLAUDE.md`. Scan `$SPEC_CHANGES_DIR/*/.spec.yaml` for `status: proposed` and Linear tickets in Backlog. Evaluate candidates against the Product Vision. Do brief web research on top 2-3 candidates for relevant context. Pick the most valuable item right now. Output structured result: TICKET, SCHEMA, REASON.

### 4. Report

```
[ideate] Backlog updated for [product]
  New ideas: N | Total pending: M | Top priority: [change-id] (score: X.X)
  Prototypes generated: K
```
