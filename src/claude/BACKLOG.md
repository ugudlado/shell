# Autonomous Developer Workflow — Backlog

Workflow infrastructure for the /develop, /specify, /implement commands.

## Built

### Commands (3)
| Command | Purpose | Status |
|---------|---------|--------|
| `/develop` | Orchestrates specify → implement → complete | Shipped, 35+ friction fixes |
| `/specify` | Architect+Researcher → OpenSpec artifacts | Shipped, schema-aware |
| `/implement` | Implementer→Reviewer→Verifier → phase gates | Shipped, TDD + bugfix support |

### Agents (8)
| Agent | Model | Purpose | Status |
|-------|-------|---------|--------|
| autonomous-developer | Opus | /develop orchestrator | Shipped |
| architect | Opus | Spec design + signoff | Shipped |
| ideator | Sonnet | Feature backlog generation | Shipped |
| code-reviewer | Opus | 7-dimension code review | Shipped |
| workflow-evaluator | Opus | Workflow compliance + quality gap analysis | Shipped |
| workflow-fixer | Sonnet | Fix workflow commands only | Shipped |
| workflow-coder | Sonnet | Fix hook code + tests | Shipped |
| implementer | Sonnet | Per-task code execution | Shipped |

### Hooks (4 new)
| Hook | Event | Purpose | Status |
|------|-------|---------|--------|
| phase-gate.sh | SubagentStop | Enforce phase review ≥ 9/10 | Shipped, 70 tests |
| iteration-gate.sh | Stop | Iterate termination criteria | Shipped, 70 tests |
| auto-continue.sh | Stop | Persist workflow state | Shipped, 70 tests |
| workflow-state.sh | SessionStart | Detect active workflows | Shipped, 70 tests |

### Skills (1)
| Skill | Purpose | Status |
|-------|---------|--------|
| iterate | Quality evaluation framework (5 dimensions) | Shipped |

### Validation
| Metric | Value |
|--------|-------|
| Hook tests | 70 BATS (55 unit + 15 scenario) |
| Completion criteria | 10-point checklist |
| Code rules | 11 rules in CLAUDE.md |
| Products validated against | 2 (AlgoViz: 17 features, DesignViz: 8 features) |
| Total features built | 25 |
| Total tests across products | 541 |
| Consecutive passes achieved | 5/5 on complex features |

## Known Issues

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | `/implement` still references phantom `pr-review-toolkit:*` agents in step 9 table header | Low | implement.md |
| 2 | `/specify` step 8 Codex review via PAL MCP assumes `clink` tool exists | Low | specify.md |
| 3 | OpenSpec CLI commands referenced but CLI may not be installed | Medium | specify.md, implement.md |
| 4 | Workflow state hooks use `~/.claude/workflows/` which may not be writable in sandbox | Low | auto-continue.sh (has fallback) |
| 5 | Phase-gate.sh still interpolates `$SCORE` into python3 `float()` call (regex-safe but not sys.argv) | Low | phase-gate.sh |

## Future Ideas (5)

### 1. /develop --dry-run Mode
- **What**: Preview what /develop would do without executing — show detected schema, expected artifacts, task structure, phase gates
- **Schema**: feature-tdd
- **Why**: Lets users validate workflow understanding before committing to a full run. Catches schema misdetection early.
- **Complexity**: medium

### 2. Workflow Metrics Dashboard
- **What**: `/workflow-metrics` command that reads all workflow state files and produces a summary — features built, avg reviewer scores, common friction patterns, time per phase
- **Schema**: feature-rapid
- **Why**: Self-improving workflow needs data. Metrics identify which phases are slow, which schemas have more friction, and where rules are most violated.
- **Complexity**: medium

### 3. Auto-Backfill Quality Rules
- **What**: When the evaluator discovers a new rule (e.g., "timer cleanup accuracy"), automatically append it to the project's CLAUDE.md without manual intervention
- **Schema**: feature-tdd
- **Why**: Currently rules are captured manually after evaluator suggests them. Automating this closes the feedback loop faster.
- **Complexity**: large (needs safe file mutation + dedup)

### 4. Cross-Product Reviewer Agent
- **What**: A reviewer that compares code patterns across products (AlgoViz + DesignViz) and flags inconsistencies — different IIFE patterns, different test structures, different CSS conventions
- **Schema**: feature-rapid
- **Why**: As more products are built through the workflow, maintaining consistency across them requires a cross-product lens the current per-feature reviewer doesn't have.
- **Complexity**: medium

### 5. Regression Test Quality Gate Hook
- **What**: A new hook (SubagentStop) that verifies bugfix regression tests actually exercise the fixed code path — checks that the test file imports/calls functions from the fixed file, not just simulates the fix
- **Schema**: feature-tdd
- **Why**: The Pub/Sub bugfix failure (tests simulated the fix instead of calling fixed code) was caught by the evaluator but should be caught by the harness automatically. A hook that parses the test file and verifies it imports from the right module would prevent this class of error.
- **Complexity**: large (needs AST-level analysis or heuristic grep)
