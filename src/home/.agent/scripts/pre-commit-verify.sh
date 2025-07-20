#!/bin/bash

# Pre-commit Hook Verification Script
# Validates code quality, security, and standards before commits

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")"
CHECKS_PASSED=0
CHECKS_FAILED=0

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

# Check if running in git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi
    log_success "Git repository detected"
}

# Check for staged files
check_staged_files() {
    local staged_files
    staged_files=$(git diff --cached --name-only)
    
    if [[ -z "$staged_files" ]]; then
        log_warning "No staged files found"
        return 1
    fi
    
    log_success "Found $(echo "$staged_files" | wc -l) staged files"
    echo "$staged_files"
}

# Syntax validation for different file types
validate_syntax() {
    local file="$1"
    local extension="${file##*.}"
    
    case "$extension" in
        "sh"|"bash")
            if command -v shellcheck &> /dev/null; then
                if shellcheck "$file"; then
                    log_success "Shell syntax valid: $file"
                else
                    log_error "Shell syntax invalid: $file"
                fi
            else
                if bash -n "$file"; then
                    log_success "Shell syntax valid: $file"
                else
                    log_error "Shell syntax invalid: $file"
                fi
            fi
            ;;
        "json")
            if command -v jq &> /dev/null; then
                if jq empty "$file" 2>/dev/null; then
                    log_success "JSON syntax valid: $file"
                else
                    log_error "JSON syntax invalid: $file"
                fi
            else
                log_warning "jq not available, skipping JSON validation for $file"
            fi
            ;;
        "yaml"|"yml")
            if command -v yamllint &> /dev/null; then
                if yamllint "$file" > /dev/null 2>&1; then
                    log_success "YAML syntax valid: $file"
                else
                    log_error "YAML syntax invalid: $file"
                fi
            elif command -v python3 &> /dev/null; then
                if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
                    log_success "YAML syntax valid: $file"
                else
                    log_error "YAML syntax invalid: $file"
                fi
            else
                log_warning "YAML validation tools not available for $file"
            fi
            ;;
        "py")
            if command -v python3 &> /dev/null; then
                if python3 -m py_compile "$file" 2>/dev/null; then
                    log_success "Python syntax valid: $file"
                else
                    log_error "Python syntax invalid: $file"
                fi
            else
                log_warning "Python not available for validation of $file"
            fi
            ;;
        "js"|"jsx"|"ts"|"tsx")
            if command -v node &> /dev/null; then
                if node -c "$file" 2>/dev/null; then
                    log_success "JavaScript/TypeScript syntax valid: $file"
                else
                    log_error "JavaScript/TypeScript syntax invalid: $file"
                fi
            else
                log_warning "Node.js not available for validation of $file"
            fi
            ;;
        *)
            log_info "No syntax validation available for: $file"
            ;;
    esac
}

# Check for secrets and sensitive information
check_secrets() {
    local file="$1"
    local secrets_found=false
    
    # Common secret patterns
    local patterns=(
        "password\s*=\s*['\"][^'\"]+['\"]"
        "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
        "secret\s*=\s*['\"][^'\"]+['\"]"
        "token\s*=\s*['\"][^'\"]+['\"]"
        "aws[_-]?access[_-]?key[_-]?id\s*=\s*['\"][^'\"]+['\"]"
        "aws[_-]?secret[_-]?access[_-]?key\s*=\s*['\"][^'\"]+['\"]"
        "-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----"
        "ssh-rsa\s+AAAA[0-9A-Za-z+/]+"
    )
    
    for pattern in "${patterns[@]}"; do
        if grep -iP "$pattern" "$file" > /dev/null 2>&1; then
            log_error "Potential secret detected in $file: $pattern"
            secrets_found=true
        fi
    done
    
    if [[ "$secrets_found" == false ]]; then
        log_success "No secrets detected in: $file"
    fi
}

# Check file permissions
check_file_permissions() {
    local file="$1"
    
    # Check if executable files have shebang
    if [[ -x "$file" ]] && [[ -f "$file" ]]; then
        if head -1 "$file" | grep -q "^#!"; then
            log_success "Executable file has shebang: $file"
        else
            log_warning "Executable file missing shebang: $file"
        fi
    fi
    
    # Check for overly permissive permissions
    local perms
    perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null || echo "unknown")
    
    if [[ "$perms" =~ ^[0-7]{3}$ ]]; then
        local world_perms="${perms: -1}"
        if [[ "$world_perms" -gt 4 ]]; then
            log_warning "File has world-writable permissions ($perms): $file"
        else
            log_success "File permissions appropriate ($perms): $file"
        fi
    fi
}

