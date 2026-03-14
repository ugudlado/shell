# Modern Dotfiles

Cross-platform dotfile management using [GNU Stow](https://www.gnu.org/software/stow/) with Claude Code integration.

## Quick Start

```bash
git clone <your-repo-url> ~/code/shell
cd ~/code/shell

# Optional — set git user info (will prompt if not set)
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="your.email@example.com"

make setup
```

Restart your shell after setup completes.

## How It Works

This repo uses two strategies for managing config:

| Strategy | What | How |
|----------|------|-----|
| **GNU Stow** | Shell configs, git, ccstatusline | `src/home/` → symlinked into `$HOME` |
| **Direct symlinks** | Claude Code config | `src/claude/` → symlinked into `~/.claude/` |

Stow handles standard dotfiles (`src/home/` maps 1:1 to `$HOME`). Claude Code config is managed separately because `~/.claude/` contains runtime data that shouldn't be version-controlled.

## Project Structure

```
.
├── Makefile                # Management commands
├── setup.sh                # Installation orchestrator
├── scripts/
│   ├── setup-common.sh     # Shared functions (install_claude_code, configure_claude_code)
│   ├── setup-macos.sh      # macOS installer
│   └── setup-linux.sh      # Linux installer
├── src/
│   ├── home/               # Stow package → $HOME
│   │   ├── .zshrc
│   │   ├── .bashrc
│   │   ├── .gitconfig
│   │   └── .config/
│   │       └── ccstatusline/settings.json
│   ├── claude/             # Claude Code config → ~/.claude/ (direct symlinks)
│   │   ├── CLAUDE.md       # Global instructions
│   │   ├── RTK.md          # Rust Token Killer config
│   │   ├── settings.json   # Hooks, plugins, permissions
│   │   ├── agents/         # Subagent definitions
│   │   ├── commands/       # Slash commands
│   │   ├── hooks/          # Event hooks
│   │   ├── skills/         # User-level skills (TDD, debugging, etc.)
│   │   ├── templates/      # Spec/task templates
│   │   └── config/         # Notification states, etc.
│   ├── .vscode/            # VS Code settings
│   └── installers/         # Platform packages (Brewfile)
└── openspec/               # OpenSpec workflow definitions
```

## Make Commands

```bash
make help        # Show all commands
make setup       # Complete initial setup
make deploy      # Backup conflicts + stow in one step
make stow        # Apply dotfile symlinks (excludes Claude Code)
make restow      # Re-apply symlinks
make dry-run     # Preview stow changes
make diff        # Show repo vs home differences
make doctor      # Check system health and CLI tools
```

## Claude Code Setup

`make setup` runs two functions for Claude Code:

1. **`install_claude_code()`** — verifies the `claude` binary and creates a `~/.local/bin/claude` symlink
2. **`configure_claude_code()`** — creates symlinks from `src/claude/` into `~/.claude/` and pre-caches ccstatusline

### What Gets Symlinked

| Source | Target | Type |
|--------|--------|------|
| `src/claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | File |
| `src/claude/RTK.md` | `~/.claude/RTK.md` | File |
| `src/claude/settings.json` | `~/.claude/settings.json` | File |
| `src/claude/hookify.*.local.md` | `~/.claude/hookify.*.local.md` | Files |
| `src/claude/agents/` | `~/.claude/agents/` | Directory |
| `src/claude/commands/` | `~/.claude/commands/` | Directory |
| `src/claude/hooks/` | `~/.claude/hooks/` | Directory |
| `src/claude/skills/` | `~/.claude/skills/` | Directory |
| `src/claude/templates/` | `~/.claude/templates/` | Directory |
| `src/claude/config/` | `~/.claude/config/` | Directory |

### Hooks

| Event | Hook | Purpose |
|-------|------|---------|
| UserPromptSubmit | `task-gate.sh` | Task context injection |
| PreToolUse (Bash) | `bash-safety-guard.sh`, `spec-adherence-check.sh`, `rtk-rewrite.sh` | Safety + RTK token savings |
| PreToolUse (Write\|Edit) | `worktree-boundary.sh`, `protected-files.sh` | Boundary enforcement |
| PostToolUse (Write\|Edit) | `auto-format.sh` | Prettier + typecheck |
| Notification | `smart-notify.sh` | macOS notifications |
| Stop | `loop-detector.sh`, `task-complete-check.sh` | Loop detection + task sync |
| SubagentStart | `subagent-task-context.sh` | Context injection |
| SubagentStop | `subagent-gate.sh`, `task-complete-check.sh` | Output validation |
| SessionEnd | `session-reflect.sh` | Post-session reflection |

### Commands

| Command | Purpose |
|---------|---------|
| `/specify <description>` | Create OpenSpec change + worktree + Linear ticket |
| `/implement <feature-id>` | Execute tasks with auto-commit per phase |
| `/complete-feature <feature-id>` | Archive + merge to main + cleanup |
| `/continue-feature <feature-id>` | Load OpenSpec context into session |
| `/commit-group` | Create commits in logical groups |
| `/release-prep` | Prepare release with changelog and git tag |
| `/diagnose` | Analyze error patterns |
| `/reflect` | Review session mistakes and extract learnings |
| `/diagram` | Generate visual diagrams via draw.io |
| `/telemetry` | Show session telemetry and workflow health |
| `/opsx:propose` `/opsx:apply` `/opsx:archive` `/opsx:explore` | OpenSpec workflow |

### Statusline

[ccstatusline](https://github.com/sirmalloc/ccstatusline) provides a two-line status bar:

- **Line 1**: Model | Context bar | Reset timer | Session usage | Output style
- **Line 2**: CWD | Git branch | Git changes

Widget config: `src/home/.config/ccstatusline/settings.json` (stowed to `~/.config/ccstatusline/`)

## Development Tools

Installed via Brewfile (`src/installers/mac/Brewfile`):

- **Shell**: zsh + oh-my-zsh + starship prompt
- **Editor**: VS Code with project-based extensions
- **CLI**: eza, bat, ripgrep, fd, fzf, zoxide, jq, glow, fx
- **Git**: git-delta for diffs
- **AI**: Claude Code CLI, Claude Desktop

## Troubleshooting

Run `make doctor` to check system health. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

## Resources

- [GNU Stow](https://www.gnu.org/software/stow/)
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)
- [ccstatusline](https://github.com/sirmalloc/ccstatusline)
- [Homebrew](https://brew.sh/)
