#!/bin/bash

# Modern Dotfiles Setup - Main Orchestrator
# Detects environment and calls appropriate platform-specific setup script

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

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

# Display environment information
show_environment_info() {
    local os=$(detect_os)
    local env=$(detect_environment)
    
    log_header "Environment Detection"
    echo "  🖥️  Operating System: $os"
    echo "  🏠 Environment: $env"
    echo "  📁 Project Directory: $SCRIPT_DIR"
    echo
}

# Validate setup scripts exist
validate_setup_scripts() {
    log_info "Validating setup scripts..."
    
    local required_scripts=(
        "$SCRIPTS_DIR/setup-common.sh"
        "$SCRIPTS_DIR/setup-macos.sh"
        "$SCRIPTS_DIR/setup-linux.sh"
        "$SCRIPTS_DIR/setup-docker.sh"
    )
    
    local missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if [[ ! -f "$script" ]]; then
            missing_scripts+=("$(basename "$script")")
        fi
    done
    
    if [[ ${#missing_scripts[@]} -gt 0 ]]; then
        log_error "Missing required setup scripts: ${missing_scripts[*]}"
        log_info "Please ensure all setup scripts are present in the scripts/ directory"
        return 1
    fi
    
    # Make scripts executable
    chmod +x "$SCRIPTS_DIR"/*.sh
    
    log_success "All setup scripts validated and made executable"
}

# Select and run appropriate setup script
run_platform_setup() {
    local os=$(detect_os)
    local env=$(detect_environment)
    local script_to_run=""
    
    # Determine which script to run based on environment
    if [[ "$env" == "docker" ]] || [[ "$env" == "container" ]]; then
        script_to_run="$SCRIPTS_DIR/setup-docker.sh"
        log_info "Using container-optimized setup"
    elif [[ "$os" == "macos" ]]; then
        script_to_run="$SCRIPTS_DIR/setup-macos.sh"
        log_info "Using macOS setup"
    elif [[ "$os" == "linux" ]]; then
        script_to_run="$SCRIPTS_DIR/setup-linux.sh"
        log_info "Using Linux setup"
    else
        log_error "Unsupported operating system: $os"
        log_info "Supported platforms: macOS, Linux, Docker/Container"
        return 1
    fi
    
    # Verify script exists
    if [[ ! -f "$script_to_run" ]]; then
        log_error "Setup script not found: $script_to_run"
        return 1
    fi
    
    log_header "Running Platform Setup"
    log_info "Executing: $(basename "$script_to_run")"
    
    # Run the appropriate setup script
    bash "$script_to_run" "$@"
}

# Show help information
show_help() {
    cat << EOF
Modern Dotfiles Setup - Main Orchestrator

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Automatically detects your environment and runs the appropriate setup script:
    
    • macOS (host)     → scripts/setup-macos.sh
    • Linux (host)     → scripts/setup-linux.sh  
    • Docker/Container → scripts/setup-docker.sh

OPTIONS:
    --help, -h         Show this help message
    --info             Show environment information only
    --validate         Validate setup scripts only
    --force-platform   Force specific platform script
                       Values: macos, linux, docker

EXAMPLES:
    $0                 # Auto-detect and run setup
    $0 --info          # Show detected environment
    $0 --force-platform docker  # Force container setup

ENVIRONMENT VARIABLES:
    GIT_USER_NAME      Git user name (skips interactive prompt)
    GIT_USER_EMAIL     Git user email (skips interactive prompt)

SETUP SCRIPTS:
    scripts/setup-common.sh    Shared functions for all platforms
    scripts/setup-macos.sh     macOS-specific setup (Homebrew, etc.)
    scripts/setup-linux.sh     Linux-specific setup (apt/dnf/pacman)
    scripts/setup-docker.sh    Container-optimized setup

For more information, see:
    • README.md              - Project overview
    • docs/USAGE.md          - Detailed usage guide
    • docs/project-context.md - Development context
EOF
}

# Force specific platform (for testing or special cases)
force_platform_setup() {
    local platform="$1"
    local script_to_run=""
    
    case "$platform" in
        macos)
            script_to_run="$SCRIPTS_DIR/setup-macos.sh"
            ;;
        linux)
            script_to_run="$SCRIPTS_DIR/setup-linux.sh"
            ;;
        docker|container)
            script_to_run="$SCRIPTS_DIR/setup-docker.sh"
            ;;
        *)
            log_error "Invalid platform: $platform"
            log_info "Valid platforms: macos, linux, docker"
            return 1
            ;;
    esac
    
    if [[ ! -f "$script_to_run" ]]; then
        log_error "Setup script not found: $script_to_run"
        return 1
    fi
    
    log_warning "Forcing platform setup: $platform"
    bash "$script_to_run"
}

# Pre-flight checks
pre_flight_checks() {
    # Check if we're in the right directory
    if [[ ! -f "$SCRIPT_DIR/Makefile" ]] || [[ ! -d "$SCRIPT_DIR/src" ]]; then
        log_error "This doesn't appear to be the dotfiles project directory"
        log_info "Please run this script from the dotfiles project root"
        return 1
    fi
    
    # Check if scripts directory exists
    if [[ ! -d "$SCRIPTS_DIR" ]]; then
        log_error "Scripts directory not found: $SCRIPTS_DIR"
        log_info "Please ensure the scripts/ directory exists"
        return 1
    fi
    
    log_success "Pre-flight checks passed"
}

# Main function
main() {
    # Handle command line arguments
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --info)
            show_environment_info
            exit 0
            ;;
        --validate)
            pre_flight_checks
            validate_setup_scripts
            log_success "All validations passed"
            exit 0
            ;;
        --force-platform)
            if [[ -z "${2:-}" ]]; then
                log_error "--force-platform requires a platform argument"
                log_info "Usage: $0 --force-platform <macos|linux|docker>"
                exit 1
            fi
            pre_flight_checks
            validate_setup_scripts
            force_platform_setup "$2"
            exit 0
            ;;
        "")
            # Normal execution
            ;;
        *)
            log_error "Unknown option: $1"
            log_info "Use --help for usage information"
            exit 1
            ;;
    esac
    
    # Main setup flow
    log_header "Modern Dotfiles Setup"
    
    # Pre-flight checks
    pre_flight_checks
    
    # Show environment info
    show_environment_info
    
    # Validate scripts
    validate_setup_scripts
    
    # Run platform-specific setup
    run_platform_setup "$@"
    
    log_success "🎉 Setup orchestration complete!"
    log_info "Check the output above for any platform-specific instructions"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi