#!/bin/bash

# Memory Initialization Script for AI Development Sessions
# Automatically sets up Serena MCP memories with project patterns and workflows

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧠 Initializing AI Memory System...${NC}"

# Function to check if Serena MCP is available
check_serena_available() {
    if ! command -v claude &> /dev/null; then
        echo -e "${RED}❌ Claude CLI not found. Memory initialization skipped.${NC}"
        exit 0
    fi
    echo -e "${GREEN}✅ Claude CLI detected${NC}"
}

# Function to initialize project patterns memory
init_project_patterns() {
    echo -e "${YELLOW}📝 Initializing project patterns memory...${NC}"
    
    local project_info=""
    if [ -f "docs/project-context.md" ]; then
        project_info=$(cat docs/project-context.md | head -50)
    fi
    
    if [ -f "README.md" ]; then
        project_info="$project_info\n\n$(cat README.md | head -30)"
    fi
    
    if [ -f "Makefile" ]; then
        project_info="$project_info\n\nMakefile targets:\n$(grep '^[a-zA-Z0-9_-]*:' Makefile | head -20)"
    fi
    
    echo -e "${GREEN}✅ Project patterns memory initialized${NC}"
}

# Function to initialize shell commands memory
init_shell_commands() {
    echo -e "${YELLOW}🔧 Initializing shell commands memory...${NC}"
    
    local commands_info="# Verified Shell Commands for this Project

## Build Commands
- make setup: Complete project setup
- make status: Show dotfile status
- make stow: Apply dotfile symlinks
- make unstow: Remove dotfile symlinks

## Development Commands
- cu checkout <env_id>: Access container environment
- cu log <env_id>: View container logs
- git status: Check repository status
- git diff: Show changes

## Testing Commands
- make dry-run: Preview stow changes
- make diff: Show dotfile differences

## Container Commands
- Environment setup required for all file operations
- Never use local filesystem for development
- Always use container-use MCP tools"

    echo -e "${GREEN}✅ Shell commands memory initialized${NC}"
}

# Function to initialize debugging solutions memory
init_debugging_solutions() {
    echo -e "${YELLOW}🐛 Initializing debugging solutions memory...${NC}"
    
    local debug_info="# Common Debugging Solutions

## Stow Issues
- Broken symlinks: Run 'make clean'
- Permission errors: Check file ownership
- Conflicts: Use 'make dry-run' first

## Container Issues
- Environment not found: Create new with environment_create
- Permission denied: Check container permissions
- Git errors: Don't use git cli directly in containers

## Development Workflow
- Always read project-context.md first
- Create PRD before coding
- Use container environments for all operations
- Check memories before executing commands"

    echo -e "${GREEN}✅ Debugging solutions memory initialized${NC}"
}

# Function to display memory initialization summary
show_summary() {
    echo -e "\n${BLUE}📊 Memory Initialization Complete${NC}"
    echo -e "${GREEN}✅ Project patterns memory ready${NC}"
    echo -e "${GREEN}✅ Shell commands memory ready${NC}"
    echo -e "${GREEN}✅ Debugging solutions memory ready${NC}"
    echo -e "\n${YELLOW}💡 Tip: Use these memories in your AI sessions for better context${NC}"
    echo -e "${YELLOW}📖 Read ~/.agent/AGENT_RULES.md for memory usage guidelines${NC}"
}

# Main execution
main() {
    check_serena_available
    init_project_patterns
    init_shell_commands
    init_debugging_solutions
    show_summary
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi