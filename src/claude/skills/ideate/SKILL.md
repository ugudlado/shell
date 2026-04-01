---
name: ideate
description: "Generate and manage product backlog as Spec changes with market research. Use when the user wants new feature ideas, backlog management, or says \"ideate\", \"generate ideas\", \"brainstorm\", \"backlog\", \"what should we build\"."
user-invocable: true
args:
  - name: topic
    description: Topic or area to ideate on (defaults to analyzing project for opportunities)
    required: false
  - name: --next
    description: Skip research, pick next idea from existing backlog
    type: flag
---

## Variables

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
SPEC_CHANGES_DIR=~/.config/spec/changes/$REPO_NAME

## Feature Ideation & Backlog Management

$ARGUMENTS

## Overview

`/ideate` spawns the ideator agent to research, generate, and prioritize product work items. Each idea becomes an Spec change (`$SPEC_CHANGES_DIR/[ID]/`) with a lightweight spec — the same system used to build features via `/develop`.

## Process

### 1. Parse Flags

Check `$ARGUMENTS` for:
- `--refresh`: re-scan codebase and existing changes, update priorities, no new ideas
- `--next`: output the highest-priority pending change ID and stop
- No flags: full ideation cycle

### 2. Find Project Root

Walk up from cwd to find the nearest directory with a CLAUDE.md file.

### 3. Spawn Ideator Agent

**For full cycle (no flags):**
> Read the project CLAUDE.md at `[project-root]/CLAUDE.md`. Scan existing changes at `$SPEC_CHANGES_DIR/`. Analyze existing code for improvement opportunities. Research market trends. Generate 5-8 ideas as new Spec changes with prioritized specs.

**For --refresh:**
> Read the project CLAUDE.md and scan `$SPEC_CHANGES_DIR/`. Re-read the codebase. Update priorities in existing `.spec.yaml` files. Do NOT create new changes or use web search.

**For --next:**
> Scan `$SPEC_CHANGES_DIR/*/. spec.yaml` for `status: proposed`. Output ONLY the feature-id with the highest priority score. Output nothing else.

### 4. Report

```
[ideate] Backlog updated for [product]
  New changes: N | Total pending: M | Top priority: [change-id] (score: X.X)
```
