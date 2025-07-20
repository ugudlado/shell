# Dotfiles Setup

A cross-platform dotfile management system using [GNU Stow](https://www.gnu.org/software/stow/) for simple, symlink-based configuration management.

## ✨ What's New

This setup replaces legacy shell scripts with:

- **GNU Stow**: Simple, symlink-based dotfile management
- **Modern Tools**: mise (dev environment manager), zoxide, eza, bat, ripgrep
- **Secure Installation**: No piped curl, proper verification
- **Cross-platform Ready**: Templates for macOS, Linux, Windows

## 📦 Core Tools Installed

### Development Environment

- **Shell**: zsh with oh-my-zsh and plugins
- **Environment Manager**: mise (replaces nvm, rbenv, pyenv, etc.)
- **Editor**: VS Code with curated extensions
- **Git**: Enhanced configuration with VS Code integration

### Modern CLI Tools

- `eza` - Enhanced directory listing (replaces ls)
- `bat` - Syntax highlighting for file viewing (replaces cat)
- `ripgrep (rg)` - Fast text search (replaces grep)
- `fd` - Fast file finder (replaces find)
- `fzf` - Fuzzy finder for files and commands
- `tree` - Directory structure visualization
- `tealdeer (tldr)` - Quick command examples
- `jq` - JSON processor and formatter
- `htop` - Interactive process viewer

## 🚀 General Setup

### Quick Start

```bash
# Clone the repository anywhere
git clone <your-repo-url> ~/shell
cd ~/shell

# Complete initial setup
make setup

# Please update git name and email in .profile and restart zsh shell
```

#### Container setup (can be useful for agentic coding)

```bash
git clone <your-repo-url> ~/shell
cd ~/shell

export GIT_USER_NAME=""
export GIT_USER_EMAIL=""

SETUP_SKIP_INTERACTIVE=true make setup
```

## 🔧 Managing Your Dotfiles

All dotfile management is done through convenient Make commands that wrap stow and git operations.

### Available Make Commands

Run `make help` to see all available commands:

```bash
make help                    # Show all available commands
make setup                   # Complete initial setup
make status                  # Show current status of managed files
make diff                    # Show differences between repo and home
make stow                    # Stow the home package
make unstow                  # Unstow the home package
make dry-run                 # Show what would be stowed
make backup                  # Backup existing files before stowing
make clean                   # Clean up broken symlinks
```

### Daily Commands

```bash
# Check status of managed files
make status

# Show differences before applying
make diff
```

### Stow Operations

```bash
# Stow the home package
make stow

# Show what would be stowed (dry run)
make dry-run

# Unstow (remove symlinks)
make unstow
```

### Advanced Operations

```bash
# Backup existing files before stowing
make backup

# Clean up broken symlinks
make clean
```

## 🤖 AI Development Workflow Integration

This dotfiles setup includes comprehensive AI development tools and workflows:

### Agent Development Tools

- **Agent Rules** (`src/home/.agent/AGENT_RULES.md`) - Development process guidelines
- **MCP Configuration** (`src/home/.agent/mcp.json`) - Model Context Protocol server settings
- **Tool Cheatsheets** (`src/home/.agent/cheatsheets/`) - Quick reference guides for development tools
- **Project Templates** (`src/home/.agent/templates/`) - Standardized project documentation templates

### AI Assistant Configuration

- **Claude Integration** (`src/home/.claude/`) - Claude AI-specific settings and instructions
- **Gemini Integration** (`src/home/.gemini/`) - Gemini AI-specific configuration
- **Session Automation** (`src/home/.agent/scripts/session-init.sh`) - Automated project state discovery

### Development Productivity

The agent workflow includes:

- Automated session initialization
- Tool integration cheatsheets
- Standardized project documentation
- AI-assisted development workflows

## 🎯 Project-Based VS Code Extensions

Instead of installing all extensions globally, use project-specific recommendations:

### Setup for New Projects

```bash
# 1. Create .vscode directory in your project
mkdir -p myproject/.vscode

# 2. Copy appropriate extension set
cp src/.vscode/extensions/javascript.json myproject/.vscode/extensions.json

# 3. VS Code will automatically suggest these extensions when you open the project
```

### Available Extension Sets

- **Core** (`src/.vscode/extensions.json`) - Essential extensions for all projects
- **JavaScript** (`src/.vscode/extensions/javascript.json`) - Node.js, TypeScript, React
- **Python** (`src/.vscode/extensions/python.json`) - Python development and data science
- **DevOps** (`src/.vscode/extensions/devops.json`) - Docker, Kubernetes, Terraform
- **Go** (`src/.vscode/extensions/go.json`) - Go development

## 📁 Repository Structure

```
.
├── Makefile                      # Build and management commands
├── README.md                     # This file
├── setup.sh                     # Modern installation script
├── src/                         # Stow packages
│   ├── .vscode/                 # VS Code configuration
│   │   ├── settings.json        # Global VS Code settings
│   │   ├── extensions.json      # Core extensions list
│   │   └── extensions/          # Language-specific extension sets
│   │       ├── README.md        # Extension management guide
│   │       ├── devops.json      # Docker, K8s, Terraform
│   │       ├── go.json          # Go development
│   │       ├── javascript.json  # JavaScript/Node.js projects
│   │       └── python.json      # Python development
│   ├── docker/                  # Docker containerization
│   │   ├── Dockerfile           # Alpine image with CLI tools
│   │   ├── README.md            # Docker usage guide
│   │   └── build.sh             # Docker build script
│   ├── installers/              # Platform-specific installers
│   │   └── mac/                 # macOS-specific packages
│   │       └── Brewfile         # Homebrew packages for macOS
│   └── home/                    # Main package containing all dotfiles
│       ├── .zshrc               # zsh configuration
│       ├── .bashrc              # bash configuration
│       ├── .gitconfig           # Git configuration
│       ├── .gitignore           # Global gitignore patterns
│       ├── .profile             # Shell profile
│       ├── .agent/              # AI development tools and workflows
│       │   ├── AGENT_RULES.md   # Development process rules
│       │   ├── README.md        # Agent tools documentation
│       │   ├── mcp.json         # MCP server configuration
│       │   ├── scripts/         # Automation scripts
│       │   │   └── session-init.sh  # Session initialization
│       │   ├── templates/       # Project templates
│       │   │   ├── PRD_TEMPLATE.md     # Product requirements template
│       │   │   ├── PRD_EXAMPLES.md     # PRD examples
│       │   │   └── project-config.json # Project configuration template
│       │   └── cheatsheets/     # Tool reference guides
│       │       ├── 100-container-use-cheatsheet.mdc
│       │       ├── 101-taskmaster-cheatsheet.mdc
│       │       ├── 102-linear-cheatsheet.mdc
│       │       ├── 103-filemcp-cheatsheet.mdc
│       │       ├── 104-misc-tools-cheatsheet.mdc
│       │       ├── 105-enhanced-tool-integration.mdc
│       │       ├── 106-container-use-mcp-cheatsheet.md
│       │       ├── 107-serena-mcp-cheatsheet.mdc
│       │       ├── 108-cli-productivity-tools.mdc
│       │       └── 110-pragmatic-programmer-tips.mdc
│       ├── .claude/             # Claude AI configuration
│       │   ├── CLAUDE.md        # Claude-specific instructions
│       │   └── settings.json    # Claude settings
│       ├── .gemini/             # Gemini AI configuration
│       │   └── GEMINI.md        # Gemini-specific instructions
│       └── .config/             # Application configurations
│           └── starship.toml    # Starship prompt configuration
└── docs/                        # Project documentation
    ├── USAGE.md                 # Detailed usage guide
    ├── project-context.md       # Project context and background
    └── PRD_dotfile-modernization.md  # Product requirements document
```

## 🔍 Troubleshooting

### Common Issues (All Platforms)

1. **Permission Denied**

   ```bash
   chmod +x setup.sh
   ```

2. **Stow Not Found**

   ```bash
   # Install stow for your platform
   # macOS: brew install stow
   # Ubuntu: sudo apt install stow
   ```

3. **VS Code Extensions Not Installing**
   - Ensure VS Code is installed first
   - Check internet connection

### Stow-Specific Issues

4. **Conflicts with Existing Files**

   ```bash
   # Backup existing files
   mv ~/.zshrc ~/.zshrc.backup

   # Then re-run stow
   cd ~/dotfiles && stow -R -d src -t ~ home
   ```

5. **Stow Package Not Found**

   ```bash
   # Ensure you're in the correct directory
   cd ~/dotfiles

   # Check package structure
   ls -la src/
   ```

### macOS Specific Issues

6. **Homebrew Installation Failed**
   - Check internet connection
   - Verify Xcode Command Line Tools: `xcode-select --install`

7. **VS Code Not Found**

   ```bash
   brew install --cask visual-studio-code
   ```

### Reset Installation

```bash
# Unstow current configuration
cd ~/dotfiles
stow -D -d src -t ~ home

# Remove any backups if needed
rm -f ~/.zshrc.backup*

# Re-run setup
./setup.sh
```

## 🧪 Testing

Test the installation in a clean environment:

### macOS Testing

```bash
# Test in a new user account or VM
# Run installation script
```

### Ubuntu Testing

```bash
# Test in Docker
docker run -it --rm ubuntu:latest bash
# Then run installation script
```

## 🔮 Future Plans

- [x] macOS support (Homebrew)
- [x] Stow-based management
- [x] Linux support (Alpine, Debian, Fedora, Arch)
- [x] Docker containerization (Alpine CLI tools)
- [x] VS Code diff integration for conflict resolution
- [x] AI development workflow integration
- [x] MCP (Model Context Protocol) server configuration
- [x] Agent-based development tools and cheatsheets
- [x] Project-based VS Code extension management
- [ ] Windows support (Chocolatey, Scoop)
- [ ] Automated testing pipeline
- [ ] Additional stow packages (tmux, vim, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test on your platform
4. Submit a pull request

## 📚 Resources

- [GNU Stow Documentation](https://www.gnu.org/software/stow/)
- [Homebrew](https://brew.sh/)
- [oh-my-zsh](https://ohmyz.sh/)
- [Modern Unix Tools](https://github.com/ibraheemdev/modern-unix)
- [Mise Development Environment Manager](https://mise.jdx.dev/)

---
