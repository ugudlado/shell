# complete workflow — feature-rapid

Identical step sequence to `feature-tdd/complete`. Steps execute in `order:` sequence.

| order | step id           | description |
|------:|-------------------|-------------|
|     1 | verify-completion | Confirm all tasks are done and the worktree is clean before merging |
|     2 | sync-main         | Merge origin/main into the feature branch and resolve any conflicts |
|     3 | archive           | Archive the completed OpenSpec change and commit the result |
|     4 | retrospective     | Compare spec predictions against actuals and write telemetry |
|     5 | close-out         | Close the Linear ticket and store final feature learnings in memory |
|     6 | merge-cleanup     | Commit remaining changes, merge feature branch to main, and remove the worktree |
|     7 | reflect           | Extract permanent learnings from session mistakes into memory |
|     8 | report            | Output the final completion report with metrics to the user |

## Routing notes

- All steps are linear — no branching or loops in this phase
