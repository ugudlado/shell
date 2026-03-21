---
description: Create feature specification with optional Linear ticket and worktree
---

## Feature Description

$ARGUMENTS

## Plugins & Tools Composed

| Step | Plugin/Skill | Purpose |
|------|-------------|---------|
| Discovery | Main session (Grep/Glob/Read) | Autonomous use case enumeration, scope definition |
| Discovery | `playground` plugin | Interactive UI mockup for visual direction (UI features) |
| Team | `architect` + `researcher` agents | Architect drives design, Researcher explores codebase |
| UI Feedback | `frontend-design:frontend-design` | Visual mockup/feedback for UI features |
| Artifacts | OpenSpec CLI + `/opsx:propose` | Generate spec + design from schema (tasks deferred to `/implement`) |
| Context | `claude-mem` plugin | Recall past decisions and patterns |
| Context | `context7` plugin | Fetch current library documentation |
| Ticket | `linear` plugin | Create Linear ticket early (step 3), update after specs (step 14b) |
| Memory | Auto memory (file-based) | Store decisions for /implement |
| Review | PAL MCP (`clink`) | Cross-model artifact review via Codex CLI |

## Staff Engineer Bar

Every agent in this pipeline operates as a **staff-level engineer**. Specifications are not rough drafts — they are the contract that implementation builds against:

- **Architect**: Challenges assumptions, surfaces gaps proactively, considers long-term system health — not just whether the feature can be built, but whether it should be built this way
- **Researcher**: Thorough, precise, evidence-based — every finding includes file paths, line numbers, and concrete data

The quality bar starts here. Gaps in the spec become bugs in the implementation.

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

### 3. Create Linear Ticket (unless --no-linear)

If `--no-linear` was NOT specified:

Use `mcp__plugin_linear_linear__save_issue`:
- Title: concise feature title derived from the description
- Description: feature description (will be updated with spec links after artifacts are written)
- Team and project: from project's CLAUDE.md (Linear Integration section)

Extract the Linear ID (e.g., `HL-80`). This ID will be used in the feature identifier, worktree path, and branch name.

If `--no-linear` was specified, skip this step.

### 4. Phase 0: Discovery

**Goal**: Produce a Discovery Brief that gates entry to design. This phase runs in the main session — no agents are spawned yet.

**Skip condition**: If the schema is `bugfix`, skip steps 4-5 entirely. Bugfixes use `diagnosis.md` for investigation, not discovery.

#### 4a. Autonomous Enumeration

The main session (not a subagent) performs autonomous discovery by analyzing:

1. **The feature description** from step 1
2. **Memory search results** from step 2 (prior decisions, feedback memories)
3. **Codebase exploration** using Grep, Glob, Read to understand:
   - Existing patterns relevant to this feature
   - Similar features already implemented (prior art)
   - Integration points and constraints
   - Files and modules likely affected

From this analysis, autonomously produce:

- **Personas/actors** who interact with this feature
- **Use cases**: minimum 3 (at least 2 happy path, at least 1 error/edge)
  - Format: `UC-N: [title] — [actor] wants to [action] so that [outcome]`
  - For error cases: `UC-EN: [title] — what happens when [condition]`
- **Scope definition**: explicit in-scope and out-of-scope lists
- **Key decisions**: architectural choices already apparent from codebase state

The enumeration should be thorough but fast — spend effort on coverage, not polish. The user will validate and correct, not the system.

#### 4b. UI Detection & Playground

**Detect UI features** by checking if the feature description contains any of these signals (case-insensitive):
- Direct: UI, frontend, page, component, dashboard, form, widget, modal, sidebar, panel, layout, navigation, menu, button, input, table, chart, graph
- Indirect: "user sees", "display", "show", "render", "visual", "screen", "view", "interface"

**If UI is detected:**

1. Inform the user: "This feature involves UI. Creating an interactive playground for visual direction before we proceed with spec/design."
2. Invoke the `/playground` skill to create an interactive HTML prototype that demonstrates the proposed UI concept — include the use cases from step 4a as context for what the playground should demonstrate
3. Use `AskUserQuestion` to present the playground and ask:
   "Review the playground above. Does this visual direction work? Adjust as needed — we'll lock this before starting the spec."
4. Iterate on playground feedback (max 3 rounds)
5. Once approved, capture the visual direction description for the Discovery Brief's "UI Direction" section

**If UI is NOT detected:** Set "UI Direction" to "N/A — no UI components".

#### 4c. Present Discovery Findings

Use `AskUserQuestion` to present the complete discovery findings to the user in a structured format:

