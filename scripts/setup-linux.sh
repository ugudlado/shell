#!/bin/bash

# Linux-specific Setup Script
# Handles different Linux distributions and package managers

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/setup-common.sh"

# Detect Linux distribution
detect_linux_distro() {
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        echo "$ID"
    elif [[ -f /etc/redhat-release ]]; then
        echo "rhel"
    elif [[ -f /etc/debian_version ]]; then
        echo "debian"
    else
        echo "unknown"
    fi
}

# Update package manager
update_package_manager() {
    local distro=$(detect_linux_distro)
    
    log_info "Updating package manager for $distro..."
    
    case "$distro" in
        ubuntu|debian)
            sudo apt-get update || log_warning "apt update failed"
            ;;
        fedora|rhel|centos)
            if command -v dnf &> /dev/null; then
                sudo dnf update -y || log_warning "dnf update failed"
            else
                sudo yum update -y || log_warning "yum update failed"
            fi
            ;;
        arch|manjaro)
            sudo pacman -Sy || log_warning "pacman update failed"
            ;;
        opensuse*)
            sudo zypper refresh || log_warning "zypper refresh failed"
            ;;
        *)
            log_warning "Unknown distribution: $distro"
            ;;
    esac
}

# Install essential packages for Linux
install_essential_packages_linux() {
    local distro=$(detect_linux_distro)
    
    log_header "Installing essential packages for $distro"
    
    # Common packages needed for all distributions
    local essential_packages=("git" "curl" "wget" "make" "build-essential" "stow")
    
    case "$distro" in
        ubuntu|debian)
            log_info "Installing packages via apt..."
            sudo apt-get install -y git curl wget make build-essential stow || log_warning "Some packages failed to install"
            
            # Additional packages available in apt
            sudo apt-get install -y jq unzip zip tree htop || log_warning "Optional packages failed to install"
            ;;
            
        fedora|rhel|centos)
            log_info "Installing packages via dnf/yum..."
            if command -v dnf &> /dev/null; then
                sudo dnf install -y git curl wget make gcc gcc-c++ stow || log_warning "Some packages failed to install"
                sudo dnf install -y jq unzip zip tree htop || log_warning "Optional packages failed to install"
            else
                sudo yum install -y git curl wget make gcc gcc-c++ || log_warning "Some packages failed to install"
                # Note: stow might not be available in older RHEL/CentOS
                sudo yum install -y epel-release || true
                sudo yum install -y stow || log_warning "stow not available, will need manual installation"
            fi
            ;;
            
        arch|manjaro)
            log_info "Installing packages via pacman..."
            sudo pacman -S --needed --noconfirm git curl wget make gcc stow || log_warning "Some packages failed to install"
            sudo pacman -S --needed --noconfirm jq unzip zip tree htop || log_warning "Optional packages failed to install"
            ;;
            
        opensuse*)
            log_info "Installing packages via zypper..."
            sudo zypper install -y git curl wget make gcc gcc-c++ stow || log_warning "Some packages failed to install"
            sudo zypper install -y jq unzip zip tree htop || log_warning "Optional packages failed to install"
            ;;
            
        *)
            log_error "Unsupported Linux distribution: $distro"
            log_info "Please install these packages manually: ${essential_packages[*]}"
            return 1
            ;;
    esac
    
    log_success "Essential packages installed"
}

# Install modern CLI tools for Linux
install_modern_cli_tools_linux() {
    log_header "Installing modern CLI tools"
    
    # Install tools that are available across distributions
    install_starship_linux
    install_eza_linux
    install_bat_linux
    install_fd_linux
    install_ripgrep_linux
    install_zoxide_linux
    install_fzf_linux
}

# Install Starship prompt
install_starship_linux() {
    if ! command -v starship &> /dev/null; then
        log_info "Installing Starship prompt..."
        curl -sS https://starship.rs/install.sh | sh -s -- -y || log_warning "Starship installation failed"
    else
        log_success "Starship already installed"
    fi
}

