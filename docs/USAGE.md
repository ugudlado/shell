# Dotfiles Usage Guide - Makefile Edition

## Quick Start

```bash
# Clone the repository anywhere you want
git clone <your-repo-url> ~/dotfiles
cd ~/dotfiles

# See all available commands
make help

# Complete initial setup (does everything)
make setup

# Or for existing systems with stow already installed
make quick-setup
```

## Daily Commands

```bash
# Edit dotfiles in VS Code
make edit

# Pull latest changes and update all symlinks
make sync

# Show current status of managed files  
make status

# Show differences between repo and home files
make diff
```

## Package Management

```bash
# List available packages
make list

# Show contents of the home package
make show

# Restow the home package
make restow

# Remove symlinks for the home package
make unstow

# Preview what would be done (dry run)
make dry-run
```

## Adding Files

```bash
# Add a file to the home package
make add FILE=~/.vimrc

# For future packages (if needed), create first then add
make new-package PACKAGE=tmux
make add FILE=~/.tmux.conf PACKAGE=tmux
```

## Safety & Backup

```bash
# Backup existing files before stowing
make backup

# Clean up broken symlinks
make clean

# Show which files are currently managed
make managed
```

## Git Operations

```bash
# Commit changes
make commit MSG="Updated shell configuration"

# Push changes
make push
```

## Examples

### Setting up on a new machine
```bash
git clone https://github.com/user/dotfiles ~/dotfiles
cd ~/dotfiles
make setup
```

### Daily workflow
```bash
cd ~/dotfiles
make edit          # Edit files in VS Code
# ... make changes ...
make diff          # Check what changed
make sync          # Apply changes
make commit MSG="Updated zsh config"
make push
```

### Adding a new dotfile
```bash
cd ~/dotfiles
make add FILE=~/.vimrc
make show
```

### Checking status
```bash
cd ~/dotfiles
make diff          # See differences
make status        # See what's linked
make dry-run       # Preview changes
```

## Package Structure

```
~/dotfiles/
├── Makefile              # All commands
├── setup.sh             # Initial setup script (called by make setup)
├── src/                 # Stow directory
│   └── home/            # Single home package
│       ├── .zshrc
│       ├── .gitconfig
│       ├── .profile
│       ├── .config/
│       │   └── starship.toml
│       ├── .claude/
│       └── .agent/
```

## All Available Commands

| Command | Description |
|---------|-------------|
| `make help` | Show help message |
| `make setup` | Complete initial setup |
| `make edit` | Edit dotfiles in VS Code |
| `make sync` | Pull and restow |
| `make status` | Show current managed files |
| `make list` | List packages |
| `make diff` | Show differences |
| `make backup` | Backup existing files |
| `make stow` | Stow home package |
| `make restow` | Restow home package |
| `make unstow` | Unstow home package |
| `make dry-run` | Show what would be stowed |
| `make add FILE=x` | Add file to home package |
| `make install-deps` | Install stow and deps |
| `make clean` | Clean broken symlinks |
| `make show` | Show home package contents |
| `make commit MSG="x"` | Commit changes |
| `make push` | Push to remote |
| `make new-package PACKAGE=x` | Create new package |
| `make quick-setup` | Quick setup for existing systems |

## Pro Tips

1. **Always use `make diff` before `make sync`** to see what will change
2. **Use `make backup` before first-time setup** to preserve existing files
3. **Use `make dry-run`** to preview stow operations
4. **Clone anywhere** - the Makefile works from any directory
5. **Use descriptive commit messages** with `make commit MSG="description"`