```
## Discovery Brief — [feature title]

### Personas
- [persona 1]
- [persona 2]

### Use Cases
- UC-1: [title] — [description]
- UC-2: [title] — [description]
- UC-E1: [title] — [description]

### Scope
**In scope:** [list]
**Out of scope:** [list]

### UI Direction
[playground summary or N/A]

### Key Decisions
- [decision 1 + rationale]

### Open Questions
- [any unresolved items]

Does this capture the feature correctly? Add, remove, or adjust anything before we proceed to specification.
```

**Wait for user response.** Incorporate feedback by adjusting the discovery findings. Re-present if the user requests significant changes (max 2 rounds).

### 5. Discovery Gate

The Discovery Brief is approved when the user confirms it in step 4c.

**Acceptance criteria — all must be met:**
- [ ] At least 3 use cases enumerated (2+ happy path, 1+ error/edge)
- [ ] In-scope and out-of-scope explicitly defined
- [ ] UI direction locked (playground approved) OR marked N/A for non-UI features
- [ ] User has confirmed the brief via AskUserQuestion

If any criterion is not met, do not proceed. Address the gap and re-present.

**The Discovery Brief is held in conversation memory.** It will be written as `discovery.md` in step 9 (Generate OpenSpec Artifacts) after the worktree and change directory exist.

### 6. Create Specification Agents (Orchestrated Sequential)

The main session orchestrates two agents sequentially — spawning each, collecting results, and feeding them to the next step. There is no peer-to-peer communication between agents.

1. **Spawn Researcher** using the Agent tool with `name: "researcher"`, `model: "sonnet"`, `subagent_type: "researcher"`. Provide:
   - The feature description for context
   - Instructions to explore the codebase: relevant files, patterns, existing implementations, library usage
   - Return structured findings (file paths, code patterns, constraints discovered)

2. **Spawn Architect** using the Agent tool with `name: "architect"`, `model: "opus"`, `subagent_type: "architect"`. Provide:
   - The feature description from step 1
   - Schema type (tdd/rapid/bugfix) from step 1
   - Memory search results from step 2
   - **Researcher findings from step 6.1** (codebase exploration results)
   - **Approved Discovery Brief from step 5** (use cases, scope, UI direction, decisions)
   - Instructions to synthesize findings into OpenSpec artifacts, with spec.md acceptance criteria tracing back to Discovery Brief use cases via `[traces: UC-N]`

The Architect:
- Uses the Discovery Brief as the primary source of truth for requirements
- Challenges assumptions — proposes alternative approaches before settling on a design
- Uses Researcher findings to ground decisions in actual codebase state
- Synthesizes into OpenSpec artifacts (spec.md, design.md) — **no tasks.md** (tasks are generated by `/implement`)
- Maps every Discovery Brief use case to at least one acceptance criterion in spec.md

**If the Architect needs additional codebase research**: The main session spawns another Researcher agent with the specific question and feeds results back to a continued Architect session via `SendMessage({to: "architect"})`.

### 7. Generate Identifier

Derive a short slug from the feature description (lowercase, hyphens, max 50 chars).

- **With Linear ticket** (from step 3): `[LINEAR-ID]-[slug]` (e.g., `HL-80-add-auth-flow`) — final identifier.
- **With `--no-linear`**: `[YYYY-MM-DD]-[slug]` (e.g., `2026-03-02-add-auth-flow`) — final identifier.

This identifier is used for:
- Worktree path: `~/code/feature_worktrees/[ID]`
- Branch name: `feature/[ID]`

### 8. Create Worktree

Use the `EnterWorktree` tool with the feature ID as the name:

```
EnterWorktree({ name: "$FEATURE_ID" })
```

The `WorktreeCreate` hook (`worktree-create.sh`) automatically handles:
- Creating the worktree at `~/code/feature_worktrees/$FEATURE_ID` with branch `feature/$FEATURE_ID`
- Symlinking `.env*` files from the main repo
- Installing dependencies (pnpm/npm/yarn)

The session's working directory is now inside the worktree.

### 9. Generate OpenSpec Artifacts (via Architect Team)

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

**Write the Discovery Brief first** (feature schemas only, not bugfix):

Write `openspec/changes/$FEATURE_ID/discovery.md` using the approved Discovery Brief from step 5. This is the first artifact written. Then let the Architect generate remaining artifacts (spec.md, design.md) which have `discovery` as a dependency in the schema.

**The Architect agent generates artifacts in dependency order** based on schema:
- `feature-tdd` / `feature-rapid`: discovery → spec → design (tasks are deferred to `/implement`)
- `bugfix`: diagnosis → fix-plan (tasks are deferred to `/implement`)

For each artifact (after discovery.md is written), the Architect:
1. Gets instructions: `openspec instructions <artifact-id> --change "$FEATURE_ID" --json`
2. Reads the template, context, and rules from the instructions output
3. Delegates research to Researcher via SendMessage as needed
4. Creates the artifact file using research findings + Discovery Brief
5. Checks status: `openspec status --change "$FEATURE_ID" --json`
6. Continues until all `applyRequires` artifacts are DONE

