#!/bin/bash
#
# setup-common.sh — Shared functions for all setup scripts
#
# Usage: source scripts/setup-common.sh
#
# Not meant to be run directly. Sourced by setup-macos.sh and setup-linux.sh.
#
# Key functions:
#   install_claude_code      — verify binary, create ~/.local/bin/claude symlink
#   configure_claude_code    — symlink src/claude/ into ~/.claude/
#   stow_dotfiles_common     — stow src/home/ into $HOME
#   backup_dotfiles_common   — backup conflicting files before stow

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "\n${BLUE}🚀 $1${NC}"
}

# Environment detection
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

detect_environment() {
    if [[ -f /.dockerenv ]] || [[ -n "${container:-}" ]]; then
        echo "docker"
    elif [[ -n "${CONTAINER_ID:-}" ]] || [[ -n "${CODESPACES:-}" ]]; then
        echo "container"
    else
        echo "host"
    fi
}

# Common Git setup
setup_git_common() {
    log_info "Setting up Git configuration..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install git first."
        return 1
    fi
    
    # Create ~/.gitconfig.local for user-specific settings
    local gitconfig_local="$HOME/.gitconfig.local"

    # Get user input for git config if not already set in .gitconfig.local
    if [[ ! -f "$gitconfig_local" ]] || [[ -z "$(git config --file "$gitconfig_local" user.name 2>/dev/null || true)" ]]; then
        if [[ -z "${GIT_USER_NAME:-}" ]]; then
            read -p "Enter your Git user name: " GIT_USER_NAME
        fi
        git config --file "$gitconfig_local" user.name "$GIT_USER_NAME"
    fi

    if [[ ! -f "$gitconfig_local" ]] || [[ -z "$(git config --file "$gitconfig_local" user.email 2>/dev/null || true)" ]]; then
        if [[ -z "${GIT_USER_EMAIL:-}" ]]; then
            read -p "Enter your Git email: " GIT_USER_EMAIL
        fi
        git config --file "$gitconfig_local" user.email "$GIT_USER_EMAIL"
    fi
    
    # Set git configuration
    git config --global init.defaultBranch main
    git config --global push.default simple
    git config --global core.autocrlf input
    
    # Set VS Code as editor if available
    if command -v code &> /dev/null; then
        git config --global core.editor "code --wait"
        git config --global merge.tool vscode
        git config --global mergetool.vscode.cmd 'code --wait $MERGED'
        git config --global diff.tool vscode
        git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'
        log_success "Git configured with VS Code integration"
    else
        log_success "Git configured (VS Code not found for editor setup)"
    fi
}

