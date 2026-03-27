#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

HOOK="iteration-gate.sh"

@test "scenario: fast convergence — stops at quality threshold" {
  # Round 1: 7.0, Round 2: 9.2 → stop (>= 9.0)
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.0, 9.2]" "2" "5"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  # Should not contain continue guidance
  if [[ -n "$output" ]]; then
    [[ "$output" != *"continue iterating"* ]]
  fi
}

@test "scenario: diminishing returns — stops when delta < 0.5" {
  # Round 1: 7.0, Round 2: 8.2, Round 3: 8.5 → delta=0.3, stop
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.0, 8.2, 8.5]" "3" "5"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  if [[ -n "$output" ]]; then
    [[ "$output" != *"continue iterating"* ]]
  fi
}

@test "scenario: max iterations — stops at cap" {
  # 3 rounds with max=3, score still 8.2 → stop (max reached)
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.0, 7.8, 8.2]" "3" "3"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  if [[ -n "$output" ]]; then
    [[ "$output" != *"continue iterating"* ]]
  fi
}

@test "scenario: steady improvement — continues when delta >= 0.5 and < 9" {
  # 2 rounds with max=5, score 8.0, delta 1.0 → continue
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.0, 8.0]" "2" "5"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATION GATE"
}
