# Adaptive Quality Bar

## Idea
Make `project.yaml quality_bar` settings adjust automatically based on historical review scores and retry patterns. If the system consistently scores 9-10 on phase reviews with zero retries, the quality bar should tighten (raise minimum review score, add stricter assertions). If it consistently hits the retry ceiling, the bar may be too high for the current capability level and should loosen temporarily while logging a ticket to investigate why.

## Why Now
The quality bar in project.yaml is manually set and never changes. As the workflow gets better at producing clean code (via accumulated rules from `/learn`), the static bar becomes trivially easy to clear -- it stops driving improvement. Conversely, if a new project type is harder than expected, a too-high bar causes retry thrashing without useful learning.

## How It Closes the Loop
**Currently open**: Quality bar is set once in project.yaml. Review scores are recorded in state.yaml. But scores never feed back to adjust the bar. A system that always scores 10/10 has a bar that's too low -- it's not being challenged.

**After this change**: The quality bar is a moving target that tracks slightly above the system's current performance level -- always reachable but never trivial. This is the difference between a static gate and an adaptive training signal.

## Implementation Sketch
- After each `/learn` cycle, compute rolling average review score over last 5 features
- If avg >= 9.5 with < 10% retry rate: bump `quality_bar.scoring.green_base` by 0.5 (cap at 9.5)
- If avg < 8.0 or retry rate > 40%: lower by 0.5 (floor at 7.0) and create a ticket to investigate
- Write the adjustment to project.yaml with a comment: `# auto-adjusted 2026-04-05 from 9.0 (avg: 9.7, retry: 5%)`
- Track adjustment history in a sidecar file for trend analysis

## Priority
- User value: 5/10 -- useful but the current static bar works fine for now
- Strategic fit: 7/10 -- aligns with "continuously improving" but not urgent
- Technical leverage: 5/10 -- marginal improvement per feature
- Effort: medium
- **Score: 5.0**
