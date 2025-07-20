# AGENT DEV RULES - 1 PAGER

## 🚀 SESSION INITIALIZATION

### Ask for Linear Ticket ID First

- **ALWAYS ASK**: Request Linear ticket ID before starting work
- **CONTAINER NAMING**: Use ticket ID as container title (e.g., "LIG-123 Feature Implementation")
- **COMMIT PREFIXES**: Use ticket ID as prefix in all commit messages within container
- **PRD LINKING**: Search for existing PRDs with ticket ID, create if needed

### Session Start Steps

1. **Get Ticket ID**: Ask user for Linear ticket ID
2. **Project Context**: Check current branch, find/create PRD for ticket
3. **Container Setup**: `cu create --title "[TICKET-ID] Description" --source $(pwd)`
5. **Task Recovery**: Check `tm ls --status in-progress` for ongoing work

### Context Discovery

- **Linear Context**: Use `mcp__linear__get_issue({"id": "TICKET-ID"})` for full context
- **PRD Status**: Search `docs/PRD_*.md` for ticket references
- **Recent Activity**: Check files changed in last 24h with `fd -t f --changed-within 1d`
- **Container History**: Resume existing container if available

## 🛑 MANDATORY: NO CODE WITHOUT PLAN APPROVAL

### 1. THINK HARDER ON COMPLEX PROBLEMS

- **NEVER SOLVE RIGHT AWAY**: For complex problems, STOP and think deeply first
- **USE SEQUENTIAL THINKING**: For complexity >6, use sequential thinking tool
- **ANALYZE THOROUGHLY**: Break down problem, consider alternatives, assess risks
- **DOCUMENT THINKING**: Write down analysis before proposing solution

### 2. COMPREHENSIVE RESEARCH METHODOLOGY - NO GUESSING

- **NO MADE-UP CODE**: Never create code without reference to existing patterns
- **MULTI-SOURCE RESEARCH**: Use Tavily (current trends) + Context7 (stable docs) + Sequential thinking (analysis)
- **VERIFY EVERYTHING**: Check assumptions against actual codebase and latest information
- **CITE SOURCES**: Reference where information comes from (Tavily, Context7, docs)
- **STORE RESEARCH**: Save consolidated findings in Serena memory for future sessions
- **USE MCP FOR DATES**: Always use MCP time tools for dates, never make up dates

#### Research Workflow Pattern

```javascript
// 1. Current information via Tavily
mcp__tavily__tavily-search({
  query: "technology best practices 2024",
  search_depth: "advanced",
  max_results: 15
});

// 2. Official documentation via Context7
mcp__context7__resolve-library-id({ libraryName: "library" });
mcp__context7__get-library-docs({ context7CompatibleLibraryID: "..." });

// 3. Store consolidated research
mcp__serena__write_memory({
  memory_name: "research_findings",
  content: "Combined: Tavily trends + Context7 docs + analysis..."
});
```

### 3. ALWAYS ASK BEFORE CODING

- **THINK FIRST**: What problem am I solving? Why?
- **PLAN**: Present complete solution approach
- **GET APPROVAL**: Wait for explicit "yes" before implementation
- **NEVER** jump into coding without approval

### 4. CONTAINERS MANDATORY

- **ALL** file operations, builds, tests MUST use container environment
- **NEVER** use local filesystem for development work
- Create dedicated container per feature/fix

### 5. READ PROJECT CONTEXT FIRST

- **ALWAYS** read `docs/project-context.md` at session start
- Understand tech stack, build commands, conventions
- Follow project-specific patterns and standards

### 6. CLARIFY WHEN BLOCKED

- **STOP** after 2-3 failed attempts
- **ASK** specific clarifying questions
- **NEVER** guess or assume when stuck
- **ASK TO UNBLOCK**: When blocked on workflow steps (container, tools, etc.), ask user to unblock

### 7. SYSTEMATIC APPROACH

- **Root Cause**: Use 5 Whys for bugs
- **Alternatives**: Consider 2+ approaches
- **Test Everything**: Write tests for bugs found
- **Fix Nearby**: Improve code when touching it

### 8. ENHANCED ESSENTIAL WORKFLOW

1. **Session Start** - Run session-start command (container + MCP tools + task recovery)
2. **Task Context** - Check Taskmaster tasks (`tm ls`), read PRD, load Serena memories
3. **Sequential Thinking** - For complex tasks (mandatory for complexity >6)
4. **Research Phase** - Tavily (current trends) + Context7 (stable docs) + memory storage
5. **Planning** - Create/update PRD with research findings and task breakdown
6. **Task Management** - Create Taskmaster tasks, link to Linear if available
7. **Implementation** - Use Serena + containers, update tasks continuously (`tm prog`)
8. **Validation** - Test, document results in PRD, mark tasks complete (`tm done`)
9. **Handoff** - Summarize state, prepare tasks for next agent session

### 9. QUALITY GATES

