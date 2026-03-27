#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

@test "scenario: interrupt during implement — auto-continue outputs resume, workflow-state detects" {
  create_workflow_state "test-feature.json" "active" "implement"

  # Simulate auto-continue — it should output a stopReason
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]
  # Hook should output resume message (may or may not update state depending on matching)
  assert_output_contains "IMPLEMENT"

  # Now simulate new session — workflow-state should detect the active workflow
  run run_hook "workflow-state.sh"
  [ "$status" -eq 0 ]
  assert_output_contains "ACTIVE AUTONOMOUS WORKFLOW"
}

@test "scenario: interrupt during iterate — scores preserved" {
  create_workflow_state "test-feature.json" "active" "iterate" "feature-tdd" "[7.5, 8.2]" "2" "3"

  # Auto-continue saves state
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]

  # Scores should still be in the state file
  local scores_count
  scores_count=$(python3 -c "import json; print(len(json.load(open('$MOCK_WORKFLOWS/test-feature.json'))['quality_scores']))")
  [ "$scores_count" -eq 2 ]
}

@test "scenario: iteration-gate and auto-continue both fire during iterate" {
  create_workflow_state "test-feature.json" "active" "iterate" "feature-tdd" "[7.5]" "1" "3"

  # iteration-gate fires first
  run run_hook "iteration-gate.sh"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATION GATE"

  # auto-continue fires second
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATE"
}

@test "scenario: iterate phase interrupt preserves scores for next session" {
  create_workflow_state "test-feature.json" "active" "iterate" "feature-tdd" "[7.5, 8.2]" "2" "3"

  # auto-continue saves state
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "auto-continue.sh"
  [ "$status" -eq 0 ]

  # Scores still intact
  local count
  count=$(python3 -c "import json; print(len(json.load(open('$MOCK_WORKFLOWS/test-feature.json'))['quality_scores']))")
  [ "$count" -eq 2 ]

  # workflow-state detects it
  run run_hook "workflow-state.sh"
  [ "$status" -eq 0 ]
  assert_output_contains "8.2"

  # iteration-gate still sees iterate phase
  run run_hook "iteration-gate.sh"
  [ "$status" -eq 0 ]
  assert_output_contains "ITERATION GATE"
}

@test "scenario: completed workflow — not detected on resume" {
  create_workflow_state "test-feature.json" "completed" "complete"

  run run_hook "workflow-state.sh"
  [ "$status" -eq 0 ]
  assert_output_empty
}
