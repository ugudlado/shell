# Modern Dotfiles

Cross-platform dotfile management using [GNU Stow](https://www.gnu.org/software/stow/) with comprehensive Claude Code integration.

## Quick Start

```bash
# Clone and setup
git clone <your-repo-url> ~/shell
cd ~/shell

# Set git user info (optional - will prompt if not set)
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="your.email@example.com"

make setup
```

Restart your shell after setup completes.

## Core Features

### Dotfile Management
- **GNU Stow** - Symlink-based configuration management
- **Cross-platform** - macOS and Linux support
- **Smart Backup** - Only backs up conflicting files
- **Git Integration** - Version control for all configs

### Claude Code Integration
- **Hooks** - Session management, safety checks, git validation
- **Commands** - `/specify`, `/plan`, `/implement`, `/complete-feature`, `/load-session`
- **Templates** - Spec, plan, and task templates
- **Memory** - Dual-store system (global + project-specific)

### Development Tools
- **Shell** - zsh with oh-my-zsh
- **Editor** - VS Code with project-based extensions
- **CLI Tools** - eza, bat, ripgrep, fd, fzf, jq
- **Git** - Enhanced config with VS Code integration

## Make Commands

```bash
make help        # Show all commands
make setup       # Complete initial setup
make stow        # Deploy dotfiles
make status      # Show managed files status
make diff        # Show differences
make backup      # Backup existing files
make doctor      # Check system health
```

## Claude Code Setup

After running `make setup`, Claude Code includes:

### Hooks
- **SessionStart** - Minimal init, shows available context snapshots
- **PreCompact** - Saves context before compaction
- **PreToolUse** - Blocks dangerous git/system commands
- **PostToolUse** - Updates Linear issues
- **Stop** - Saves session log

### Commands
- `/specify <description>` - Create Linear ticket and spec
- `/plan <linear-id>` - Generate implementation plan
- `/implement <linear-id>` - Execute TDD implementation
- `/complete-feature <linear-id>` - Merge and cleanup
- `/load-session [source]` - Restore saved context

### Safety Features
Automatically blocks:
- `git rebase` - All rebase operations
- `git push --force` - Force pushes
- `rm` - All rm commands
- System destructive operations

### Memory System
- **Global** - `~/.claude/memory.json` (cross-project patterns)
- **Project** - `./memory.json` (project-specific, gitignored)

## Project Structure

```
.
├── Makefile              # Management commands
├── setup.sh              # Installation orchestrator
├── scripts/              # Platform-specific setup
│   ├── setup-common.sh   # Shared functions
│   ├── setup-macos.sh    # macOS installer
│   └── setup-linux.sh    # Linux installer
├── src/
│   ├── home/             # Dotfiles (stow package)
│   │   ├── .zshrc
│   │   ├── .gitconfig
│   │   ├── .claude/      # Claude Code config
│   │   │   ├── commands/ # Slash commands
│   │   │   ├── hooks/    # Event hooks
│   │   │   ├── templates/# Spec/plan templates
│   │   │   └── settings.json
│   │   ├── .mcp.json     # Project MCP template
│   │   └── .config/
│   ├── .vscode/          # VS Code config
│   └── installers/       # Platform packages
└── scripts/              # Setup and verification
```

## MCP Configuration

### Global Setup (Manual)
Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "memory-global": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {"MEMORY_FILE_PATH": "~/.claude/memory.json"}
    }
  }
}
```

### Project Setup (Automatic)
`.mcp.json` template deployed via stow - customize per project.

## VS Code Extensions

Project-based extension management:

```bash
# Copy appropriate extension set to your project
mkdir -p myproject/.vscode
cp src/.vscode/extensions/javascript.json myproject/.vscode/extensions.json
```

Available sets: Core, JavaScript, Python, DevOps, Go

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to common issues.

## Features Roadmap

- [x] Stow-based management
- [x] macOS support (Homebrew)
- [x] Linux support (apt, dnf, pacman)
- [x] Claude Code hooks and commands
- [x] MCP memory dual-store
- [x] Git safety features
- [x] Project-based VS Code extensions
- [ ] Windows support (Chocolatey, Scoop)
- [ ] Automated testing pipeline

## Resources

- [GNU Stow](https://www.gnu.org/software/stow/)
- [Claude Code Docs](https://docs.claude.com/en/docs/claude-code)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Homebrew](https://brew.sh/)
- [Modern Unix Tools](https://github.com/ibraheemdev/modern-unix)

---

**Note:** `.claude.json` contains user-specific data and must be manually configured. The MCP servers config shown above should be merged into your existing `~/.claude.json` file.
