# Spec Workflow System

Agent-agnostic workflow orchestration for spec-first development.

## Layout

Shared infrastructure (schemas, steps, templates) lives at a configurable home
directory. Per-project config lives in the repo.

```
$SPEC_HOME (~/.config/spec/)        # Shared — same across all repos
  schemas/
    feature.yaml                     # Schema: phases, outputs, steps, rules, flags
    bugfix.yaml
  steps/                             # Shared step contracts (referenced by ID)
    load-project-context.yaml
    explore-or-diagnose.yaml
    create-or-refresh-artifacts.yaml
    generate-or-refresh-tasks.yaml
    execute-next-task.yaml
    run-phase-review.yaml
    create-linear-ticket.yaml
    phase-signoff.yaml
    run-feature-verification.yaml
    final-signoff.yaml
    archive-completed-change.yaml
  templates/
    project.yaml                     # Template for /bootstrap to init new repos
    feature/                         # Feature artifact templates
    bugfix/                          # Bugfix artifact templates
  changes/$REPO_NAME/               # Active changes (runtime state)

$REPO_ROOT/spec/                    # Per-project — lives in repo
  project.yaml                       # This project's config, quality bar, rules
  changes/archive/                   # Completed change artifacts
```

### Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SPEC_HOME` | `~/.config/spec` | Shared infrastructure root |
| `SPEC_CHANGES_DIR` | `$SPEC_HOME/changes/$REPO_NAME` | Active change state |
| `REPO_ROOT` | `git rev-parse --show-toplevel` | Project root |

In this dotfiles repo, `src/spec/` is the source for shared infra and gets
symlinked to `~/.config/spec/` by `configure_claude_code()`.

## How It Works

### Rule Cascade

Rules flow from broad to specific. An agent collects rules from all levels:

```
project.yaml rules           (always — per project)
       ↓
schema rules                 (per schema — feature vs bugfix)
       ↓
schema phases[].rules        (per phase — specify, implement, complete)
       ↓
steps/*.yaml rules           (per step)
       ↓
step inline rules            (rules_when / extra_rules on step entries)
```

The agent enforces the union of all collected rules. If a step rule has the same
ID as a project rule, the step rule wins (override).

### Execution Loop

Any agent (Claude Code, Cursor, Codex, etc.) follows this loop:

1. **Read** schema from `$SPEC_HOME/schemas/<schema>.yaml`.
2. **Read** project config from `$REPO_ROOT/spec/project.yaml`.
3. **Collect rules** from project + schema + current phase + current step.
4. **Parse step entry** — evaluate `if`/`if not` conditions against flags.
5. **Load step** contract from `$SPEC_HOME/steps/<step-id>.yaml`.
6. **Execute** the step's instruction field, following all merged rules.
7. **Update** state.yaml with step result (enables pause/resume).
8. **Advance** to next step. If step has `repeat_until:`, re-execute until condition met.
9. When all steps in phase done → advance to next phase.
10. **Repeat** until all phases are done.

### State Management (pause/resume)

`$SPEC_CHANGES_DIR/$CHANGE_ID/state.yaml` tracks:

- Current phase and step
- Feature flags (tdd_required, fill_forward, etc.)
- Step history (audit trail)
- Quality scores
- Next step instruction (for resume)

An agent can pause at any step. On resume, it reads state.yaml and picks up
from the recorded next_step.

### Adding a New Schema

1. Read `$SPEC_HOME/grammar.yaml` for the schema grammar.
2. Create `$SPEC_HOME/schemas/<name>.yaml` conforming to the grammar.
3. Add artifact templates to `$SPEC_HOME/templates/<name>/`.
4. Reuse existing steps — use inline conditions and rules_when for schema-specific behavior.

### Adding a New Step

1. Read `$SPEC_HOME/grammar.yaml` for the step contract grammar.
2. Create `$SPEC_HOME/steps/<step-id>.yaml` with: id, intent, inputs, rules,
   instruction, verify, outputs.
3. Reference the step ID in a schema's phases[].steps array.

## Grammar

`$SPEC_HOME/grammar.yaml` defines the formal syntax for every YAML file in this
system — schemas, steps, project configs, state files, verify blocks, rules, flags.

Any agent can read the grammar to:
- **Parse** existing schemas and steps
- **Validate** that a schema conforms to the grammar
- **Create** new schemas or steps that are structurally correct
- **Propose improvements** to the grammar itself

### Workflow Evolution

The grammar defines valid syntax. The **workflow** (schemas, steps, rules) evolves
after every feature cycle. The `/learn` skill drives this:

1. After each completed feature, `/learn` evaluates what worked and what didn't
2. It proposes changes: add/update steps, adjust rules, tighten verify blocks
3. Changes are committed and take effect on the next feature

What evolves:
- **Schemas**: add steps, reorder phases, add rules, adjust verify thresholds
- **Steps**: improve instructions, add verify checks, refine rules
- **Project config**: add project-wide rules, adjust quality_bar, change signoff
- **Templates**: improve artifact structure based on what produced better specs

What rarely changes:
- **Grammar**: only when a fundamentally new construct is needed

## Bootstrapping a New Project

Run `/bootstrap` in any repo to generate `spec/project.yaml` from the template
at `$SPEC_HOME/templates/project.yaml`. Bootstrap auto-detects project name,
tech stack, and conventions, then writes a filled-in config.

After generation, `project.yaml` evolves with the project — add rules,
adjust quality_bar, change signoff_policy as the team matures.

## Canonical Schemas

| Schema | Entry Phase | Use For |
|--------|-------------|---------|
| `feature` | specify | Features, prototypes, tooling. Flags: --no-tdd, --ff |
| `bugfix` | diagnose | Bug fixes, regressions, incidents |
