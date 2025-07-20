# Dotfiles Project Context

## Project Overview

- **Name**: Modern Dotfiles Management System
- **Type**: Development Environment Setup & Configuration
- **Tech Stack**: Shell scripts, GNU Stow, Homebrew, VS Code, Starship, Oh-My-Zsh
- **Purpose**: Automated, cross-platform developer environment setup with modern tooling

## Quick Reference

- **Main Branch**: master
- **Setup Command**: `make setup` (complete setup)
- **Daily Commands**: `make status`, `make diff`
- **Package Management**: `make stow`, `make unstow`, `make dry-run`
- **Agent Tools**: `~/.agent/` (cheatsheets, scripts, MCP config)

## Current Directory Structure

```
.
├── Makefile                     # All dotfile management commands
├── README.md                    # Project documentation
├── setup.sh                    # Installation script (called by make setup)
├── docs/                        # Project documentation
│   ├── project-context.md       # This file
│   ├── USAGE.md                 # Comprehensive usage guide
│   └── PRD_dotfile-modernization.md  # Project requirements
└── src/                         # Stow packages and configurations
    ├── .vscode/                 # VS Code configuration
    │   ├── settings.json        # Global VS Code settings
    │   ├── extensions.json      # Core extensions list
    │   └── extensions/          # Language-specific extension sets
    │       ├── README.md        # Extension management guide
    │       ├── devops.json      # Docker, K8s, Terraform
    │       ├── go.json          # Go development
    │       ├── javascript.json  # JavaScript/Node.js projects
    │       └── python.json      # Python development
    ├── docker/                  # Docker containerization
    │   ├── Dockerfile           # Alpine image with CLI tools
    │   ├── README.md            # Docker usage guide
    │   └── build.sh             # Docker build script
    ├── installers/              # Platform-specific installers
    │   └── mac/                 # macOS-specific packages
    │       └── Brewfile         # Homebrew packages for macOS
    └── home/                    # Main stow package containing all dotfiles
        ├── .zshrc               # Zsh configuration with starship + oh-my-zsh
        ├── .bashrc              # Bash configuration
        ├── .gitconfig           # Git configuration template
        ├── .gitignore           # Global gitignore patterns
        ├── .profile             # Shell profile
        ├── .agent/              # AI development tools and workflows
        │   ├── AGENT_RULES.md   # Development process rules
        │   ├── README.md        # Agent tools documentation
        │   ├── mcp.json         # MCP server configuration
        │   ├── scripts/         # Automation scripts
        │   ├── templates/       # Project templates
        │   └── cheatsheets/     # Tool reference guides
        ├── .claude/             # Claude AI configuration
        ├── .gemini/             # Gemini AI configuration
        └── .config/             # Application configurations
            └── starship.toml    # Starship prompt configuration
```

## Development Commands

```bash
# Setup complete environment
make setup                     # Complete initial setup

# Manage dotfiles with Makefile
make status                    # Show current status of managed files
make diff                      # Show differences between repo and home
make stow                      # Stow the home package
make unstow                    # Unstow the home package
make dry-run                   # Preview stow changes (dry run)
make backup                    # Backup existing dotfiles before stowing
make clean                     # Clean up broken symlinks

# Package management
brew bundle install --file=src/installers/mac/Brewfile  # Install/update packages (macOS)
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

- **Source Directory**: `src/home/`
- **Package Structure**: Single `home` package containing all dotfiles
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

- **Location**: `src/home/.agent/mcp.json`
- **Servers**: Linear, PostgreSQL, Context7, Container-use, and others
- **Auto-linking**: Setup script creates symlinks automatically

### Development Scripts

- **Session Init**: `src/home/.agent/scripts/session-init.sh`

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
