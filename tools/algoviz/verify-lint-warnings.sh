#!/usr/bin/env bash
# Regression test: verify that the 2 lint warnings exist before fix.
# This script should EXIT 0 if the warnings are found (bug confirmed),
# and EXIT 1 if they are NOT found (bug already fixed or not reproducible).

set -euo pipefail
cd "$(dirname "$0")"

OUTPUT=$(npx eslint@8 --no-eslintrc --env node,es2022 \
  --rule '{"no-undef": "error", "no-unused-vars": "warn"}' \
  levenshtein-algorithm.js scan-algorithm.js 2>&1 || true)

FOUND=0

if echo "$OUTPUT" | grep -q "'prev' is assigned a value but never used"; then
  echo "CONFIRMED: levenshtein-algorithm.js — unused 'prev' variable"
  FOUND=$((FOUND + 1))
else
  echo "NOT FOUND: levenshtein-algorithm.js — unused 'prev' variable"
fi

if echo "$OUTPUT" | grep -q "'maxFloor' is defined but never used"; then
  echo "CONFIRMED: scan-algorithm.js — unused 'maxFloor' parameter"
  FOUND=$((FOUND + 1))
else
  echo "NOT FOUND: scan-algorithm.js — unused 'maxFloor' parameter"
fi

if [ "$FOUND" -eq 2 ]; then
  echo ""
  echo "RESULT: Both warnings confirmed ($FOUND/2). Bug is reproducible."
  exit 0
else
  echo ""
  echo "RESULT: Only $FOUND/2 warnings found. Bug may already be fixed."
  exit 1
fi