# Install eza (modern ls replacement)
install_eza_linux() {
    if ! command -v eza &> /dev/null; then
        log_info "Installing eza..."
        local distro=$(detect_linux_distro)
        
        case "$distro" in
            ubuntu|debian)
                # Use cargo if available, otherwise skip
                if command -v cargo &> /dev/null; then
                    cargo install eza || log_warning "eza installation failed"
                else
                    log_warning "eza requires Rust/Cargo, skipping installation"
                fi
                ;;
            arch|manjaro)
                sudo pacman -S --needed --noconfirm eza || log_warning "eza installation failed"
                ;;
            *)
                log_warning "eza not available for $distro, skipping"
                ;;
        esac
    else
        log_success "eza already installed"
    fi
}

# Install bat (modern cat replacement)
install_bat_linux() {
    if ! command -v bat &> /dev/null && ! command -v batcat &> /dev/null; then
        log_info "Installing bat..."
        local distro=$(detect_linux_distro)
        
        case "$distro" in
            ubuntu|debian)
                sudo apt-get install -y bat || log_warning "bat installation failed"
                ;;
            fedora|rhel|centos)
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y bat || log_warning "bat installation failed"
                fi
                ;;
            arch|manjaro)
                sudo pacman -S --needed --noconfirm bat || log_warning "bat installation failed"
                ;;
            *)
                log_warning "bat not available for $distro, skipping"
                ;;
        esac
    else
        log_success "bat already installed"
    fi
}

# Install fd (modern find replacement)
install_fd_linux() {
    if ! command -v fd &> /dev/null && ! command -v fdfind &> /dev/null; then
        log_info "Installing fd..."
        local distro=$(detect_linux_distro)
        
        case "$distro" in
            ubuntu|debian)
                sudo apt-get install -y fd-find || log_warning "fd installation failed"
                ;;
            fedora|rhel|centos)
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y fd-find || log_warning "fd installation failed"
                fi
                ;;
            arch|manjaro)
                sudo pacman -S --needed --noconfirm fd || log_warning "fd installation failed"
                ;;
            *)
                log_warning "fd not available for $distro, skipping"
                ;;
        esac
    else
        log_success "fd already installed"
    fi
}

# Install ripgrep (modern grep replacement)
install_ripgrep_linux() {
    if ! command -v rg &> /dev/null; then
        log_info "Installing ripgrep..."
        local distro=$(detect_linux_distro)
        
        case "$distro" in
            ubuntu|debian)
                sudo apt-get install -y ripgrep || log_warning "ripgrep installation failed"
                ;;
            fedora|rhel|centos)
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y ripgrep || log_warning "ripgrep installation failed"
                fi
                ;;
            arch|manjaro)
                sudo pacman -S --needed --noconfirm ripgrep || log_warning "ripgrep installation failed"
                ;;
            *)
                log_warning "ripgrep not available for $distro, skipping"
                ;;
        esac
    else
        log_success "ripgrep already installed"
    fi
}

# Install zoxide (smart cd replacement)
install_zoxide_linux() {
    if ! command -v zoxide &> /dev/null; then
        log_info "Installing zoxide..."
        curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash || log_warning "zoxide installation failed"
    else
        log_success "zoxide already installed"
    fi
}

# Install fzf (fuzzy finder)
install_fzf_linux() {
    if ! command -v fzf &> /dev/null; then
        log_info "Installing fzf..."
        local distro=$(detect_linux_distro)
        
        case "$distro" in
            ubuntu|debian)
                sudo apt-get install -y fzf || log_warning "fzf installation failed"
                ;;
            fedora|rhel|centos)
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y fzf || log_warning "fzf installation failed"
                fi
                ;;
            arch|manjaro)
                sudo pacman -S --needed --noconfirm fzf || log_warning "fzf installation failed"
                ;;
            *)
                # Install via git if package manager doesn't have it
                if [[ ! -d "$HOME/.fzf" ]]; then
                    git clone --depth 1 https://github.com/junegunn/fzf.git "$HOME/.fzf"
                    "$HOME/.fzf/install" --all || log_warning "fzf installation failed"
                fi
                ;;
        esac
    else
        log_success "fzf already installed"
    fi
}

