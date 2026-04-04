# Discovery Brief — Step Contract Effectiveness

**Feature**: Track which learned rules in step contracts actually reduce retry rates and failure patterns. Add effectiveness metrics per rule for evidence-based pruning.

---

## What I Understand

The auto-learn loop (HL-195) adds rules to step contracts after every feature completion. The decay evaluation (CONVENTIONS.md § Rule Lifecycle Convention) prunes old rules every 5th cycle — but only using age-based heuristics ("Age > 10 completed features"). There's no measurement of whether a rule actually reduced failures. This means effective rules get pruned because they're old, and ineffective rules survive because they're new.

The goal: **evidence-based pruning** — keep rules that demonstrably reduce retries, remove rules that don't.

---

## What Already Exists

### Rule Lifecycle Convention (CONVENTIONS.md:1149-1186)
- Learned rules have metadata: `<!-- learned: YYYY-MM-DD, source: FEATURE-ID, cycle: N -->`
- Decay criteria: age > 10 features AND source not in recent retry analysis
- Decay runs every 5th `/learn` invocation
- Currently 2 learned rules in production

### feature-metrics.jsonl
- Records per-feature: tasks, quality, retries, prediction accuracy, learn results
- `learn.rules_added/removed` counts — but no per-rule identity or effectiveness data
- 4 entries currently

### /learn skill § Rule Decay Evaluation (5b)
- Scans `$SPEC_HOME/steps/*.yaml` for `<!-- learned:` lines
- Parses metadata (date, source, cycle)
- Flags for removal when age > 10 AND source not in recent retries
- Flags contradictory rules for resolution

---

## Build or Reuse?

**Build** — extend the existing rule metadata format and decay evaluation logic.

---

## Approaches Considered

### Approach A — Per-rule effectiveness counters in metadata (S complexity)

Extend the `<!-- learned: ... -->` metadata comment to include effectiveness counters:
`<!-- learned: 2026-04-05, source: HL-203, cycle: 6, hits: 3, misses: 0 -->`

Where:
- `hits` = number of features where the step this rule belongs to had zero retries (rule may be helping)
- `misses` = number of features where the step had retries despite the rule (rule may not be helping)

The `/learn` cycle updates these counters by scanning step_history for retry patterns per step.

- Pros: Self-contained — all data in the metadata comment, no new files. Decay evaluation reads counters directly.
- Cons: Updating metadata comments inline is fragile. Counters are correlation-based, not causal.
- Reuse: Extends existing metadata format, extends existing /learn cycle.

### Approach B — Separate rule effectiveness log file (M complexity)

Create `$SPEC_HOME/steps/rule-effectiveness.jsonl` tracking per-rule metrics over time. Each `/learn` cycle appends an entry mapping rule IDs to step retry rates.

- Pros: Clean separation of data. Full history preserved. Easy to analyze trends.
- Cons: New file to manage. Needs rule IDs (currently rules are identified by text, not ID).
- Reuse: New file, but read by existing decay evaluation logic.

---

## Recommendation

**Approach A** — simplest, all data stays inline with the rule. The metadata comment already exists and is parsed by decay evaluation. Adding two counters is a minimal extension.

---

## Key Decisions

### D1: Approach A selected (S complexity)
Deterministic selection: A=S(2) < B=M(3). A reuses existing metadata format.

### D2: Hit/miss counting logic
- **Hit**: A feature completes and the step containing this rule had zero retries in step_history
- **Miss**: A feature completes and the step had retries in step_history
- Counter updates happen during `/learn` cycle (step 5b decay evaluation or a new sub-step)

### D3: Effectiveness threshold for decay
Replace pure age-based decay with: eligible for removal when `hits == 0 AND age > 5 features` (rule never demonstrably helped) OR `misses / (hits + misses) > 0.7 AND age > 10` (rule mostly ineffective over sufficient sample).

---

## Scope

### In-Scope
- Extend learned rule metadata comment format to include `hits` and `misses` counters
- Update CONVENTIONS.md § Rule Lifecycle Convention with the new metadata fields and effectiveness-based decay criteria
- Update /learn skill § Rule Decay Evaluation to update counters and use effectiveness criteria

### Out-of-Scope
- Causal analysis (proving a rule *caused* improvement — correlation is sufficient)
- Per-rule dashboards or visualizations
- Changes to feature-metrics.jsonl schema
- Changes to step contracts other than CONVENTIONS.md

---

## Technical Context

### Files Directly Affected
- `~/.config/spec/steps/CONVENTIONS.md` — Rule Lifecycle Convention: new metadata fields, effectiveness decay criteria
- `/Users/spidey/code/shell/src/claude/skills/learn/SKILL.md` — Rule Decay Evaluation (5b): counter update logic, effectiveness-based flagging

### Open Questions
None — approach is straightforward.
