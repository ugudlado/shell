---
name: test-driven-development
description: Use when implementing any feature or bugfix in TDD mode. Check the OpenSpec change's .openspec.yaml for mode — if mode is "tdd", this skill MUST be followed for all implementation work. Also use when the user explicitly asks for TDD, red-green-refactor, or "write tests first". Do not use when mode is "non-tdd" or for throwaway prototypes unless the user explicitly requests it.
---

# Test-Driven Development (TDD)

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## When This Activates

This skill is enforced when:
- The OpenSpec change `.openspec.yaml` has `mode: tdd`
- The user explicitly requests TDD
- Fixing a bug (write failing test that reproduces it first)

Exceptions (ask the user):
- Throwaway prototypes
- Generated code
- Configuration files

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete. Implement fresh from tests.

## Red-Green-Refactor

### RED — Write Failing Test

Write one minimal test showing what should happen.

```typescript
// GOOD: Clear name, tests real behavior, one thing
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);
  expect(result).toBe('success');
  expect(attempts).toBe(3);
});

// BAD: Vague name, tests mock not code
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(2);
});
```

Requirements:
- One behavior per test
- Clear name that describes behavior
- Real code (no mocks unless unavoidable)

### Verify RED — Watch It Fail

**MANDATORY. Never skip.**

Run the test. Confirm:
- Test fails (not errors)
- Failure message is the expected one
- Fails because the feature is missing (not typos)

Test passes? You're testing existing behavior. Fix the test.
Test errors? Fix the error, re-run until it fails correctly.

### GREEN — Minimal Code

Write the simplest code to pass the test.

```typescript
// GOOD: Just enough to pass
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try { return await fn(); }
    catch (e) { if (i === 2) throw e; }
  }
  throw new Error('unreachable');
}

// BAD: Over-engineered (YAGNI)
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; backoff?: 'linear' | 'exponential'; }
): Promise<T> { /* ... */ }
```

Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN — Watch It Pass

**MANDATORY.**

Run the test. Confirm:
- Test passes
- Other tests still pass
- Output is clean (no errors, warnings)

Test fails? Fix code, not the test.
Other tests fail? Fix now.

### REFACTOR — Clean Up

After green only:
- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

### Repeat

Next failing test for the next behavior.

## Testing Anti-Patterns

### Don't Test Mock Behavior

```typescript
// BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});

// GOOD: Test real component behavior
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

Before asserting on any mock element, ask: "Am I testing real behavior or mock existence?"

### Don't Add Test-Only Methods to Production Code

```typescript
// BAD: destroy() only used in tests
class Session {
  async destroy() { /* cleanup */ }
}

// GOOD: Test utilities handle test cleanup
// in test-utils/
export async function cleanupSession(session: Session) { /* ... */ }
```

Before adding any method to a production class, ask: "Is this only used by tests?" If yes, put it in test utilities.

### Don't Mock Without Understanding

Before mocking:
1. What side effects does the real method have?
2. Does this test depend on any of those side effects?
3. If yes — mock at a lower level, not the method the test depends on

### Don't Create Incomplete Mocks

Mock the COMPLETE data structure as it exists in reality, not just fields your immediate test uses. Partial mocks hide structural assumptions and fail silently when downstream code accesses omitted fields.

### Warning Signs

- Mock setup longer than test logic → consider integration tests
- Mocking everything to make test pass → design too coupled
- `*-mock` test IDs in assertions → testing mock, not real behavior
- Methods only called in test files → test-only code in production

## Debugging Integration

Bug found? Write failing test reproducing it first. Follow the TDD cycle. The test proves the fix and prevents regression.

Never fix bugs without a test.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc != systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration, start fresh with TDD. |
| "Test hard = design unclear" | Listen to the test. Hard to test = hard to use. |
| "TDD will slow me down" | TDD is faster than debugging. |
| "It's about spirit not ritual" | Tests-after answer "what does this do?" Tests-first answer "what should this do?" |

## Red Flags — STOP and Start Over

- Code written before test
- Test passes immediately (never saw it fail)
- Can't explain why test failed
- Rationalizing "just this once"
- "Keep as reference" or "adapt existing code"
- "TDD is dogmatic, I'm being pragmatic"

All of these mean: delete the code, start over with TDD.

## Verification Checklist

Before marking implementation work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for the expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output is clean (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered
