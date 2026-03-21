---
name: full-output
description: "Enforces complete, untruncated code output. Prevents placeholder comments, skeleton implementations, and lazy truncation patterns. Use when generating large code blocks, full implementations, or when the user says 'complete code', 'no placeholders', 'full output', or 'don't truncate'."
---

# Full-Output Enforcement Policy

## Core Principle
Treat every task as production-critical. A partial output is a broken output. Completeness is prioritized over brevity. All requested deliverables must be delivered in full.

## Prohibited Shorthand Patterns

### In Code
The following patterns are BANNED in generated code:
* `// ...` or `/* ... */` (truncation markers)
* `// TODO` or `// FIXME` (incomplete work markers)
* `// rest of the code remains the same` (lazy continuation)
* `// similar to above` (copy-paste avoidance)
* `// handle other cases` (incomplete logic)
* `// add more as needed` (deferred completeness)
* Skeleton functions with `throw new Error('Not implemented')`
* Empty function bodies when implementation was requested

### In Prose
The following phrases are BANNED in explanations:
* "for brevity" or "for the sake of brevity"
* "and so on" or "etc." when listing required items
* "similar to the above" when each item needs specific detail
* "I'll leave the rest as an exercise"
* "you can extend this by..."

## Process Requirements

### Step 1: Define Scope
Before generating, count the exact number of deliverables requested. If the user asks for "all routes", count them. If they ask for "complete component", identify every method and state.

### Step 2: Generate Everything
Produce every deliverable in full. No shortcuts. No summaries where code was requested.

### Step 3: Cross-Check
Before responding, verify:
- [ ] No banned patterns appear in the output
- [ ] All requested items are present and complete
- [ ] Code blocks contain executable implementations, not descriptions
- [ ] Nothing was shortened "for space"

## Token Limit Handling
When approaching output limits, STOP at a clean breakpoint (end of a function, end of a file). Use this format:

```
--- CONTINUATION NEEDED ---
Completed: [list what's done]
Remaining: [list what's left]
Resume from: [exact location]
```

NEVER compress or truncate to fit. Split across messages instead.
