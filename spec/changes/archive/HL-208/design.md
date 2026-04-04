# Design: Verify Command Portability

## Selected Approach
Add verify_commands to project.yaml, reference from schemas. S complexity.

## Schema Change Pattern

Before:
```yaml
verify:
  commands:
    - type-check
    - test
    - build
```

After:
```yaml
verify:
  commands: $project.verify_commands
```

The orchestrator resolves `$project.verify_commands` by reading project.yaml at runtime. If the field is missing, fall back to `[type-check, test, build]`.

## Open Questions
- None.
