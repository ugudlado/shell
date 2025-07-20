#!/bin/bash

# Docker/Container-specific Setup Script
# Lightweight setup optimized for container environments

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/setup-common.sh"

# Minimal package installation for containers
install_minimal_packages_docker() {
    log_header "Installing minimal packages for container"
    
    # Detect the container's base OS
    local distro="unknown"
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        distro="$ID"
    fi
    
    log_info "Container base OS: $distro"
    
    case "$distro" in
        ubuntu|debian)
            # Update package list
            apt-get update || log_warning "apt update failed"
            
            # Install only essential packages
            apt-get install -y \
                git \
                curl \
                wget \
                make \
                stow \
                jq \
                unzip \
                ca-certificates \
                gnupg \
                lsb-release || log_warning "Some packages failed to install"
            
            # Clean up to reduce image size
            apt-get clean && rm -rf /var/lib/apt/lists/*
            ;;
            
        alpine)
            # Alpine Linux (common in containers)
            apk update || log_warning "apk update failed"
            apk add --no-cache \
                git \
                curl \
                wget \
                make \
                stow \
                jq \
                unzip \
                bash \
                zsh || log_warning "Some packages failed to install"
            ;;
            
        fedora|rhel|centos)
            if command -v dnf &> /dev/null; then
                dnf install -y \
                    git \
                    curl \
                    wget \
                    make \
                    stow \
                    jq \
                    unzip || log_warning "Some packages failed to install"
            else
                yum install -y \
                    git \
                    curl \
                    wget \
                    make \
                    jq \
                    unzip || log_warning "Some packages failed to install"
                # stow might not be available
            fi
            ;;
            
        *)
            log_warning "Unknown container base: $distro"
            log_info "Assuming packages are pre-installed or will be handled externally"
            ;;
    esac
    
    log_success "Minimal packages installed"
}

# Install essential CLI tools for container development
install_container_cli_tools() {
    log_header "Installing container-optimized CLI tools"
    
    # Only install lightweight, essential tools
    
    # Starship (lightweight and fast)
    if ! command -v starship &> /dev/null; then
        log_info "Installing Starship prompt..."
        curl -sS https://starship.rs/install.sh | sh -s -- -y || log_warning "Starship installation failed"
    fi
    
    # Skip heavy tools like Mise in containers unless specifically needed
    log_info "Skipping heavy tools in container environment"
    log_info "Use container-use MCP for environment management instead"
}

# Minimal shell setup for containers
setup_shell_docker() {
    log_header "Setting up minimal shell for container"
    
    # Use bash as default in containers (more universally available)
    if ! command -v zsh &> /dev/null; then
        log_info "zsh not available, using bash"
        log_info "Shell configuration will adapt to available shell"
    else
        log_info "zsh available, will use zsh configuration"
        
        # Minimal Oh My Zsh setup (no plugins to keep it light)
        if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
            log_info "Installing minimal Oh My Zsh..."
            sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended || log_warning "Oh My Zsh installation failed"
        fi
    fi
    
    log_success "Minimal shell setup complete"
}

# Container-specific Git configuration
setup_git_docker() {
    log_header "Setting up Git for container"
    
    # In containers, often git config comes from mounted volumes or environment
    # But we'll set sensible defaults if not configured
    
    if [[ -z "$(git config --global user.name 2>/dev/null || true)" ]]; then
        # Use environment variables if available
        if [[ -n "${GIT_USER_NAME:-}" ]]; then
            git config --global user.name "$GIT_USER_NAME"
            log_success "Git user name set from environment"
        else
            git config --global user.name "Container User"
            log_info "Set default Git user name (override with GIT_USER_NAME env var)"
        fi
    fi
    
    if [[ -z "$(git config --global user.email 2>/dev/null || true)" ]]; then
        if [[ -n "${GIT_USER_EMAIL:-}" ]]; then
            git config --global user.email "$GIT_USER_EMAIL"
            log_success "Git user email set from environment"
        else
            git config --global user.email "user@container.local"
            log_info "Set default Git user email (override with GIT_USER_EMAIL env var)"
        fi
    fi
    
    # Set sensible defaults
    git config --global init.defaultBranch main
    git config --global push.default simple
    git config --global core.autocrlf input
    git config --global pull.rebase false
    
    log_success "Git configured for container"
}

# Container-optimized agent tools setup
setup_agent_tools_docker() {
    log_header "Setting up agent tools for container"
    
    # Ensure .agent directory exists
    mkdir -p "$HOME/.agent"
    
    # Skip memory initialization in containers (Claude CLI typically not available)
    if [[ -f "$HOME/.agent/scripts/memory-init.sh" ]]; then
        log_info "Memory initialization script available but skipping in container"
        log_info "Run manually if Claude CLI is available"
    fi
    
    # Ensure scripts are executable
    if [[ -d "$HOME/.agent/scripts" ]]; then
        chmod +x "$HOME/.agent/scripts"/*.sh 2>/dev/null || true
        log_success "Agent scripts made executable"
    fi
    
    log_success "Agent tools configured for container"
}

# Container environment optimization
optimize_container_environment() {
    log_header "Optimizing container environment"
    
    # Set container-friendly environment variables
    export TERM=xterm-256color
    export DEBIAN_FRONTEND=noninteractive
    
    # Disable some interactive features that don't work well in containers
    export PAGER=cat
    export EDITOR=nano
    
    # Create minimal directory structure
    mkdir -p "$HOME"/{.config,.cache,.local/bin}
    
    # Set appropriate permissions
    chmod 755 "$HOME"
    
    log_success "Container environment optimized"
}

# Minimal post-install for containers
post_install_docker() {
    log_success "🐳 Container dotfiles setup complete!"
    echo
    log_info "Container-specific notes:"
    echo "  • Use container-use MCP for development environments"
    echo "  • Git config uses environment variables (GIT_USER_NAME, GIT_USER_EMAIL)"
    echo "  • Memory initialization skipped (run manually if needed)"
    echo "  • Optimized for lightweight, fast startup"
    echo
    log_info "Available commands:"
    echo "  • make status     - Show dotfile status"
    echo "  • make verify     - Run quality checks (if tools available)"
    echo "  • make doctor     - Check system health"
    echo
    log_info "Environment variables:"
    echo "  • GIT_USER_NAME   - Set git user name"
    echo "  • GIT_USER_EMAIL  - Set git user email"
    echo "  • EDITOR          - Set preferred editor"
}

# Health check for container setup
container_health_check() {
    log_header "Running container health check"
    
    # Check essential tools
    local tools=("git" "make" "stow")
    local missing=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing+=("$tool")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing essential tools: ${missing[*]}"
        return 1
    fi
    
    # Check directory structure
    if [[ ! -d "$HOME/.agent" ]]; then
        log_error "Agent directory not found"
        return 1
    fi
    
    # Check git configuration
    if [[ -z "$(git config --global user.name 2>/dev/null || true)" ]]; then
        log_warning "Git user name not configured"
    fi
    
    log_success "Container health check passed"
}

# Main Docker setup function
main_docker() {
    log_header "Starting Docker/Container-specific setup"
    
    # Check if we're in a container
    local environment=$(detect_environment)
    if [[ "$environment" != "docker" ]] && [[ "$environment" != "container" ]]; then
        log_warning "This script is optimized for container environments"
        log_info "Detected environment: $environment"
    fi
    
    # Skip root check in containers (often necessary)
    log_info "Running in container environment"
    
    # Core setup steps (lightweight)
    optimize_container_environment
    install_minimal_packages_docker
    install_container_cli_tools
    
    # Git configuration (container-optimized)
    setup_git_docker
    
    # Backup and stow dotfiles (minimal backup needed in containers)
    log_info "Skipping backup in container (ephemeral environment)"
    stow_dotfiles_common
    
    # Container-specific setup
    setup_shell_docker
    setup_agent_tools_docker
    
    # Health check
    container_health_check
    
    # Final steps
    post_install_docker
    
    log_success "Docker/Container setup complete!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_docker "$@"
fi