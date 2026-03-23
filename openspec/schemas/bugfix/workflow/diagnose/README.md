# diagnose workflow — bugfix

Steps execute in `order:` sequence. Filenames are slugs; order is declared inside each file.

| order | step id              | description |
|------:|----------------------|-------------|
|     1 | parse-args           | Parse flags and bug description from $ARGUMENTS; schema is always bugfix — no detection needed |
|     2 | search-memory        | Search claude-mem for similar bugs, past fixes, and relevant patterns before any codebase work |
|     3 | create-ticket        | Create Linear ticket early using bug description, extract ticket ID for use in identifier |
|     4 | investigate          | Root cause investigation — explore codebase for symptoms, reproduction steps, and root cause |
|     5 | write-diagnosis      | Write diagnosis.md with symptoms, reproduction steps, and root cause; write fix-plan.md with approach, affected files, and risk assessment |
|     6 | generate-id-worktree | Derive bugfix identifier from Linear ID or date plus slug, then create the worktree via EnterWorktree |
|     7 | generate-artifacts   | Scaffold change directory, write .openspec.yaml, and write diagnosis.md and fix-plan.md artifacts |
|     8 | user-review          | Present diagnosis and fix plan to user for approval; wait for confirmation or incorporate feedback |
|     9 | store-commit-report  | Save diagnosis decisions as memory, commit artifacts to feature branch, update Linear, and output the final report |

## Routing notes

- All steps are linear — no branching or loops in this phase