- **No broken windows** - Fix bad code immediately
- **DRY principle** - Reuse existing code
- **Follow patterns** - Match project conventions
- **Validate assumptions** - Prove don't assume

### 10. TOOLS PRIORITY

1. **Container environments** - ALL operations
2. **Serena MCP** - Code analysis, symbol-level editing, memory management
3. **MCP tools** - Complex operations, thinking
4. **Shell commands** - Build, test, git (in container)
5. **Sequential thinking** - Complex problems (mandatory)

### 11. PRD DOCUMENTATION REQUIRED

- **ONE PRD PER BRANCH** - Create `PRD_[branch-name].md` using template in `~/.agent/templates/PRD_TEMPLATE.md`
- **CONTINUOUS UPDATES** - Update PRD with progress, learnings, decisions
- **CONTEXT SWITCHING** - Document current state for next agent/developer
- **COMPLETE JOURNEY** - Requirements → Design → Implementation → Testing → Deploy
- **KNOWLEDGE CAPTURE** - All debugging, research, decisions in PRD

### 12. MEMORY MANAGEMENT WORKFLOWS

- **PROJECT INITIALIZATION** - Always run memory initialization script at session start
- **PATTERN STORAGE** - Store project patterns, conventions, and architectures in Serena memories
- **COMMAND MEMORY** - Check shell command memories before executing any commands
- **LEARNING CAPTURE** - Write new learnings to memories during development
- **MEMORY REVIEW** - Review existing memories before starting work on similar features
- **KNOWLEDGE SHARING** - Update memories with debugging solutions and code patterns discovered

#### Memory Categories

- **project_patterns**: Core architectural patterns and conventions
- **shell_commands**: Verified command sequences and their purposes
- **debugging_solutions**: Common issues and their proven solutions
- **code_conventions**: Language-specific patterns and standards
- **workflow_optimizations**: Process improvements and automation discoveries

#### Memory Workflow

1. **Session Start**: `mcp__serena__read_memory({ memory_file_name: "project_patterns" })`
2. **Before Commands**: `mcp__serena__read_memory({ memory_file_name: "shell_commands" })`
3. **During Development**: Store patterns with `mcp__serena__write_memory({ memory_name: "category_name", content: "..." })`
4. **Problem Solving**: Check `debugging_solutions` memory before investigating
5. **Session End**: Update memories with new learnings and patterns

### 13. SEQUENTIAL THINKING MANDATORY TRIGGERS

**USE mcp__sequential-thinking__sequentialthinking FOR:**

- **Complexity Score >6**: Multiple interdependent components requiring analysis
- **Unclear Requirements**: User request needs clarification and options
- **Multiple Valid Approaches**: Architectural decisions requiring trade-off analysis
- **Root Cause Analysis**: Complex bugs/errors needing systematic investigation
- **New Technology Integration**: Research and options analysis required

**SEQUENTIAL THINKING WORKFLOW:**

1. **Identify Trigger** → Use sequential thinking tool for thorough analysis
2. **Document Analysis** → Store findings and reasoning in PRD
3. **Present Options** → Show researched alternatives with pros/cons
4. **Get Approval** → Wait for explicit user decision before implementation
5. **Store Learnings** → Update Serena memory with decision rationale

### 14. RESEARCH DECISION TRIGGERS

**USE ENHANCED RESEARCH (Tavily + Context7) FOR:**

- New technology adoption decisions and framework selection
- Architecture pattern selection and comparison analysis
- Security vulnerability assessment and mitigation strategies
- Performance optimization approaches and tools
- Industry trend analysis and competitive landscape
- Tool/framework comparison and evaluation

**RESEARCH INTEGRATION PATTERN:**

- **Current Information** (Tavily) → **Official Documentation** (Context7) → **Analysis** (Sequential) → **Storage** (Serena) → **Decision** (User)

### 15. TASKMASTER TASK CONTINUITY SYSTEM

**REFERENCE**: See **[Taskmaster Cheatsheet](~/.agent/cheatsheets/101-taskmaster-cheatsheet.mdc)** for all commands

**INTEGRATION WORKFLOW:**

- **Session Start**: Check ongoing tasks, load context from memories and PRD
- **During Work**: Update task status, break down complex work into subtasks
- **Session End**: Complete tasks, prepare continuation tasks, sync with Linear
- **Cross-Session Recovery**: Initialize board (first time), use structured hierarchy

**KEY PATTERNS:**

- Initialize once: `tm init` → Create tasks → Track progress → Sync with Linear
- Always check existing tasks before starting new work
- Use task hierarchy for complex projects with subtasks
- Link to Linear for team coordination and visibility

### 16. MODERN CLI TOOLS INTEGRATION

**REFERENCE**: See **[CLI Productivity Tools](~/.agent/cheatsheets/108-cli-productivity-tools.mdc)** for detailed usage

**INTEGRATION PATTERN:**

