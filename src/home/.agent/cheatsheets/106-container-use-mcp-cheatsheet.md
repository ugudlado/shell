# Container-Use MCP Cheatsheet

## 🐳 Overview
Container-Use is an MCP server for creating isolated development environments for AI agents. It works through MCP integration, not direct CLI commands.

## 🚀 Installation & Setup
```bash
# Install container-use
brew install dagger/tap/container-use

# Add MCP server to repository
claude mcp add container-use -- cu stdio

# Optional: Add agent rules
curl https://raw.githubusercontent.com/dagger/container-use/main/rules/agent.md >> CLAUDE.md
```

## 🎯 How It Works
- **MCP Integration**: Works through AI agent MCP calls, not CLI commands
- **Natural Language**: Ask agent to create environments in plain English
- **Automatic Management**: Agent handles container creation, git branches, isolation
- **Real-time Visibility**: See command history and logs
- **Git Workflow**: Use `git checkout <branch>` to review agent work

## 📝 Usage Patterns

### Creating Environments
Instead of CLI commands, use natural language with your AI agent:

```
❌ Don't: cu create my-project
✅ Do: "Create a containerized development environment for my dotfiles modernization project"
```

### Common Requests
- "Set up a container environment for React TypeScript development"
- "Create isolated environment for Python Flask app"
- "Initialize containerized workspace for dotfiles modernization"
- "Set up development container with Node.js and Git"

## 🔧 Agent Workflow
1. **Request**: Ask agent for containerized environment
2. **Auto-Creation**: Agent creates container + git branch
3. **Isolated Work**: All development happens in container
4. **Review**: Use `git checkout <branch>` to see changes
5. **Merge**: Standard git merge when satisfied

## 🛠️ Available CLI Commands (for monitoring)
```bash
cu list        # List existing environments
cu log <env>   # Show environment logs
cu checkout    # Check out environment in git
cu terminal    # Drop into environment terminal
cu diff        # Show changes vs local branch
cu merge       # Merge environment to current branch
cu delete      # Delete environments
cu watch       # Watch git log output
```

## 🎯 Key Benefits
- **Isolation**: Each project gets fresh container + git branch
- **Safety**: No risk to local environment
- **Visibility**: Complete command history
- **Control**: Can intervene via terminal access
- **Collaboration**: Multiple agents can work independently

## ⚠️ Important Notes
- **Experimental**: May have rough edges, breaking changes
- **MCP Required**: Must be configured as MCP server
- **Agent-Driven**: Designed for AI agent interaction
- **Support**: Discord #container-use channel

## 🔗 Resources
- [GitHub](https://github.com/dagger/container-use)
- [Discord Support](https://discord.gg/Nf42dydvrX)
- [Installation Script](https://raw.githubusercontent.com/dagger/container-use/main/install.sh)

## 💡 Best Practices
1. **Be Specific**: Clearly describe what environment you need
2. **Natural Language**: Use plain English requests
3. **Check Status**: Use `cu list` to see active environments
4. **Review Work**: Always check `cu log` before merging
5. **Clean Up**: Delete old environments with `cu delete`

---
*Remember: container-use works through MCP integration with AI agents, not standalone CLI commands*