# Check for large files
check_file_size() {
    local file="$1"
    local max_size=$((10 * 1024 * 1024)) # 10MB
    
    if [[ -f "$file" ]]; then
        local size
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
        
        if [[ "$size" -gt "$max_size" ]]; then
            log_warning "Large file detected ($(( size / 1024 / 1024 ))MB): $file"
        else
            log_success "File size appropriate: $file"
        fi
    fi
}

# Check for TODOs and FIXMEs
check_todos() {
    local file="$1"
    local todo_count
    
    todo_count=$(grep -ci "TODO\|FIXME\|HACK\|XXX" "$file" 2>/dev/null || echo 0)
    
    if [[ "$todo_count" -gt 0 ]]; then
        log_warning "Found $todo_count TODO/FIXME comments in: $file"
        grep -ni "TODO\|FIXME\|HACK\|XXX" "$file" | head -5
    else
        log_success "No TODO/FIXME comments in: $file"
    fi
}

# Check commit message quality
check_commit_message() {
    if [[ -f "$PROJECT_ROOT/.git/COMMIT_EDITMSG" ]]; then
        local commit_msg
        commit_msg=$(head -1 "$PROJECT_ROOT/.git/COMMIT_EDITMSG")
        
        # Check minimum length
        if [[ ${#commit_msg} -lt 10 ]]; then
            log_error "Commit message too short (minimum 10 characters)"
            return 1
        fi
        
        # Check maximum length for first line
        if [[ ${#commit_msg} -gt 72 ]]; then
            log_warning "Commit message first line too long (maximum 72 characters)"
        fi
        
        # Check for conventional commit format
        if [[ "$commit_msg" =~ ^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?: ]]; then
            log_success "Commit message follows conventional format"
        else
            log_warning "Commit message doesn't follow conventional format"
        fi
        
        log_success "Commit message validation complete"
    else
        log_info "No commit message found for validation"
    fi
}

# Run linting tools if available
run_linters() {
    local file="$1"
    local extension="${file##*.}"
    
    case "$extension" in
        "sh"|"bash")
            if command -v shellcheck &> /dev/null; then
                if shellcheck "$file"; then
                    log_success "Shellcheck passed: $file"
                else
                    log_error "Shellcheck failed: $file"
                fi
            fi
            ;;
        "py")
            if command -v pylint &> /dev/null; then
                if pylint --disable=all --enable=syntax-error "$file" > /dev/null 2>&1; then
                    log_success "Pylint passed: $file"
                else
                    log_error "Pylint failed: $file"
                fi
            fi
            ;;
        "js"|"jsx"|"ts"|"tsx")
            if command -v eslint &> /dev/null; then
                if eslint "$file" > /dev/null 2>&1; then
                    log_success "ESLint passed: $file"
                else
                    log_error "ESLint failed: $file"
                fi
            fi
            ;;
    esac
}

# Main verification function
verify_files() {
    local staged_files
    staged_files=$(check_staged_files) || return 1
    
    log_info "Running pre-commit verification..."
    
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            log_info "Checking: $file"
            
            validate_syntax "$file"
            check_secrets "$file"
            check_file_permissions "$file"
            check_file_size "$file"
            check_todos "$file"
            run_linters "$file"
            
            echo # Blank line for readability
        fi
    done <<< "$staged_files"
    
    check_commit_message
}

# Display summary
show_summary() {
    echo
    log_info "Pre-commit verification summary:"
    echo -e "  ${GREEN}✅ Checks passed: $CHECKS_PASSED${NC}"
    echo -e "  ${RED}❌ Checks failed: $CHECKS_FAILED${NC}"
    
    if [[ "$CHECKS_FAILED" -gt 0 ]]; then
        echo
        log_error "Pre-commit verification failed. Please fix issues before committing."
        return 1
    else
        echo
        log_success "All pre-commit checks passed! Ready to commit."
        return 0
    fi
}

# Main execution
main() {
    log_info "🔍 Starting pre-commit verification..."
    
    check_git_repo || exit 1
    verify_files || exit 1
    show_summary
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi