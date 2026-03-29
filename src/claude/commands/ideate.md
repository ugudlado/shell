---
description: Generate and manage product backlog as OpenSpec changes with market research
---

## Feature Ideation & Backlog Management

$ARGUMENTS

## Overview

`/ideate` spawns the ideator agent to research, generate, and prioritize product work items. Each idea becomes an OpenSpec change (`openspec/changes/[ID]/`) with a lightweight spec — the same system used to build features via `/develop`.

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
> Read the project CLAUDE.md at `[project-root]/CLAUDE.md`. Scan existing changes at `[project-root]/openspec/changes/`. Analyze existing code for improvement opportunities. Research market trends. Generate 5-8 ideas as new OpenSpec changes with prioritized specs.

**For --refresh:**
> Read the project CLAUDE.md and scan `[project-root]/openspec/changes/`. Re-read the codebase. Update priorities in existing `.openspec.yaml` files. Do NOT create new changes or use web search.

**For --next:**
> Scan `[project-root]/openspec/changes/*/. openspec.yaml` for `status: proposed`. Output ONLY the feature-id with the highest priority score. Output nothing else.

### 4. Report

```
[ideate] Backlog updated for [product]
  New changes: N | Total pending: M | Top priority: [change-id] (score: X.X)
```
