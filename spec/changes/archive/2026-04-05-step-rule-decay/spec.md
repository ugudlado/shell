---
feature-id: step-rule-decay
linear-ticket: HL-200
---

# Specification: Step Rule Decay

## Motivation

Every `/learn` cycle appends rules to step contracts. Nothing ever removes them. Over time, step contracts accumulate stale advice from early cycles — patterns that no longer apply, problems that were one-offs, or rules that contradict newer guidance. Each stale rule consumes context tokens and reduces the signal-to-noise ratio for the agent executing that step.

Rule lifecycle closes this loop: rules are born from `/learn`, prove their value by remaining relevant, and are retired when they stop being useful.

## What Changes

1. A new "Rule Lifecycle Convention" section in `CONVENTIONS.md` defines the metadata comment format for learned rules.
2. The `/learn` skill's "Route Findings" step is updated to tag each new rule with creation metadata when routing via workflow-fixer.
3. The `/learn` skill gains a "Rule Decay Evaluation" sub-step that runs every 5th invocation, scans step contracts for stale learned rules, and routes flagged rules to workflow-fixer for pruning.

## Requirements

### Functional

1. **FR-1**: Learned rules written to step contracts MUST include a metadata comment: `<!-- learned: YYYY-MM-DD, source: FEATURE-ID, cycle: N -->` on the same line or immediately after the rule text.
2. **FR-2**: Hand-written rules (original to the step contract, no metadata comment) are permanent — never subject to decay evaluation.
3. **FR-3**: Every 5th `/learn` invocation (measured by line count of `feature-metrics.jsonl`), a decay evaluation pass runs.
4. **FR-4**: A rule is flagged for removal when: age > 10 completed features AND the rule's source feature-id does not appear in any recent retry_reasons or evaluator findings.
5. **FR-5**: A rule is flagged for resolution when it contradicts a newer rule in the same step contract (opposing advice on the same topic).
6. **FR-6**: Flagged rules are passed to workflow-fixer for pruning/resolution, not removed inline.
7. **FR-7**: Decay results are logged: `[learn] Rule decay: scanned N rules, flagged M for removal, K for resolution`.

### Non-Functional

1. **NFR-1**: Decay evaluation is non-blocking — if scanning fails, log a warning and continue.
2. **NFR-2**: Rules without metadata are never touched.

## Architecture

### Components

| Component | Role | Change |
|-----------|------|--------|
| `CONVENTIONS.md` | Step contract conventions | Add Rule Lifecycle Convention section |
| `learn/SKILL.md` | Learn skill | Tag new rules + add decay evaluation sub-step |

### Data Flow

```
/learn (every invocation)
  |-- Route Findings (step 4)
  |   |-- workflow-fixer writes rule WITH metadata comment
  v
/learn (every 5th invocation)
  |-- Rule Decay Evaluation (step 5b)
  |   |-- scan src/spec/steps/*.yaml for <!-- learned: ...
  |   |-- flag stale (age > 10 features, no retry hits)
  |   |-- flag contradictory (opposing advice, same step)
  |   |-- pass flagged list to workflow-fixer for pruning
  |   v
  |-- log decay results
```

## Acceptance Criteria

- AC-1: CONVENTIONS.md has a "Rule Lifecycle Convention" section defining the metadata comment format and the permanent/decay distinction.
- AC-2: learn/SKILL.md step 4 instructs workflow-fixer to append the metadata comment when writing a new learned rule.
- AC-3: learn/SKILL.md has a step 5b that triggers every 5th invocation and performs the decay scan, flagging, and workflow-fixer routing.
- AC-4: Hand-written rules (no metadata comment) are explicitly excluded from decay evaluation per CONVENTIONS.md and SKILL.md instructions.

## Alternatives Considered

**Sidecar relevance counter file**: Track per-rule "hit" counts in a separate file during step execution. Rejected — requires agent to write to sidecar during every step execution, adding overhead to the hot path. Age + retry pattern analysis is a simpler proxy for relevance.

**Decay on every /learn**: Unnecessary overhead. Every 5th cycle balances responsiveness with cost.

<!-- Format contract: CONVENTIONS.md § Specification Format Contract -->
