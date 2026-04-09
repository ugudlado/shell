# Discovery Brief — Project YAML Portability Layer

**Feature**: Make bootstrap generate stack-adapted project.yaml from detect-language results.

---

## What I Understand

Bootstrap detects the tech stack (detect-language) and installs tooling (install-tooling), but never generates `spec/project.yaml`. This file is assumed to exist or is hand-written. New repos bootstrapped by the workflow have no project.yaml, which means: no quality_bar, no verify commands, no conventions, no signoff_policy. The workflow falls back to defaults everywhere.

---

## What Already Exists

### detect-language outputs
- `languages`: list (e.g., `["node-ts", "python"]`)
- `package_manager`: string
- `web_project`: boolean
- `backend_project`: boolean

### install-tooling outputs
- Scripts added to package.json (lint, format, type-check, test, build)

### project.yaml (current format — from shell repo)
```yaml
version: 1
project:
  name: shell
  repo: shell dotfiles
  summary: ...
context:
  tech_stack: [zsh, bash, yaml, ...]
  conventions: [...]
quality_bar:
  min_phase_review_score: 9
  max_retry_rounds: 3
  scoring: { critical_cap: 5, important_cap: 7, green_base: 9 }
storage: { active_changes_root, repo_archive_root, archive_on }
state_contract: { file, required, merge_precedence }
schemas: [feature, bugfix, chore, spike]
signoff_policy: { specify: required, implement: required, ... }
rules: [{ id: evidence-based, rule: ... }, ...]
```

### Bootstrap schema steps (current)
`check-bootstrap-state` → `detect-language` → `install-tooling` → `configure-gitignore` → `setup-claude-md` → `run-quality-baseline` → `setup-portless` → `check-linear-config` → `write-bootstrap-state`

No `generate-project-yaml` step exists.

---

## Build or Reuse?

**Build** — new step contract (`generate-project-yaml.yaml`) + add to bootstrap schema.

---

## Key Decisions

### D1: New step contract + schema entry (S complexity)
Create `generate-project-yaml.yaml` step. Add it to bootstrap.yaml after `install-tooling` and before `setup-claude-md` (so CLAUDE.md can reference project.yaml).

### D2: Stack-to-config mapping
detect-language outputs → project.yaml fields:

| detect-language output | project.yaml field |
|---|---|
| `languages` | `context.tech_stack` |
| `package_manager` | `context.tech_stack` (appended) |
| `web_project` | `context.conventions` (adds UI review rules) |
| Scripts from install-tooling | `quality_bar` verify commands |

### D3: Sensible defaults by stack
- Node/TS: `quality_bar.scoring.green_base: 9`, verify: `[type-check, test, lint]`
- Python: verify: `[test, lint]`, no type-check by default unless mypy installed
- Rust: verify: `[test, clippy]`
- Config/docs repos: verify: `[]`, `green_base: 9`

---

## Scope

### In-Scope
- Create `generate-project-yaml.yaml` step contract
- Add step to bootstrap.yaml after install-tooling
- Step reads detect-language + install-tooling outputs, generates `spec/project.yaml`
- Stack-appropriate defaults for quality_bar, conventions, verify commands

### Out-of-Scope
- Modifying existing project.yaml for this repo (backward compat — only generates if missing)
- Per-repo step overrides (future feature)
- Changes to the project.yaml schema itself

---

## Technical Context

### Files Directly Affected
- New: `~/.config/spec/steps/generate-project-yaml.yaml` — step contract
- Modify: `~/.config/spec/schemas/bootstrap.yaml` — add step to setup phase
