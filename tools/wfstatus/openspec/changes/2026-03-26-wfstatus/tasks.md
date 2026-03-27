# wfstatus — Tasks

## Phase 1: Implementation

### Task 1: Create wfstatus bash script
- **Why**: Core functionality — read workflow JSON files and display as table
- **Files**: `tools/wfstatus/wfstatus` (create)
- **Verify**:
  - `./wfstatus --help` prints usage
  - `./wfstatus` with test data shows formatted table
  - `./wfstatus` with no workflows shows "No active workflows found."
  - `./wfstatus --all` shows all workflows including non-active
  - Exit code is 0 on success
  - Malformed JSON files are skipped with stderr warning

### Task 2: Verify end-to-end with real workflow data
- **Why**: Ensure the tool works with the actual workflow state file created by this /develop session
- **Files**: none (verification only)
- **Verify**:
  - `./wfstatus` shows the current active workflow from this session
  - Output formatting is clean and aligned
  - No errors on stderr
