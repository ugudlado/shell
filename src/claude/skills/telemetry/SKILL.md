---
name: telemetry
description: Show SWE-bench-aligned metrics dashboard with benchmark comparisons. Use when the user wants to see workflow analytics, session stats, performance trends, or says "telemetry", "show metrics", "workflow health", "dashboard", "benchmarks".
user-invocable: true
args: []
---

# SWE Metrics Dashboard

Read feature metrics data and present a benchmark-comparable dashboard.

## Data Sources

1. **Primary**: `~/.claude/logs/feature-metrics.jsonl` — one JSON line per completed feature with SWE-bench-aligned metrics
2. **State files**: `$SPEC_CHANGES_DIR/*/state.yaml` — active and recently completed features (may have metrics block)
3. **Error patterns**: `~/.claude/logs/error-patterns.jsonl` — session-level error data

## Benchmark Reference Values

These are published numbers from industry benchmarks (as of April 2026):

| Metric | SWE-bench Verified | Aider Polyglot | Devin | Terminal-Bench |
|--------|-------------------|----------------|-------|----------------|
| Resolve rate | 80.9% (Opus 4.5) | 88% (GPT-5) | 67% PR merge | — |
| Cost/task | $0.05–$0.75 | — | $2.25/ACU | — |
| pass@1 | — | Reported separately | — | — |
| Input/output ratio | ~7–10:1 (research) | — | — | — |

## Steps

### 1. Load Data

Read `~/.claude/logs/feature-metrics.jsonl` (each line is JSON). If it doesn't exist or is empty, check state.yaml files for any features with `metrics:` blocks.

Parse each entry and collect into arrays for aggregation.

### 2. Compute Aggregate Metrics

For all features in the dataset:

**SWE-Bench Comparable**:
- **Resolve rate**: mean of `swe_comparable.resolve_rate` across all features
- **Cost per task** (median): median of `swe_comparable.cost_per_task`
- **Tokens per task** (median): median of `swe_comparable.tokens_per_task`
- **Wall clock** (median): median of `swe_comparable.wall_clock_minutes`

**Workflow Quality**:
- **pass@1**: mean of `workflow_quality.pass_at_1` (Aider-comparable)
- **pass@2**: mean of `workflow_quality.pass_at_2`
- **Review score avg**: mean of `workflow_quality.review_score_avg`
- **Rework rate**: mean of `workflow_quality.rework_rate`
- **Human intervention rate**: mean of `workflow_quality.human_interventions` / mean tasks per feature
- **Regression rate**: mean of `workflow_quality.regression_rate`

**Efficiency**:
- **Cache hit rate**: mean of `efficiency.cache_hit_rate`
- **Input/output ratio**: median of `efficiency.input_output_ratio`
- **Turns per feature** (median): median of `efficiency.turns`
- **Tool calls per feature** (median): median of `efficiency.tool_calls`

### 3. Present Dashboard

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     SWE Metrics Dashboard — {repo}                          ║
║                     {N} features │ {date range}                             ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  RESOLVE RATE              YOURS        SWE-BENCH     AIDER      DEVIN     ║
║  ──────────────────────────────────────────────────────────────────────     ║
║  Task completion           {X}%         80.9%         88%        67%       ║
║  pass@1 (first attempt)    {X}%         —             reported   —         ║
║  pass@2 (within 2 tries)   {X}%         —             reported   —         ║
║  Regression rate           {X}%         0% (req)      —          —         ║
║                                                                             ║
║  COST EFFICIENCY                                                            ║
║  ──────────────────────────────────────────────────────────────────────     ║
║  Cost/task (net)           ${X}         $0.05–$0.75   —          $2.25     ║
║  Cost/task (gross)         ${X}         (HAL basis)   —          —         ║
║  Tokens/task               {X}K         —             —          —         ║
║  Cache hit rate            {X}%         —             —          —         ║
║  Cache savings             {X}%         —             —          —         ║
║                                                                             ║
║  WORKFLOW HEALTH                                                            ║
║  ──────────────────────────────────────────────────────────────────────     ║
║  Review score avg          {X}/10       —             —          —         ║
║  Rework rate               {X}%         —             —          —         ║
║  Human interventions       {X}/feature  —             33%        —         ║
║  Input/output ratio        {X}:1        7–10:1        —          —         ║
║  Turns/feature (median)    {X}          —             —          —         ║
║                                                                             ║
║  TREND (last 5 features)                                                    ║
║  ──────────────────────────────────────────────────────────────────────     ║
║  Cost/task:   ${older} → ... → ${latest}   {↓↑→} trend                    ║
║  Resolve:     {X}% → ... → {X}%            {↓↑→} trend                    ║
║  pass@1:      {X}% → ... → {X}%            {↓↑→} trend                    ║
║  Rework:      {X}% → ... → {X}%            {↓↑→} trend                    ║
║                                                                             ║
║  PER-FEATURE BREAKDOWN                                                      ║
║  ──────────────────────────────────────────────────────────────────────     ║
║  ID          Schema   Tasks  Resolve  pass@1  Cost    Tokens   Time        ║
║  {id}        {type}   {N}    {X}%     {X}%    ${X}    {X}K     {X}m        ║
║  ...                                                                        ║
║                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 4. Suggest Actions

Based on the data:

- If **resolve rate < 90%**: "Task failures detected — review failed tasks for spec clarity issues"
- If **pass@1 < 70%**: "First-attempt success is low — consider improving spec acceptance criteria"
- If **rework rate > 10%**: "High rework — review fix commits for systemic issues (/learn)"
- If **cost/task > $1.00**: "Cost above SWE-bench median — check token efficiency, consider Sonnet for simpler tasks"
- If **cache hit rate < 50%**: "Low cache utilization — context may be changing too frequently between turns"
- If **input/output ratio > 12:1**: "Input tokens dominate — consider trimming context or using progressive loading"
- If **regression rate > 0%**: "Regressions detected — add regression test suite to verify blocks"

### 5. Comparison Context

When presenting numbers, always show the benchmark reference alongside:

- **Resolve rate context**: "SWE-bench Verified top score is 80.9% across 500 diverse GitHub issues. Your rate measures task completion within your workflow, which has more structured specs — so expect higher rates. The meaningful comparison is trending: are you improving?"

- **Cost context**: "SWE-bench cost ranges $0.05 (cheap models) to $0.75 (Opus). Your cost includes full workflow overhead (discovery, spec, review, not just implementation). Cost per task is the fair comparison unit."

- **pass@1 context**: "Aider reports first-attempt and post-retry success separately. Your pass@1 maps to their pass_rate_1. Industry range: 50-75% for complex tasks."

## Notes

- This command is read-only — it doesn't modify any files
- If feature-metrics.jsonl has <3 entries, show individual features without trends
- Data accumulates over time; more features = better trend signal
- Run after /complete-feature or weekly to track progress
