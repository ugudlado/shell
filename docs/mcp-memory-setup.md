# MCP Memory Configuration Guide

## Overview

This project uses a dual-memory system with MCP (Model Context Protocol) servers:
- **Global Memory**: Cross-project patterns stored in `~/.claude/memory.json`
- **Project Memory**: Project-specific patterns stored in `./memory.json`

## Configuration Files

### Global Configuration
```
~/.claude.json           # MCP server definitions (global scope)
~/.claude/memory.json    # Global memory store
~/.claude/settings.json  # Claude Code settings (hooks, permissions, etc.)
```

### Project Configuration
```
.mcp.json               # MCP server definitions (project scope, version-controlled)
memory.json             # Project memory store (gitignored)
```

## Configuration Hierarchy

MCP servers follow this priority order (highest to lowest):

1. **Local scope** - Session only, not persisted (highest priority)
2. **Project scope** - `.mcp.json` in project root (version-controlled)
3. **User/Global scope** - `~/.claude.json` (lowest priority)

When servers with the same name exist at multiple scopes, the higher priority scope wins.

## Memory Store Architecture

### Global Memory (`~/.claude/memory.json`)
- **Purpose**: Cross-project reusable patterns
- **Categories**: testing_patterns, architecture_patterns, development_workflow, code_conventions
- **Synced via**: Dotfiles repository
- **Access**: Available to all projects

### Project Memory (`./memory.json`)
- **Purpose**: Project-specific patterns and context
- **Storage**: Local to each project
- **Synced via**: Gitignored (stays local)
- **Access**: Only available within project

## Setup Instructions

### 1. Deploy Configuration Files

```bash
# From dotfiles project root
./setup.sh

# This deploys:
# - ~/.claude.json (global MCP config)
# - ~/.claude/memory.json (global memory store)
# - Template .mcp.json files
```

### 2. Initialize Project Memory

```bash
# In your project directory
cp ~/.mcp.json ./.mcp.json  # Copy template
echo '{"entities":[],"relations":[]}' > memory.json  # Initialize store
```

### 3. Verify Configuration

```bash
# Run verification script
./scripts/verify-mcp.sh

# Or manually check:
claude mcp list  # List detected MCP servers
```

## Using Memory Stores

### Accessing Global Memory

Global memory is automatically available in all Claude Code sessions:

```
# MCP tools available:
mcp__memory-global__create_entities
mcp__memory-global__search_nodes
mcp__memory-global__read_graph
```

### Accessing Project Memory

Start Claude Code from project root to access project memory:

```bash
cd /path/to/project
claude

# MCP tools available:
mcp__memory-project__create_entities
mcp__memory-project__search_nodes
mcp__memory-project__read_graph
```

## File Structure

```
~/.claude/
├── .claude.json              # Global MCP servers
├── memory.json               # Global memory store
└── settings.json             # Claude Code settings

project/
├── .mcp.json                 # Project MCP servers (version-controlled)
├── memory.json               # Project memory store (gitignored)
└── .gitignore                # Excludes memory.json
```

## Configuration Examples

### Global MCP Config (`~/.claude.json`)
```json
{
  "mcpServers": {
    "memory-global": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "~/.claude/memory.json"
      }
    }
  }
}
```

### Project MCP Config (`.mcp.json`)
```json
{
  "mcpServers": {
    "memory-project": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "./memory.json"
      }
    }
  }
}
```

## Troubleshooting

### MCP Servers Not Detected

```bash
# 1. Verify files exist and are valid JSON
./scripts/verify-mcp.sh

# 2. Check Claude Code is started from project root
cd /path/to/project && claude

# 3. Approve project-scoped servers on first use
# Claude Code will prompt for approval
```

### Memory Store Issues

```bash
# Validate JSON format
jq empty ~/.claude/memory.json  # Global
jq empty ./memory.json           # Project

# Reset if corrupted
echo '{"entities":[],"relations":[]}' > memory.json
```

### Configuration File Priority

```bash
# Check which config files Claude Code reads:
# 1. Local (session) - highest priority
# 2. Project (.mcp.json)
# 3. Global (~/.claude.json) - lowest priority

# To override global config, add same server to .mcp.json
```

## Best Practices

### Global Memory
- Store cross-project reusable patterns
- Document architecture decisions
- Keep testing patterns and conventions
- Sync via dotfiles repo

### Project Memory
- Store project-specific context
- Document feature decisions in `specs/[LINEAR-ID]/memory.md`
- Don't commit to git (use .gitignore)
- Keep patterns relevant to this project only

### Configuration Management
- Commit `.mcp.json` to version control (team-shared)
- Keep `memory.json` local (gitignored)
- Use global config for personal preferences
- Use project config for team collaboration

## Security Notes

- Claude Code prompts for approval on first use of project-scoped servers
- Review `.mcp.json` in pull requests carefully
- Never commit sensitive data to memory stores
- Global config only affects your machine

## References

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [MCP Server Memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- Project: `/scripts/verify-mcp.sh` - Verification tool
