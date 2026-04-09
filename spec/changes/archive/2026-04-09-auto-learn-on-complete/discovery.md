# Discovery Brief — Auto-Learn on Complete

## Problem Statement

The underlying goal is to close the self-improvement loop that currently requires manual intervention. After every completed feature, `/learn` must be explicitly invoked to route step-history data into step contract rules, workflow fixes, and Linear tickets. In `--auto` mode (the primary autopilot path), this never happens — the workflow executes perfectly but learns nothing.

The stated request is to trigger `/learn` automatically as part of the `complete` phase. The real goal is: **every completed change improves the next one without human involvement**.

---

## Codebase Survey

### What already exists

**The `archive-completed-change` step** (`/Users/spidey/.config/spec/steps/archive-completed-change.yaml`)
- Version 3, intent: compute SWE metrics, persist to state.yaml and feature-metrics.jsonl, then archive.
- Already spawns as a haiku-agent (see `/develop` SKILL.md line for "archive-completed-change": "Spawn a haiku-agent with the step contract instruction").
- It is the final step in the `complete` phase of feature, bugfix, and chore schemas.
- Spike schema has no `complete` phase and no archive step — learning on spikes is out of scope.

**The `/learn` skill** (`/Users/spidey/.claude/skills/learn/SKILL.md`)
- Spawns `workflow-evaluator` agent (opus model) with state.yaml step_history, per-step learnings, and aggregate metrics.
- Routes findings to: workflow-fixer (workflow issues + learned rules → step contracts), Linear (code/functionality issues), and CLAUDE.md (project-specific code rules, max 3/cycle).
- Currently user-invocable only, no schema step wrapper.
- Already handles the case where the feature-id is passed as an argument.

**`/autopilot` skill** (`/Users/spidey/.claude/skills/autopilot/SKILL.md`)
- Explicitly calls `/learn` after every `/develop` completion (step 4d).
- Uses `Skill({ skill: "learn", args: "[TICKET_ID]" })`.
- Has error handling: "/learn fails → Log warning, skip learning, continue".
- This is the only existing integration point — autopilot manually invokes learn, but `/complete-feature` and direct `/develop` do not.

**`complete-feature` skill** (`/Users/spidey/.claude/skills/complete-feature/SKILL.md`)
- Thin wrapper around `/develop` that runs only the complete phase.
- No post-completion learning step.

**Schemas — `complete` phase structure** (feature, bugfix, chore):
All three have identical step sequence:
```
- run-feature-verification
- final-signoff
- archive-completed-change
```
None have a step after `archive-completed-change`.

**Feedback file** (`/Users/spidey/.claude/projects/.../feedback_learn_after_complete.md`):
- Prior incident: HL-170 skipped `/learn` entirely, workflow-evaluator verdict was FAIL (BLOCKING).
- Established convention: `/learn` is mandatory after `/complete-feature`.
- Currently enforced only by convention — not by the workflow itself.

**`workflow-evaluator` agent** (`/Users/spidey/.claude/agents/workflow-evaluator.md`)
- Receives: workflow report, reviewer quality report, project root, schema used.
- Outputs: CLAUDE.md rule additions, metrics.jsonl entry, verdict, workflow-fixer routing.
- Model: opus.

**`workflow-fixer` agent** (`/Users/spidey/.claude/agents/workflow-fixer.md`)
- Edits: step contracts (`$SPEC_HOME/steps/*.yaml`), schemas (`$SPEC_HOME/schemas/*.yaml`), skills.
- Cannot edit: application code, agent definitions, CLAUDE.md files.
- Model: sonnet.

**No existing `run-learn` or `auto-learn` step contract exists** — confirmed by scanning `/Users/spidey/.config/spec/steps/`.

---

## Constraints and Integration Points

### Constraints

1. **Non-blocking requirement**: Failure to learn must never fail the archive. This is explicit in `archive-completed-change` rules for metrics (line: "Metrics script failure is non-blocking — archive proceeds with a warning"). The same principle must apply to learning.

2. **Agent execution model**: The `complete` phase steps run differently based on the `agents` flag. `archive-completed-change` is a mechanical step (no `agent:` field in schema) — it always spawns a haiku-agent inline regardless of `agents` flag. A learn step would need to spawn the workflow-evaluator (opus), which is heavier. This creates a model-tier mismatch if implemented as part of the haiku-agent archive invocation.

3. **Schema uniformity**: feature, bugfix, and chore schemas all have identical `complete` phase structure. Any change must be applied to all three. Spike is intentionally excluded (no archive, no review gates, throwaway work).

4. **Step contract SRP**: CONVENTIONS.md requires each step does ONE thing. Adding learn invocation to `archive-completed-change` would violate SRP. The archive step's intent is "Compute SWE metrics, persist to state.yaml and feature-metrics.jsonl, then archive." Learning is a separate concern.

