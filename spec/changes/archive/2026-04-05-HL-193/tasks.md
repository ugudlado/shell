# Tasks

## T-1: Add auto-commit convention to CONVENTIONS.md
- [x] Add § Auto-Commit Convention section to `src/spec/steps/CONVENTIONS.md`
- Format: `chore(<change-id>): complete T-N — <task title>` for chore schema, `feat(<change-id>): complete T-N — <task title>` for feature schema
- Convention: commit only when task verification passes; never commit failing state
- Files: `src/spec/steps/CONVENTIONS.md`
- Verify: Section exists with format definition, schema-prefix mapping, and rules

## T-2: Update execute-next-task step contract with auto-commit
- [x] Add commit instruction to `execute-next-task.yaml` after task marked [x]
- Insert between current step 6 (mark complete) and step 7 (verification fails)
- Add commit to `verify.after_each` list
- depends: T-1
- Files: `src/spec/steps/execute-next-task.yaml`
- Verify: Instruction includes commit step; verify section references commit check