**Traceability requirement**: The Architect MUST map every use case from discovery.md to at least one acceptance criterion in spec.md. Format: `[traces: UC-N]` appended to each acceptance criterion.

**Important**: The Architect owns artifact creation. The Researcher provides codebase facts and feasibility validation on demand.

### 10. Generate Diagrams

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

### 11. Multi-Dimensional Review (before user sign-off)

Before presenting to the user, run a comprehensive review suite covering UX, architecture, security, and cross-model perspectives. All reviews run in parallel where possible.

**Determine which reviews are needed** based on spec content:

| Condition | Review | Tool/Skill |
|-----------|--------|------------|
| UI components/pages/styling | UX Design Critique | `/critique` skill |
| UI components/pages/styling | Frontend Design Review | `frontend-design:frontend-design` skill |
| Backend architecture/APIs/data models | Architecture Review | `feature-dev:code-architect` agent |
| Any API endpoints or data handling | Security Review | PAL MCP `secaudit` |
| Full-stack | All of the above | Dispatch in parallel |
| **Always** | Codex Artifact Review | PAL MCP `clink` |

**Dispatch all applicable reviews in parallel** using the Agent tool and MCP tools simultaneously:
- Each reviewer receives all artifacts from `openspec/changes/$FEATURE_ID/`
- Each reviewer scores findings as: **critical**, **suggestion**, or **nitpick**

**UX Design Critique** (UI features only):
Invoke `/critique` skill on the spec and any mockups/diagrams. Evaluates visual hierarchy, information architecture, interaction patterns, and accessibility.

**Security Review** (API/data features):
Use PAL MCP `secaudit` tool on the spec and design artifacts. Evaluates for OWASP top 10 risks, auth/authz gaps, input validation, and data exposure.

**Codex artifact review** (always, runs in parallel with Claude reviews):

Use the PAL MCP `clink` tool to invoke Codex CLI as an independent artifact reviewer:

```
clink with codex codereviewer to review the feature specification artifacts at openspec/changes/$FEATURE_ID/ (spec.md, design.md, discovery.md). Evaluate for:
1. Logical gaps or contradictions between artifacts
2. Missing edge cases or error scenarios not covered by Discovery Brief use cases
3. Feasibility concerns with the proposed architecture
4. Use case traceability — do all acceptance criteria trace to a Discovery Brief use case?
5. Unclear or ambiguous requirements that could derail implementation
Report findings as: critical (blocks implementation), suggestion (improves quality), or nitpick (minor).
```

**Feedback loop (max 2 iterations):**
1. Collect all review feedback (Claude agents + Codex + critique + secaudit)
2. If there are **critical** findings from any reviewer:
   a. Dispatch parallel subagents to address critical issues from each reviewer simultaneously
   b. Re-run only the reviewers that raised critical issues
   c. Repeat until no critical findings remain
3. Compile a **Review Summary** with attribution (`[codex]`, `[claude-arch]`, `[claude-ux]`, `[critique]`, `[secaudit]`) and append to spec.md

### 12. Review with User

**Use the `AskUserQuestion` tool** to present the artifacts (discovery.md, spec.md, design.md) and ask the user to approve, request changes, or adjust scope. Wait for their response before proceeding. Incorporate feedback by updating artifact files.

### 13. Store Decisions in Memory

Save key decisions as auto memory files (type: `project`) in the project memory directory. Write one file per significant decision covering:
- Key decisions and architecture rationale
- Trade-offs considered
- Library patterns to use
- Why rejected approaches were not chosen

Name files descriptively: `project_[FEATURE_ID]_[topic].md`

### 14. Commit Specs

Commit the approved artifacts to the feature branch:

```bash
cd "$WORKTREE_PATH"
git add openspec/
git commit -m "feat: add spec and tasks for $FEATURE_ID

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### 14b. Update Linear Ticket (unless --no-linear)

If a Linear ticket was created in step 3, update it with the finalized spec:

Use `mcp__plugin_linear_linear__save_issue` to update:
- Description: spec overview, requirements summary, worktree path, and links to artifacts
- Team and project: from project's CLAUDE.md (Linear Integration section)

### 15. Report

Output:
- Linear ticket ID and URL (if created)
- Feature ID: `[FEATURE_ID]`
- Worktree path: `~/code/feature_worktrees/[FEATURE_ID]`
- Change: `openspec/changes/[FEATURE_ID]/`
- Artifacts: discovery.md, spec.md, design.md
- Branch: `feature/[FEATURE_ID]`
- Ready for `/implement [FEATURE_ID]`
