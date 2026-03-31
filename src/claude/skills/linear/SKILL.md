---
description: >-
  Create and update Linear issues via MCP and OpenSpec workflows; use project linear-config for
  labels.
---

# Linear + OpenSpec

**Canonical path:** `~/.claude/skills/linear/SKILL.md`

Use this skill when OpenSpec steps mention Linear, `linear-ticket`, `create-ticket`, or Linear MCP tools.

## Project configuration

- Read **`.claude/memory/linear-config.md`** at the **project root** for `label_ids` and team defaults when creating issues.
- If missing, create issues without custom labels or ask the user once.

## MCP (plugin-linear-linear)

Typical tools (exact names may match your MCP server):

- **Create / update issues:** `mcp__plugin_linear_linear__save_issue` (or equivalent `save_issue`).
- **Fetch issue:** `mcp__plugin_linear_linear__get_issue` when implement `load-context` needs ticket body/state.

Follow the **OpenSpec schema step** that names the tool (e.g. `create-ticket.yaml`, `store-commit-report.yaml`, `wrap-up.yaml`) for field order and skip conditions (`--no-linear`).

## OpenSpec fields

- **`linear-ticket`** in `.openspec.yaml` — primary issue id (e.g. `HL-134`).
- **`linear-tickets`** — optional list when one change spans multiple Linear issues.

Do not invent ticket ids; use values returned from MCP or the user.

## Relationship to workflow YAML

OpenSpec step files under `openspec/schemas/.../workflow/` remain authoritative for **when** each Linear call runs. This skill defines **how** (config, tools) without duplicating every step file.
