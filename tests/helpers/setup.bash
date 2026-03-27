# Common test setup for BATS hook tests
# Sources this file in each .bats test with: load '../helpers/setup'

# Path to the hook scripts under test
HOOKS_DIR="$(cd "$(dirname "${BATS_TEST_FILENAME}")/../.." && pwd)/src/claude/hooks"

setup() {
  # Create isolated temp environment
  TEST_DIR="$(mktemp -d)"
  REAL_HOME="$HOME"
  export HOME="$TEST_DIR"

  # Create workflow state directory
  export MOCK_WORKFLOWS="$HOME/.claude/workflows"
  mkdir -p "$MOCK_WORKFLOWS"

  # Create mock bin directory for git/openspec mocks
  MOCK_BIN="$TEST_DIR/bin"
  mkdir -p "$MOCK_BIN"
  export PATH="$MOCK_BIN:$PATH"

  # Create mock git that returns configurable values
  cat > "$MOCK_BIN/git" << 'MOCKGIT'
#!/usr/bin/env bash
case "$*" in
  "rev-parse --abbrev-ref HEAD")
    echo "${MOCK_GIT_BRANCH:-main}" ;;
  "status --porcelain"*)
    echo "${MOCK_GIT_STATUS:-}" ;;
  "log --oneline -1")
    echo "${MOCK_GIT_LAST_COMMIT:-abc1234 test commit}" ;;
  "rev-parse --show-toplevel")
    echo "${MOCK_GIT_TOPLEVEL:-$PWD}" ;;
  "worktree list"*)
    echo "${MOCK_GIT_WORKTREE:-$PWD (bare)}" ;;
  *)
    echo "mock-git: $*" ;;
esac
MOCKGIT
  chmod +x "$MOCK_BIN/git"

  # Create mock openspec
  cat > "$MOCK_BIN/openspec" << 'MOCKSPEC'
#!/usr/bin/env bash
echo "${MOCK_OPENSPEC_OUTPUT:-{}}"
MOCKSPEC
  chmod +x "$MOCK_BIN/openspec"

  # Default: simulate being in a feature worktree
  MOCK_WORKTREE_DIR="$TEST_DIR/code/feature_worktrees/test-feature"
  mkdir -p "$MOCK_WORKTREE_DIR"
  export MOCK_GIT_BRANCH="feature/test-feature"
}

teardown() {
  export HOME="$REAL_HOME"
  rm -rf "$TEST_DIR"
}

# Helper: create a workflow state file
create_workflow_state() {
  local filename="${1:-test-feature.json}"
  local status="${2:-active}"
  local phase="${3:-implement}"
  local schema="${4:-feature-tdd}"
  local scores="${5:-[]}"
  local iteration_count="${6:-0}"
  local max_iterations="${7:-3}"

  cat > "$MOCK_WORKFLOWS/$filename" << EOF
{
  "feature_id": "test-feature",
  "phase": "$phase",
  "schema": "$schema",
  "description": "Test feature description",
  "started_at": "2026-03-25T10:00:00Z",
  "flags": {
    "no_linear": false,
    "no_iterate": false,
    "max_iterations": $max_iterations
  },
  "iteration_count": $iteration_count,
  "quality_scores": $scores,
  "status": "$status"
}
EOF
}

# Helper: create a mock transcript file with a score
create_transcript() {
  local path="$1"
  local content="${2:-}"
  mkdir -p "$(dirname "$path")"
  echo "$content" > "$path"
}

# Helper: run a hook with JSON input on stdin
run_hook() {
  local hook="$1"
  shift
  echo "${HOOK_INPUT:-{}}" | bash "$HOOKS_DIR/$hook" "$@"
}

# Helper: run a hook in a specific directory
run_hook_in_dir() {
  local dir="$1"
  local hook="$2"
  shift 2
  (cd "$dir" && echo "${HOOK_INPUT:-{}}" | bash "$HOOKS_DIR/$hook" "$@")
}
