# Tasks — Step Rule Decay

## Phase 1: Rule Lifecycle Convention and /learn Updates

- [x] T-1: Add Rule Lifecycle Convention to CONVENTIONS.md
  Files: src/spec/steps/CONVENTIONS.md
  Verify: File has "Rule Lifecycle Convention" section defining metadata comment format, permanent vs decay distinction

- [x] T-2: Extend /learn to tag new rules with metadata
  Files: src/claude/skills/learn/SKILL.md
  Verify: Step 4 "Route Findings" instructs workflow-fixer to append `<!-- learned: ... -->` metadata comment on each new rule
  depends: T-1

- [x] T-3: Add decay evaluation sub-step to /learn
  Files: src/claude/skills/learn/SKILL.md
  Verify: Step 5b exists, triggers every 5th invocation, scans *.yaml for learned rules, flags stale/contradictory, routes to workflow-fixer, logs results
  depends: T-2
