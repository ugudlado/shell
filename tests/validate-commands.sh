#!/usr/bin/env bash
# Validate structural integrity of command files, hooks, and settings
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0
WARNINGS=0

echo "=== Validating Command Structure ==="

for cmd in "$REPO_ROOT"/src/claude/commands/*.md; do
  name=$(basename "$cmd" .md)

  # Check frontmatter
  if ! head -3 "$cmd" | grep -q "^---"; then
    echo "FAIL: $name — missing frontmatter"
    ERRORS=$((ERRORS + 1))
  fi

  # Check description in frontmatter
  if ! grep -q "^description:" "$cmd"; then
    echo "FAIL: $name — missing description field"
    ERRORS=$((ERRORS + 1))
  fi

  # Check $ARGUMENTS placeholder
  if ! grep -q '\$ARGUMENTS' "$cmd"; then
    echo "WARN: $name — no \$ARGUMENTS placeholder"
    WARNINGS=$((WARNINGS + 1))
  fi
done

echo "=== Validating Agent Structure ==="

for agent in "$REPO_ROOT"/src/claude/agents/*.md; do
  name=$(basename "$agent" .md)

  if ! head -5 "$agent" | grep -q "^---"; then
    echo "FAIL: $name — missing frontmatter"
    ERRORS=$((ERRORS + 1))
  fi

  if ! grep -q "^name:" "$agent"; then
    echo "FAIL: $name — missing name field"
    ERRORS=$((ERRORS + 1))
  fi

  if ! grep -q "^model:" "$agent"; then
    echo "FAIL: $name — missing model field"
    ERRORS=$((ERRORS + 1))
  fi
done

echo "=== Validating Skill Structure ==="

for skill in "$REPO_ROOT"/src/claude/skills/*/SKILL.md; do
  name=$(basename "$(dirname "$skill")")

  if ! head -5 "$skill" | grep -q "^---"; then
    echo "FAIL: skill/$name — missing frontmatter"
    ERRORS=$((ERRORS + 1))
  fi

  if ! grep -q "^name:" "$skill"; then
    echo "FAIL: skill/$name — missing name field"
    ERRORS=$((ERRORS + 1))
  fi
done

echo "=== Validating settings.json ==="

SETTINGS="$REPO_ROOT/src/claude/settings.json"
if ! python3 -c "import json; json.load(open('$SETTINGS'))" 2>/dev/null; then
  echo "FAIL: settings.json is invalid JSON"
  ERRORS=$((ERRORS + 1))
else
  echo "OK: settings.json is valid JSON"
fi

echo "=== Validating Hook References ==="

# Check all hooks referenced in settings.json actually exist
HOOKS_DIR="$REPO_ROOT/src/claude/hooks"
for hook in $(grep -oP '(?<=hooks/)[^"]+' "$SETTINGS" 2>/dev/null | sort -u); do
  if [[ ! -f "$HOOKS_DIR/$hook" ]]; then
    echo "FAIL: Hook '$hook' referenced in settings.json but file missing"
    ERRORS=$((ERRORS + 1))
  else
    # Check hook is executable
    if [[ ! -x "$HOOKS_DIR/$hook" ]]; then
      echo "WARN: Hook '$hook' exists but is not executable"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

echo "=== Validating Hook Scripts ==="

# Basic syntax check on all hook scripts
for hook in "$HOOKS_DIR"/*.sh; do
  name=$(basename "$hook")
  if ! bash -n "$hook" 2>/dev/null; then
    echo "FAIL: $name — bash syntax error"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "=== Results ==="
echo "Errors: $ERRORS | Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
  echo "FAILED"
  exit 1
fi
echo "PASSED"
exit 0
