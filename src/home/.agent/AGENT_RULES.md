# AGENT DEV RULES - 1 PAGER

## 🛑 MANDATORY: NO CODE WITHOUT PLAN APPROVAL

### 1. THINK HARDER ON COMPLEX PROBLEMS

- **NEVER SOLVE RIGHT AWAY**: For complex problems, STOP and think deeply first
- **USE SEQUENTIAL THINKING**: For complexity >6, use sequential thinking tool
- **ANALYZE THOROUGHLY**: Break down problem, consider alternatives, assess risks
- **DOCUMENT THINKING**: Write down analysis before proposing solution

### 2. NEVER HALLUCINATE - USE ONLY TRUSTED SOURCES

- **NO MADE-UP CODE**: Never create code without reference to existing patterns
- **TRUST ONLY**: docs/, code/, Context7 MCP, Serena MCP, official documentation
- **VERIFY EVERYTHING**: Check assumptions against actual codebase
- **CITE SOURCES**: Reference where information comes from
- **USE MCP FOR DATES**: Always use MCP time tools for dates, never make up dates

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

### 8. ESSENTIAL WORKFLOW

1. **Container** - Set up dedicated environment
2. **Context** - Read project-context.md
3. **PRD** - Create PRD with initial requirements
4. **Plan Mode** - Refine PRD (requirements, design, implementation, tasks) until approved
5. **Implement** - Follow approved PRD, continuously update progress
6. **Test** - Validate with project tests, document results in PRD
7. **Document** - Finalize PRD with learnings and next steps

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

### 12. FORBIDDEN PRACTICES

- ❌ Code without plan approval
- ❌ Local filesystem operations
- ❌ Skip project context reading
- ❌ Guess when information missing
- ❌ Copy code without understanding
- ❌ Skip testing "because it should work"

## 🎯 REMEMBER: THINK → PLAN → APPROVE → IMPLEMENT

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
