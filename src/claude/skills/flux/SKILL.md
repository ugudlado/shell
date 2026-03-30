---
description: >-
  Flux CLI reference for local task board operations. Use this skill as a command
  reference when OpenSpec schema steps need to interact with the Flux board.
  Workflow orchestration (when to create/update/close) lives in the schema YAML
  steps — this file only documents HOW to call the CLI.
---

# Flux CLI Reference

**Canonical path:** `~/.claude/skills/flux/SKILL.md`

## Shared Storage

The Flux UI (`http://flux.localhost:1355`) reads the **global** data file. **`FLUX_DATA` is already set in `~/.zshrc`** so every `flux` invocation uses the shared store.

- Do **not** use `flux init --git` — it creates per-repo data the UI cannot see.
- Project registration for a new repo: see **bootstrap** skill, Step 8 (Flux).

| Layer | Role |
|-------|------|
| **`FLUX_DATA`** | Single source of truth path (set in user's shell). |
| **`flux` CLI** | Create/update/import tasks. Writes the same file the UI reads. |
| **Flux web UI** | Browse columns, drag status, read titles/comments. |

## Project ID Resolution

Always resolve the **internal id** before creating tasks/epics. The web UI queries by id, not name.

```bash
REPO=$(basename "$(git rev-parse --show-toplevel)")
PROJECT_ID=$(flux project list --json | jq -r --arg n "$REPO" '.[] | select(.name == $n) | .id')
# If empty: flux project create "$REPO" && re-fetch
```

## CLI Commands

### Projects

```bash
flux project list [--json]
flux project create <name>
flux project use <id>
flux project update <id> [--name <n>] [--description <d>]
flux project delete <id>
```

### Epics

```bash
flux epic list <project> [--json]
flux epic create <project> <title> [--note <desc>]
flux epic update <id> [--title <t>] [--status <s>] [--note <n>]
flux epic delete <id>
```

### Tasks

```bash
flux task list [project] [--epic <id>] [--status <s>] [--json]
flux task create [project] <title> [-P 0|1|2] [-e <epic>] [-d <dep1,dep2>] [--note <n>] [--ac <criteria>] [--guardrail "999:text"]
flux task update <id> [--title <t>] [--status <s>] [--epic <e>] [--note <n>] [-P <p>] [-d <deps>] [--blocked "reason"|--blocked clear] [--ac <criteria>] [--guardrail "999:text"]
flux task start <id>           # todo -> in_progress
flux task done <id> [--note]   # -> done
flux task show <id>            # full details + comments
flux task delete <id>
```

### Ready (unblocked tasks)

```bash
flux ready [project] [--json]  # unblocked, sorted by priority
```

### Import / Export

```bash
flux export [-o file.json]                    # full store -> JSON
flux import <file.json> [--merge]             # --merge appends new ids only
flux import - --merge < file.json             # stdin
```

**Merge semantics**: `--merge` appends items whose `id` is new. Does not update existing ids. To refresh, delete first or use a new id.

## Data Model

### Task Status Flow

`planning` → `todo` → `in_progress` → `done`

### Task Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Short unique string |
| `title` | string | Display title |
| `status` | enum | planning / todo / in_progress / done |
| `depends_on` | string[] | Task IDs that must be done first |
| `epic_id` | string? | Parent epic |
| `project_id` | string | **Must be internal id**, not name |
| `priority` | 0/1/2 | P0 urgent, P1 normal, P2 low |
| `agent` | enum? | claude / codex / gemini / other |
| `workers` | string[] | Badges on in_progress cards |
| `acceptance_criteria` | string[] | Observable behavioral outcomes |
| `guardrails` | object[] | `{id, number, text}` |
| `comments` | object[] | `{id, body, author, agent_name?, created_at}` |
| `blocked_reason` | string? | External blocker text |

### Epic Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Short unique string |
| `title` | string | Display title |
| `status` | string | e.g. planning / done |
| `depends_on` | string[] | Epic-level deps |
| `notes` | string | Description |
| `project_id` | string | Internal id |

## Executor Assignment

Set **`FLUX_EXECUTOR`** in the shell so agents assign work consistently.

| `FLUX_EXECUTOR` | Flux `agent` field | Comment label |
|-----------------|-------------------|---------------|
| `claude` | `claude` | `Executor: Claude` |
| `cursor` | `other` | `Executor: Cursor` |
| `codex` | `codex` | `Executor: Codex` |
| `gemini` | `gemini` | `Executor: Gemini` |

Set both `agent` on the task and an `Executor: …` line in a comment.

## Import JSON Format

Minimal merge file for creating tasks from Linear:

```json
{
  "projects": [],
  "epics": [],
  "tasks": [
    {
      "id": "imp-HL-134-x7k",
      "title": "HL-134: Short title",
      "status": "todo",
      "depends_on": [],
      "project_id": "<PROJECT_ID>",
      "priority": 1,
      "agent": "other",
      "comments": [
        {
          "id": "c-imp-HL-134",
          "body": "Executor: Cursor\nLinear: https://linear.app/<team>/issue/HL-134",
          "author": "mcp",
          "created_at": "2026-03-30T12:00:00.000Z"
        }
      ],
      "created_at": "2026-03-30T12:00:00.000Z",
      "updated_at": "2026-03-30T12:00:00.000Z"
    }
  ],
  "blobs": []
}
```

## MCP

If `mcp__flux__*` tools are available, use them instead of CLI for the same outcomes. Still persist flux state in `.openspec.yaml`.

## Upstream

The Flux app and `flux-src` trees are **upstream — never edit them**. Fix behavior with CLI, import, web UI, and MCP. Upstream: [github.com/sirsjg/flux](https://github.com/sirsjg/flux).
