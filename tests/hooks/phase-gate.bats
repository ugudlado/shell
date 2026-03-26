#!/usr/bin/env bats

load '../helpers/setup'
load '../helpers/assertions'

HOOK="phase-gate.sh"

@test "score >= 9 allows subagent to stop" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Review complete. Score: 9.5/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "score < 9 blocks subagent stop" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Review complete. Score: 7.0/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 2 ]
}

@test "score exactly 9.0 allows" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Score: 9.0/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "no score in transcript allows (not a reviewer)" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Implementer completed task T-3. No review score."
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "no transcript path allows" {
  HOOK_INPUT='{}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "not in feature worktree skips" {
  HOOK_INPUT='{}'
  export MOCK_GIT_BRANCH="main"
  run run_hook_in_dir "/tmp" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "multiple scores uses last one" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "$(printf 'First review Score: 7.0/10\nSecond review Overall: 9.2/10')"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "decimal score 8.9 blocks correctly" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Score: 8.9/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 2 ]
}

@test "score 0/10 blocks stop" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Score: 0/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 2 ]
}

@test "perfect score 10/10 allows" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Score: 10/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "malformed JSON input on stdin does not crash" {
  HOOK_INPUT="not json at all"
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}

@test "stderr contains gate message when blocking" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Score: 7.0/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 2 ]
}
