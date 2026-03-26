#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

@test "fresh workflow state has all required fields" {
  create_workflow_state "test.json" "active" "specify" "feature-tdd" "[]" "0" "3"

  # Verify all required fields
  assert_file_json "$MOCK_WORKFLOWS/test.json" "status" "active"
  assert_file_json "$MOCK_WORKFLOWS/test.json" "phase" "specify"
  assert_file_json "$MOCK_WORKFLOWS/test.json" "schema" "feature-tdd"
  assert_file_json "$MOCK_WORKFLOWS/test.json" "feature_id" "test-feature"
}

@test "phase transition updates correctly" {
  create_workflow_state "test.json" "active" "specify"

  # Simulate phase transition
  python3 -c "
import json
with open('$MOCK_WORKFLOWS/test.json') as f:
    data = json.load(f)
data['phase'] = 'implement'
data['feature_id'] = 'HL-99-test-feature'
with open('$MOCK_WORKFLOWS/test.json', 'w') as f:
    json.dump(data, f)
"
  assert_file_json "$MOCK_WORKFLOWS/test.json" "phase" "implement"
  assert_file_json "$MOCK_WORKFLOWS/test.json" "feature_id" "HL-99-test-feature"
}

@test "iteration scoring accumulates correctly" {
  create_workflow_state "test.json" "active" "iterate" "feature-tdd" "[7.5]" "1" "3"

  # Add a second score
  python3 -c "
import json
with open('$MOCK_WORKFLOWS/test.json') as f:
    data = json.load(f)
data['quality_scores'].append(8.2)
data['iteration_count'] = 2
with open('$MOCK_WORKFLOWS/test.json', 'w') as f:
    json.dump(data, f)
"
  local scores
  scores=$(python3 -c "import json; print(len(json.load(open('$MOCK_WORKFLOWS/test.json'))['quality_scores']))")
  [ "$scores" -eq 2 ]

  local count
  count=$(python3 -c "import json; print(json.load(open('$MOCK_WORKFLOWS/test.json'))['iteration_count'])")
  [ "$count" -eq 2 ]
}

@test "workflow completion stops detection" {
  create_workflow_state "test.json" "active" "iterate"

  # Complete it
  python3 -c "
import json
with open('$MOCK_WORKFLOWS/test.json') as f:
    data = json.load(f)
data['status'] = 'completed'
with open('$MOCK_WORKFLOWS/test.json', 'w') as f:
    json.dump(data, f)
"
  # workflow-state.sh should not detect it
  run run_hook "workflow-state.sh"
  [ "$status" -eq 0 ]
  assert_output_empty
}

@test "corrupt state file handled gracefully" {
  echo "not valid json {{{" > "$MOCK_WORKFLOWS/corrupt.json"

  # All hooks should handle this gracefully (exit 0)
  run run_hook "workflow-state.sh"
  [ "$status" -eq 0 ]

  run run_hook "iteration-gate.sh"
  [ "$status" -eq 0 ]
}
