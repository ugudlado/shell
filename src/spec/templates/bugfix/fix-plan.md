# Fix Plan: {title}

## Fix Strategy

{What will be changed and why.}
Root cause reference: {from diagnosis.md Root Cause section}

## Affected Files

- `file_path:line_number` — {what changes and why}

## Regression Test

- **Test file**: {path}
- **Test name**: {name}
- **Asserts**: {what it proves}
- **Must fail before fix**: yes
- **Must pass after fix**: yes

## Risk Assessment

### Could This Break Other Things?

{Other code paths touching the same area. Shared state, side effects, coupling.}

### Rollback Plan

{How to revert if the fix causes issues.}

## Out of Scope

- {Related issues NOT fixed in this change — file separate bugs if needed}
- {"None — fix is self-contained" if nothing to note}

<!-- Format contract: CONVENTIONS.md § Fix Plan Format Contract -->
