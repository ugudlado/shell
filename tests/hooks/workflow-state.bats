#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

HOOK="workflow-state.sh"

@test "active workflow injects additionalContext" {
  create_workflow_state "test.json" "active" "implement"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ACTIVE AUTONOMOUS WORKFLOW"
}

@test "no workflows dir exits silently" {
  rmdir "$MOCK_WORKFLOWS"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_empty
}

@test "all completed workflows skips" {
  create_workflow_state "done1.json" "completed" "complete"
  create_workflow_state "done2.json" "completed" "complete"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_empty
}

@test "multiple active workflows lists all" {
  create_workflow_state "feat1.json" "active" "implement"
  create_workflow_state "feat2.json" "active" "iterate"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "2"
}

@test "state with scores includes score info" {
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[8.5]" "1"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "8.5"
}

@test "state with uncommitted changes shows warning" {
  create_workflow_state "test.json" "active" "implement"
  # Add last_session with uncommitted changes
  python3 -c "
import json
with open('$MOCK_WORKFLOWS/test.json') as f:
    data = json.load(f)
data['last_session'] = {'uncommitted_changes': True, 'working_directory': '/tmp/test'}
with open('$MOCK_WORKFLOWS/test.json', 'w') as f:
    json.dump(data, f)
"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "WARNING"
}

@test "output is valid JSON structure" {
  create_workflow_state "test.json" "active" "implement"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_valid_json
}

@test "corrupt file among valid ones still detects valid" {
  echo "not json {{{" > "$MOCK_WORKFLOWS/corrupt.json"
  create_workflow_state "valid.json" "active" "implement"
  run run_hook "$HOOK"
  [ "$status" -eq 0 ]
  assert_output_contains "ACTIVE AUTONOMOUS WORKFLOW"
}