1. **Fast Discovery** (CLI): Use rg/fd/eza for immediate pattern discovery
2. **Deep Analysis** (Serena): Symbol-level analysis and relationship mapping
3. **Intelligent Action** (Combined): Use insights from both for precise changes
4. **Memory Storage** (Serena): Store discovered patterns and solutions

**KEY TOOLS**: ripgrep (rg), fd, eza, fzf, bat - all integrated with Serena MCP workflows

### 17. AUTONOMOUS TOOL SELECTION FRAMEWORK

**RESEARCH DECISIONS:**

- Quick current info → Tavily web search with advanced depth
- Official documentation → Context7 with specific topic focus
- Complex analysis → Sequential thinking tool for thorough evaluation
- Cross-reference validation → Both Tavily + Context7 + existing memories
- Knowledge storage → Serena memory system with organized categories

**TASK MANAGEMENT DECISIONS:**

- Simple todos → Continue with current TodoWrite system if no Taskmaster
- Complex projects → Initialize Taskmaster board with hierarchical tasks
- Team coordination → Taskmaster with Linear sync for shared visibility
- Cross-session work → Taskmaster + PRD + Serena memory triple-layer continuity

**CODE OPERATIONS:**

- Fast discovery → CLI tools (rg, fd, eza) for immediate code exploration
- Deep analysis → Serena MCP symbolic tools for precision
- All operations → Container-use environments for isolation
- Pattern storage → Serena memory system for future reference

**ERROR HANDLING PROTOCOL:**

- **Attempts 1-2**: Use available tools, memories, and documented patterns
- **Attempt 3**: Ask specific clarifying questions with context
- **Never Guess**: When critical information is missing or ambiguous
- **Document Blocks**: Update PRD with obstacles for handoff continuity

### 18. AGENT HANDOFF PROTOCOL

**BEFORE ENDING SESSION:**

1. Review all task statuses (see Taskmaster cheatsheet)
2. Document code changes with Serena summarization tools
3. Update PRD with progress, decisions, and next steps
4. Prepare continuation tasks for next session
5. Store any new learnings in Serena memory

**NEW AGENT SESSION START:**

1. Run enhanced session-start command (container + tools + context)
2. Check active tasks requiring attention (see Taskmaster cheatsheet)
3. Read PRD summary and current project state
4. Load relevant Serena memories for context and patterns
5. Begin work with full context restoration and task continuity

### 19. FORBIDDEN PRACTICES

- ❌ Code without plan approval
- ❌ Local filesystem operations (always use containers)
- ❌ Skip project context reading
- ❌ Guess when information missing (use research tools)
- ❌ Copy code without understanding patterns
- ❌ Skip testing "because it should work"
- ❌ Execute commands without checking memory first
- ❌ Skip memory updates after learning something new
- ❌ Start work without checking existing tasks (`tm ls`)
- ❌ Use single-source research (always use Tavily + Context7 for important decisions)

## 🎯 REMEMBER: RESEARCH → THINK → PLAN → APPROVE → IMPLEMENT → MEMORIZE

### MULTI-TOOL AGENT WORKFLOW SUMMARY

**SESSION INITIALIZATION:**

1. Run session-start command → Container + MCP tools + task recovery
2. Check Taskmaster: `tm ls --status in-progress`
3. Load Serena memories and project context
4. Review PRD state if continuing work

**RESEARCH & ANALYSIS:**

1. **Sequential Thinking** for complex problems (complexity >6)
2. **Tavily Search** for current trends and real-world usage
3. **Context7 Documentation** for official best practices
4. **Serena Memory** storage for consolidated findings

**IMPLEMENTATION:**

1. Container-use for all operations
2. CLI tools (rg/fd/eza) for fast discovery
3. Serena MCP for deep analysis and precise editing
4. Taskmaster for progress tracking (`tm prog`, `tm done`)

**HANDOFF:**

1. Summarize changes and update PRD
2. Complete tasks and prepare next session tasks
3. Store learnings in Serena memory
4. Sync with Linear if configured (`tm up`)

### container-use

ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

DO NOT install or use the git cli with the environment_run_cmd tool. All environment tools will handle git operations for you. Changing ".git" yourself will compromise the integrity of your environment.

You MUST inform the user how to view your work using cu log <env_id> AND cu checkout <env_id>. Failure to do this will make your work inaccessible to others.

**Every coding session must improve both the codebase AND the development process.**

### serena

**SMART CODE OPERATIONS**: Use Serena for intelligent code analysis and editing

- **SYMBOL-LEVEL EDITING**: Use `find_symbol` and `replace_symbol_body` for precise code changes
- **MEMORY MANAGEMENT**: Store project patterns, conventions, and learnings in Serena memories
- **CODE ANALYSIS**: Use `get_symbols_overview` to understand codebase structure before changes
- **SEARCH FIRST**: Use `search_for_pattern` to find existing patterns before creating new code
- **THINK TOOLS**: Use `think_about_*` tools before major changes to validate approach
- **SHELL COMMANDS**: Read shell command memories before executing commands
- **ONBOARDING**: Check if project onboarding is complete before starting work
