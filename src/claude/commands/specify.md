---
description: Create feature specification with optional Linear ticket and worktree
---

## Feature Description

$ARGUMENTS

## Plugins & Tools Composed

| Step | Plugin/Skill | Purpose |
|------|-------------|---------|
| Team | `architect` + `researcher` agents | Architect drives design, Researcher explores codebase |
| Brainstorm | `opsx:explore` | Explore intent, requirements, approaches |
| UI Feedback | `frontend-design:frontend-design` | Visual mockup/feedback for UI features |
| Artifacts | OpenSpec CLI + `/opsx:propose` | Generate spec, design, tasks from schema |
| Context | `claude-mem` plugin | Recall past decisions and patterns |
| Context | `context7` plugin | Fetch current library documentation |
| Ticket | `linear` plugin | Create and manage Linear ticket (optional) |
| Memory | `claude-mem` plugin | Store decisions for /implement |
| Review | PAL MCP (`clink`) | Cross-model artifact review via Codex CLI |

## Process

### 1. Parse Arguments

Check for flags in the arguments:
- `--no-linear`: skip Linear ticket creation, use date-prefixed slug as identifier
- `--tdd`: use `feature-tdd` schema (tests before impl, coverage >= 90%)
- `--rapid`: use `feature-rapid` schema (no test requirements)
- `--bugfix`: use `bugfix` schema (diagnosis → regression test → fix)

If no schema flag is provided, auto-detect from the description:
- Words like "fix", "bug", "broken", "regression", "crash", "error" → `bugfix`
- Words like "prototype", "spike", "experiment", "quick", "poc", "tooling", "dashboard", "cli", "tool", "utility", "show", "list", "display", "monitor", "status", "visualization" → `feature-rapid`
- Otherwise → `feature-tdd` (default to production quality)

Mark auto-detected schema with `[ASSUMPTION: using <schema> — override with --tdd/--rapid/--bugfix if wrong]`.

Extract the feature description (everything except flags).

### 2. Search Memory First

Use `mcp__plugin_claude-mem_mcp-search__search` for relevant patterns and past decisions before anything else.

### 3. Create Specification Team

**Complexity gate** — skip the Architect+Researcher team when ALL of these are true:
- Description mentions only 1-2 distinct capabilities (not 3+)
- No external APIs, databases, or third-party services mentioned
- No multi-component architecture (single file/module scope)
- Schema is `feature-rapid` or `bugfix`

If any condition is false, or schema is `feature-tdd`, use the team.

For features that warrant the team, spawn the Architect and Researcher agents as a named team:

1. **Spawn Architect** using the Agent tool with `name: "architect"`, `model: "opus"`, `subagent_type: "architect"`. Provide:
   - The feature description from step 1
   - Schema type (tdd/rapid/bugfix) from step 1
   - Memory search results from step 2
   - Instructions to collaborate with the Researcher via `SendMessage({to: "researcher"})`

2. **Spawn Researcher** using the Agent tool with `name: "researcher"`, `model: "sonnet"`, `subagent_type: "researcher"`. Provide:
   - The feature description for context
   - Instructions to wait for research requests from the Architect via SendMessage

The Architect drives the workflow:
- Explores intent and requirements (may invoke `opsx:explore` skill)
- Delegates codebase investigation to Researcher via SendMessage
- Synthesizes findings into OpenSpec artifacts (spec.md, design.md, tasks.md)
- If UI components detected: invokes `frontend-design:frontend-design` for mockups, uses `AskUserQuestion` to get feedback

**Important**: Let the team work to completion. The Architect owns the artifacts; the Researcher provides data. Do NOT interrupt their collaboration unless they escalate via [NEEDS CLARIFICATION].

### 4. Generate Identifier

Derive a short slug from the feature description (lowercase, hyphens, max 50 chars).

- **Without `--no-linear`**: Use a temporary date-prefixed slug for now. The Linear ticket will be created after specs are written (step 12), and the worktree/branch will be renamed to include the Linear ID.
- **With `--no-linear`**: `[YYYY-MM-DD]-[slug]` (e.g., `2026-03-02-add-auth-flow`) — this is the final identifier.

This identifier is used for:
- Worktree path: `~/code/feature_worktrees/[ID]`
- Branch name: `feature/[ID]`

### 5. Create Worktree

**Prerequisites**: Verify git worktree support (`git worktree list` succeeds). Create `~/code/feature_worktrees/` if it doesn't exist (`mkdir -p`). If already in a feature worktree, use the main repo (first entry from `git worktree list`) for branching.

