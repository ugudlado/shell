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

@test "score-like text early in transcript is ignored" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  # Build a transcript with a failing score on line 2, then >20 filler lines,
  # so the early score falls outside the tail -20 window.
  {
    echo "Subagent started review process."
    echo "Score: 3/10"
    echo "Filler line 1 — discussing architecture."
    echo "Filler line 2 — checking component hierarchy."
    echo "Filler line 3 — verifying API contracts."
    echo "Filler line 4 — reviewing error handling."
    echo "Filler line 5 — examining test coverage."
    echo "Filler line 6 — analyzing performance."
    echo "Filler line 7 — reviewing dependencies."
    echo "Filler line 8 — checking accessibility."
    echo "Filler line 9 — validating security."
    echo "Filler line 10 — reviewing documentation."
    echo "Filler line 11 — checking edge cases."
    echo "Filler line 12 — verifying state management."
    echo "Filler line 13 — reviewing data flow."
    echo "Filler line 14 — checking type safety."
    echo "Filler line 15 — validating input handling."
    echo "Filler line 16 — reviewing logging."
    echo "Filler line 17 — checking config loading."
    echo "Filler line 18 — verifying output format."
    echo "Filler line 19 — reviewing cleanup logic."
    echo "Filler line 20 — checking integration points."
    echo "Filler line 21 — final summary."
    echo "No review score in the tail window."
  } > "$TRANSCRIPT"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  # The Score: 3/10 on line 2 is outside tail -20, so no score found — should pass
  [ "$status" -eq 0 ]
}

@test "stderr contains gate message when blocking" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "Score: 7.0/10"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 2 ]
}

@test "review score at end of transcript still detected" {
  TRANSCRIPT="$TEST_DIR/transcript.txt"
  create_transcript "$TRANSCRIPT" "$(printf 'Starting review.\nChecking code quality.\nFound 2 issues.\nFixed them.\nRe-checking.\nAll good now.\nFinal assessment.\nCode follows conventions.\nTest coverage adequate.\nScore: 9.5/10\nReview complete.')"
  HOOK_INPUT='{"transcript_path": "'$TRANSCRIPT'"}'
  run run_hook_in_dir "$MOCK_WORKTREE_DIR" "$HOOK"
  [ "$status" -eq 0 ]
}
