# implement workflow — feature-tdd

Steps execute in `order:` sequence. Filenames are slugs; order is declared inside each file.

| order | step id           | description |
|------:|-------------------|-------------|
|     1 | load-context      | Auto-detect feature ID, read OpenSpec metadata, fetch Linear ticket, search memory, and load all context artifacts |
|     2 | auto-resume       | Detect prior session state from state.yaml, TaskList, and git status, then resume from the correct step |
|     3 | generate-tasks    | Generate the minimal set of implementation tasks from spec and design, write tasks.md, and wire task dependencies |
|     4 | start-dev-server  | Start the project dev server once and keep it running for the entire implementation session |
|     5 | pick-task         | Select next ready task(s) from the task graph and update state |
|     6 | implement         | Implementer writes code for the current task(s) |
|     7 | simplify          | Simplify the current task's code before review — catches complexity while context is fresh |
|     8 | review            | Reviewer scores the implementation against spec and coding standards |
|     9 | verify            | Verifier runs the task's verification steps against the live server |
|    10 | task-gate         | Check task outcomes — retry failed tasks, advance completed ones, or escalate |
|    11 | phase-verify      | Verify each completed phase with static checks, live server runtime verification, and acceptance criteria check before committing |
|    12 | commit-phase      | Auto-commit completed phase and sync tasks.md from native task state |
|    13 | final-validation  | Verify all tasks completed and all checks pass before entering the review pipeline |
|    14 | final-review      | Run parallel comprehensive review at staff engineer bar, score, and iterate until >= 9/10 |
|    15 | architect-signoff | Architect reviews implementation against spec for gaps, drift, and quality |
|    16 | verifier-signoff  | Verifier runs comprehensive feature-level verification against live server |
|    17 | signoff-gate      | Aggregate signoff results — pass, fix and retry, or escalate |
|    18 | wrap-up           | Stop dev server, classify review findings, store learnings, update Linear, output final report |

## Routing notes

- `auto-resume` (2) may jump ahead to any later step — consult its `resume_rules:` for exact conditions
- `task-gate` (10) loops back to `pick-task` (5) if more tasks remain, or advances to `phase-verify` (11)
- `signoff-gate` (17) loops back to `final-review` (14) on failure, or advances to `wrap-up` (18)
- Steps 6–10 are the per-task inner loop; steps 11–12 are the per-phase gate
