---
name: iterate
description: Evaluate implementation quality across multiple dimensions, identify highest-impact improvements, execute them, and re-evaluate. Use after implementation is complete to polish code quality, UX, performance, and test coverage through structured improvement cycles. Triggers when the user asks to "iterate", "improve", "polish", or "refine" a feature, or automatically during /develop phase 5.
---

# Iterate — Structured Improvement Cycles

Evaluate → Prioritize → Improve → Re-evaluate → Stop when done.

## Philosophy

Iteration is not about perfection — it's about **highest-impact improvements with diminishing returns awareness**. Each round should make the feature meaningfully better. When improvements become marginal, stop.

## Step 1: Baseline Evaluation

Score the current implementation across these dimensions (1-10 each):

### Dimensions

**Code Quality** (weight: 0.25)
- Patterns: Does the code follow project conventions? DRY? Single responsibility?
- Error handling: Are failure modes covered? Graceful degradation?
- Edge cases: Are boundary conditions handled?
- Readability: Can a new developer understand this in 5 minutes?

**UX Quality** (weight: 0.25, skip if no UI)
- Invoke the `/critique` skill on any UI components
- Visual hierarchy, information architecture, emotional resonance
- States: empty, loading, error, success — are they all handled well?
- Accessibility: keyboard navigation, screen reader, color contrast

**Performance** (weight: 0.15)
- Obvious bottlenecks: N+1 queries, unnecessary re-renders, blocking operations
- Bundle size impact (for frontend)
- Memory leaks or resource cleanup issues
- Caching opportunities

**Test Quality** (weight: 0.20)
- Coverage of critical paths (not just line coverage)
- Edge case coverage
- Test independence (no shared mutable state)
- Assertion quality (testing behavior, not implementation details)

**Developer Experience** (weight: 0.15)
- API ergonomics: Is this pleasant to use from the caller's perspective?
- Naming clarity: Do names communicate intent?
- Documentation: Are complex parts explained? (only where needed)
- Defaults: Are sensible defaults provided?

### Scoring Rules

- **10**: Exceptional, nothing to improve
- **9**: Excellent, minor polish opportunities only
- **8**: Good, a few clear improvements available
- **7**: Solid, several meaningful improvements possible
- **6**: Adequate, notable gaps that affect quality
- **5 or below**: Needs significant work

**Overall score** = weighted average of applicable dimensions (skip UX weight if no UI, redistribute proportionally).

### Evaluation Method

For each dimension:
1. Read the relevant code files
2. Run relevant checks (tests, type-check, build)
3. Apply dimension-specific criteria
4. Score with specific evidence (not vibes)
5. List concrete improvement opportunities

## Step 2: Prioritize Improvements

From the evaluation, create a ranked list of improvements:

```
| Priority | Dimension | Improvement | Impact | Effort | Score Delta |
|----------|-----------|-------------|--------|--------|-------------|
| 1        | UX        | Add loading states | High | Low | +0.8 |
| 2        | Code      | Extract shared validation | Med | Low | +0.5 |
| 3        | Test      | Add error path tests | Med | Med | +0.4 |
| ...      | ...       | ...         | ...    | ...    | ...         |
```

**Ranking criteria** (in order):
1. **User-facing impact** — Will users notice? (UX > performance > code quality > DX)
2. **Effort-to-value ratio** — Quick wins before heavy lifts
3. **Risk** — Low-risk improvements before risky refactors
4. **Score delta** — How much will this move the needle?

**Cut line**: Only pursue improvements with estimated score delta ≥ 0.3 per round. Below that, it's diminishing returns.

## Step 3: Execute Improvements

For each improvement above the cut line (in priority order):

1. **Create task** via TaskCreate:
   - Subject: `[iterate] <improvement description>`
   - Description: Why (dimension + gap), Files, Verify
   - Metadata: `{"phase": "Iteration N", "dimension": "<dimension>"}`

2. **Implement** using the Implementer → Reviewer → Verifier loop:
   - Spawn implementer agent for the task
   - Reviewer validates against the improvement criteria
   - Verifier confirms tests pass, build clean, improvement achieved

3. **Commit** after each improvement (or batch related improvements):
   ```
   refactor: [FEATURE-ID] iteration N — <improvement summary>
   ```

**Guardrails**:
- Don't refactor working code just for style — it must improve a scored dimension
- Don't add features — iteration improves existing behavior, not scope
- Don't break passing tests — every improvement must leave the suite green
- Time-box each improvement — if it takes more than ~15 minutes of agent time, reassess priority

## Step 4: Re-evaluate

After executing improvements for this round:

1. Re-score all dimensions using the same criteria from Step 1
2. Record scores in the iteration history
3. Compute score delta from previous round

```
Round 1: 7.5 → Round 2: 8.8 (+1.3) → Round 3: 9.2 (+0.4)
```

## Step 5: Termination Check

**Stop iterating when ANY of these are true:**

1. **Quality threshold met**: Overall score ≥ 9.0
2. **Diminishing returns**: Score improvement < 0.5 from previous round
3. **Max iterations reached**: Default 3, configurable via `--iterations N`
4. **No improvements above cut line**: All remaining opportunities have delta < 0.3
5. **All dimensions ≥ 8**: No weak spots remaining

**If stopping with score < 8.0**: Log remaining opportunities as "deferred improvements" in the workflow state and mention them in the report.

## Output Format

```
## Iteration Report: FEATURE-ID

### Scores by Round

| Dimension       | Baseline | Round 1 | Round 2 | Final |
|-----------------|----------|---------|---------|-------|
| Code Quality    | 7        | 8       | 9       | 9     |
| UX Quality      | 6        | 8       | 9       | 9     |
| Performance     | 8        | 8       | 9       | 9     |
| Test Quality    | 7        | 8       | 8       | 9     |
| Developer XP    | 8        | 8       | 9       | 9     |
| **Overall**     | **7.1**  | **8.0** | **8.8** | **9.0** |

### Improvements Made

Round 1:
- [UX] Added loading, empty, and error states to all views (+1.5 UX)
- [Code] Extracted shared validation into reusable hook (+0.8 Code)
- [Test] Added error path and edge case tests (+0.7 Test)

Round 2:
- [UX] Improved keyboard navigation and focus management (+0.5 UX)
- [Perf] Memoized expensive list rendering (+0.8 Perf)
- [DX] Improved type exports and API defaults (+0.5 DX)

### Termination Reason
Overall score ≥ 9.0 — quality threshold met.

### Deferred (below cut line)
- [Code] Minor naming inconsistency in utils (delta: 0.1)
- [Test] Additional snapshot tests for edge layouts (delta: 0.2)
```

## Integration Notes

- When invoked from `/develop`, scores are written to workflow state
- When invoked standalone via `/iterate`, creates its own tracking
- Memory: Store iteration patterns and common improvements via claude-mem
- The skill is read-only for spec artifacts — it improves implementation, not spec
