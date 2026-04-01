---
description: >-
  Create and update Linear issues via MCP and Spec workflows; use project linear-config for
  labels.
---

# Linear + Spec

**Canonical path:** `~/.claude/skills/linear/SKILL.md`

Use this skill when Spec steps mention Linear, `linear-ticket`, `create-ticket`, or Linear MCP tools.

## Configuration

- Read **`~/.config/linear/config.yaml`** for centralized team settings and per-repo labels.
- Detect repo name: `basename $(git rev-parse --show-toplevel)` and look up under `repos:` map.
- **If repo is not listed**: Linear is disabled — treat as `--no-linear`. Bootstrap handles onboarding new repos.

## MCP (plugin-linear-linear)

Typical tools (exact names may match your MCP server):

- **Create / update issues:** `mcp__plugin_linear_linear__save_issue` (or equivalent `save_issue`).
- **Fetch issue:** `mcp__plugin_linear_linear__get_issue` when implement `load-context` needs ticket body/state.

Follow the **Spec schema step** that names the tool (e.g. `create-ticket.yaml`, `store-commit-report.yaml`, `wrap-up.yaml`) for field order and skip conditions (`--no-linear`).

## Spec fields

- **`linear-ticket`** in `.spec.yaml` — primary issue id (e.g. `HL-134`).
- **`linear-tickets`** — optional list when one change spans multiple Linear issues.

Do not invent ticket ids; use values returned from MCP or the user.

## Relationship to workflow YAML

Spec step files under `spec/schemas/.../workflow/` remain authoritative for **when** each Linear call runs. This skill defines **how** (config, tools) without duplicating every step file.
