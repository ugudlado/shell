---
description: Create feature specification with optional Linear ticket and worktree
model: opus
---

## Feature Description

$ARGUMENTS

## Plugins & Tools Composed

| Step | Plugin/Skill | Purpose |
|------|-------------|---------|
| Brainstorm | `opsx:explore` | Explore intent, requirements, approaches |
| UI Feedback | `frontend-design:frontend-design` | Visual mockup/feedback for UI features |
| Artifacts | OpenSpec CLI + `/opsx:propose` | Generate spec, design, tasks from schema |
| Context | `claude-mem` plugin | Recall past decisions and patterns |
| Context | `Explore` agent | Understand relevant codebase areas |
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

### 3. Brainstorm (invoke skill)

**Invoke the `opsx:explore` skill.** This will:
- Explore project context (files, docs, recent commits)
- Ask clarifying questions one at a time
- Propose 2-3 approaches with trade-offs and recommendation
- Present design sections for approval

**Important**: Let exploration run to completion. Do NOT skip to artifact generation. Its output feeds directly into the OpenSpec artifacts.

**If the feature has UI components**: During the design presentation step, invoke `frontend-design:frontend-design` to generate a visual mockup or prototype. Present this alongside the design for user feedback before finalizing.

**Note on design doc**: The brainstorming skill will try to write a design doc to `docs/plans/`. Instead, capture all brainstorming output — it will be used as context when generating OpenSpec artifacts in step 6.

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

### 6. Generate OpenSpec Artifacts

Use the OpenSpec CLI to scaffold the change and generate all planning artifacts.

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

**Generate artifacts in dependency order** based on schema:
- `feature-tdd` / `feature-rapid`: spec → design → tasks
- `bugfix`: diagnosis → fix-plan → tasks

For each artifact in the pipeline:
1. Get instructions: `openspec instructions <artifact-id> --change "$FEATURE_ID" --json`
2. Read the template, context, and rules from the instructions output
3. Create the artifact file using brainstorming output as source material
4. Apply context and rules as constraints (do NOT copy them into the file)
5. Check status: `openspec status --change "$FEATURE_ID" --json`
6. Continue until all `applyRequires` artifacts are DONE

**Important**: Use brainstorming output (approaches, requirements, architecture decisions, alternatives) to fill in the artifact templates. The OpenSpec schema defines structure; brainstorming provides content.

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

Present the artifacts for user review before committing:
- Show spec.md — motivation, requirements, architecture, alternatives
- Show design.md — technical design
- Show tasks.md — task breakdown with dependencies
- Ask user to approve, request changes, or adjust scope

**Wait for user approval before proceeding.** Incorporate feedback by updating artifact files.

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
