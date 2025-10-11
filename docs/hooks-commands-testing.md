# Hooks & Commands Testing Guide

## Testing Checklist

### Hook Scripts

#### ✅ Session Init Hook
**File:** `~/.claude/hooks/session-init.sh`
**Trigger:** SessionStart event
**Test:**
```bash
# Manual test
bash ~/.claude/hooks/session-init.sh

# Check output file
cat /tmp/claude-session-context-*.txt
```
**Expected:** Session context with git status, branch info, recent commits

#### ✅ Smart Validate Hook
**File:** `~/.claude/hooks/smart-validate.sh`
**Trigger:** PostToolUse (Edit|Write|MultiEdit)
**Test:**
```bash
# Test with sample file
echo '{"tool_input":{"file_path":"test.js"}}' | bash ~/.claude/hooks/smart-validate.sh

# Test with different file types
echo '{"tool_input":{"file_path":"test.py"}}' | bash ~/.claude/hooks/smart-validate.sh
echo '{"tool_input":{"file_path":"test.sh"}}' | bash ~/.claude/hooks/smart-validate.sh
```
**Expected:** Language-specific validation runs (if tools installed)

#### ✅ Git Validate Hook
**File:** `~/.claude/hooks/validate-git.sh`
**Trigger:** PreToolUse (Bash)
**Test:**
```bash
# Test dangerous command (should block)
echo '{"tool_input":{"command":"git push --force"}}' | bash ~/.claude/hooks/validate-git.sh
echo $?  # Should be 2 (blocked)

# Test safe command
echo '{"tool_input":{"command":"git status"}}' | bash ~/.claude/hooks/validate-git.sh
echo $?  # Should be 0 (allowed)

# Test warning command
echo '{"tool_input":{"command":"git commit --amend"}}' | bash ~/.claude/hooks/validate-git.sh
echo $?  # Should be 0 (allowed with warning)
```
**Expected:**
- Dangerous commands blocked (exit 2)
- Safe commands allowed (exit 0)
- Risky commands warned but allowed (exit 0)

#### ✅ Dangerous Command Filter Hook
**File:** `~/.claude/hooks/dangerous-command-filter.sh`
**Trigger:** PreToolUse (Bash)
**Test:**
```bash
# Test blocked command
echo '{"tool_input":{"command":"rm -rf /"}}' | bash ~/.claude/hooks/dangerous-command-filter.sh
echo $?  # Should be 2 (blocked)

# Test warning command
echo '{"tool_input":{"command":"rm -rf ./temp"}}' | bash ~/.claude/hooks/dangerous-command-filter.sh
echo $?  # Should be 0 (warned)

# Test safe command
echo '{"tool_input":{"command":"ls -la"}}' | bash ~/.claude/hooks/dangerous-command-filter.sh
echo $?  # Should be 0 (allowed)
```
**Expected:**
- System-destructive commands blocked
- File operations warned
- Safe commands allowed

#### ✅ Linear Update Hook
**File:** `~/.claude/hooks/update-linear.sh`
**Trigger:** PostToolUse (Bash - git commands)
**Test:**
```bash
# Test git commit detection
echo '{"tool_input":{"command":"git commit -m \"test\""}}' | bash ~/.claude/hooks/update-linear.sh

# Test git push detection
echo '{"tool_input":{"command":"git push"}}' | bash ~/.claude/hooks/update-linear.sh

# Test non-git command (should skip)
echo '{"tool_input":{"command":"ls"}}' | bash ~/.claude/hooks/update-linear.sh
```
**Expected:** Extracts Linear ID from branch/commit, updates if CLI available

#### ✅ Save Session Hook
**File:** `~/.claude/hooks/save-session.sh`
**Trigger:** Stop event
**Test:**
```bash
# Manual test
bash ~/.claude/hooks/save-session.sh

# Check session logs
ls -lt ~/.claude/sessions/ | head
cat ~/.claude/sessions/*.log | tail -50
```
**Expected:** Session log created in `~/.claude/sessions/`

---

### Slash Commands

#### ✅ /specify Command
**File:** `~/.claude/commands/specify.md`
**Test:**
```bash
# In Claude Code session
/specify Add user authentication with JWT tokens and refresh tokens

# Check for:
# 1. $ARGUMENTS is replaced with description
# 2. Command creates Linear ticket
# 3. Spec file created in specs/[LINEAR-ID]/
# 4. Template loaded from correct path (~/.claude/templates/spec-template.md)
```
**Expected:**
- Accepts arguments
- Creates Linear ticket
- Generates specification
- Uses correct template path

#### ✅ /plan Command
**File:** `~/.claude/commands/plan.md`
**Test:**
```bash
# In Claude Code session
/plan BOK-123

# Check for:
# 1. $ARGUMENTS contains ticket ID
# 2. Loads spec from specs/BOK-123/
# 3. Creates plan.md, data-model.md, tasks.md
# 4. Template loaded from ~/.claude/templates/
```
**Expected:**
- Accepts ticket ID argument
- Generates implementation plan
- Creates design artifacts
- Uses correct template paths

#### ✅ /implement Command
**File:** `~/.claude/commands/implement.md`
**Test:**
```bash
# In Claude Code session
/implement BOK-123

# Check for:
# 1. $ARGUMENTS contains ticket ID
# 2. Navigates to worktree
# 3. Executes tasks from tasks.md
# 4. Creates commits with ticket reference
```
**Expected:**
- Accepts ticket ID argument
- Implements tasks in order
- Creates logical commits
- Updates memory

