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

## 🔧 Troubleshooting Guide

### Common Installation Issues

#### 1. Stow Conflicts

**Problem**: Stow fails with "existing target is neither a link nor a directory"

```bash
# Symptoms
ERROR: Existing target is neither a link nor a directory: .zshrc

# Solution
make backup              # Backup existing files first
make clean              # Remove broken symlinks
make dry-run            # Preview what will be stowed
make stow               # Apply dotfiles
```

#### 2. Permission Errors

**Problem**: Permission denied when stowing files

```bash
# Symptoms
stow: ERROR: Can't create link

# Solutions
sudo chown -R $(whoami) ~/.config    # Fix ownership
chmod 755 ~/.config                  # Fix permissions
ls -la ~/                            # Check current permissions
```

#### 3. Homebrew Installation Failures

**Problem**: Brew command not found or installation fails

```bash
# For macOS
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH if needed
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Verify installation
brew --version
```

#### 4. Git Configuration Issues

**Problem**: Git operations fail or user info missing

```bash
# Check current configuration
git config --global --list

# Reconfigure if needed
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Reset git config completely
git config --global --unset-all user.name
git config --global --unset-all user.email
make setup  # Re-run setup for interactive configuration
```

### Shell Configuration Issues

#### 5. Zsh Not Default Shell

**Problem**: Still using bash instead of zsh

```bash
# Check current shell
echo $SHELL

# Change to zsh
chsh -s $(which zsh)

# Restart terminal and verify
echo $SHELL  # Should show /bin/zsh or /usr/local/bin/zsh
```

#### 6. Oh-My-Zsh Plugin Errors

**Problem**: Plugins not loading or causing errors

```bash
# Check if oh-my-zsh is installed
ls -la ~/.oh-my-zsh

# Reinstall oh-my-zsh if missing
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Check plugin syntax in .zshrc
grep "plugins=" ~/.zshrc

# Common plugin issues
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)  # Correct format
```

#### 7. Starship Prompt Not Working

**Problem**: Prompt looks broken or default

```bash
# Check if starship is installed
which starship

# Install if missing (macOS)
brew install starship

# Check configuration
ls -la ~/.config/starship.toml

# Test starship configuration
starship config

# Restart shell
exec zsh
```

### Development Environment Issues

#### 8. Mise/Development Tools Problems

**Problem**: Node, Python, or other environments not working

```bash
# Check mise installation
which mise
mise --version

# List available tools
mise list-all node
mise list-all python

# Install specific versions
mise install node@latest
mise install python@latest

# Check mise configuration
cat .mise.toml

# Activate mise for current shell
eval "$(mise activate zsh)"
```

#### 9. VS Code Extension Issues

**Problem**: Extensions not installing or working

```bash
# Check VS Code command line tools
which code

# Install command line tools
# VS Code > Command Palette > "Install 'code' command in PATH"

# Check extension file
cat ~/.vscode/extensions.json

# Install extensions manually
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-typescript-next
```

### Agent Tools Issues

#### 10. MCP Server Configuration Problems

**Problem**: AI tools not working or MCP servers failing

```bash
# Check MCP configuration
cat ~/.agent/mcp.json

# Test Claude CLI connection
claude --version

# Check if scripts are executable
ls -la ~/.agent/scripts/

# Make scripts executable if needed
chmod +x ~/.agent/scripts/*.sh

# Run memory initialization
~/.agent/scripts/memory-init.sh
```

#### 11. Pre-commit Hooks Failing

**Problem**: Verification scripts fail on commit

```bash
# Test pre-commit verification manually
make verify

# Check script permissions
ls -la ~/.agent/scripts/pre-commit-verify.sh

# Install missing linting tools
npm install -g eslint                    # JavaScript
pip install pylint                       # Python
brew install shellcheck                  # Shell scripts

# Skip hooks temporarily (emergency)
git commit --no-verify -m "message"
```

#### 12. Vulnerability Scanning Issues

**Problem**: Security scans fail or tools missing

```bash
# Install scanning tools
make scan-install

# Or install manually
npm install -g npm@latest               # Update npm
pip install safety pip-audit bandit     # Python tools
go install golang.org/x/vuln/cmd/govulncheck@latest  # Go tools
cargo install cargo-audit               # Rust tools

# Run scan manually
make scan

# Check scan results
ls -la .security-scans/
```

### Platform-Specific Issues

#### 13. macOS Specific Problems

```bash
# Xcode command line tools missing
xcode-select --install

# Rosetta issues on M1 Macs
softwareupdate --install-rosetta

# SIP (System Integrity Protection) issues
csrutil status

# Homebrew path issues on M1
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
```

#### 14. Linux Specific Problems

```bash
# Package manager varies by distribution
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install stow git curl

# Fedora/RHEL
sudo dnf install stow git curl

# Arch Linux
sudo pacman -S stow git curl

# Missing dependencies
sudo apt-get install build-essential  # For compilation
```

### File System Issues

#### 15. Broken Symlinks

**Problem**: Files showing as broken links

```bash
# Find broken symlinks
make clean

# Or manually
find ~ -maxdepth 1 -name ".*" -type l ! -exec test -e {} \; -print

# Remove specific broken link
rm ~/.broken-link

# Re-stow to recreate
make restow
```

#### 16. Conflicting Dotfiles

**Problem**: Multiple dotfile managers or old files

```bash
# Check for existing dotfile managers
ls -la ~ | grep -E "(\.oh-my-zsh|\.dotfiles|\.config)"

# Backup and remove conflicting files
make backup
rm ~/.conflicting-file

# Use nuclear option (careful!)
make nuke  # Removes ALL dotfile symlinks
```

### Recovery Procedures

#### 17. Complete Reset

**Problem**: Everything is broken, need fresh start

```bash
# 1. Backup current state
cp -r ~ ~/backup-$(date +%Y%m%d)

# 2. Remove all dotfile symlinks
make nuke

# 3. Clean shell configuration
rm ~/.zshrc ~/.bashrc ~/.profile 2>/dev/null || true

# 4. Fresh installation
make setup

# 5. Verify installation
make doctor
make check
```

#### 18. Diagnostic Commands

**Problem**: Need to understand current state

```bash
# Comprehensive diagnostics
make doctor

# Check specific components
make status              # Dotfile status
make diff               # Show differences
git status              # Git repository state
ls -la ~/.agent/        # Agent tools
which stow git make     # Required tools

# Environment information
echo $SHELL             # Current shell
echo $PATH              # PATH variable
env | grep -E "(EDITOR|BROWSER|LANG)"  # Environment vars
```

### Getting Help

#### 19. Debug Information Collection

When reporting issues, collect this information:

```bash
# System information
uname -a                    # OS version
echo $SHELL                 # Shell
which stow git make         # Tool locations

# Dotfiles status
make doctor                 # Diagnostic output
make status                 # Stow status
git status                  # Git status

# Configuration files
cat ~/.zshrc | head -20     # Shell config (first 20 lines)
cat ~/.agent/mcp.json       # MCP configuration
ls -la ~/.config/           # Config directory
```

#### 20. Common Fix Workflow

For most issues, try this sequence:

```bash
1. make doctor              # Identify missing components
2. make backup             # Backup current state
3. make clean              # Remove broken symlinks
4. make dry-run            # Preview changes
5. make restow             # Re-apply dotfiles
6. make verify             # Run quality checks
7. make test               # Comprehensive testing
```

---

**💡 Pro Tips:**

- Always run `make dry-run` before `make stow`
- Use `make doctor` for quick diagnostics
- Keep backups with `make backup` before major changes
- Check `~/.agent/scripts/` for additional automation tools
