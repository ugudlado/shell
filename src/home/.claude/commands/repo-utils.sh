#!/bin/bash

# Repository utility functions for dynamic path resolution
# Source this file in commands: source ~/.claude/commands/repo-utils.sh

# Get main repository path (first worktree is always main)
get_main_repo() {
    git worktree list 2>/dev/null | head -1 | awk '{print $1}'
}

# Get current worktree path
get_current_worktree() {
    git rev-parse --show-toplevel 2>/dev/null
}

# Check if we're in a worktree or main repo
is_worktree() {
    local current=$(get_current_worktree)
    local main=$(get_main_repo)
    [ "$current" != "$main" ]
}

# Get specs directory path
get_specs_dir() {
    local linear_id="$1"
    local main_repo=$(get_main_repo)
    echo "$main_repo/specs/$linear_id"
}

# Get worktree path for a feature
get_feature_worktree() {
    local linear_id="$1"
    local main_repo=$(get_main_repo)
    local parent_dir=$(dirname "$main_repo")
    echo "$parent_dir/feature_worktrees/$linear_id"
}

# Read workflow state variable
get_workflow_var() {
    local linear_id="$1"
    local var_name="$2"
    local specs_dir=$(get_specs_dir "$linear_id")
    grep "^$var_name=" "$specs_dir/.workflow-state" 2>/dev/null | cut -d= -f2-
}

# Update workflow state variable
set_workflow_var() {
    local linear_id="$1"
    local var_name="$2"
    local var_value="$3"
    local specs_dir=$(get_specs_dir "$linear_id")
    local state_file="$specs_dir/.workflow-state"

    # Remove old value if exists
    grep -v "^$var_name=" "$state_file" > "$state_file.tmp" 2>/dev/null || true

    # Add new value
    echo "$var_name=$var_value" >> "$state_file.tmp"
    mv "$state_file.tmp" "$state_file"
}

# Create specs directory structure
create_specs_structure() {
    local linear_id="$1"
    local specs_dir=$(get_specs_dir "$linear_id")

    mkdir -p "$specs_dir"
    touch "$specs_dir/spec.md"
    touch "$specs_dir/memory.md"
    touch "$specs_dir/.workflow-state"

    # Initialize workflow state
    set_workflow_var "$linear_id" "MAIN_REPO" "$(get_main_repo)"
    set_workflow_var "$linear_id" "LINEAR_ID" "$linear_id"
    set_workflow_var "$linear_id" "CREATED" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    echo "$specs_dir"
}

# Create worktree for feature
create_feature_worktree() {
    local linear_id="$1"
    local worktree_path=$(get_feature_worktree "$linear_id")
    local main_repo=$(get_main_repo)
    local specs_dir=$(get_specs_dir "$linear_id")

    # Create worktree
    cd "$main_repo"
    git worktree add "$worktree_path" -b "feature/$linear_id"

    # Create symlink to specs
    ln -s "$specs_dir" "$worktree_path/specs-link"

    # Update workflow state
    set_workflow_var "$linear_id" "WORKTREE_PATH" "$worktree_path"
    set_workflow_var "$linear_id" "WORKTREE_CREATED" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    echo "$worktree_path"
}

# Archive completed specs
archive_specs() {
    local linear_id="$1"
    local main_repo=$(get_main_repo)
    local specs_dir=$(get_specs_dir "$linear_id")
    local archive_dir="$main_repo/specs-completed/$(date +%Y-%m)"

    mkdir -p "$archive_dir"
    mv "$specs_dir" "$archive_dir/$linear_id"

    echo "$archive_dir/$linear_id"
}

# Clean up worktree
cleanup_worktree() {
    local linear_id="$1"
    local worktree_path=$(get_workflow_var "$linear_id" "WORKTREE_PATH")
    local main_repo=$(get_main_repo)

    if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
        cd "$main_repo"
        git worktree remove "$worktree_path" 2>/dev/null || git worktree remove --force "$worktree_path"
        git worktree prune
    fi

    # Delete branch
    git branch -d "feature/$linear_id" 2>/dev/null || true
    git push origin --delete "feature/$linear_id" 2>/dev/null || true
}

# Print repository info
print_repo_info() {
    echo "Repository Information:"
    echo "  Main repo: $(get_main_repo)"
    echo "  Current location: $(get_current_worktree)"
    echo "  Is worktree: $(is_worktree && echo "Yes" || echo "No")"
    echo ""
    echo "Active worktrees:"
    git worktree list
}

# Validate Linear ID format
validate_linear_id() {
    local linear_id="$1"
    if [[ ! "$linear_id" =~ ^[A-Z]+-[0-9]+$ ]]; then
        echo "Error: Invalid Linear ID format. Expected format: ABC-123"
        return 1
    fi
    return 0
}

# Export functions for use in commands
export -f get_main_repo
export -f get_current_worktree
export -f is_worktree
export -f get_specs_dir
export -f get_feature_worktree
export -f get_workflow_var
export -f set_workflow_var
export -f create_specs_structure
export -f create_feature_worktree
export -f archive_specs
export -f cleanup_worktree
export -f print_repo_info
export -f validate_linear_id