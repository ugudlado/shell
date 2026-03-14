# CLAUDE.md

Dotfiles repo — manages shell config, Claude Code setup, and dev tools across macOS/Linux.

## Architecture

Two strategies for managing config:

| Strategy | Source | Target | Managed by |
|----------|--------|--------|------------|
| GNU Stow | `src/home/` | `$HOME` | `stow_dotfiles_common()` |
| Direct symlinks | `src/claude/` | `~/.claude/` | `configure_claude_code()` |

Stow handles standard dotfiles (`.zshrc`, `.bashrc`, `.gitconfig`, `.config/ccstatusline/`). Claude Code config uses direct symlinks because `~/.claude/` mixes tracked config with runtime data.

## Key Commands

```bash
make setup       # Full install (Homebrew, stow, Claude Code, etc.)
make deploy      # Backup conflicts + stow
make stow        # Apply stow symlinks only
make doctor      # Check system health
make dry-run     # Preview stow changes
```

## Project Structure

```
src/home/        # Stow package — maps 1:1 to $HOME
src/claude/      # Claude Code config — symlinked into ~/.claude/
  settings.json  # Hooks, plugins, permissions, statusline
  hooks/         # Event hooks (bash scripts)
  commands/      # Slash commands
  agents/        # Subagent definitions (architect, researcher, implementer, reviewer, verifier + opus/sonnet/haiku)
  skills/        # User-level skills (TDD, debugging, OpenSpec, etc.)
  templates/     # Spec/task templates
scripts/         # Setup scripts (setup-common.sh, setup-macos.sh, setup-linux.sh)
openspec/        # OpenSpec schemas and workflow definitions
  schemas/
    feature-tdd/   # Production features — tests first, coverage >= 90%
    feature-rapid/ # Prototypes, tooling — no test requirements
    bugfix/        # Bug fixes — diagnosis → regression test → fix
```

## Setup Functions (scripts/setup-common.sh)

- `install_claude_code()` — verifies binary, creates `~/.local/bin/claude` symlink
- `configure_claude_code()` — symlinks `src/claude/` files+dirs into `~/.claude/`, pre-caches ccstatusline
- `stow_dotfiles_common()` — runs `stow -t $HOME -d src -R home`

## Gotchas

- Editing `~/.claude/settings.json` edits `src/claude/settings.json` directly (symlink) — changes show in `git diff`
- `src/home/` is stow's domain — don't put Claude Code config there
- Stow creates per-file symlinks; `configure_claude_code` symlinks entire directories (agents/, hooks/, etc.)
- ccstatusline widget config lives in `src/home/.config/ccstatusline/settings.json` (stowed), but Claude Code's statusLine command is in `src/claude/settings.json`
