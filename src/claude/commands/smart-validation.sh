#!/bin/bash

# Smart validation - only check what changed
# Usage: source ~/.claude/commands/smart-validation.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get modified files compared to main
get_modified_files() {
    local base_branch="${1:-origin/main}"
    git diff "$base_branch" --name-only
}

# Get staged files
get_staged_files() {
    git diff --cached --name-only
}

# Run tests only for modified test files
smart_test() {
    echo -e "${BLUE}Running tests for modified files...${NC}"

    local modified_files=$(get_modified_files)
    local test_files=$(echo "$modified_files" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)

    if [ -z "$test_files" ]; then
        echo -e "${YELLOW}No test files modified - skipping test run${NC}"
        return 0
    fi

    echo -e "${BLUE}Testing: ${NC}"
    echo "$test_files"

    # Convert newlines to spaces for pnpm test command
    local test_args=$(echo "$test_files" | tr '\n' ' ')

    if [ -n "$test_args" ]; then
        pnpm test -- $test_args
    fi
}

# Run linting only on modified files
smart_lint() {
    echo -e "${BLUE}Running lint on modified files...${NC}"

    local modified_files=$(get_modified_files)
    local lint_files=$(echo "$modified_files" | grep -E '\.(ts|tsx|js|jsx|json|md)$' || true)

    if [ -z "$lint_files" ]; then
        echo -e "${YELLOW}No lintable files modified${NC}"
        return 0
    fi

    # Check if eslint is available
    if command -v eslint &> /dev/null || [ -f "node_modules/.bin/eslint" ]; then
        echo "$lint_files" | xargs npx eslint --fix
    else
        echo -e "${YELLOW}ESLint not found - skipping${NC}"
    fi

    # Check if prettier is available
    if command -v prettier &> /dev/null || [ -f "node_modules/.bin/prettier" ]; then
        echo "$lint_files" | xargs npx prettier --write
    else
        echo -e "${YELLOW}Prettier not found - skipping${NC}"
    fi
}

# Run type checking only on modified TypeScript files
smart_typecheck() {
    echo -e "${BLUE}Running typecheck on modified files...${NC}"

    local modified_files=$(get_modified_files)
    local ts_files=$(echo "$modified_files" | grep -E '\.(ts|tsx)$' || true)

    if [ -z "$ts_files" ]; then
        echo -e "${YELLOW}No TypeScript files modified - skipping typecheck${NC}"
        return 0
    fi

    # Use TypeScript incremental build if available
    if [ -f "tsconfig.json" ]; then
        npx tsc --noEmit --incremental
    else
        echo -e "${YELLOW}tsconfig.json not found - skipping typecheck${NC}"
    fi
}

# Run pre-commit hooks if available
run_precommit() {
    echo -e "${BLUE}Running pre-commit hooks...${NC}"

    # Check for git hooks
    if [ -f ".git/hooks/pre-commit" ]; then
        .git/hooks/pre-commit
    elif command -v pre-commit &> /dev/null; then
        pre-commit run --files $(get_staged_files)
    else
        echo -e "${YELLOW}No pre-commit hooks configured${NC}"
        # Run smart validation as fallback
        smart_lint
        smart_typecheck
    fi
}

# Validate only what changed
smart_validate() {
    echo -e "${GREEN}=== Smart Validation ===${NC}"
    echo -e "${BLUE}Checking only modified files to save time${NC}"
    echo

    # Show what changed
    echo -e "${BLUE}Modified files:${NC}"
    get_modified_files | head -20
    local count=$(get_modified_files | wc -l)
    if [ "$count" -gt 20 ]; then
        echo "... and $((count - 20)) more files"
    fi
    echo

    # Run smart checks
    smart_test
    echo

    # Only run lint/typecheck if no pre-commit hooks
    if [ ! -f ".git/hooks/pre-commit" ] && ! command -v pre-commit &> /dev/null; then
        smart_lint
        echo
        smart_typecheck
        echo
    else
        run_precommit
    fi

    echo -e "${GREEN}Smart validation complete!${NC}"
}

# Quick validation before commit
quick_check() {
    echo -e "${BLUE}Quick pre-commit check...${NC}"

    # Stage all changes
    git add -A

    # Run pre-commit or smart validation
    if [ -f ".git/hooks/pre-commit" ]; then
        .git/hooks/pre-commit
    else
        smart_validate
    fi
}

# Full validation (for CI or final checks)
full_validate() {
    echo -e "${GREEN}=== Full Validation ===${NC}"
    echo -e "${YELLOW}Running complete test suite (this may take time)${NC}"

    # Run all tests
    pnpm test

    # Run full lint
    pnpm lint:fix || pnpm lint || npx eslint . --fix

    # Run full typecheck
    pnpm typecheck || npx tsc --noEmit

    # Build
    pnpm build

    echo -e "${GREEN}Full validation complete!${NC}"
}

# Compare performance: smart vs full
compare_validation() {
    echo -e "${BLUE}Comparing smart vs full validation...${NC}"

    # Time smart validation
    local start_smart=$(date +%s)
    smart_validate > /dev/null 2>&1
    local end_smart=$(date +%s)
    local smart_time=$((end_smart - start_smart))

    # Time full validation
    local start_full=$(date +%s)
    full_validate > /dev/null 2>&1
    local end_full=$(date +%s)
    local full_time=$((end_full - start_full))

    echo -e "${GREEN}Results:${NC}"
    echo "  Smart validation: ${smart_time}s"
    echo "  Full validation: ${full_time}s"
    echo "  Time saved: $((full_time - smart_time))s ($(( (full_time - smart_time) * 100 / full_time ))%)"
}

# Export functions
export -f get_modified_files
export -f get_staged_files
export -f smart_test
export -f smart_lint
export -f smart_typecheck
export -f run_precommit
export -f smart_validate
export -f quick_check
export -f full_validate
export -f compare_validation

# Help message
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Smart Validation - Check only what changed"
    echo ""
    echo "Usage:"
    echo "  source ~/.claude/commands/smart-validation.sh"
    echo "  smart_validate    # Run smart validation"
    echo "  quick_check       # Quick pre-commit check"
    echo "  full_validate     # Run full validation suite"
    echo "  smart_test        # Test only modified test files"
    echo "  smart_lint        # Lint only modified files"
    echo "  smart_typecheck   # Typecheck only modified TS files"
    echo ""
    echo "This saves time by only checking files that changed,"
    echo "rather than running lint/typecheck on the entire codebase."
fi