**Skip worktree**: For in-repo subprojects (tools, scripts, plugins that live inside the current repo), skip worktree creation. Work directly in the repo subdirectory and use the current branch. Set `.openspec.yaml` worktree to the subdirectory path and branch to the current branch.

```bash
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
FEATURE_ID="[generated-identifier]"
WORKTREE_PATH="$HOME/code/feature_worktrees/$FEATURE_ID"

mkdir -p "$HOME/code/feature_worktrees"
cd "$MAIN_REPO"
git worktree add "$WORKTREE_PATH" -b "feature/$FEATURE_ID"

# Symlink all gitignored env files
find "$MAIN_REPO" -maxdepth 4 -name '.env*' -not -path '*/node_modules/*' -not -path '*/.git/*' | while read env_file; do
  rel_path="${env_file#$MAIN_REPO/}"
  mkdir -p "$WORKTREE_PATH/$(dirname "$rel_path")"
  ln -sf "$env_file" "$WORKTREE_PATH/$rel_path"
done

# Install dependencies
cd "$WORKTREE_PATH"
# Refer to project's CLAUDE.md for the correct package manager and setup commands
```

### 6. Generate OpenSpec Artifacts (via Architect Team)

Scaffold the change directory, then let the Architect team generate artifacts:

```bash
cd "$WORKTREE_PATH"
openspec new change "$FEATURE_ID"
```

This creates `openspec/changes/$FEATURE_ID/` with `.openspec.yaml`.

**Write per-change metadata** to `openspec/changes/$FEATURE_ID/.openspec.yaml`:
```yaml
schema: feature-tdd  # or feature-rapid, bugfix
feature-id: <FEATURE_ID>
linear-ticket: HL-XXX  # or "none"
worktree: ~/code/feature_worktrees/<FEATURE_ID>
branch: feature/<FEATURE_ID>
```

**The Architect agent generates artifacts in dependency order** based on schema:
- `feature-tdd` / `feature-rapid`: spec → design → tasks
- `bugfix`: diagnosis → fix-plan → tasks

For each artifact, the Architect:
1. Gets instructions: `openspec instructions <artifact-id> --change "$FEATURE_ID" --json`
2. Reads the template, context, and rules from the instructions output
3. Delegates research to Researcher via SendMessage as needed
4. Creates the artifact file using research findings + brainstorming output
5. Checks status: `openspec status --change "$FEATURE_ID" --json`
6. Continues until all `applyRequires` artifacts are DONE

**Important**: The Architect owns artifact creation. The Researcher provides codebase facts and feasibility validation on demand.

**TDD-specific requirement**: For `feature-tdd` schema, the Architect MUST fill out the spec's Test Strategy section with:
- Concrete test file paths (e.g., `src/__tests__/auth.test.ts`)
- Per-module coverage targets (e.g., "auth module: ≥ 95%")
- Key test scenarios (e.g., "valid login, expired token, rate limit exceeded")
- Coverage tool to use (e.g., vitest with c8, jest with istanbul)

The Implementer depends on this during TDD. If test strategy is missing or generic (e.g., "write tests for all components"), the spec review (step 8) MUST flag it as a critical finding.

### 7. Generate Diagrams

**Skip criteria**: Skip diagram generation entirely for `feature-rapid` with ≤ 4 **implementation tasks** (exclude verification-only gate tasks from count), `bugfix` with a single-file fix, or any feature where the design.md component breakdown is self-explanatory. Diagrams add value for medium/large features with multiple interacting components.

For features that warrant diagrams, use the `architect` agent to assess complexity and generate appropriate diagrams.

**Dispatch an architect agent** with the spec content and ask it to:
1. Assess feature complexity (small / medium / large)
2. Decide which diagram types best communicate the architecture
3. Generate Mermaid syntax for each diagram

**Save diagrams** to `openspec/changes/$FEATURE_ID/diagrams/`:
- `architecture.mmd` — overall architecture (medium/large features)
- `flow.mmd` — control or data flow (if applicable)
- `before.mmd` + `after.mmd` — before/after comparison (large features / refactors)

**Render via draw.io:** Use `mcp__drawio__open_drawio_mermaid` to open each diagram.

**Update the main artifact** to reference diagrams with a "## Diagrams" section (spec.md for features, diagnosis.md for bugfix).

### 8. Agent Reviews (before user sign-off)

Before presenting to the user, run context-dependent agent reviews on the artifacts and diagrams. The goal is to present a **thoroughly vetted** spec so user approval is fast and confident.

**Review scale by complexity**:
- `feature-rapid` with ≤ 4 **implementation tasks** (exclude gate tasks): Codex artifact review only (skip architecture and UX — overhead not justified)
- `feature-tdd` or features with ≥ 4 tasks: Full review suite
- `bugfix` where team was skipped (step 3): Codex review only
- `bugfix` where team was used: Codex review + architecture review (skip UX)