# Install Mise environment manager for Linux
install_mise_linux() {
    log_header "Installing Mise environment manager"
    
    if ! command -v mise &> /dev/null; then
        log_info "Installing Mise..."
        curl https://mise.jdx.dev/install.sh | sh || log_warning "Mise installation failed"
        
        # Add to PATH for current session
        if [[ -f "$HOME/.local/bin/mise" ]]; then
            export PATH="$HOME/.local/bin:$PATH"
            eval "$($HOME/.local/bin/mise activate bash)"
            log_success "Mise installed and activated"
        fi
    else
        log_success "Mise already installed"
        eval "$(mise activate bash)"
    fi
}

# Setup shell for Linux
setup_shell_linux() {
    log_header "Setting up shell for Linux"
    
    # Install zsh if not present
    local distro=$(detect_linux_distro)
    if ! command -v zsh &> /dev/null; then
        log_info "Installing zsh..."
        
        case "$distro" in
            ubuntu|debian)
                sudo apt-get install -y zsh || log_warning "zsh installation failed"
                ;;
            fedora|rhel|centos)
                if command -v dnf &> /dev/null; then
                    sudo dnf install -y zsh || log_warning "zsh installation failed"
                else
                    sudo yum install -y zsh || log_warning "zsh installation failed"
                fi
                ;;
            arch|manjaro)
                sudo pacman -S --needed --noconfirm zsh || log_warning "zsh installation failed"
                ;;
            opensuse*)
                sudo zypper install -y zsh || log_warning "zsh installation failed"
                ;;
        esac
    fi
    
    # Change default shell to zsh
    if command -v zsh &> /dev/null && [[ "$SHELL" != "$(which zsh)" ]]; then
        log_info "Changing default shell to zsh..."
        chsh -s "$(which zsh)" || log_warning "Failed to change shell to zsh"
    fi
    
    # Install Oh My Zsh if not present
    if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
        log_info "Installing Oh My Zsh..."
        sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
        log_success "Oh My Zsh installed"
    else
        log_success "Oh My Zsh already installed"
    fi
    
    # Install zsh plugins
    local plugin_dir="$HOME/.oh-my-zsh/custom/plugins"
    
    if [[ ! -d "$plugin_dir/zsh-autosuggestions" ]]; then
        log_info "Installing zsh-autosuggestions..."
        git clone https://github.com/zsh-users/zsh-autosuggestions "$plugin_dir/zsh-autosuggestions"
    fi
    
    if [[ ! -d "$plugin_dir/zsh-syntax-highlighting" ]]; then
        log_info "Installing zsh-syntax-highlighting..."
        git clone https://github.com/zsh-users/zsh-syntax-highlighting "$plugin_dir/zsh-syntax-highlighting"
    fi
    
    log_success "Zsh plugins configured"
}

# Setup development environments for Linux
setup_development_environments_linux() {
    log_header "Setting up development environments"
    
    if command -v mise &> /dev/null; then
        if [[ -f "$HOME/.mise.toml" ]]; then
            log_info "Installing development environments from .mise.toml..."
            mise install || log_warning "Some development environments failed to install"
        else
            log_info "Installing default development environments..."
            mise install node@lts || log_warning "Node.js installation failed"
            mise install python@latest || log_warning "Python installation failed"
            mise install go@latest || log_warning "Go installation failed"
        fi
    else
        log_warning "Mise not available, skipping development environment setup"
    fi
}

# Main Linux setup function
main_linux() {
    log_header "Starting Linux-specific setup"
    
    # Check if we're actually on Linux
    if [[ "$(detect_os)" != "linux" ]]; then
        log_error "This script is for Linux only"
        exit 1
    fi
    
    local distro=$(detect_linux_distro)
    log_info "Detected Linux distribution: $distro"
    
    check_root
    
    # Core setup steps
    update_package_manager
    install_essential_packages_linux
    install_modern_cli_tools_linux
    install_mise_linux
    
    # Verify required tools are now available
    verify_required_tools
    
    # Git configuration
    setup_git_common
    
    # Backup and stow dotfiles
    backup_dotfiles_common
    stow_dotfiles_common
    
    # Linux-specific setup
    setup_shell_linux
    setup_development_environments_linux
    
    # Agent tools setup
    setup_agent_tools_common
    setup_shell_common
    
    # Final steps
    post_install_common
    
    log_success "Linux setup complete!"
    log_info "Restart your terminal or run 'exec zsh' to activate all changes"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_linux "$@"
fi