#### ✅ /complete-feature Command
**File:** `~/.claude/commands/complete-feature.md`
**Test:**
```bash
# In Claude Code session
/complete-feature BOK-123

# Check for:
# 1. $ARGUMENTS contains ticket ID
# 2. Validates completion
# 3. Merges to main
# 4. Cleans up worktree
# 5. Archives specs
```
**Expected:**
- Accepts ticket ID argument
- Completes feature cycle
- Merges and cleans up
- Archives documentation

---

## Integration Testing

### End-to-End Hook Flow
```bash
# 1. Start session (triggers SessionStart)
claude

# 2. Make a file edit (triggers PostToolUse)
# In Claude Code: Ask to edit a file

# 3. Run git command (triggers PreToolUse + PostToolUse)
# In Claude Code: Ask to run git status

# 4. Stop session (triggers Stop)
# Exit Claude Code

# 5. Verify logs
cat /tmp/claude-session-context-*.txt
cat ~/.claude/sessions/*.log
```

### End-to-End Command Flow
```bash
# 1. Create specification
/specify Build a dashboard widget system

# 2. Generate plan
/plan [LINEAR-ID from step 1]

# 3. Implement feature
/implement [LINEAR-ID]

# 4. Complete and merge
/complete-feature [LINEAR-ID]

# 5. Verify artifacts
ls -la specs-completed/
ls -la ~/.claude/sessions/
```

---

## Validation Checklist

### Hooks
- [x] All hook scripts exist and are executable
- [x] Scripts handle malformed JSON gracefully
- [x] Scripts exit with appropriate codes (0=allow, 2=block)
- [x] Scripts output to stderr for user feedback
- [x] SessionStart hook loads context
- [x] PreToolUse hooks can block operations
- [x] PostToolUse hooks validate changes
- [x] Stop hook saves session state

### Commands
- [x] All commands use proper frontmatter
- [x] Commands use $ARGUMENTS for parameters
- [x] Commands reference correct template paths
- [x] Commands have clear descriptions
- [x] Commands specify appropriate models
- [x] Commands are project-agnostic where possible

### Templates
- [x] Templates exist in ~/.claude/templates/
- [x] spec-template.md structure defined
- [x] plan-template.md structure defined
- [x] tasks-template.md structure defined

---

## Troubleshooting

### Hooks Not Firing
```bash
# Check settings.json syntax
jq empty ~/.claude/settings.json

# Verify hook paths
ls -la ~/.claude/hooks/

# Check hook permissions
chmod +x ~/.claude/hooks/*.sh

# Test hooks manually
echo '{"tool_input":{"command":"test"}}' | bash ~/.claude/hooks/validate-git.sh
```

### Commands Not Found
```bash
# List available commands
ls -la ~/.claude/commands/

# Check command syntax
head -20 ~/.claude/commands/specify.md

# Verify frontmatter
grep -A 3 "^---$" ~/.claude/commands/specify.md
```

### Template Errors
```bash
# Check template paths
ls -la ~/.claude/templates/

# Verify templates readable
cat ~/.claude/templates/spec-template.md

# Test template in commands
grep -n "template" ~/.claude/commands/*.md
```

---

## Performance Testing

### Hook Execution Time
```bash
# Time individual hooks
time bash ~/.claude/hooks/session-init.sh
time echo '{"tool_input":{"file_path":"test.js"}}' | bash ~/.claude/hooks/smart-validate.sh
time echo '{"tool_input":{"command":"git status"}}' | bash ~/.claude/hooks/validate-git.sh

# Expected: All hooks < 1 second
```

### Session Logs Cleanup
```bash
# Check session log count
ls ~/.claude/sessions/*.log | wc -l

# Should auto-cleanup to keep last 50
# Verify cleanup logic in save-session.sh
```

---

## Security Testing

### Hook Input Validation
```bash
# Test with malformed JSON
echo 'not json' | bash ~/.claude/hooks/validate-git.sh

# Test with missing fields
echo '{}' | bash ~/.claude/hooks/validate-git.sh

# Test with injection attempts
echo '{"tool_input":{"command":"test; rm -rf /"}}' | bash ~/.claude/hooks/dangerous-command-filter.sh
```

### Command Security
```bash
# Verify commands don't execute arbitrary code
grep -r "eval" ~/.claude/commands/
grep -r "| bash" ~/.claude/commands/

# Check for hardcoded credentials
grep -ri "password\|token\|secret" ~/.claude/commands/
```

---

## Sign-Off

### Hooks
- [ ] All 5 hook scripts implemented
- [ ] All hooks tested individually
- [ ] Integration testing complete
- [ ] Performance acceptable (< 1s)
- [ ] Security validated

### Commands
- [ ] All 4 commands updated
- [ ] $ARGUMENTS support added
- [ ] Template paths fixed
- [ ] Commands tested end-to-end
- [ ] Documentation complete

### Deployment
- [ ] Files in src/home/.claude/
- [ ] Permissions set correctly
- [ ] Templates in place
- [ ] Ready for stow deployment

---

## Next Steps

1. Deploy via setup.sh: `./setup.sh`
2. Restart Claude Code to load new hooks
3. Test one command: `/specify Test feature`
4. Verify hooks execute: Check logs
5. Complete integration test: Full workflow

---

## Notes

- Hooks run automatically, commands require explicit invocation
- Hooks should be fast (< 1 second) to avoid UX lag
- Commands can be long-running (minutes/hours)
- Test in non-production environment first
- Keep session logs for debugging
