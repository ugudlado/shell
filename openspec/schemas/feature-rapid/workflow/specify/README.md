# specify workflow — feature-rapid

Identical step sequence to `feature-tdd/specify`. Steps execute in `order:` sequence.

| order | step id              | description |
|------:|----------------------|-------------|
|     1 | parse-args           | Parse flags and feature description from $ARGUMENTS, auto-detect schema if no flag provided |
|     2 | search-memory        | Search claude-mem for relevant patterns and past decisions before any codebase work |
|     3 | create-ticket        | Create Linear ticket early using feature description, extract ticket ID for use in identifier |
|     4 | discovery            | Phase 0 Discovery — brainstorm intent, explore alternatives, challenge assumptions before committing to an approach |
|     5 | discovery-gate       | Verify Discovery Brief meets all acceptance criteria before proceeding to agents |
|     6 | design               | Architect produces spec and design artifacts from the approved Discovery Brief |
|     7 | generate-id-worktree | Derive feature identifier from Linear ID or date plus slug, then create the worktree via EnterWorktree |
|     8 | generate-artifacts   | Scaffold change directory, write .openspec.yaml and discovery.md, then let Architect generate spec and design |
|     9 | generate-diagrams    | Assess feature complexity, generate Mermaid diagrams, render via draw.io, and link from spec.md |
|    10 | review               | Multi-dimensional parallel review covering UX, architecture, security, and cross-model (Codex) perspectives |
|    11 | user-review          | Present all artifacts to the user for approval; wait for confirmation or incorporate feedback |
|    12 | store-commit-report  | Save decisions as memory, commit artifacts to feature branch, update Linear, and output the final report |

## Routing notes

- `discovery-gate` (5) is a quality gate; loops back into discovery if criteria unmet
- All other steps are linear
