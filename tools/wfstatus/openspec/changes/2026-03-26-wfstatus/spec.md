# wfstatus — Active Workflow Status Display

## Motivation

The `/develop` workflow persists state to `~/.claude/workflows/*.json` for cross-session resumption. There is currently no way to quickly see all active workflows, their current phase, schema type, and feature ID from the command line. This tool fills that gap.

## Requirements

### Functional
1. Read all `*.json` files from `~/.claude/workflows/`
2. Parse each file for: `feature_id`, `phase`, `schema`, `status`, `quality_scores`
3. Filter to only `"status": "active"` workflows (skip completed/archived)
4. Display results in a formatted ASCII table with columns: Feature ID, Phase, Schema, Status, Score
5. If no active workflows exist, print "No active workflows found." to stdout
6. Support `--all` flag to show all workflows (not just active)
7. Support `--help` flag to show usage

### Non-Functional
- Exit 0 on success
- Exit 1 on error (e.g., unreadable JSON)
- Pure bash — no external dependencies beyond `jq` (commonly available)
- Gracefully handle missing `~/.claude/workflows/` directory

## Schema

`feature-rapid` — this is a simple CLI utility with no test requirements.

## Acceptance Criteria
- [ ] Running `wfstatus` with active workflows shows a formatted table
- [ ] Running `wfstatus` with no active workflows shows "No active workflows found."
- [ ] Running `wfstatus --all` shows all workflows regardless of status
- [ ] Running `wfstatus --help` shows usage information
- [ ] Exit code 0 on success, 1 on error
- [ ] Handles missing workflows directory gracefully
- [ ] Handles malformed JSON files gracefully (skip with warning to stderr)
