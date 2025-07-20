# Agent Development Rules System

## 🎯 PRIMARY RULE BOOK

**ALL AGENTS MUST READ AND FOLLOW**: **[AGENT_RULES.md](AGENT_RULES.md)** - Essential 1-pager development process

## 🛠️ Tool References

**Command References**: **[cheatsheets/](cheatsheets/)** - MCP and CLI command references for specific tools

## 📁 Contents

### Documentation

- **`AGENT_RULES.md`** - Universal agent principles and development process
- **`cheatsheets/`** - Tool-specific command references
- **`templates/`** - Project configuration templates

## 🔄 Agent Workflow

### 1. Read Rules (in order)

1. **Generic**: `~/.agent/AGENT_RULES.md` - Universal agent principles
2. **Project**: `docs/project-context.md` - Project-specific context

### 2. Project Context

- **Main Context**: `docs/project-context.md` - Project-specific documentation
- **Tool Cheatsheets**: `~/.agent/cheatsheets/` - MCP tools reference

## 📁 Structure

```
.agent/
├── AGENT_RULES.md              # PRIMARY - Essential rules (READ FIRST!)
├── cheatsheets/                # Tool-specific command references
└── templates/                  # Project configuration templates
```

## 🚀 Quick Setup

For new projects:

1. Copy `.agent/` folder to project root
2. Create `docs/project-context.md` with project-specific info
3. All agents follow the same AGENT_RULES.md process

## 🎯 Core Philosophy

### Development Principles

- **Think harder** on complex problems before solving
- **Never hallucinate** - use only trusted sources
- **Plan before implementation** - no coding without approval
- **Container-based development** - all operations in containers

### Separation of Concerns

- **`.agent/`** = Generic, reusable across projects
- **`docs/`** = Project-specific documentation

### Project Ownership

- Project-specific context lives in docs/
- Generic utilities in .agent/
- Clear separation between reusable and project-specific
