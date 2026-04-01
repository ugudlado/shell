# Spec Workflow System

Agent-agnostic workflow orchestration for spec-first development.

## Architecture

```
spec/
  project.yaml              # Project context, quality bar, project-level rules
  commands.yaml              # Canonical actions (new, apply, verify, archive...)
  schemas/
    feature/
      schema.yaml            # Artifact definitions + apply instruction
      workflow.yaml           # Phases with inline rules, step IDs, exit conditions
      templates/              # Artifact templates (discovery, spec, design, tasks)
    bugfix/
      schema.yaml
      workflow.yaml
      templates/
  steps/                     # Shared step contracts (referenced by ID)
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

1. Create `spec/schemas/<name>/schema.yaml` with artifact definitions.
2. Create `spec/schemas/<name>/workflow.yaml` with phases, step IDs, and rules.
3. Add templates to `spec/schemas/<name>/templates/`.
4. Reuse existing steps from `spec/steps/` — add step_overrides in workflow.yaml
   for schema-specific behavior.

### Adding a New Step

1. Create `spec/steps/<step-id>.yaml` with: id, intent, inputs, rules,
   instruction, checks, outputs.
2. Reference the step ID in workflow.yaml phases[].steps array.
3. Add step_overrides in workflow.yaml if the step behaves differently per flag.

## Canonical Schemas

| Schema | Entry Phase | Use For |
|--------|-------------|---------|
| `feature` | specify | Features, prototypes, tooling. Flags: --no-tdd, --ff |
| `bugfix` | diagnose | Bug fixes, regressions, incidents |
