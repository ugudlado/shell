#!/bin/bash

# macOS-specific Setup Script
# Handles Homebrew, macOS packages, and macOS-specific configurations

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/setup-common.sh"

# Install Homebrew
install_homebrew() {
    log_header "Installing Homebrew package manager"
    
    if command -v brew &> /dev/null; then
        log_success "Homebrew already installed"
        
        # Clean up old taps first
        log_info "Cleaning up outdated Homebrew taps..."
        brew untap homebrew/cask-fonts 2>/dev/null || true
        
        # Update Homebrew (skip if credentials are needed)
        log_info "Updating Homebrew..."
        if ! brew update 2>/dev/null; then
            log_warning "Homebrew update failed (possibly due to git credentials)"
            log_info "Continuing with existing Homebrew installation..."
        fi
    else
        log_info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for current session
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f "/usr/local/bin/brew" ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        
        log_success "Homebrew installed"
    fi
}

# Install core packages via Homebrew
install_macos_packages() {
    log_header "Installing macOS packages"
    
    # Install GNU Stow first (required for dotfiles)
    if ! command -v stow &> /dev/null; then
        log_info "Installing GNU Stow..."
        brew install stow
        log_success "GNU Stow installed"
    else
        log_success "GNU Stow already installed"
    fi
    
    # Install packages from Brewfile if it exists
    if [[ -f "$PROJECT_ROOT/src/installers/mac/Brewfile" ]]; then
        log_info "Installing packages from Brewfile..."
        brew bundle install --file="$PROJECT_ROOT/src/installers/mac/Brewfile"
        log_success "Core packages installed from Brewfile"
    else
        log_warning "Brewfile not found, installing essential packages manually"
        
        # Essential packages for development
        local essential_packages=(
            "git"
            "curl"
            "wget"
            "jq"
            "starship"
            "eza"
            "bat"
            "fd"
            "ripgrep"
            "zoxide"
            "fzf"
        )
        
        for package in "${essential_packages[@]}"; do
            if ! brew list "$package" &> /dev/null; then
                log_info "Installing $package..."
                brew install "$package" || log_warning "Failed to install $package"
            fi
        done
    fi
}

# Install Mise (modern environment manager)
install_mise_macos() {
    log_header "Installing Mise environment manager"
    
    if ! command -v mise &> /dev/null; then
        log_info "Installing Mise via Homebrew..."
        brew install mise
        log_success "Mise installed"
    else
        log_success "Mise already installed"
    fi
    
    # Activate mise for current session
    if command -v mise &> /dev/null; then
        eval "$(mise activate bash)"
        log_info "Mise activated for current session"
    fi
}

# Setup VS Code on macOS
setup_vscode_macos() {
    log_header "Setting up VS Code"
    
    if command -v code &> /dev/null; then
        log_success "VS Code command line tools already available"
    else
        log_info "VS Code not found in PATH"
        
        # Check if VS Code is installed in Applications
        if [[ -d "/Applications/Visual Studio Code.app" ]]; then
            log_info "VS Code found in Applications. Install command line tools:"
            log_info "Open VS Code > Command Palette > 'Install code command in PATH'"
        else
            log_info "Installing VS Code via Homebrew..."
            brew install --cask visual-studio-code || log_warning "Failed to install VS Code"
        fi
    fi
    
    # Install core extensions if VS Code is available
    if command -v code &> /dev/null && [[ -f "$HOME/.vscode/extensions.json" ]]; then
        log_info "VS Code extension recommendations configured"
        log_info "Extensions will be suggested when VS Code starts"
    fi
}

# macOS-specific optimizations
setup_macos_optimizations() {
    log_header "Applying macOS optimizations"
    
    # Install Xcode Command Line Tools if needed
    if ! xcode-select -p &> /dev/null; then
        log_info "Installing Xcode Command Line Tools..."
        xcode-select --install || log_warning "Xcode Command Line Tools installation may have failed"
        log_info "Please complete the Xcode Command Line Tools installation if prompted"
    else
        log_success "Xcode Command Line Tools already installed"
    fi
    
    # Check for Rosetta on Apple Silicon
    if [[ "$(uname -m)" == "arm64" ]]; then
        if ! /usr/bin/pgrep oahd >/dev/null 2>&1; then
            log_info "Installing Rosetta 2 for x86_64 compatibility..."
            softwareupdate --install-rosetta --agree-to-license || log_warning "Rosetta installation failed"
        else
            log_success "Rosetta 2 already installed"
        fi
    fi
    
    # Setup shell integration for macOS
    setup_shell_macos
}

# macOS-specific shell setup
setup_shell_macos() {
    log_info "Setting up shell for macOS..."
    
    # Change default shell to zsh if it's not already
    if [[ "$SHELL" != "/bin/zsh" ]] && [[ "$SHELL" != "/usr/local/bin/zsh" ]]; then
        log_info "Changing default shell to zsh..."
        chsh -s /bin/zsh || log_warning "Failed to change shell to zsh"
    fi
    
    # Install Oh My Zsh if not present
    if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
        log_info "Installing Oh My Zsh..."
        sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
        log_success "Oh My Zsh installed"
    else
        log_success "Oh My Zsh already installed"
    fi
    
    # Install popular zsh plugins
    local plugin_dir="$HOME/.oh-my-zsh/custom/plugins"
    
    # zsh-autosuggestions
    if [[ ! -d "$plugin_dir/zsh-autosuggestions" ]]; then
        log_info "Installing zsh-autosuggestions..."
        git clone https://github.com/zsh-users/zsh-autosuggestions "$plugin_dir/zsh-autosuggestions"
    fi
    
    # zsh-syntax-highlighting
    if [[ ! -d "$plugin_dir/zsh-syntax-highlighting" ]]; then
        log_info "Installing zsh-syntax-highlighting..."
        git clone https://github.com/zsh-users/zsh-syntax-highlighting "$plugin_dir/zsh-syntax-highlighting"
    fi
    
    log_success "Zsh plugins configured"
}

# Setup development environments with mise
setup_development_environments_macos() {
    log_header "Setting up development environments"
    
    if command -v mise &> /dev/null; then
        # Setup common development environments
        if [[ -f "$HOME/.mise.toml" ]]; then
            log_info "Installing development environments from .mise.toml..."
            mise install || log_warning "Some development environments failed to install"
        else
            log_info "Installing default development environments..."
            
            # Install latest stable versions of common tools
            mise install node@lts || log_warning "Node.js installation failed"
            mise install python@latest || log_warning "Python installation failed"
            mise install go@latest || log_warning "Go installation failed"
            
            log_success "Development environments installed"
        fi
    else
        log_warning "Mise not available, skipping development environment setup"
    fi
}

# Main macOS setup function
main_macos() {
    log_header "Starting macOS-specific setup"
    
    # Check if we're actually on macOS
    if [[ "$(detect_os)" != "macos" ]]; then
        log_error "This script is for macOS only"
        exit 1
    fi
    
    check_root
    
    # Core setup steps
    install_homebrew
    install_macos_packages
    install_mise_macos
    
    # Verify required tools are now available
    verify_required_tools
    
    # Git configuration
    setup_git_common
    
    # Backup and stow dotfiles
    backup_dotfiles_common
    stow_dotfiles_common
    
    # macOS-specific setup
    setup_macos_optimizations
    setup_vscode_macos
    setup_development_environments_macos
    
    # Agent tools and shell setup
    setup_agent_tools_common
    setup_shell_common
    
    # Final steps
    post_install_common
    
    log_success "macOS setup complete!"
    log_info "Restart your terminal to activate all changes"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_macos "$@"
fi