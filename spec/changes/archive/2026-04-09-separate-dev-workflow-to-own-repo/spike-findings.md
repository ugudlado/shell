# Spike Findings — Separate Dev Workflow into Own Repo

## Summary

The shell repo conflates dotfiles (personal env config) with the dev workflow system (agents, skills, step contracts). These have different change velocities (~90% of commits are workflow changes) and different audiences (personal vs. shareable). Separation is architecturally clean — zero runtime coupling exists today.

## Key Decisions

### 1. Repo Structure

New repo: `dev-workflow/`

```
dev-workflow/
├── agents/                    # Agent definitions (AGENTS.md-compatible)
│   ├── developer.md
│   ├── reviewer.md
│   ├── architect.md
│   ├── discoverer.md
│   ├── ideator.md
│   ├── workflow-improver.md
│   ├── humanizer.md
│   ├── debugger.md
│   ├── ux-reviewer.md
│   └── sonnet-agent.md
├── skills/                    # SKILL.md format (portable across 44+ tools)
│   ├── orchestrate/SKILL.md   # Primary entry point (was /develop)
│   ├── specify/SKILL.md
│   ├── implement/SKILL.md
│   ├── complete-feature/SKILL.md
│   ├── learn/SKILL.md
│   ├── autopilot/SKILL.md
│   ├── commit-group/SKILL.md
│   ├── workflow-improve/SKILL.md
│   ├── telemetry/SKILL.md
│   ├── reflect/SKILL.md
│   ├── critique/SKILL.md
│   ├── diagnose/SKILL.md
│   ├── systematic-debugging/SKILL.md
│   ├── diagram/SKILL.md
│   ├── humanizer/SKILL.md
│   ├── ideate/SKILL.md
│   ├── portless/SKILL.md
│   ├── shadcn/SKILL.md
│   ├── frontend-design/SKILL.md
│   ├── pal/SKILL.md
│   └── context-hub/SKILL.md
├── config/
│   ├── workflows/             # Was schemas/ — workflow type definitions
│   │   ├── feature.yaml
│   │   ├── bugfix.yaml
│   │   ├── chore.yaml
│   │   ├── spike.yaml
│   │   └── bootstrap.yaml
│   ├── steps/                 # Step contracts
│   ├── templates/             # Artifact templates
│   ├── scripts/               # Utility scripts
│   └── guidelines.yaml        # LLM-driven workflow selection rules
├── scripts/
│   └── install.sh             # Symlinks to ~/.claude/, ~/.cursor/, etc.
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

### 2. What Stays in Shell Repo

- `src/home/` — GNU Stow dotfiles
- `src/claude/settings.json` — Claude Code permissions & prefs
- `src/claude/hooks/` — Claude Code hook scripts
- `src/hooksmith/` — Hooksmith rules & scripts (Claude setup, not workflow)
- `src/linear/` — Linear integration config
- `scripts/` — Machine setup scripts
- `spec/project.yaml` — Per-repo workflow config
- `spec/changes/archive/` — Historical record

### 3. Naming Changes

| Current | New | Rationale |
|---------|-----|-----------|
| `/develop` | `/orchestrate` | Better reflects orchestration role |
| `schemas/` | `config/workflows/` | "Workflows" is clearer than "schemas" |
| `spec/` (in workflow) | `config/` | Avoids overloading "spec" (phase vs directory) |
| `SPEC_HOME` | `WORKFLOW_HOME` | Matches new naming |
| Keyword matching | `guidelines.yaml` | LLM decides on the fly vs rigid regex |

### 4. `/orchestrate` as Single Entry Point

`/orchestrate` replaces `/develop` as the primary workflow entry point.

**Aliases:**
- `/develop` → `/orchestrate` (backward compat)
- `/specify` → `/orchestrate --phase=specify`
- `/implement` → `/orchestrate --phase=implement`
- `/complete-feature` → `/orchestrate --phase=complete`

**Workflow selection via guidelines (not rules):**
```yaml
# config/guidelines.yaml
workflow_selection:
  - workflow: bugfix
    guidance: >
      Use when the user describes something broken, a regression,
      an error, crash, or unexpected behavior.
  - workflow: spike
    guidance: >
      Use when exploring, prototyping, researching feasibility.
  - workflow: chore
    guidance: >
      Use for maintenance: config, deps, renames, cleanups.
  - workflow: bootstrap
    guidance: >
      Use when setting up project tooling from scratch.
  - workflow: feature
    guidance: >
      Default. New capabilities or enhancements.
```

The LLM reads guidelines and decides contextually — no rigid keyword matching.

### 5. Cross-Tool Portability

Research confirmed SKILL.md is an open standard working across 44+ tools (Claude Code, Cursor, Codex CLI, Gemini CLI, Windsurf, etc.). No adapter layer needed.

**Install script handles per-tool symlinks:**
```bash
# Claude Code
ln -sf $REPO/skills ~/.claude/skills
ln -sf $REPO/agents ~/.claude/agents

# Cursor (if installed)
ln -sf $REPO/skills ~/.cursor/skills

# Shared config
ln -sf $REPO/config ~/.config/spec
```

### 6. Global CLAUDE.md Integration

Workflow instructions appended to global `~/.claude/CLAUDE.md` (managed by shell repo). The install script adds workflow-specific lines. All repos automatically get workflow capabilities.

### 7. Env Var Changes

```bash
# Current
SPEC_HOME=${SPEC_HOME:-$HOME/.config/spec}

# After extraction
WORKFLOW_HOME=${WORKFLOW_HOME:-$HOME/.config/spec}  # Same path, new name
```

Backward compat: `SPEC_HOME` still works as fallback.

## Migration Plan

1. Create `dev-workflow` repo with directory structure
2. Copy files from shell repo (fresh copy, not filter-branch)
3. Rename: schemas→workflows, spec→config, develop→orchestrate
4. Create `install.sh` with per-tool symlinks
5. Update `guidelines.yaml` with workflow selection guidance
6. Update shell repo's `configure_claude_code()` to use `WORKFLOW_REPO` path
7. Remove moved files from shell repo
8. Update global CLAUDE.md integration
9. Test: bootstrap on clean machine, verify all repos still work

## Risks

- **Symlink path changes**: All consuming repos use `~/.config/spec/` — if install.sh points symlinks correctly, zero impact
- **Historical archives**: Stay in shell repo, new repo starts fresh
- **Two repos to clone on new machine**: Mitigated by shell's setup script auto-detecting workflow repo

## Recommendation

Proceed to feature. The separation is clean, the formats are standardized, and the migration is low-risk (symlink source changes, no consumer changes).
