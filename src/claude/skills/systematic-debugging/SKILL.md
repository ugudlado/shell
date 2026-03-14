---
name: systematic-debugging
description: Use when encountering any bug, test failure, unexpected behavior, build failure, or performance problem — before proposing fixes. Also use when a previous fix attempt didn't work, when under time pressure with a technical issue, or when you've tried multiple approaches without success. This skill enforces root-cause investigation before any fix attempt. If you're about to suggest a code change to fix something and haven't completed Phase 1, stop and use this skill first.
---

# Systematic Debugging

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** Find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## The Four Phases

Complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

**1. Read Error Messages Carefully**
- Don't skip past errors or warnings — they often contain the exact solution
- Read stack traces completely
- Note line numbers, file paths, error codes

**2. Reproduce Consistently**
- Can you trigger it reliably? What are the exact steps?
- If not reproducible, gather more data — don't guess

**3. Check Recent Changes**
- What changed? Git diff, recent commits, new dependencies, config changes, environmental differences

**4. Gather Evidence in Multi-Component Systems**

When the system has multiple components (CI → build → signing, API → service → database), add diagnostic instrumentation before proposing fixes:

```
For EACH component boundary:
  - Log what data enters the component
  - Log what data exits the component
  - Verify environment/config propagation
  - Check state at each layer

Run once to gather evidence showing WHERE it breaks
THEN analyze evidence to identify the failing component
THEN investigate that specific component
```

**5. Trace Data Flow (Root Cause Tracing)**

When the error is deep in the call stack, trace backward to find the original trigger:

1. **Observe the symptom** — what's the error?
2. **Find immediate cause** — what code directly causes it?
3. **Ask "what called this?"** — trace up the call chain
4. **Keep tracing** — what value was passed? Where did it come from?
5. **Find original trigger** — the source, not the symptom

When you can't trace manually, add instrumentation:

```typescript
// Before the problematic operation
const stack = new Error().stack;
console.error('DEBUG operation:', {
  inputValue,
  cwd: process.cwd(),
  stack,
});
```

Use `console.error()` in tests (not logger — may be suppressed). Log *before* the dangerous operation, not after it fails.

**The key principle:** Never fix where the error appears. Trace back to find the original trigger.

---

### Phase 2: Pattern Analysis

**1. Find Working Examples**
- Locate similar working code in the same codebase
- What works that's similar to what's broken?

**2. Compare Against References**
- If implementing a pattern, read reference implementation COMPLETELY — don't skim
- Understand the pattern fully before applying

**3. Identify Differences**
- What's different between working and broken?
- List every difference, however small — don't assume "that can't matter"

**4. Understand Dependencies**
- What other components does this need?
- What settings, config, environment?
- What assumptions does it make?

---

### Phase 3: Hypothesis and Testing

**1. Form Single Hypothesis**
- State clearly: "I think X is the root cause because Y"
- Be specific, not vague

**2. Test Minimally**
- Make the SMALLEST possible change to test hypothesis
- One variable at a time — don't fix multiple things at once

**3. Verify Before Continuing**
- Did it work? → Phase 4
- Didn't work? → Form NEW hypothesis (don't add more fixes on top)

**4. When You Don't Know**
- Say "I don't understand X" — don't pretend to know

---

### Phase 4: Implementation

**1. Create Failing Test Case**

If the project uses TDD mode, invoke the `test-driven-development` skill for writing proper failing tests. Otherwise, create the simplest possible automated reproduction.

**2. Implement Single Fix**
- Address the root cause identified — ONE change at a time
- No "while I'm here" improvements, no bundled refactoring

**3. Verify Fix**
- Run tests — does it pass now? No other tests broken?
- Run the original reproduction — is the issue actually resolved?

**4. If Fix Doesn't Work**
- Count: How many fixes have you tried?
- If < 3: Return to Phase 1, re-analyze with new information
- **If >= 3: STOP and question the architecture** (see below)
- Do NOT attempt fix #4 without discussing with the user

**5. If 3+ Fixes Failed: Question Architecture**

Pattern indicating an architectural problem:
- Each fix reveals new shared state/coupling/problem in a different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere

Stop and question fundamentals:
- Is this pattern fundamentally sound?
- Are we sticking with it through inertia?
- Should we refactor architecture vs. continue fixing symptoms?

Discuss with the user before attempting more fixes. This is not a failed hypothesis — this is a wrong architecture.

**6. Apply Defense-in-Depth**

After fixing the root cause, add validation at EVERY layer data passes through. Single validation can be bypassed by different code paths, refactoring, or mocks.

| Layer | Purpose | Example |
|-------|---------|---------|
| **Entry Point** | Reject invalid input at API boundary | Validate not empty, exists, correct type |
| **Business Logic** | Ensure data makes sense for this operation | Domain-specific invariants |
| **Environment Guards** | Prevent dangerous operations in specific contexts | Refuse destructive ops outside tmpdir in tests |
| **Debug Instrumentation** | Capture context for forensics | Log with stack trace before risky operations |

All four layers are necessary — during testing, each layer catches bugs the others miss. Different code paths bypass entry validation, mocks bypass business logic, edge cases need environment guards.

---

## Technique: Condition-Based Waiting

When debugging flaky tests that use arbitrary delays, replace timeouts with condition polling:

```typescript
// BAD: Guessing at timing
await new Promise(r => setTimeout(r, 50));

// GOOD: Waiting for the actual condition
await waitFor(() => getResult() !== undefined);
```

Generic polling function:
```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();
  while (true) {
    const result = condition();
    if (result) return result;
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }
    await new Promise(r => setTimeout(r, 10));
  }
}
```

Arbitrary timeouts are ONLY correct when testing actual timing behavior (debounce, throttle). Always document WHY with a comment.

---

## Red Flags — STOP and Follow Process

If you catch yourself thinking any of these, return to Phase 1:

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
- Each fix reveals new problem in different place

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms != understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Done When |
|-------|---------------|-----------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare, identify differences | Know what's different |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix root cause, verify, add defense-in-depth | Bug resolved, tests pass, layers validated |
