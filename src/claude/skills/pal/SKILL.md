---
name: pal
description: Use PAL MCP to invoke external CLI models (Codex, Claude) for cross-model code review, artifact review, consensus, and deep analysis. Triggers when you need an independent model's perspective — code reviews, spec reviews, architectural debates, or second opinions. Also use when the user says "ask codex", "cross-model review", "get a second opinion", or "use PAL".
---

# PAL — Provider Abstraction Layer

Invoke external AI CLIs (Codex, Claude) via PAL MCP's `clink` tool for cross-model collaboration. No API keys needed — delegates to locally installed CLIs.

## Available CLIs

| CLI | Model | Best For |
|-----|-------|----------|
| `codex` | OpenAI o3 | Logical reasoning, subtle bugs, code review |
| `claude` | Claude | Fresh perspective, parallel analysis |

## When to Use

- **Code review**: Get Codex's o3 to review diffs for bugs and logic errors
- **Artifact review**: Have Codex review specs/designs for gaps and feasibility
- **Second opinion**: When unsure about an approach, get cross-model validation
- **Debugging**: Use o3's reasoning for hard-to-find bugs

## Usage Patterns

### Code Review (diff-based)

```
Use the PAL MCP clink tool:
clink with codex codereviewer to review the changes in this diff (git diff <base>...<head>). Focus on:
1. Bugs, logic errors, and security vulnerabilities
2. Missing error handling or edge cases
3. Code quality and consistency
Report findings with file paths, line numbers. Categorize as: critical, important, or advisory.
```

### Artifact Review (spec/design)

```
Use the PAL MCP clink tool:
clink with codex codereviewer to review the feature specification artifacts at <path>. Evaluate for:
1. Logical gaps or contradictions between artifacts
2. Missing edge cases or error scenarios
3. Feasibility concerns with the proposed architecture
4. Task completeness — do tasks cover all spec requirements?
5. Unclear or ambiguous requirements
Report findings as: critical, suggestion, or nitpick.
```

### Uncommitted Changes Review

```
Use the PAL MCP clink tool:
clink with codex codereviewer to review uncommitted changes in this repository. Focus on high-confidence issues only — bugs, security, logic errors. Report file paths and line numbers.
```

## Output Format

When presenting PAL/clink results alongside Claude's own review, use attribution tags:

| Tag | Meaning |
|-----|---------|
| `[codex]` | Found by Codex CLI (o3) |
| `[claude]` | Found by Claude's own review |
| `[both]` | Same issue caught by both models (high-signal) |

## Integration Points

This skill is composed by other workflows:

| Workflow | Use | Blocking? |
|----------|-----|-----------|
| `/specify` (step 8) | Artifact review in parallel with Claude agents | Yes (critical findings block) |
| `phase-review` (step 2) | Code review in parallel with feature-dev:code-reviewer | Yes (critical findings block) |
| `/complete-feature` (step 2) | Final full-diff review | Advisory only |

## Prerequisites

- PAL MCP server configured in `~/.claude/.mcp.json`
- `codex` CLI installed and authenticated (`codex --version`)
- `claude` CLI installed (`claude --version`)
