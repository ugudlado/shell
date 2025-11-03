# Global Claude Code Development Guidelines

**Core Principle**: Use plugin-based workflow commands. Plugins handle heavy lifting with parallel execution. Keep responses concise.

## 🚀 WORKFLOW COMMANDS

Use slash commands for the unified feature development workflow:

**`/specify [feature-description]`** - Create spec & Linear ticket
- Model: `claude-opus-4-1` (deep analysis)
- Plugins: `code-explorer` (2 parallel codebase analysis)
- Zen: ThinkDeep (GPT-5 systematic requirements)
- Output: `specs/[LINEAR-ID]/spec.md` + Linear ticket

**`/plan [LINEAR-ID]`** - Generate implementation plan
- Model: `claude-opus-4-1` (architecture design)
- Plugins: `code-architect` (3 parallel approaches)
- Zen: Planner (GPT-5 synthesis & tasks)
- Output: `plan.md` + `tasks.md` + worktree

**`/implement [LINEAR-ID]`** - Execute TDD implementation
- Model: `claude-sonnet-4-5` (efficient coding)
- Plugins: PR Review Toolkit (4 parallel quality gates)
- Quality: ≥9/10 reviews + ≥90% coverage
- Output: Feature code + tests + commits

**`/complete-feature [LINEAR-ID]`** - Merge & cleanup
- Model: `claude-haiku-4-5` (fast operations)
- Git: Merge (NOT rebase)
- Output: Merged to main + archived + cleaned

**`/commit-group`** - Organize commits logically
**`/load-session`** - Restore previous session context

## 📁 PROJECT STRUCTURE

```
specs/[LINEAR-ID]/          # One folder per Linear ticket
├── spec.md                 # Requirements and acceptance criteria
├── data-model.md           # Data structures and schemas
├── plan.md                 # Implementation phases
├── tasks.md                # Task breakdown with progress
├── research.md             # Research findings
└── memory.md               # Feature-specific patterns
```

## 🎯 LINEAR INTEGRATION

- Spec folder named with Linear ticket: `specs/LIG-189/`
- Commits reference ticket: `feat: [LIG-189] description`
- Tasks marked "Done" ONLY after user approval

## 💬 COMMUNICATION STYLE

- **Concise** - Max 4 lines unless detail requested
- **No preamble/postamble** - Skip "I'll help you with..." or "Here's what I found..."
- **Direct answers** - One word when appropriate
- **Execute fast** - Recognize task → run command → done

## 🚨 CRITICAL STANDARDS

1. **Spec-first**: Every feature needs `specs/[LINEAR-ID]/` before implementation
2. **Quality gates**: ≥9/10 reviews + ≥90% coverage (NOT ≥8)
3. **Git strategy**: Merge (NOT rebase unless requested)
4. **Team**: LighthouseAI (NOT "BOK")
5. **User approval**: Required before commits and merges

## 🔄 TYPICAL FLOW

```
User: "Add user authentication"
→ /specify Add user authentication with OAuth2
→ Creates spec.md + Linear ticket LIG-456

User: "Let's build it"
→ /plan LIG-456
→ Creates plan.md + tasks.md + worktree

→ /implement LIG-456
→ Executes tasks + auto-reviews + commits

User: "Merge it"
→ /complete-feature LIG-456
→ Merges to main + archives + cleans up
```

## 🔌 PLUGIN ECOSYSTEM

**Commands automatically use:**
- **feature-dev plugin**: `code-explorer`, `code-architect`, `code-reviewer`
- **pr-review-toolkit plugin**: 6 specialized review agents
- **Zen MCP**: ThinkDeep, Planner, Consensus (GPT-5)
- **Linear MCP**: Ticket management
- **Context7**: Library documentation

## 🧠 MEMORY SYSTEM

**Memory MCP** - Central knowledge store for all patterns and learnings

**Global Memories** (Cross-Project Patterns)
- Categories: `testing_patterns`, `architecture_patterns`, `development_workflow`, `code_conventions`
- Content: Reusable patterns applicable across any project
- Tools: `mcp__memory__search_nodes`, `mcp__memory__create_entities`, `mcp__memory__add_observations`

**Project-Specific Memories** (Project Context)
- Category: Project name (e.g., `lighthouse_journey`)
- Content: Project-specific architecture, patterns, decisions
- Same tools as global, just different entity names

**Feature Memory** (Feature Context)
- Location: `specs/[LINEAR-ID]/memory.md`
- Content: Feature-specific decisions and learnings
- Use: Document during implementation, extract to Memory MCP after

**Search Priority**: Memory MCP (project-specific) → Memory MCP (global) → Feature Memory → Web

## 🎓 GIT PREFERENCES

- **Strategy**: Merge (NOT rebase unless requested)
- **Pull**: `git pull` (NOT `git pull --rebase`)
- **Worktrees**: `~/code/feature_worktrees/[LINEAR-ID]`
- **Branches**: `feature/[LINEAR-ID]`

## 📝 LINEAR CONFIGURATION

Linear team configuration is **project-specific**. Each project's CLAUDE.md should include:

```markdown
## 🎯 LINEAR INTEGRATION

**Team Name**: [TeamName]
**Team ID**: [team-uuid]
**Team URL**: https://linear.app/[workspace]/team/[KEY]/all
**Ticket Prefix**: [KEY]-

Use this team when creating Linear tickets.
```

**Note**: `/specify` command reads team info from project's CLAUDE.md, not global config.

## 🤖 AGENT ARCHITECTURE

**Skills (Auto-Invoked)**
- `backend-engineer` - Project patterns for server (Drizzle, Awilix, Vitest)
- `frontend-engineer` - Project patterns for UI (React, TanStack Query, Zustand)
- Automatically loaded when relevant to conversation context
- NOT redundant with agents - different purpose (knowledge vs execution)

**Available Agents (Manual via Task Tool)**
- `opus-agent` - Deep analysis with Claude Opus 4
- `sonnet-agent` - Parallel coding tasks in separate context (saves main context)
- `haiku-agent` - Fast simple operations with Claude Haiku 4.5
- Plugin agents via workflows (`/specify`, `/plan`, `/implement`)

**Why Sonnet Agent?** Spins up separate Sonnet instances with isolated context windows. Use for:
- Parallel coding tasks without polluting main context
- Background implementation while you continue planning
- Multiple concurrent feature development

**Deprecated Agents (Removed for Redundancy)**
- ~~`solution-architect-reviewer`~~ - Use Zen MCP (`thinkdeep`, `planner`) + plugins
- ~~`tdd-software-engineer`~~ - Use `/implement` workflow instead

## 🎯 REMEMBER

- Commands handle the workflow - just invoke them
- Plugin agents do the heavy lifting automatically
- Skills auto-load project patterns - no manual invocation
- Quality gates are enforced at ≥9/10
- Keep responses minimal and direct
