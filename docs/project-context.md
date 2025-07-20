# Dotfiles Project Context

## Project Overview

- **Name**: Modern Dotfiles Management System
- **Type**: Development Environment Setup & Configuration
- **Tech Stack**: Shell scripts, GNU Stow, Homebrew, VS Code, Starship, Oh-My-Zsh
- **Purpose**: Automated, cross-platform developer environment setup with modern tooling

## Quick Reference

- **Main Branch**: master
- **Setup Command**: `make setup` (complete setup) or `make quick-setup` (existing systems)
- **Daily Commands**: `make edit`, `make sync`, `make status`, `make diff`
- **Package Management**: `make restow PACKAGE=shell`, `make add FILE=~/.vimrc PACKAGE=shell`
- **Agent Tools**: `~/.agent/` (cheatsheets, scripts, MCP config)

## Current Directory Structure

```
.
├── Makefile                     # All dotfile management commands
├── Brewfile                     # Homebrew packages for macOS
├── README.md                    # Project documentation
├── setup.sh                    # Installation script (called by make setup)
├── USAGE.md                     # Comprehensive usage guide
├── docs/                        # Project documentation
│   ├── project-context.md       # This file
│   └── PRD_dotfile-modernization.md  # Project requirements
├── extensions/                   # VS Code extension sets by technology
│   ├── core.json               # Essential extensions
│   ├── javascript.json         # JS/TS/React development
│   ├── python.json             # Python & data science
│   ├── devops.json             # Docker, K8s, cloud tools
│   ├── go.json                 # Go development
│   └── rust.json               # Rust development
├── home/                        # Stow packages organized by category
│   └── shell/                  # Shell configuration package
│       ├── .zshrc              # Zsh configuration with starship + oh-my-zsh
│       ├── .gitconfig          # Git configuration template
│       └── .config/
│           └── starship.toml   # Starship prompt configuration
└── agent/                       # Source agent tools (symlinked to ~/.agent)
    ├── mcp.json                # MCP server configuration
    ├── scripts/                # Development utility scripts
    │   ├── session-init.sh     # Session initialization

    helper
    ├── cheatsheets/            # Technology cheatsheets
    └── templates/              # Project and PRD templates
```

## Development Commands

```bash
# Setup complete environment
./setup.sh

# Manage dotfiles with Makefile
make edit                       # Edit dotfiles in VS Code
make restow PACKAGE=shell      # Restow shell configuration
make dry-run PACKAGE=shell     # Preview stow changes (dry run)
make diff                      # Show differences before applying

# Package management
brew bundle install            # Install/update all packages
mise install                   # Install development environments

# VS Code extensions
code --install-extension <ext>  # Install specific extension
```

## Technology Stack

### Core Tools

- **Package Manager**: Homebrew (macOS)
- **Dotfile Manager**: GNU Stow (symlink-based)
- **Environment Manager**: mise (replaces nvm, pyenv, rbenv)
- **Python Manager**: uv (fast package/environment management)

### Shell Environment

- **Shell**: Zsh with Oh-My-Zsh
- **Prompt**: Starship (modern, fast prompt)
- **Plugins**: autosuggestions, syntax highlighting, completions
- **History**: Atuin (better shell history with sync)

### Modern CLI Tools

- **File Operations**: eza (ls), bat (cat), fd (find), rg (grep)
- **Navigation**: zoxide (cd), fzf (fuzzy finder)
- **Development**: git, gh, docker, VS Code
- **Productivity**: dust (du), bottom (top), hyperfine, tokei

### Development Environment

- **Editor**: VS Code with tech-specific extension sets
- **Git Integration**: VS Code as diff/merge tool
- **AI Tools**: GitHub Copilot, Tabnine
- **Agent Integration**: MCP servers for enhanced AI workflows

## Configuration Management

### Stow Integration

- **Source Directory**: `~/.dotfiles/home/`
- **Package Structure**: Organized by logical groupings (shell, editor, etc.)
- **Symlink Management**: Direct symlinks to home directory
- **No Templates**: Simple, transparent file management

### Git Configuration

- **Interactive Setup**: Prompts for user name/email during installation
- **VS Code Integration**: Set as default editor and merge tool
- **Modern Defaults**: main branch, simple push, proper line endings

### VS Code Extensions

- **Workspace-Based**: Project-specific recommendations via `.vscode/extensions.json`
- **Core Extensions**: Installed globally (AI, productivity, remote)
- **Tech Stacks**: Separate extension sets for JS, Python, DevOps, Go, Rust

## Agent Tools Integration

### MCP Configuration

- **Location**: `~/.config/mcp.json` → `agent/mcp.json`
- **Servers**: Linear, PostgreSQL, Context7, Container-use, Tavily, Serena
- **Auto-linking**: Setup script creates symlinks automatically

### Development Scripts

- **Session Init**: `~/.agent/scripts/session-init.sh`

### Cheatsheets & Templates

- **Technology Guides**: Container usage, Linear workflow, tool integrations
- **Project Templates**: PRD examples, project configuration
- **Best Practices**: Pragmatic programmer tips, enhanced tool integration

## Current Status

### ✅ Completed Features

- Modern CLI tool integration with mise and uv
- Starship prompt with oh-my-zsh plugins
- GNU Stow-based symlink management
- Interactive git configuration
- Agent folder auto-linking
- Stow package structure for shell configuration
- Tech-specific VS Code extension sets
- Cross-platform Brewfile optimization

### 🔧 Architecture Patterns

- **Configuration as Code**: All dotfiles version controlled
- **Symlink-Based**: GNU Stow for transparent file management
- **Package-Oriented**: Modular stow packages by functionality
- **Agent Integration**: Unified AI tools configuration via MCP
- **Modern Tooling**: Latest alternatives to traditional Unix tools
