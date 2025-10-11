# Claude Code Hooks & Commands Review

## Review Date: 2025-10-11
## Status: Issues Found - Needs Fix

---

## Hooks Configuration Issues

### ❌ **CRITICAL: Missing Hook Scripts**

**Problem:** `settings.json` references hook scripts that don't exist:
```json
"command": "bash ~/.claude/hooks/smart-validate.sh"
"command": "bash ~/.claude/hooks/update-linear.sh"
"command": "~/.claude/hooks/validate-git.sh"
"command": "bash ~/.claude/hooks/dangerous-command-filter.sh"
"command": "bash ~/.claude/hooks/save-session.sh"
```

**Location:** `src/home/.claude/hooks/` directory doesn't exist

**Impact:** Hooks will fail silently or error when triggered

**Fix Required:**
1. Create `src/home/.claude/hooks/` directory
2. Implement referenced hook scripts OR
3. Remove unused hooks from settings.json

---

### ⚠️ Hook Best Practices Comparison

| Hook Event | Current Implementation | 2025 Best Practice | Status |
|------------|----------------------|-------------------|--------|
| **PreToolUse** | ✅ Bash matcher with validation | ✅ Correct - security checks before execution | Good |
| **PostToolUse** | ✅ Edit/Write/Bash matchers | ✅ Correct - validation after changes | Good |
| **Notification** | ✅ macOS notification | ✅ Correct - user alerts | Good |
| **Stop** | ✅ Session save | ✅ Correct - cleanup on completion | Good |
| **UserPromptSubmit** | ❌ Empty | ⚠️ Optional - could add context loading | Optional |
| **SessionStart** | ❌ Empty | ⚠️ Missing - should load dev context | **Needs** |

---

### 📋 Recommended SessionStart Hook

**Purpose:** Load development context automatically when session starts

**Best Practice Implementation:**
```json
"SessionStart": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "bash ~/.claude/hooks/session-init.sh"
      }
    ]
  }
]
```

**Script:** `~/.claude/hooks/session-init.sh`
```bash
#!/bin/bash
# Load git context, recent issues, and project state
{
  echo "=== Session Context ==="
  echo "Date: $(date)"
  echo "Repo: $(git rev-parse --show-toplevel 2>/dev/null || echo 'Not a git repo')"
  echo "Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
  echo ""
  echo "=== Recent Commits ==="
  git log --oneline -5 2>/dev/null || echo "No git history"
  echo ""
  echo "=== Working Tree Status ==="
  git status --short 2>/dev/null || echo "Clean or no git"
} > /tmp/claude-session-context.txt 2>&1
```

---

## Slash Commands Review

### ✅ **Commands: Structure Correct**

**Location:** `src/home/.claude/commands/`
- ✅ `/specify` - specify.md (93 lines)
- ✅ `/plan` - plan.md (133 lines)
- ✅ `/implement` - implement.md
- ✅ `/complete-feature` - complete-feature.md

**Format:** All use correct frontmatter with `description` and `model` fields

**Example:**
```markdown
---
description: Create Linear ticket and feature specification
model: claude-sonnet-4-5
---
```

### ⚠️ **Commands: Content Issues**

#### 1. **Hardcoded Paths**
```markdown
# ❌ Problem
~/.claude/.specify/templates/spec-template.md

# ✅ Should be
~/.claude/templates/spec-template.md
```

**Files Affected:** `/specify`, `/plan`

#### 2. **Project-Specific Logic**
Commands reference "Lighthouse", "BOK" team, and "Awilix DI" patterns - these are project-specific and should be:
- Moved to project-level `.claude/commands/` OR
- Made generic with variables

#### 3. **MCP Tool References**
```markdown
# References tools that may not exist:
- mcp__zen__thinkdeep
- mcp__zen__planner
- memory tool operations
```

**Issue:** Commands assume specific MCP servers installed

---

### 📋 Commands Best Practices (2025)

| Feature | Current | Best Practice | Status |
|---------|---------|--------------|--------|
| **Frontmatter** | ✅ Has description & model | ✅ Correct | Good |
| **Arguments** | ❌ Not using $ARGUMENTS | ⚠️ Should use $ARGUMENTS | **Fix** |
| **Scope** | ❌ User-level with project logic | ⚠️ Should be project-level | **Move** |
| **Templates** | ❌ Wrong paths | ✅ Should exist in ~/.claude/templates/ | **Fix** |
| **Namespacing** | ❌ No subdirectories | ⚠️ Optional - could use /project:specify | Optional |

---

### 🔧 **Recommended Arguments Usage**

**Current (specify.md):**
```markdown
Given the feature description provided as an argument, do this:
```

**Should be:**
```markdown
---
description: Create Linear ticket and feature specification from natural language description.
model: claude-sonnet-4-5
---

Given the feature description: $ARGUMENTS

Do this:
1. Analyze requirements: $ARGUMENTS
2. Create Linear ticket with: $1 (title) $2 (description)
...
```

**Usage:** `/specify Add user authentication with JWT tokens`

---

## Summary of Issues

### Critical (Must Fix)
1. ❌ **Missing hook scripts** - Referenced in settings.json but don't exist
2. ❌ **Wrong template paths** - ~/.claude/.specify/templates/ doesn't exist

### Important (Should Fix)
3. ⚠️ **SessionStart hook missing** - No dev context loading
4. ⚠️ **Commands not using $ARGUMENTS** - Harder to use with parameters
5. ⚠️ **Project-specific commands in user scope** - Should be in project .claude/commands/

### Nice to Have (Consider)
6. ℹ️ **UserPromptSubmit hook** - Could add context preprocessing
7. ℹ️ **Command namespacing** - Use subdirectories for organization
8. ℹ️ **MCP tool validation** - Check if referenced tools exist

---

## Recommended Action Plan

### Phase 1: Fix Broken References
1. Create `src/home/.claude/hooks/` directory
2. Implement or stub hook scripts
3. Fix template paths in commands
4. Move templates to correct location

### Phase 2: Add Missing Functionality
1. Implement SessionStart hook
2. Add $ARGUMENTS support to commands
3. Create template files

### Phase 3: Reorganize Structure
1. Move project-specific commands to `.claude/commands/` (project-level)
2. Keep generic commands in `~/.claude/commands/` (user-level)
3. Add command namespacing if needed

---

## Testing Commands

```bash
# List all available commands
claude # then type / to see autocomplete

# Test specific command
/specify Test feature description

# Verify hooks are running
# Check Claude Code output for hook execution messages
```

## Testing Hooks

```bash
# Trigger PostToolUse hook
# Make a file edit in Claude Code and check if validation runs

# Trigger SessionStart hook
# Start a new Claude Code session and check for context loading

# Check hook logs
tail -f ~/.claude/logs/*.log  # If logging is configured
```

---

## References

- [Claude Code Hooks Guide](https://docs.claude.com/en/docs/claude-code/hooks-guide)
- [Slash Commands Documentation](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Awesome Claude Code Examples](https://github.com/hesreallyhim/awesome-claude-code)
