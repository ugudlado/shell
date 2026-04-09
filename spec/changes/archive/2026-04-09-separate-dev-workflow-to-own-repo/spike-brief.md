# Spike Brief — Separating Dev Workflow from Shell Repo

## Problem Statement

The shell repo serves two distinct concerns with different change velocities:
1. **Dotfiles + Claude Code setup** — personal shell config, hooks, settings — changes rarely
2. **Dev workflow system** — agents, skills, step contracts, schemas — changes frequently

~90% of recent commits are workflow changes, polluting the dotfiles git history.

## Final Scope Decision

### Moves to new repo (`dev-workflow/`)

Everything that IS the workflow engine or serves it:

**Core engine:**
- `src/spec/` — schemas, steps, templates, conventions, scripts

**All agents:**
- developer, reviewer, architect, discoverer, workflow-improver, ideator
- humanizer, debugger, ux-reviewer, sonnet-agent

**All skills:**
- develop, specify, implement, complete-feature, learn, autopilot, commit-group
- workflow-improve, telemetry, reflect, critique, diagnose, systematic-debugging
- diagram, humanizer, ideate, portless, shadcn, frontend-design, pal, context-hub

### Stays in shell (Claude Code setup + dotfiles)

**Dotfiles:**
- `src/home/` — GNU Stow package (.zshrc, .gitconfig, etc.)
- `src/installers/` — Brewfile, package lists
- `Makefile` — stow targets
- `scripts/` — setup scripts (updated to reference workflow repo)

**Claude Code setup:**
- `src/claude/settings.json` — permissions and personal prefs
- `src/claude/hooks/` — Claude Code hook scripts
- `src/claude/CLAUDE.md`, `RTK.md` — root Claude config
- `src/hooksmith/` — hooksmith rules and scripts
- `src/linear/` — Linear integration config

**Project-specific:**
- `spec/project.yaml` — this repo's workflow config
- `spec/changes/archive/` — historical record (stays)
- `CLAUDE.md`, `AGENTS.md`, `RULES.md` — root docs

## Key Finding: Zero Runtime Coupling

The workflow system has **no runtime dependency** on the shell repo path. Everything is consumed through symlinks:
- `~/.claude/agents/` → source agents
- `~/.claude/skills/` → source skills
- `~/.config/spec/` → source schemas/steps/templates

After extraction, symlinks just point to the new repo instead.

## Symlink Changes

```
# BEFORE (shell repo)
~/.claude/agents/   → ~/code/shell/src/claude/agents/
~/.claude/skills/   → ~/code/shell/src/claude/skills/
~/.config/spec/     → ~/code/shell/src/spec/

# AFTER (split)
~/.claude/agents/   → ~/code/dev-workflow/agents/
~/.claude/skills/   → ~/code/dev-workflow/skills/
~/.config/spec/     → ~/code/dev-workflow/spec/
~/.claude/hooks/    → ~/code/shell/src/claude/hooks/     (unchanged)
~/.config/hooksmith → ~/code/shell/src/hooksmith/        (unchanged)
```

## New Repo Structure

```
dev-workflow/
├── agents/
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
├── skills/
│   ├── develop/SKILL.md
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
├── spec/
│   ├── schemas/
│   ├── steps/
│   ├── templates/
│   └── scripts/
├── scripts/
│   └── setup-workflow.sh
├── spec/project.yaml          (workflow repo's own project config)
├── CLAUDE.md
└── README.md
```

## Setup Flow

```bash
# New machine bootstrap
git clone shell && git clone dev-workflow
WORKFLOW_REPO=~/code/dev-workflow ./setup.sh

# Or separately
cd ~/code/dev-workflow && make install
cd ~/code/shell && make stow
```

Shell setup gracefully degrades if workflow repo isn't cloned (prints helpful message).

## Open Questions

1. **Repo name**: `dev-workflow`? Something else?
2. **Historical archives**: Leave in shell (recommended) or migrate?
3. **Linear project**: New project for workflow tickets?
4. **settings.json composition**: Workflow repo could provide a base settings template that shell's setup merges with personal prefs.

## Migration Steps (if we proceed to feature)

1. Create new repo with directory structure
2. Move files (git filter-branch or fresh copy with attribution)
3. Update shell repo's `configure_claude_code()` to accept `WORKFLOW_REPO` path
4. Update symlink targets in setup scripts
5. Remove moved files from shell repo
6. Test bootstrap on clean machine