# Smart backup functionality - only backup files that would conflict
backup_dotfiles_common() {
    log_info "Checking for conflicting dotfiles..."
    
    # Debug: show what we're checking
    if [[ "${DEBUG_BACKUP:-false}" == "true" ]]; then
        log_info "Debug mode: PROJECT_ROOT = $PROJECT_ROOT"
        log_info "Debug mode: HOME = $HOME"
    fi
    
    # Get list of files that would be stowed from our repo
    local repo_files=()
    if [[ -d "$PROJECT_ROOT/src/home" ]]; then
        while IFS= read -r -d '' file; do
            # Convert absolute path to relative path from home
            local relative_path="${file#$PROJECT_ROOT/src/home/}"
            repo_files+=("$relative_path")
        done < <(find "$PROJECT_ROOT/src/home" -type f -print0)
    fi
    
    if [[ ${#repo_files[@]} -eq 0 ]]; then
        log_info "No dotfiles found in repository, skipping backup"
        return 0
    fi
    
    # Check which files would conflict (exist and are not symlinks to our repo)
    local conflicts=()
    for file in "${repo_files[@]}"; do
        local home_file="$HOME/$file"
        local repo_file="$PROJECT_ROOT/src/home/$file"
        
        # Skip files that are inside symlinked directories
        local parent_dir="$(dirname "$file")"
        local parent_is_symlinked=false
        
        # Check if any parent directory is already symlinked to our repo
        while [[ "$parent_dir" != "." ]]; do
            local parent_home="$HOME/$parent_dir"
            if [[ -L "$parent_home" ]]; then
                local parent_link=$(readlink "$parent_home")
                local parent_resolved=""
                if [[ "$parent_link" = /* ]]; then
                    parent_resolved=$(realpath "$parent_link" 2>/dev/null || echo "$parent_link")
                else
                    parent_resolved=$(realpath "$HOME/$parent_link" 2>/dev/null || echo "")
                fi
                local parent_expected=$(realpath "$PROJECT_ROOT/src/home/$parent_dir" 2>/dev/null || echo "")
                
                if [[ "$parent_resolved" == "$parent_expected" ]]; then
                    parent_is_symlinked=true
                    if [[ "${DEBUG_BACKUP:-false}" == "true" ]]; then
                        log_info "Debug: $file skipped - parent $parent_dir is symlinked to repo"
                    fi
                    break
                fi
            fi
            parent_dir="$(dirname "$parent_dir")"
        done
        
        if [[ "$parent_is_symlinked" == "true" ]]; then
            continue
        fi
        
        if [[ -f "$home_file" ]]; then
            if [[ -L "$home_file" ]]; then
                # It's a symlink - check if it points to our repo
                local link_target=$(readlink "$home_file")
                
                # Handle both absolute and relative symlinks
                local resolved_target=""
                if [[ "$link_target" = /* ]]; then
                    # Absolute path
                    resolved_target=$(realpath "$link_target" 2>/dev/null || echo "$link_target")
                else
                    # Relative path - resolve from file's directory
                    local file_dir="$(dirname "$home_file")"
                    resolved_target=$(realpath "$file_dir/$link_target" 2>/dev/null || echo "")
                fi
                
                local expected_target=$(realpath "$repo_file" 2>/dev/null || echo "")
                
                if [[ "${DEBUG_BACKUP:-false}" == "true" ]]; then
                    log_info "Debug: $file -> link: '$link_target', resolved: '$resolved_target', expected: '$expected_target'"
                fi
                
                if [[ "$resolved_target" != "$expected_target" ]]; then
                    # Symlink exists but points elsewhere
                    conflicts+=("$file (symlink to wrong location)")
                elif [[ "${DEBUG_BACKUP:-false}" == "true" ]]; then
                    log_info "Debug: $file correctly linked to repo, no conflict"
                fi
                # If symlink points to our repo, no conflict
            else
                # Regular file that would conflict
                if [[ "${DEBUG_BACKUP:-false}" == "true" ]]; then
                    log_info "Debug: $file is regular file, would conflict"
                fi
                conflicts+=("$file")
            fi
        fi
    done
    
    # Note: Directory conflicts are handled by the file-level checks above.
    # Stow typically creates directories and symlinks individual files,
    # so the main conflict detection happens at the file level.
    
    if [[ ${#conflicts[@]} -eq 0 ]]; then
        log_success "No conflicting dotfiles found, backup not needed"
        return 0
    fi
    
    # Create backup directory and backup only conflicting files
    local backup_dir="$HOME/.dotfiles-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    log_warning "Found ${#conflicts[@]} conflicting files/directories:"
    for conflict in "${conflicts[@]}"; do
        echo "  • $conflict"
    done
    
    for file in "${conflicts[@]}"; do
        local home_path="$HOME/$file"
        local backup_path="$backup_dir/$file"
        
        if [[ -f "$home_path" ]]; then
            # Create directory structure in backup
            mkdir -p "$(dirname "$backup_path")"
            mv "$home_path" "$backup_path"
            log_info "Backed up file: $file"
        elif [[ -d "$home_path" ]]; then
            # Backup directory
            mkdir -p "$(dirname "$backup_path")"
            cp -r "$home_path" "$backup_path"
            rm -rf "$home_path"
            log_info "Backed up directory: $file"
        fi
    done
    
    log_success "Conflicting dotfiles backed up to $backup_dir"
}

# Common stow functionality
stow_dotfiles_common() {
    log_info "Stowing dotfiles..."

    cd "$PROJECT_ROOT"

    # Ensure target directories exist for non-claude stow packages
    mkdir -p "$HOME/.config"
    mkdir -p "$HOME/.agent"

    # Stow the home package (restow to handle any previous state)
    if stow -t "$HOME" -d src -R home; then
        log_success "Dotfiles stowed successfully"
    else
        log_error "Failed to stow dotfiles. Check for conflicts and try again."
        log_info "You can run 'make dry-run' to see what would be stowed"
        return 1
    fi
}

# Common agent tools setup
setup_agent_tools_common() {
    log_info "Setting up agent tools..."
    
    # Ensure .agent directory exists
    mkdir -p "$HOME/.agent"
    
    # Run memory initialization if script exists
    if [[ -f "$HOME/.agent/scripts/memory-init.sh" ]]; then
        log_info "Initializing AI memory system..."
        bash "$HOME/.agent/scripts/memory-init.sh" || log_warning "Memory initialization failed"
    fi
    
    log_success "Agent tools configured"
}

# Common shell setup
setup_shell_common() {
    log_info "Setting up shell integration..."
    
    # Source the new configuration
    if [[ -f "$HOME/.zshrc" ]]; then
        log_info "Zsh configuration is ready. Restart your terminal or run 'source ~/.zshrc'"
    fi
    
    if [[ -f "$HOME/.bashrc" ]]; then
        log_info "Bash configuration is ready. Restart your terminal or run 'source ~/.bashrc'"
    fi
    
    log_success "Shell integration configured"
}

# Install Claude Code binary and symlink
install_claude_code() {
    log_header "Installing Claude Code"

    if command -v claude &> /dev/null; then
        log_success "Claude Code already installed"

        local claude_path=$(which claude)
        local symlink_path="$HOME/.local/bin/claude"

        mkdir -p "$HOME/.local/bin"

        if [[ ! -L "$symlink_path" ]] || [[ "$(readlink "$symlink_path")" != "$claude_path" ]]; then
            ln -sf "$claude_path" "$symlink_path"
            log_success "Claude Code symlink created: $symlink_path -> $claude_path"
        else
            log_info "Claude Code symlink already correct"
        fi
    else
        log_warning "Claude Code not found. Install it with: brew install claude-code"
    fi
}

# Configure Claude Code via direct symlinks (not stow)
# ~/.claude/ mixes tracked config with runtime data, so we symlink
# individual files and directories rather than letting stow manage it.
configure_claude_code() {
    log_header "Configuring Claude Code"

    local claude_src="$PROJECT_ROOT/src/claude"
    local claude_dst="$HOME/.claude"

    mkdir -p "$claude_dst"

    # Symlink individual config files
    local files=(
        "CLAUDE.md"
        "RTK.md"
        "settings.json"
    )

    for file in "${files[@]}"; do
        if [[ -f "$claude_src/$file" ]]; then
            _symlink_claude "$claude_src/$file" "$claude_dst/$file"
        fi
    done

    # Symlink hookify .local.md files
    for file in "$claude_src"/hookify.*.local.md; do
        [[ -f "$file" ]] || continue
        _symlink_claude "$file" "$claude_dst/$(basename "$file")"
    done

    # Symlink directories (agents, commands, hooks, templates, config)
    local dirs=("agents" "commands" "hooks" "skills" "templates" "config")

    for dir in "${dirs[@]}"; do
        if [[ -d "$claude_src/$dir" ]]; then
            _symlink_claude "$claude_src/$dir" "$claude_dst/$dir"
        fi
    done

    # Pre-cache ccstatusline so first session has no download delay
    if command -v npx &> /dev/null; then
        log_info "Pre-caching ccstatusline..."
        npx -y ccstatusline@latest --version 2>/dev/null || true
        log_success "ccstatusline ready"
    else
        log_warning "npx not found — ccstatusline will auto-install on first Claude Code session"
    fi
}

# Helper: create a symlink, backing up any existing non-symlink target
_symlink_claude() {
    local src="$1"
    local dst="$2"

    if [[ -L "$dst" ]]; then
        local current
        current="$(readlink "$dst")"
        if [[ "$current" == "$src" ]]; then
            log_info "  Already linked: $(basename "$dst")"
            return
        fi
        # Points elsewhere — relink
        rm "$dst"
    elif [[ -e "$dst" ]]; then
        # Regular file/dir exists — back it up
        local backup="$dst.bak.$(date +%s)"
        mv "$dst" "$backup"
        log_warning "  Backed up existing $(basename "$dst") -> $(basename "$backup")"
    fi

    ln -s "$src" "$dst"
    log_success "  Linked: $(basename "$dst")"
}

# Common post-installation steps
post_install_common() {
    log_success "🎉 Dotfiles setup complete!"
    echo
    log_info "Next steps:"
    echo "  1. Restart your terminal or source your shell config"
    echo "  2. Run 'make doctor' to check system health"
    echo
    log_info "Available commands:"
    echo "  • make doctor     - Check system health"
    echo "  • make diff       - Show differences"
    echo "  • make stow       - Re-apply dotfiles"
    echo
    log_info "Documentation:"
    echo "  • README.md              - Project overview"
    echo "  • docs/USAGE.md          - Usage guide"
    echo "  • docs/project-context.md - Development context"
}

# Check if running as root (generally not recommended)
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root is not recommended for dotfiles setup"
        log_warning "Consider running as a regular user"
    fi
}

# Verify required tools
verify_required_tools() {
    local required_tools=("git" "make" "stow")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install these tools before continuing"
        return 1
    fi
    
    log_success "All required tools are available"
}

# Export functions for use in other scripts
export -f log_info log_success log_warning log_error log_header
export -f detect_os detect_environment
export -f setup_git_common backup_dotfiles_common stow_dotfiles_common
export -f setup_agent_tools_common setup_shell_common install_claude_code configure_claude_code _symlink_claude post_install_common
export -f check_root verify_required_tools