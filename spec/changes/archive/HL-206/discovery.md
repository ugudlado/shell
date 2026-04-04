# Discovery Brief — Learned Rule Scoping

**Feature**: Add scoping to learned rules so rules learned in one repo don't leak to all repos.

---

## What I Understand

The workflow's learning system routes ALL learned rules to shared step contracts in `$SPEC_HOME/steps/`. These step contracts are used by every repo. A rule learned in the dotfiles repo ("never overwrite existing config files") would incorrectly constrain a React app. This is the #1 blocker for multi-repo workflow adoption.

---

## What Already Exists

### Rule Merge Contract (CONVENTIONS.md:680)
5 rule sources, precedence order:
1. Step entry injections (schema-level)
2. **Step contract rules** (`$SPEC_HOME/steps/*.yaml`) ← learned rules go HERE
3. Phase rules (schema-level)
4. Schema rules (named, top-level)
5. Project rules (`project.yaml`) ← repo-specific, hand-written

### Learned Rule Metadata (CONVENTIONS.md:1153)
Format: `<!-- learned: YYYY-MM-DD, source: FEATURE-ID, cycle: N, hits: M, misses: K -->`
No `repo:` field — rules are implicitly global.

### /learn Routing (learn/SKILL.md:120-145)
Routes rules to step contracts via workflow-fixer. No repo filtering.

### project.yaml (spec/project.yaml)
Per-repo config with named rules. But these are hand-written, not auto-learned.

---

## Build or Reuse?

**Build** — extend existing metadata format + merge algorithm. Minimal change.

---

## Key Decisions

### D1: Add `repo:` field to learned rule metadata (S complexity)

Extend: `<!-- learned: ..., repo: shell -->` 

When `/learn` writes a rule, it includes `repo: $REPO_NAME`. The merge algorithm in CONVENTIONS.md filters: only apply learned rules where `repo:` matches current repo OR `repo: *` (universal).

### D2: Existing rules default to `repo: *` (universal)

Backward compatible — rules without `repo:` are treated as universal. This is correct for existing rules since the system currently only has one active repo.

### D3: Universal vs repo-scoped classification

The `/learn` skill decides scope based on the rule's nature:
- **Universal** (`repo: *`): Workflow mechanics — "always verify before claiming completion", "write next_step before spawn"
- **Repo-scoped** (`repo: <name>`): Tech-stack or domain rules — "never overwrite config files", "run type-check before commit"

Default to repo-scoped unless the evaluator explicitly classifies as universal.

---

## Scope

### In-Scope
- Add `repo:` field to CONVENTIONS.md § Rule Lifecycle Convention metadata format
- Update CONVENTIONS.md § Rule Merge Contract to filter learned rules by repo
- Update /learn skill to include `repo:` when writing rules
- Backward compatibility: rules without `repo:` treated as universal

### Out-of-Scope
- Moving rules to per-repo locations (too disruptive — scoping via metadata is simpler)
- Migrating existing rules (only 2 exist, both from this repo)
- Changes to project.yaml rules format
