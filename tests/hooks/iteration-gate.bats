#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

HOOK="iteration-gate.sh"

@test "no workflows dir skips silently" {
  rmdir "$MOCK_WORKFLOWS"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_empty
}

@test "no active iterate workflow skips" {
  create_workflow_state "test.json" "active" "implement"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_empty
}

@test "score >= 9.0 allows stop" {
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[9.2]" "1" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  # Should NOT have a stopReason telling to continue
  if [[ -n "$output" ]]; then
    [[ "$output" != *"continue iterating"* ]]
  fi
}

@test "score < 9.0 first round injects continue" {
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.5]" "1" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATION GATE"
}

@test "diminishing returns allows stop" {
  # Delta = 8.3 - 8.0 = 0.3, which is < 0.5
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[8.0, 8.3]" "2" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  # Should NOT inject continue guidance
  if [[ -n "$output" ]]; then
    [[ "$output" != *"continue iterating"* ]]
  fi
}

@test "good delta injects continue" {
  # Delta = 8.2 - 7.0 = 1.2, which is >= 0.5
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.0, 8.2]" "2" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATION GATE"
}

@test "max iterations reached allows stop" {
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.5, 8.0, 8.3]" "3" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  if [[ -n "$output" ]]; then
    [[ "$output" != *"continue iterating"* ]]
  fi
}

@test "completed workflow is ignored" {
  create_workflow_state "test.json" "completed" "iterate"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_empty
}

@test "empty scores array handles gracefully" {
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[]" "0" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
}

@test "finds iterate workflow among multiple files" {
  create_workflow_state "other.json" "active" "implement"
  create_workflow_state "iterate-one.json" "active" "iterate" "feature-tdd" "[7.5]" "1" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATION GATE"
}
