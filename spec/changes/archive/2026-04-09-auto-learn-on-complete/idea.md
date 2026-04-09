# Auto-Learn on Complete

## Idea
Automatically trigger `/learn` as the final step of `archive-completed-change`, so the workflow evaluates itself after every feature without requiring manual invocation. Currently `/learn` must be called explicitly, which means it often gets skipped -- especially in `--auto` mode where the whole point is unattended execution. This closes the most critical open loop: the system finishes work but doesn't reflect on it.

## Why Now
With autopilot mode (`--ff --auto --agents`) becoming the primary execution path, manual post-completion steps are antithetical to the vision. The archive step already computes SWE metrics -- adding a learn trigger is a natural extension that makes every completed feature improve the next one.

## How It Closes the Loop
**Currently open**: `/complete-feature` archives the change and stops. Learnings from the execution only get captured if the user remembers to run `/learn` afterward. In autopilot, this never happens.

**After this change**: Every completed change automatically feeds its execution data (retries, scores, step history, duration outliers) back into step contracts. The system literally gets better with every feature it ships.

## Implementation Sketch
- Add a `post_archive` step in the feature/bugfix/chore schemas that triggers the workflow-evaluator agent
- OR: add a hooksmith rule on the `archive-completed-change` step's completion that spawns `/learn`
- The learn invocation should be non-blocking (failure to learn should not fail the archive)
- In `--auto` mode, the evaluator should apply rule changes without user confirmation

## Priority
- User value: 9/10 -- eliminates the biggest source of lost learnings
- Strategic fit: 10/10 -- directly serves "continuously improving" and "less human intervention"
- Technical leverage: 8/10 -- every future feature benefits from learnings that would otherwise be lost
- Effort: small
- **Score: 8.5**