**Determine which reviews are needed** based on spec content:
- If spec involves UI components/pages/styling → invoke `frontend-design:frontend-design` skill for UI/UX review
- If spec involves backend architecture/APIs/data models → dispatch `architect` agent for architecture review
- If spec is full-stack → dispatch both in parallel
- **Always**: Codex artifact review via PAL MCP (see below)

**Dispatch all reviews in parallel** using the Agent tool and MCP tools simultaneously:
- Each reviewer receives all artifacts from `openspec/changes/$FEATURE_ID/`
- Each reviewer scores findings as: **critical**, **suggestion**, or **nitpick**
- Each reviewer also provides a **confidence score** (1-10) for the spec quality

**Codex artifact review** (runs in parallel with Claude reviews above):

Use the PAL MCP `clink` tool to invoke Codex CLI as an independent artifact reviewer:

```
clink with codex codereviewer to review the specification artifacts at openspec/changes/$FEATURE_ID/ (schema-appropriate: spec.md+design.md+tasks.md or diagnosis.md+fix-plan.md+tasks.md). Evaluate for:
1. Logical gaps or contradictions between artifacts
2. Missing edge cases or error scenarios
3. Feasibility concerns with the proposed architecture
4. Task completeness — do tasks cover all spec requirements?
5. Unclear or ambiguous requirements that could derail implementation
Score overall spec quality (1-10). Report findings as: critical (blocks implementation), suggestion (improves quality), or nitpick (minor).
```

**Feedback loop (autonomous — fix before showing to user):**
1. Collect all review feedback (Claude agents + Codex)
2. If there are **critical** findings from any reviewer:
   a. Revise artifacts to address critical issues autonomously
   b. Re-run only the reviewers that raised critical issues
   c. Repeat until no critical findings remain (max 2 iterations)
   d. If critical findings persist after 2 rounds → include them in user presentation with context
3. Compile a **Review Summary** with:
   - Attribution per finding: `[codex]`, `[claude-arch]`, `[claude-ux]`
   - Aggregate confidence score (average of all reviewer scores)
   - List of critical issues fixed during review loop (so user sees what was caught and resolved)
   - Any remaining suggestions/nitpicks for user awareness
4. Append Review Summary to spec.md

### 9. Review with User

**Use the `AskUserQuestion` tool** to present the artifacts for user approval. This is an essential quality gate — the spec defines the feature.

Present:
- **Artifacts**: spec.md, design.md, tasks.md (or diagnosis.md, fix-plan.md, tasks.md for bugfix)
- **Review confidence**: Aggregate score from step 8 (e.g., "Review confidence: 8.5/10")
- **Schema**: Which OpenSpec schema and why (especially if auto-detected)
- **Task summary**: N tasks across M phases, with OpenSpec phase structure
- **Critical issues fixed**: What the review loop caught and resolved
- **Remaining suggestions**: Non-critical items for user awareness
- **Assumptions made**: Any `[ASSUMPTION]` markers from auto-detection

Ask: "Approve to proceed to implementation, request changes, or adjust scope."

Wait for response. Incorporate feedback by updating artifact files. If user requests changes, update artifacts and re-run affected reviews before re-presenting.

### 10. Store Decisions in Memory

Use `mcp__plugin_claude-mem_mcp-search__save_observation` to save key decisions:
- Project: `[FEATURE_ID]`
- Key decisions and architecture rationale
- Trade-offs considered
- Library patterns to use
- Why rejected approaches were not chosen

### 11. Commit Specs

Commit the approved artifacts to the feature branch:

```bash
cd "$WORKTREE_PATH"
git add openspec/
git commit -m "feat: add spec and tasks for $FEATURE_ID

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### 12. Create Linear Ticket (unless --no-linear)

If `--no-linear` was NOT specified:

Use `mcp__plugin_linear_linear__save_issue`:
- Title: concise feature title
- Description: spec overview, requirements summary, and worktree path
- Team and project: from project's CLAUDE.md (Linear Integration section)

Extract the Linear ID (e.g., HL-80). Update spec.md title and `.openspec.yaml` to include the Linear ID.

### 13. Report

Output:
- Linear ticket ID and URL (if created)
- Feature ID: `[FEATURE_ID]`
- Worktree path: `~/code/feature_worktrees/[FEATURE_ID]`
- Change: `openspec/changes/[FEATURE_ID]/`
- Artifacts: spec.md, design.md, tasks.md
- Branch: `feature/[FEATURE_ID]`
- Ready for `/implement [FEATURE_ID]`