5. **`--auto` flag semantics**: When `auto: true`, `final-signoff` auto-approves. The learning step should also run non-interactively in `--auto` mode — rule changes should apply without user confirmation. This is already how the workflow-evaluator is designed (it writes directly to step contracts and CLAUDE.md).

6. **Opus model cost**: workflow-evaluator uses opus. Each completed feature triggers one opus invocation. At current scale (solo developer), this is acceptable. Worth noting as a constraint if scale increases.

7. **`archive-completed-change` already runs as haiku-agent** (mechanical step). The learn invocation would need to spawn a different agent. Cleaner to add as a separate schema step rather than extending the archive step.

### Integration Points

- **`/Users/spidey/.config/spec/schemas/feature.yaml`** — `complete` phase `steps:` array (line 154-157)
- **`/Users/spidey/.config/spec/schemas/bugfix.yaml`** — `complete` phase `steps:` array (line 148-152)
- **`/Users/spidey/.config/spec/schemas/chore.yaml`** — `complete` phase `steps:` array (line 101-108)
- **`/Users/spidey/.config/spec/steps/archive-completed-change.yaml`** — may need a flag indicating learn should follow
- **`/Users/spidey/.claude/skills/learn/SKILL.md`** — existing skill logic (no changes needed)
- **`/Users/spidey/.claude/skills/autopilot/SKILL.md`** — currently has redundant `/learn` call in step 4d that should be removed once learn is embedded in schemas
- **`/Users/spidey/.claude/skills/develop/SKILL.md`** — mechanical step dispatch table for `archive-completed-change` and future `run-learn-cycle` step

---

## Unresolved Questions

1. **New step vs extending archive**: Should this be a new `run-learn-cycle` step contract, or embedded in `archive-completed-change`? SRP strongly suggests new step. But does adding a step to the `complete` phase change anything about how `complete-feature` or `/develop` handles it? No — they walk all steps in the phase. Lean toward new step.

2. **Spike schema**: Should spikes ever auto-learn? The spike schema has a `summarize` phase but no `complete` phase. The spike-findings.md captures learnings narratively. Adding an auto-learn step to the spike `summarize` phase is debatable — spikes are throwaway, but they do produce step_history. Currently leaving out of scope, but worth flagging for the architect.

3. **`--no-learn` flag**: Should there be a way to skip learning (e.g., for very fast chores where the overhead is unwanted)? The idea.md says "failure to learn should not fail the archive" — non-blocking satisfies this. A flag feels like premature optimization.

4. **Autopilot redundancy**: After this change, `/autopilot`'s step 4d (explicit `/learn` call) would be redundant. Should it be removed? Yes — but that's a separate change to `/autopilot`. The architect should note this in the spec as a follow-on.

5. **What data does the learn step receive?** The `archive-completed-change` step generates state.yaml with full step_history, metrics, and quality scores. The learn step runs after archive, so it reads the archived state or the still-present active state.yaml (which exists until cleanup in step 8 of archive). **Key timing issue**: archive step 8 cleans up the active change directory. If learn runs after archive and after cleanup, the learn step must read from the repo archive path (`spec/changes/archive/YYYY-MM-DD-$CHANGE_ID/state.yaml`), not the active dir.

6. **Agent model for the learn step**: Should the schema specify `agent: workflow-evaluator` directly, or should it spawn via the haiku orchestrator? Current `develop` SKILL.md handles `archive-completed-change` as a "mechanical step" (haiku-agent). The learn step involves opus-level reasoning. It should have `agent: workflow-evaluator` in the schema entry to get the right model tier via agent mode dispatch.

---

## Build-or-Reuse Assessment

**Recommendation: Build a thin new step contract (`run-learn-cycle.yaml`) and add it to the three schemas.**

Rationale:
- The `/learn` skill already contains all the logic — it spawns workflow-evaluator with the right inputs. The new step contract is essentially a wrapper that says "invoke `/learn` for the just-completed change."
- The step contract is minimal: intent (run post-completion learning), instruction (invoke learn skill with change_id, mark non-blocking), verify (metrics.jsonl entry exists or learning was skipped with warning).
- No new agent needed — reuses `workflow-evaluator` via the existing learn skill path.
- The pattern of a thin schema step that invokes a skill is already established (see `create-linear-ticket`).
- Total change surface: 1 new step contract + 3 schema updates (feature, bugfix, chore complete phases) + 1 skill update (autopilot step 4d removal).

**What NOT to build:**
- Do not add `/learn` invocation to `archive-completed-change` — SRP violation.
- Do not create a new hooksmith rule — hooks fire on session events, not on schema step completion.
- Do not add a `--no-learn` flag — non-blocking failure already handles the "skip" case gracefully.

