#!/bin/bash

# Modern Dotfile Installation Script
# Uses GNU Stow for simple, symlink-based dotfile management
# Replaces legacy install.sh with secure practices

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# OS Detection
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        CYGWIN*|MINGW*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install stow if not present
install_stow() {
    if command_exists stow; then
        log_info "stow already installed: $(stow --version | head -1)"
        return
    fi

    log_info "Installing stow..."

    case "$(detect_os)" in
        macos)
            if command_exists brew; then
                brew install stow
            else
                log_error "Homebrew is required to install stow on macOS"
                exit 1
            fi
            ;;
        linux)
            if command_exists apt; then
                sudo apt update && sudo apt install -y stow
            elif command_exists dnf; then
                sudo dnf install -y stow
            elif command_exists pacman; then
                sudo pacman -S stow
            else
                log_error "Unsupported package manager. Please install stow manually"
                exit 1
            fi
            ;;
        *)
            log_error "Unsupported OS for automatic stow installation"
            exit 1
            ;;
    esac

    log_success "stow installed successfully"
}

# Install packages for Linux distributions
install_linux_packages() {
    log_info "Setting up Linux packages..."

    # Detect Linux distribution
    if [[ -f /etc/alpine-release ]]; then
        install_alpine_packages
    elif command_exists apt; then
        install_debian_packages
    elif command_exists dnf; then
        install_fedora_packages
    elif command_exists pacman; then
        install_arch_packages
    else
        log_warning "Unsupported Linux distribution for automatic package installation"
        return 1
    fi
}

# Install packages on Alpine Linux
install_alpine_packages() {
    log_info "Installing Alpine Linux packages..."

    # Enable community and testing repositories
    echo "https://dl-cdn.alpinelinux.org/alpine/v$(cat /etc/alpine-release | cut -d. -f1-2)/main" > /etc/apk/repositories
    echo "https://dl-cdn.alpinelinux.org/alpine/v$(cat /etc/alpine-release | cut -d. -f1-2)/community" >> /etc/apk/repositories
    echo "https://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories

    # Update package index
    apk update

    # Install core development tools
    apk add --no-cache \
        bash zsh curl wget git openssh-client ca-certificates \
        findutils grep sed gawk coreutils make vim \
        jq tree htop

    # Install modern CLI tools from community repo
    apk add --no-cache \
        ripgrep fd eza bat fzf

    # Install tealdeer from testing repo
    apk add --no-cache tealdeer --repository=https://dl-cdn.alpinelinux.org/alpine/edge/testing

    # Update tldr cache
    tldr --update || log_warning "Failed to update tldr pages"

    log_success "Alpine packages installed"
}

# Install packages on Debian/Ubuntu
install_debian_packages() {
    log_info "Installing Debian/Ubuntu packages..."

    # Update package lists
    apt update

    # Install core tools
    apt install -y \
        bash zsh curl wget git openssh-client ca-certificates \
        build-essential vim make jq tree htop

    # Install modern CLI tools
    apt install -y ripgrep fd-find || {
        log_warning "Some modern tools not available in default repos, trying alternatives"
        # Add external repositories if needed
        curl -fsSL https://github.com/sharkdp/fd/releases/download/v8.7.0/fd_8.7.0_amd64.deb -o /tmp/fd.deb
        dpkg -i /tmp/fd.deb || apt install -f -y
    }

    # Try to install other tools
    apt install -y exa bat fzf || log_warning "Some tools may not be available"

    # Install tealdeer via cargo if available
    if command_exists cargo; then
        cargo install tealdeer
    else
        log_warning "tealdeer not available without Rust toolchain"
    fi

    log_success "Debian/Ubuntu packages installed"
}

# Install packages on Fedora/RHEL
install_fedora_packages() {
    log_info "Installing Fedora/RHEL packages..."

    # Install core tools
    dnf install -y \
        bash zsh curl wget git openssh-clients ca-certificates \
        gcc make vim jq tree htop

    # Install modern CLI tools
    dnf install -y ripgrep fd-find bat fzf

    # Install eza and tealdeer via cargo if available
    if command_exists cargo; then
        cargo install eza tealdeer
    else
        log_warning "eza and tealdeer not available without Rust toolchain"
    fi

    log_success "Fedora/RHEL packages installed"
}

