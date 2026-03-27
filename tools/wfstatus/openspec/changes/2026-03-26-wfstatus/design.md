# wfstatus — Technical Design

## Architecture

Single bash script (`wfstatus`) that:
1. Parses CLI arguments (`--all`, `--help`)
2. Reads JSON files from `~/.claude/workflows/`
3. Uses `jq` to extract fields from each file
4. Formats output as an ASCII table

## Data Flow

```
~/.claude/workflows/*.json → jq parse → filter by status → format table → stdout
```

## File Structure

```
tools/wfstatus/
├── wfstatus              # Main executable (bash script)
└── openspec/             # Spec artifacts
```

## Key Decisions

- **jq dependency**: `jq` is the standard JSON CLI tool and is already available in this environment. Falls back to error message if not installed.
- **No color by default**: Plain ASCII table for pipe-friendliness. Could add `--color` later.
- **Score display**: Show the latest overall evaluation score if available, otherwise `-`.
- **Feature ID fallback**: If `feature_id` is null (pre-specify phase), show the filename slug instead.

## Error Handling

- Missing directory: print "No active workflows found." (not an error)
- No JSON files: print "No active workflows found."
- Malformed JSON: skip file, print warning to stderr
- jq not installed: print error to stderr, exit 1