---

## Personas

**Primary actor**: The workflow itself (in `--auto` mode). No human present. Must run and self-improve without prompting.

**Secondary actor**: The developer using `/develop` or `/complete-feature` manually. Currently has to remember to run `/learn`. Should get it automatically.

**Tertiary actor**: The autopilot operator. Currently autopilot manually calls `/learn` — this should be removed to avoid double invocation.

---

## Use Cases

**UC-1: Auto-learn in --auto mode**
The workflow completes a feature in fully unattended `--auto --ff --agents` mode. After `archive-completed-change` completes, `run-learn-cycle` fires automatically. The workflow-evaluator reads state.yaml step_history and metrics, applies up to 3 step contract rules, routes workflow issues to workflow-fixer, and writes a metrics.jsonl entry. No human interaction. The next feature benefits from the improvements.

**UC-2: Auto-learn after manual /complete-feature**
A developer runs `/complete-feature HL-195` manually. After archive, the `run-learn-cycle` step runs. The evaluator finds a FRICTION issue (missing verify assertion in a step contract) and routes it to workflow-fixer. The fix is applied to disk before the session ends. Developer sees the learn report in their session output.

**UC-3: Learn step fails gracefully**
The workflow-evaluator fails (e.g., opus unavailable, malformed state.yaml). The `run-learn-cycle` step catches the error, logs a warning to state.yaml (`learn_skipped: true, learn_error: <message>`), and returns success. The archive already completed and committed. Nothing is lost — the feature is done.

**UC-4: Autopilot double-invocation prevented**
After this change, `/autopilot`'s step 4d (explicit `/learn` call) is removed. The learn already happened inside `/develop`'s complete phase. No double-evaluation, no double metrics.jsonl entry.

**UC-5: Chore completes with relaxed threshold**
A chore completes. The learn step runs. The workflow-evaluator uses chore's relaxed threshold (min 7) for verdict computation. This means the chore schema context must be available to the evaluator — it reads it from state.yaml's `schema:` field.

---

## Scope

**In scope:**
- New `run-learn-cycle.yaml` step contract in `$SPEC_HOME/steps/`
- Add `run-learn-cycle` as final step in `complete` phase of: feature.yaml, bugfix.yaml, chore.yaml
- Non-blocking error handling (learn failure must not affect archive outcome)
- `--auto` mode: evaluator runs non-interactively, applies changes without confirmation
- Remove redundant `/learn` call from `/autopilot` step 4d

**Out of scope:**
- Spike schema (no archive, no `complete` phase)
- Changes to `workflow-evaluator` agent internals
- Changes to `workflow-fixer` agent internals
- Changes to the `/learn` skill logic
- New `--no-learn` flag
- Any changes to how metrics are computed (that belongs to `archive-completed-change`)

---

## UI Direction

N/A — no UI components involved.

---

## Technical Context

Key files for implementation:

- `/Users/spidey/.config/spec/steps/archive-completed-change.yaml` — final step before the new one; timing note: cleanup (step 8) deletes active dir, so run-learn-cycle must read archive path
- `/Users/spidey/.config/spec/steps/create-linear-ticket.yaml` — reference pattern for a thin step that invokes a skill (new step should follow this pattern)
- `/Users/spidey/.config/spec/schemas/feature.yaml` line 153-157 — `complete` phase steps
- `/Users/spidey/.config/spec/schemas/bugfix.yaml` line 147-152 — `complete` phase steps
- `/Users/spidey/.config/spec/schemas/chore.yaml` line 100-108 — `complete` phase steps
- `/Users/spidey/.claude/skills/develop/SKILL.md` lines 310-316 — "Mechanical Steps (no agent)" dispatch table; `run-learn-cycle` may need an entry here, or may use the agent-based dispatch
- `/Users/spidey/.claude/skills/autopilot/SKILL.md` lines 148-168 — step 4d (explicit `/learn` call) to be removed post-implementation
- `/Users/spidey/.claude/skills/learn/SKILL.md` — existing learn logic, no changes needed
- `/Users/spidey/.claude/agents/workflow-evaluator.md` — opus model, receives step_history + metrics

**Critical timing constraint**: In `archive-completed-change`, step 8 cleans up `$SPEC_CHANGES_DIR/$CHANGE_ID/`. The `run-learn-cycle` step runs after archive, so it must reference the archived state.yaml at `spec/changes/archive/YYYY-MM-DD-$CHANGE_ID/state.yaml`, not the (now-deleted) active path.

**Agent dispatch question for architect**: Should `run-learn-cycle` be a mechanical step (spawns evaluator inline via haiku intermediary, like archive does) or a schema-declared agent step (schema says `agent: workflow-evaluator`)? The latter is cleaner and avoids nesting. Worth deciding in design.