# Install packages on Arch Linux
install_arch_packages() {
    log_info "Installing Arch Linux packages..."

    # Update package database
    pacman -Sy

    # Install core tools
    pacman -S --noconfirm \
        bash zsh curl wget git openssh ca-certificates \
        base-devel vim make jq tree htop

    # Install modern CLI tools
    pacman -S --noconfirm ripgrep fd eza bat fzf tealdeer

    # Update tldr cache
    tldr --update || log_warning "Failed to update tldr pages"

    log_success "Arch Linux packages installed"
}

# Install package manager and packages for macOS
install_macos_packages() {
    log_info "Setting up macOS packages..."

    # Install Homebrew if not present
    if ! command_exists brew; then
        log_info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH
        if [[ -f /opt/homebrew/bin/brew ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f /usr/local/bin/brew ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    fi

    # Install packages from Brewfile
    if [[ -f "src/installers/mac/Brewfile" ]]; then
        log_info "Installing packages from Brewfile..."
        brew bundle install --file=src/installers/mac/Brewfile
        log_success "Homebrew packages installed"
    else
        log_warning "Brewfile not found, skipping package installation"
    fi

    tldr --update || log_warning "Failed to update tldr pages"
}

# Install oh-my-zsh if not present
install_oh_my_zsh() {
    if [[ -d "$HOME/.oh-my-zsh" ]]; then
        log_info "oh-my-zsh already installed"
    else
        log_info "Installing oh-my-zsh..."
        sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    fi

    # Install essential zsh plugins for autocompletion and suggestions
    log_info "Installing zsh plugins..."

    # zsh-autosuggestions (fish-like suggestions)
    if [[ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions" ]]; then
        git clone https://github.com/zsh-users/zsh-autosuggestions \
            "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"
    fi

    # zsh-syntax-highlighting (syntax highlighting)
    if [[ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]]; then
        git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \
            "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"
    fi

    # zsh-completions (additional completions)
    if [[ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-completions" ]]; then
        git clone https://github.com/zsh-users/zsh-completions \
            "$HOME/.oh-my-zsh/custom/plugins/zsh-completions"
    fi

    # fast-syntax-highlighting (faster alternative)
    if [[ ! -d "$HOME/.oh-my-zsh/custom/plugins/fast-syntax-highlighting" ]]; then
        git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git \
            "$HOME/.oh-my-zsh/custom/plugins/fast-syntax-highlighting"
    fi

    log_success "oh-my-zsh and plugins installed"
}

# Show diff using VS Code if available, fallback to terminal
show_vscode_diff() {
    local file1="$1"
    local file2="$2"
    local description="${3:-files}"

    # Skip VS Code in container mode or if not available
    if [[ "$DOCKER_MODE" == "true" ]] || ! command_exists code; then
        log_info "Showing diff for $description using terminal:"

        # Show the diff using best available terminal tool
        if command_exists colordiff; then
            colordiff -u "$file1" "$file2" 2>/dev/null || diff -u "$file1" "$file2"
        elif diff --color=auto -u "$file1" "$file2" >/dev/null 2>&1; then
            diff --color=auto -u "$file1" "$file2"
        else
            diff -u "$file1" "$file2"
        fi
    else
        log_info "Opening $description in VS Code for visual comparison..."
        code --diff "$file1" "$file2" --wait
    fi
}

# Configure git with user input
configure_git() {
    log_info "Configuring git..."

    # Check if git is available
    if ! command_exists git; then
        log_warning "Git not found, skipping git configuration"
        return
    fi

    # Priority: Environment variables > Current config > Interactive prompts
    if [[ "$DOCKER_MODE" == "true" ]]; then
        # Container mode with no env vars - use defaults
        git_name="${GIT_USER_NAME:-Container User}"
        git_email="${GIT_USER_EMAIL:-user@container.local}"
        log_info "Container mode: Using default git configuration"
        log_info "Name: $git_name, Email: $git_email"
    fi
}

# Check for differences between repo files and existing files
check_file_differences() {
    local package_dir="$1"
    local package_name="$2"
    local has_differences=false

    log_info "Checking for differences in package: $package_name"

    # Find all files in the package
    fd -t f . "$package_dir" | while IFS= read -r repo_file; do
        # Get relative path from package directory
        local rel_path="${repo_file#$package_dir/}"
        local home_file="$HOME/$rel_path"

        # Skip if home file doesn't exist
        if [[ ! -f "$home_file" ]]; then
            continue
        fi

        # Handle symlink cases
        if [[ -L "$home_file" ]]; then
            local symlink_target
            symlink_target=$(readlink "$home_file")

            # Skip if symlink already points to our repo
            if [[ "$symlink_target" == "$repo_file" ]]; then
                continue
            fi

            # Handle symlink pointing to different location
            echo -e "\n${YELLOW}[SYMLINK]${NC} $rel_path is a symlink pointing to: $symlink_target"
            log_info "Will replace with symlink to: $repo_file"

            # Compare content if the symlink target exists
            if [[ -f "$symlink_target" ]]; then
                if ! diff -q "$repo_file" "$symlink_target" >/dev/null 2>&1; then
                    echo -e "${YELLOW}[CONTENT DIFF]${NC} Content differs between current target and new file:"
                    show_vscode_diff "$symlink_target" "$repo_file" "$rel_path (symlink target vs new file)"
                    has_differences=true
                fi
            else
                log_warning "Symlink target does not exist: $symlink_target"
                has_differences=true
            fi
        else
            # Handle regular file differences
            if ! diff -q "$repo_file" "$home_file" >/dev/null 2>&1; then
                echo -e "\n${YELLOW}[DIFF]${NC} Found differences in: $rel_path"
                show_vscode_diff "$home_file" "$repo_file" "$rel_path (current vs new)"
                has_differences=true
            fi
        fi
    done

    return 0
}

# Backup conflicting files with user confirmation
backup_conflicting_files() {
    local package_dir="$1"
    local package_name="$2"
    local backup_needed=false
    local conflicting_files=()

    # Find all files that would conflict
    while IFS= read -r repo_file; do
        local rel_path="${repo_file#$package_dir/}"
        local home_file="$HOME/$rel_path"

        # Check if file exists and is not already our symlink
        if [[ -f "$home_file" && ! -L "$home_file" ]]; then
            conflicting_files+=("$rel_path")
            backup_needed=true
        elif [[ -L "$home_file" && "$(readlink "$home_file")" != "$repo_file" ]]; then
            conflicting_files+=("$rel_path")
            backup_needed=true
        fi
    done < <(fd -t f . "$package_dir")

    if [[ "$backup_needed" == true && ${#conflicting_files[@]} -gt 0 ]]; then
        echo -e "\n${YELLOW}The following files will be backed up and replaced:${NC}"
        printf "  - %s\n" "${conflicting_files[@]}"

        read -p "Continue with backup and symlinking? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_warning "Skipping package: $package_name"
            return 1
        fi

        # Create backup directory
        local backup_dir="$HOME/.dotfiles-backup/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"

        # Backup conflicting files
        fd -t f . "$package_dir" | while IFS= read -r repo_file; do
            local rel_path="${repo_file#$package_dir/}"
            local home_file="$HOME/$rel_path"

            if [[ -e "$home_file" ]]; then
                local backup_file="$backup_dir/$rel_path"
                mkdir -p "$(dirname "$backup_file")"
                mv "$home_file" "$backup_file"
                log_info "Backed up: $rel_path -> $backup_file"
            fi
        done

        log_success "Files backed up to: $backup_dir"
    fi

    return 0
}

# Apply dotfiles using stow
apply_dotfiles_with_stow() {
    log_info "Setting up dotfiles with stow..."

    # Change to the dotfiles directory (where stow packages are located)
    if [[ ! -d "src/home" ]]; then
        log_warning "No 'src/home' directory found for stow packages"
        return
    fi

    local stow_dir="$PWD"
    cd "$stow_dir"

    # Process the home package
    local package_name="home"
    local package_dir="$stow_dir/src/home"

    echo -e "\n${BLUE}=== Processing package: $package_name ===${NC}"

    # Check for differences
    check_file_differences "$package_dir" "$package_name"

    # Handle conflicting files
    if backup_conflicting_files "$package_dir" "$package_name"; then
        # Apply stow
        log_info "Stowing package: $package_name"
        if stow -d src -t "$HOME" "$package_name"; then
            log_success "Successfully stowed: $package_name"
        else
            log_error "Failed to stow package: $package_name"
            log_info "You may need to resolve conflicts manually"
        fi
    fi

    # Note: All files are now in the home package, no need for additional stowing

    log_success "Dotfiles applied with stow"
    log_info "Dotfiles are now symlinked to $stow_dir"

    # Show current dotfiles structure with modern tools
    echo -e "\n${BLUE}=== Current Dotfiles Structure ===${NC}"
    if [[ -d "src/home" ]]; then
        eza --tree --level=3 src/home 2>/dev/null || tree -L 3 src/home 2>/dev/null || ls -la src/home
    fi
}

# Install VS Code extensions
install_vscode_extensions() {
    if ! command_exists code; then
        log_warning "VS Code not found, skipping extension installation"
        return
    fi

    # Install core extensions only (project-specific extensions via workspace recommendations)
    if [[ -f "extensions/core.json" ]]; then
        log_info "Installing core VS Code extensions..."
        # Extract recommendations from JSON and install
        if command_exists jq; then
            jq -r '.recommendations[]' extensions/core.json | while read -r extension; do
                [[ -n "$extension" ]] && code --install-extension "$extension"
            done
        else
            # Fallback: simple rg extraction (more robust than grep)
            rg -o '"[^"]*"' extensions/core.json | sed 's/"//g' | rg '^[a-z0-9.-]+\.[a-z0-9.-]+$' | while read -r extension; do
                code --install-extension "$extension"
            done
        fi
        log_success "Core VS Code extensions installed"
        log_info "Project-specific extensions will be suggested via workspace recommendations"
    else
        log_warning "No extension files found"
    fi
}

# Main installation function
main() {
    log_info "Starting modern dotfile installation with stow..."

    # Detect OS
    OS=$(detect_os)
    log_info "Detected OS: $OS"

    # Check if running in Docker/container environment
    DOCKER_MODE="${SETUP_SKIP_INTERACTIVE:-false}"
    if [[ -f "/.dockerenv" ]] || [[ "$DOCKER_MODE" == "true" ]]; then
        log_info "Container environment detected - enabling non-interactive mode"
        DOCKER_MODE=true
    fi

    # Create necessary directories
    mkdir -p "$HOME/.local/bin"
    mkdir -p "$HOME/.config/zsh"

    if [[ ! -f "src/home/.profile" ]]; then
        # Set up environment variables
        touch "src/home/.profile"
        echo -e "\n# Custom environment variables" >> "src/home/.profile"
        echo "export GIT_USER_NAME=\"${GIT_USER_NAME}\"" >> "src/home/.profile"
        echo "export GIT_USER_EMAIL=\"${GIT_USER_EMAIL}\"" >> "src/home/.profile"
    fi

    # Install stow (skip in container mode since we're not managing dotfiles)
    if [[ "$DOCKER_MODE" != "true" ]]; then
        install_stow
    else
        log_info "Skipping stow installation in container mode"
    fi

    # OS-specific package installation
    case "$OS" in
        macos)
            install_macos_packages
            ;;
        linux)
            install_linux_packages
            ;;
        windows)
            log_info "Windows package installation will be implemented in future version"
            ;;
        *)
            log_warning "Unknown OS, skipping package installation"
            ;;
    esac

    # Skip interactive parts in Docker mode
    if [[ "$DOCKER_MODE" != "true" ]]; then
        # Install oh-my-zsh
        install_oh_my_zsh

        # Configure git with user input
        configure_git

        # Install VS Code extensions
        install_vscode_extensions

        # Set zsh as default shell (Linux only - macOS already uses zsh)
        if [[ "$OS" == "linux" ]] && command_exists zsh && [[ "$SHELL" != "$(which zsh)" ]]; then
            log_info "Setting zsh as default shell..."
            chsh -s "$(which zsh)" || log_warning "Could not set zsh as default shell"
        fi

        # Apply dotfiles with stow (after all tools are installed)
        apply_dotfiles_with_stow

    else
        log_info "Skipping interactive setup in container mode"
        log_info "Tools have been installed and are ready to use"
    fi

    log_success "Modern dotfile installation completed!"
    log_info "Please restart your terminal or run 'source ~/.zshrc' to apply changes"
}

# Run main function
main "$@"
