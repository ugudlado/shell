#!/bin/bash

# Dependency Vulnerability Scanning Workflow
# Automated security scanning for various package managers and dependencies

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(pwd)"
SCAN_RESULTS_DIR="$PROJECT_ROOT/.security-scans"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

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

# Create results directory
setup_scan_environment() {
    mkdir -p "$SCAN_RESULTS_DIR"
    log_info "Vulnerability scan results will be saved to: $SCAN_RESULTS_DIR"
}

# Check for package files
detect_package_managers() {
    local package_managers=()
    
    if [[ -f "package.json" ]]; then
        package_managers+=("npm")
        log_info "Detected Node.js project (package.json)"
    fi
    
    if [[ -f "yarn.lock" ]]; then
        package_managers+=("yarn")
        log_info "Detected Yarn project (yarn.lock)"
    fi
    
    if [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]] || [[ -f "Pipfile" ]]; then
        package_managers+=("python")
        log_info "Detected Python project"
    fi
    
    if [[ -f "go.mod" ]]; then
        package_managers+=("go")
        log_info "Detected Go project (go.mod)"
    fi
    
    if [[ -f "Cargo.toml" ]]; then
        package_managers+=("rust")
        log_info "Detected Rust project (Cargo.toml)"
    fi
    
    if [[ -f "composer.json" ]]; then
        package_managers+=("php")
        log_info "Detected PHP project (composer.json)"
    fi
    
    if [[ -f "Gemfile" ]]; then
        package_managers+=("ruby")
        log_info "Detected Ruby project (Gemfile)"
    fi
    
    if [[ ${#package_managers[@]} -eq 0 ]]; then
        log_warning "No package managers detected in current directory"
        return 1
    fi
    
    printf '%s\n' "${package_managers[@]}"
}

# NPM/Node.js vulnerability scanning
scan_npm() {
    log_info "Running NPM vulnerability audit..."
    
    local output_file="$SCAN_RESULTS_DIR/npm-audit-$TIMESTAMP.json"
    local summary_file="$SCAN_RESULTS_DIR/npm-audit-summary-$TIMESTAMP.txt"
    
    if command -v npm &> /dev/null; then
        # Run npm audit and capture both JSON and human-readable output
        if npm audit --json > "$output_file" 2>&1; then
            log_success "NPM audit completed without vulnerabilities"
        else
            log_warning "NPM audit found vulnerabilities - check $output_file"
        fi
        
        # Generate human-readable summary
        npm audit > "$summary_file" 2>&1 || true
        
        # Try to fix automatically
        if npm audit fix --dry-run > "$SCAN_RESULTS_DIR/npm-audit-fix-$TIMESTAMP.txt" 2>&1; then
            log_info "NPM audit fix suggestions saved to npm-audit-fix-$TIMESTAMP.txt"
            
            # Ask if user wants to apply fixes
            if [[ "${AUTO_FIX:-false}" == "true" ]]; then
                log_info "Applying automatic fixes..."
                npm audit fix
                log_success "NPM audit fixes applied"
            else
                log_info "Run 'npm audit fix' to apply automatic fixes"
            fi
        fi
    else
        log_error "NPM not found, skipping NPM audit"
        return 1
    fi
}

# Yarn vulnerability scanning
scan_yarn() {
    log_info "Running Yarn vulnerability audit..."
    
    local output_file="$SCAN_RESULTS_DIR/yarn-audit-$TIMESTAMP.json"
    
    if command -v yarn &> /dev/null; then
        if yarn audit --json > "$output_file" 2>&1; then
            log_success "Yarn audit completed without vulnerabilities"
        else
            log_warning "Yarn audit found vulnerabilities - check $output_file"
        fi
    else
        log_error "Yarn not found, skipping Yarn audit"
        return 1
    fi
}

# Python vulnerability scanning
scan_python() {
    log_info "Running Python vulnerability scanning..."
    
    local output_file="$SCAN_RESULTS_DIR/python-safety-$TIMESTAMP.txt"
    
    # Try safety-cli first (most common Python vulnerability scanner)
    if command -v safety &> /dev/null; then
        if safety check --json > "$output_file" 2>&1; then
            log_success "Python safety check completed without vulnerabilities"
        else
            log_warning "Python safety check found vulnerabilities - check $output_file"
        fi
    elif command -v pip-audit &> /dev/null; then
        # Alternative: pip-audit
        if pip-audit --format=json --output="$output_file" 2>&1; then
            log_success "Python pip-audit completed without vulnerabilities"
        else
            log_warning "Python pip-audit found vulnerabilities - check $output_file"
        fi
    elif command -v bandit &> /dev/null; then
        # Fallback: bandit for code analysis
        local bandit_output="$SCAN_RESULTS_DIR/python-bandit-$TIMESTAMP.json"
        if bandit -r . -f json -o "$bandit_output" 2>/dev/null; then
            log_success "Python bandit scan completed"
        else
            log_warning "Python bandit scan found issues - check $bandit_output"
        fi
    else
        log_warning "No Python security tools found (safety, pip-audit, bandit)"
        log_info "Install with: pip install safety pip-audit bandit"
        return 1
    fi
}

# Go vulnerability scanning
scan_go() {
    log_info "Running Go vulnerability scanning..."
    
    local output_file="$SCAN_RESULTS_DIR/go-vulncheck-$TIMESTAMP.txt"
    
    if command -v go &> /dev/null; then
        # Use govulncheck if available (official Go vulnerability scanner)
        if command -v govulncheck &> /dev/null; then
            if govulncheck ./... > "$output_file" 2>&1; then
                log_success "Go vulnerability check completed without issues"
            else
                log_warning "Go vulnerability check found issues - check $output_file"
            fi
        else
            log_warning "govulncheck not found. Install with: go install golang.org/x/vuln/cmd/govulncheck@latest"
            
            # Fallback: check go.sum for known patterns
            if [[ -f "go.sum" ]]; then
                local go_sum_check="$SCAN_RESULTS_DIR/go-sum-check-$TIMESTAMP.txt"
                log_info "Checking go.sum for known vulnerable patterns..."
                grep -E "(CVE-|vulnerable)" go.sum > "$go_sum_check" 2>&1 || log_info "No obvious vulnerabilities in go.sum"
            fi
        fi
    else
        log_error "Go not found, skipping Go vulnerability scan"
        return 1
    fi
}

# Rust vulnerability scanning
scan_rust() {
    log_info "Running Rust vulnerability scanning..."
    
    local output_file="$SCAN_RESULTS_DIR/rust-audit-$TIMESTAMP.txt"
    
    if command -v cargo &> /dev/null; then
        if command -v cargo-audit &> /dev/null; then
            if cargo audit > "$output_file" 2>&1; then
                log_success "Rust cargo-audit completed without vulnerabilities"
            else
                log_warning "Rust cargo-audit found vulnerabilities - check $output_file"
            fi
        else
            log_warning "cargo-audit not found. Install with: cargo install cargo-audit"
            return 1
        fi
    else
        log_error "Cargo not found, skipping Rust vulnerability scan"
        return 1
    fi
}

# Docker/Container vulnerability scanning
scan_docker() {
    log_info "Scanning for Docker vulnerabilities..."
    
    local output_file="$SCAN_RESULTS_DIR/docker-scan-$TIMESTAMP.txt"
    
    # Check if Dockerfile exists
    if [[ -f "Dockerfile" ]]; then
        log_info "Found Dockerfile, scanning for vulnerabilities..."
        
        # Use hadolint for Dockerfile best practices
        if command -v hadolint &> /dev/null; then
            if hadolint Dockerfile > "$output_file" 2>&1; then
                log_success "Dockerfile passed hadolint checks"
            else
                log_warning "Dockerfile has issues - check $output_file"
            fi
        else
            log_warning "hadolint not found. Install for Dockerfile scanning"
        fi
        
        # Use trivy if available for comprehensive scanning
        if command -v trivy &> /dev/null; then
            local trivy_output="$SCAN_RESULTS_DIR/trivy-scan-$TIMESTAMP.json"
            log_info "Running Trivy filesystem scan..."
            if trivy fs --format json --output "$trivy_output" . 2>&1; then
                log_success "Trivy filesystem scan completed"
            else
                log_warning "Trivy scan found issues - check $trivy_output"
            fi
        fi
    else
        log_info "No Dockerfile found, skipping Docker vulnerability scan"
    fi
}

# Generate vulnerability report
generate_report() {
    log_info "Generating vulnerability scan report..."
    
    local report_file="$SCAN_RESULTS_DIR/vulnerability-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Vulnerability Scan Report

**Date:** $(date)
**Project:** $(basename "$PROJECT_ROOT")
**Scan ID:** $TIMESTAMP

## Scan Summary

EOF
    
    # Count scan files
    local scan_count=0
    local issue_count=0
    
    for scan_file in "$SCAN_RESULTS_DIR"/*-"$TIMESTAMP".*; do
        if [[ -f "$scan_file" ]]; then
            ((scan_count++))
            local filename=$(basename "$scan_file")
            echo "- [$filename](./$filename)" >> "$report_file"
            
            # Simple heuristic for issues
            if grep -qi "vulnerability\|error\|warning\|critical\|high" "$scan_file" 2>/dev/null; then
                ((issue_count++))
            fi
        fi
    done
    
    cat >> "$report_file" << EOF

## Results Overview

- **Scans completed:** $scan_count
- **Scans with potential issues:** $issue_count

## Recommendations

1. Review all scan results in the \`.security-scans\` directory
2. Prioritize fixing HIGH and CRITICAL vulnerabilities
3. Update dependencies to latest secure versions
4. Consider implementing automated vulnerability scanning in CI/CD
5. Run scans regularly (weekly or before releases)

## Next Steps

\`\`\`bash
# To fix NPM vulnerabilities
npm audit fix

# To update Python dependencies
pip install --upgrade -r requirements.txt

# To update Go dependencies
go get -u ./...

# To update Rust dependencies
cargo update
\`\`\`

---
*Generated by vuln-scan.sh on $(date)*
EOF
    
    log_success "Vulnerability report generated: $report_file"
    
    # Display summary
    echo
    log_info "Vulnerability Scan Summary:"
    echo -e "  📊 Scans completed: $scan_count"
    echo -e "  ⚠️  Scans with issues: $issue_count"
    echo -e "  📄 Report: $report_file"
    echo
}

# Main scanning function
run_vulnerability_scan() {
    local package_managers
    package_managers=$(detect_package_managers) || {
        log_warning "No package managers detected, scanning for general vulnerabilities..."
        scan_docker
        return 0
    }
    
    # Run scans for detected package managers
    while IFS= read -r pm; do
        case "$pm" in
            "npm")
                scan_npm
                ;;
            "yarn")
                scan_yarn
                ;;
            "python")
                scan_python
                ;;
            "go")
                scan_go
                ;;
            "rust")
                scan_rust
                ;;
            *)
                log_info "Scanning not implemented for: $pm"
                ;;
        esac
    done <<< "$package_managers"
    
    # Always check Docker if present
    scan_docker
}

# Install scanning tools
install_tools() {
    log_info "Installing/updating vulnerability scanning tools..."
    
    # NPM tools
    if command -v npm &> /dev/null; then
        npm audit --version > /dev/null 2>&1 || npm install -g npm@latest
    fi
    
    # Python tools
    if command -v pip &> /dev/null; then
        pip install --upgrade safety pip-audit bandit 2>/dev/null || log_warning "Failed to install Python security tools"
    fi
    
    # Go tools
    if command -v go &> /dev/null; then
        go install golang.org/x/vuln/cmd/govulncheck@latest 2>/dev/null || log_warning "Failed to install govulncheck"
    fi
    
    # Rust tools
    if command -v cargo &> /dev/null; then
        cargo install cargo-audit 2>/dev/null || log_warning "Failed to install cargo-audit"
    fi
    
    log_info "Tool installation/update complete"
}

# Display help
show_help() {
    cat << EOF
Vulnerability Scanner - Automated dependency security scanning

Usage: $0 [OPTIONS]

Options:
    --install-tools     Install/update scanning tools
    --auto-fix         Automatically apply fixes where possible
    --help             Show this help message

Examples:
    $0                 Run vulnerability scan
    $0 --install-tools Install scanning tools
    $0 --auto-fix      Run scan and apply automatic fixes

Supported package managers:
    - NPM/Node.js (package.json)
    - Yarn (yarn.lock)
    - Python (requirements.txt, pyproject.toml, Pipfile)
    - Go (go.mod)
    - Rust (Cargo.toml)
    - Docker (Dockerfile)

Results are saved to: .security-scans/
EOF
}

# Main execution
main() {
    case "${1:-}" in
        "--install-tools")
            install_tools
            exit 0
            ;;
        "--auto-fix")
            export AUTO_FIX=true
            ;;
        "--help"|"-h")
            show_help
            exit 0
            ;;
    esac
    
    log_info "🔍 Starting vulnerability scan..."
    
    setup_scan_environment
    run_vulnerability_scan
    generate_report
    
    log_success "Vulnerability scan complete!"
    log_info "Review results in: $SCAN_RESULTS_DIR"
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi