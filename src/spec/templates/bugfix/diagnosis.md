# Diagnosis: {title}

## Symptoms

{What's broken — include error messages, screenshots, logs.}

## Reproduction Steps

1. {Step 1}
2. {Step 2}
3. {Observed failure}

## Expected vs Actual

- **Expected**: {what should happen}
- **Actual**: {what happens instead}

## Investigation

### Evidence Gathered

- {What was checked — logs, git blame, recent changes, config diffs}

### Data Flow Trace

{Trace from input to error point. Where does it diverge from expected?}

## Root Cause

{The actual cause — not symptoms, not guesses.}
Reference: `file_path:line_number`

## Impact

### Severity

{One of: critical, high, medium, low}

### Affected Areas

{Users, features, or systems impacted.}

### Since When

{Commit, PR, or date when introduced. "Unknown" if not determinable.}

## Linear Ticket

{HL-XXX or "none"}

<!-- Format contract: CONVENTIONS.md § Diagnosis Format Contract -->
