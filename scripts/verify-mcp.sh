#!/bin/bash

# MCP Server Configuration Verification Script
# Verifies that MCP servers are properly configured and detected

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo -e "\n${BLUE}🔍 $1${NC}"
}

# Check if file exists and is valid JSON
check_json_file() {
    local file="$1"
    local description="$2"

    if [[ ! -f "$file" ]]; then
        log_error "$description not found: $file"
        return 1
    fi

    if ! jq empty "$file" 2>/dev/null; then
        log_error "$description has invalid JSON: $file"
        return 1
    fi

    log_success "$description found and valid: $file"
    return 0
}

# Check MCP server configuration in file
check_mcp_servers() {
    local file="$1"
    local description="$2"

    if [[ ! -f "$file" ]]; then
        return 1
    fi

    local server_count=$(jq -r '.mcpServers | keys | length' "$file" 2>/dev/null || echo "0")

    if [[ "$server_count" -gt 0 ]]; then
        log_info "$description contains $server_count MCP server(s):"
        jq -r '.mcpServers | keys[]' "$file" 2>/dev/null | while read -r server; do
            echo "    • $server"
        done
    else
        log_warning "$description contains no MCP servers"
    fi
}

# Main verification
main() {
    log_header "MCP Server Configuration Verification"

    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_warning "jq not installed. Install it for detailed verification: brew install jq"
        log_info "Performing basic checks only..."
    fi

    # Check global configuration
    log_header "Global Configuration (~/.claude.json)"
    if check_json_file "$HOME/.claude.json" "Global MCP config"; then
        check_mcp_servers "$HOME/.claude.json" "Global config"
    fi

    # Check global memory file
    log_header "Global Memory Store"
    if check_json_file "$HOME/.claude/memory.json" "Global memory"; then
        log_success "Global memory store initialized"
    fi

    # Check project configuration
    log_header "Project Configuration (.mcp.json)"
    if [[ -f ".mcp.json" ]]; then
        if check_json_file ".mcp.json" "Project MCP config"; then
            check_mcp_servers ".mcp.json" "Project config"
        fi
    else
        log_info "No project-level .mcp.json found (this is optional)"
    fi

    # Check project memory file
    log_header "Project Memory Store"
    if [[ -f "memory.json" ]]; then
        if check_json_file "memory.json" "Project memory"; then
            log_success "Project memory store initialized"
        fi
    else
        log_info "No project-level memory.json found (create one to use project memory)"
    fi

    # Check Claude Code CLI
    log_header "Claude Code CLI Detection"
    if command -v claude &> /dev/null; then
        log_success "Claude Code CLI found"
        log_info "To list MCP servers, run: claude mcp list"
    else
        log_warning "Claude Code CLI not found in PATH"
    fi

    # Summary
    log_header "Configuration Summary"
    echo
    echo "📁 Configuration Files:"
    echo "   Global MCP:    ~/.claude.json"
    echo "   Global Memory: ~/.claude/memory.json"
    echo "   Project MCP:   .mcp.json (in project root)"
    echo "   Project Memory: memory.json (in project root)"
    echo
    echo "🔄 Scope Priority (highest to lowest):"
    echo "   1. Local (session only, not persisted)"
    echo "   2. Project (.mcp.json, version-controlled)"
    echo "   3. User/Global (~/.claude.json)"
    echo
    echo "✨ To use MCP servers:"
    echo "   1. Start Claude Code from project directory: cd <project> && claude"
    echo "   2. MCP tools appear as: mcp__<server-name>__<tool-name>"
    echo "   3. Approve project-scoped servers on first use"
    echo
    log_success "Verification complete!"
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
