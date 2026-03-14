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
- Words like "fix", "bug", "broken", "regression", "crash", "error" → suggest `bugfix`
- Otherwise → ask the user: "Is this TDD (production) or rapid (prototype)?"

Extract the feature description (everything except flags).

### 2. Search Memory First

Use `mcp__plugin_claude-mem_mcp-search__search` for relevant patterns and past decisions before anything else.

### 3. Create Specification Team

Spawn the Architect and Researcher agents as a named team:

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

### 7. Generate Diagrams

After writing artifacts, use the `feature-dev:code-architect` agent to assess complexity and generate appropriate diagrams.

**Dispatch an architect agent** with the spec content and ask it to:
1. Assess feature complexity (small / medium / large)
2. Decide which diagram types best communicate the architecture
3. Generate Mermaid syntax for each diagram

**Save diagrams** to `openspec/changes/$FEATURE_ID/diagrams/`:
- `architecture.mmd` — overall architecture (medium/large features)
- `flow.mmd` — control or data flow (if applicable)
- `before.mmd` + `after.mmd` — before/after comparison (large features / refactors)

**Render via draw.io:** Use `mcp__drawio__open_drawio_mermaid` to open each diagram.

**Update spec.md** to reference diagrams with a "## Diagrams" section.

### 8. Agent Reviews (before user sign-off)

Before presenting to the user, run context-dependent agent reviews on the artifacts and diagrams.

**Determine which reviews are needed** based on spec content:
- If spec involves UI components/pages/styling → invoke `frontend-design:frontend-design` skill for UI/UX review
- If spec involves backend architecture/APIs/data models → dispatch `feature-dev:code-architect` agent for architecture review
- If spec is full-stack → dispatch both in parallel
- **Always**: Codex artifact review via PAL MCP (see below)

**Dispatch all reviews in parallel** using the Agent tool and MCP tools simultaneously:
- Each reviewer receives all artifacts from `openspec/changes/$FEATURE_ID/`
- Each reviewer scores findings as: **critical**, **suggestion**, or **nitpick**

**Codex artifact review** (runs in parallel with Claude reviews above):

Use the PAL MCP `clink` tool to invoke Codex CLI as an independent artifact reviewer:

```
clink with codex codereviewer to review the feature specification artifacts at openspec/changes/$FEATURE_ID/ (spec.md, design.md, tasks.md). Evaluate for:
1. Logical gaps or contradictions between artifacts
2. Missing edge cases or error scenarios
3. Feasibility concerns with the proposed architecture
4. Task completeness — do tasks cover all spec requirements?
5. Unclear or ambiguous requirements that could derail implementation
Report findings as: critical (blocks implementation), suggestion (improves quality), or nitpick (minor).
```

**Feedback loop:**
1. Collect all review feedback (Claude agents + Codex)
2. If there are **critical** findings from any reviewer:
   a. Revise artifacts to address critical issues
   b. Re-run only the reviewers that raised critical issues
   c. Repeat until no critical findings remain (max 2 iterations)
3. Compile a **Review Summary** with attribution (`[codex]`, `[claude-arch]`, `[claude-ux]`) and append to spec.md

### 9. Review with User

**Use the `AskUserQuestion` tool** to present the artifacts (spec.md, design.md, tasks.md) and ask the user to approve, request changes, or adjust scope. Wait for their response before proceeding. Incorporate feedback by updating artifact files.

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
