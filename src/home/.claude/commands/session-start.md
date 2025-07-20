# Session Start Command

Quick session initialization for coding agents.

# Ask for Linear ticket ID before creating development session and use that as title if provided by user. Please use this ticket ID as prefix in all commit messages within container

# Create/resume container environment

cu create --title "Development Session" --source $(pwd)

# or: cu checkout <env_id> if resuming

```

## Manual Steps

1. Read `~/.agent/AGENT_RULES.md` for development rules
2. Read `docs/project-context.md` for project specifics
3. Initialize Taskmaster if needed: `tm init`
4. Check ongoing tasks: `tm ls --status in-progress`

## Ready Checklist

- ✅ Container environment active
- ✅ MCP tools available (Serena, Context7, Tavily, Sequential Thinking, Taskmaster)
- ✅ Project context loaded
- ✅ Task continuity restored
