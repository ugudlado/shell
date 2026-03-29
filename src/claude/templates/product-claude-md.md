# [Product Name]

[One paragraph: what this product is and why it exists.]

## Product Vision

[What this product aims to become. The ideator agent reads this to evaluate strategic fit of new features. Be specific about the end state, not the current state.]

## Target Users

[Who uses this product and what they need. The ideator agent reads this to evaluate user value of features. List 1-3 personas with their goals.]

## Development

```bash
# How to run locally
[commands]

# How to run tests
[commands]
```

## Quality Gates

| Check | Command | When |
|-------|---------|------|
| Tests | `[command]` | Every phase |
| Lint | `[command]` | Every phase |
| Format | `[command]` | Before commit |

[Note any checks that are N/A for this project.]

## Architecture

[High-level structure: file patterns, module organization, shared vs per-feature files.]

## Code Rules

[Start empty. The evaluator agent will populate this section automatically as it learns product-specific patterns from code reviews. Each rule traces back to a real issue found during development.]

## Adding a New [Feature Unit]

[Step-by-step template for the most common development pattern in this product. This guides the implementer agent.]

## Metrics Summary

[Auto-populated by /autopilot after each cycle. Shows quality trends, features built, rules learned.]

---

<!--
USAGE: Drop this CLAUDE.md in any project root, fill in the sections above,
then run `/autopilot --cycles N` to start the self-improving development loop.

The system will:
1. Research and generate a feature backlog (ideator agent)
2. Build features using /develop (architect → implementer → reviewer → verifier)
3. Learn from each cycle and auto-append code rules to this file
4. Each cycle benefits from rules learned in previous cycles

Users can also add ideas directly to backlog.json.
-->
