# Spec Workflow System

Agent-agnostic workflow orchestration for spec-first development.

## Architecture

```
spec/
  project.yaml              # THIS project's config (generated from template)
  schemas/
    feature.yaml             # Schema: phases, outputs, steps, rules, flags
    bugfix.yaml
  steps/                     # Shared step contracts (referenced by ID from schemas)
    resolve-change.yaml
    load-project-context.yaml
    explore-or-diagnose.yaml
    create-or-refresh-artifacts.yaml
    generate-or-refresh-tasks.yaml
    execute-next-task.yaml
    run-phase-review.yaml
    phase-signoff.yaml
    run-feature-verification.yaml
    final-signoff.yaml
    archive-completed-change.yaml
  templates/                 # All templates in one place
    project.yaml             # Template for /bootstrap to init spec/ in new repos
    feature/                 # Feature artifact templates
    bugfix/                  # Bugfix artifact templates
  changes/
    archive/                 # Completed change artifacts
```

## How It Works

### Rule Cascade

Rules flow from broad to specific. An agent collects rules from all levels:

```
project.yaml rules      (always active)
       ↓
workflow.yaml rules      (per schema — feature vs bugfix)
       ↓
workflow.yaml phases[].rules  (per phase — specify, implement, complete)
       ↓
steps/*.yaml rules       (per step)
       ↓
workflow.yaml step_overrides  (flag-conditional rules per step)
```

The agent enforces the union of all collected rules. If a step rule has the same
ID as a project rule, the step rule wins (override).

### Execution Loop

Any agent (Claude Code, Cursor, Codex, etc.) follows this loop:

1. **Read** workflow.yaml to get the phase list and step IDs for current phase.
2. **Collect rules** from project.yaml + workflow.yaml + current phase + current step.
3. **Load step** contract from steps/<step-id>.yaml.
4. **Execute** the step's instruction field.
5. **Update** state.yaml with step result (enables pause/resume).
6. **Advance** to next step, or next phase when all steps complete.
7. **Repeat** until all phases are done.

### State Management (pause/resume)

`~/.config/spec/changes/$REPO_NAME/$CHANGE_ID/state.yaml` tracks:

- Current phase and step
- Feature flags (tdd_required, fill_forward, etc.)
- Step history (audit trail)
- Quality scores
- Next step instruction (for resume)

An agent can pause at any step. On resume, it reads state.yaml and picks up
from the recorded next_step.

### Adding a New Schema

1. Create `spec/schemas/<name>.yaml` with phases (including outputs + templates),
   rules, steps, and step_overrides.
2. Add artifact templates to `spec/templates/<name>/`.
3. Reuse existing steps from `spec/steps/` — add step_overrides for
   schema-specific behavior.

### Adding a New Step

1. Create `spec/steps/<step-id>.yaml` with: id, intent, inputs, rules,
   instruction, checks, outputs.
2. Reference the step ID in workflow.yaml phases[].steps array.
3. Add step_overrides in workflow.yaml if the step behaves differently per flag.

## Bootstrapping a New Project

Run `/bootstrap` in any repo to generate `spec/project.yaml` from the template.
Bootstrap auto-detects project name, tech stack, and conventions from the codebase,
then writes a filled-in `project.yaml`. The template lives at `spec/templates/project.yaml`.

After initial generation, `project.yaml` evolves with the project — add rules,
adjust quality_bar, change signoff_policy as the team matures.

## Canonical Schemas

| Schema | Entry Phase | Use For |
|--------|-------------|---------|
| `feature` | specify | Features, prototypes, tooling. Flags: --no-tdd, --ff |
| `bugfix` | diagnose | Bug fixes, regressions, incidents |
