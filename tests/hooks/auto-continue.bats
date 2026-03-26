#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

HOOK="auto-continue.sh"

@test "active workflow saves state and outputs stopReason" {
  create_workflow_state "test-feature.json" "active" "implement"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "AUTONOMOUS WORKFLOW"
  assert_output_contains "IMPLEMENT"
}

@test "no workflow state exits silently" {
  # No state files created
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "completed workflow is skipped" {
  create_workflow_state "test-feature.json" "completed" "complete"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
  # Should not output workflow active message
  if [[ -n "$output" ]]; then
    [[ "$output" != *"AUTONOMOUS WORKFLOW"* ]]
  fi
}

@test "specify phase outputs correct resume message" {
  create_workflow_state "test-feature.json" "active" "specify"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "SPECIFY"
}

@test "implement phase outputs correct resume message" {
  create_workflow_state "test-feature.json" "active" "implement"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "IMPLEMENT"
}

@test "iterate phase outputs correct resume message" {
  create_workflow_state "test-feature.json" "active" "iterate"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATE"
}

@test "not in feature context exits silently" {
  create_workflow_state "test-feature.json" "active" "implement"
  export MOCK_GIT_BRANCH="main"
  HOOK_INPUT='{}'
  run run_hook_in_dir "/tmp" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "git commit with single quotes does not break state" {
  create_workflow_state "test-feature.json" "active" "implement"
  export MOCK_GIT_LAST_COMMIT="abc1234 fix: it's a 'quoted' thing"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]
}

@test "complete phase outputs correct resume message" {
  create_workflow_state "test-feature.json" "active" "complete"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]
  assert_output_contains "COMPLETE"
}

@test "read-only state file does not crash hook" {
  create_workflow_state "test-feature.json" "active" "implement"
  chmod 444 "$MOCK_WORKFLOWS/test-feature.json"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]
}

@test "stopReason output is valid JSON" {
  create_workflow_state "test-feature.json" "active" "implement"
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]
  assert_valid_json
}
