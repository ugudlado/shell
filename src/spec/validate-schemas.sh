#!/usr/bin/env bash
# Schema Validator — structural validation for workflow schemas
# Usage: bash src/spec/validate-schemas.sh [SPEC_HOME]
# Exit 0 on pass, 1 on any failure.

set -euo pipefail

SPEC_HOME="${1:-${SPEC_HOME:-$HOME/.config/spec}}"
SCHEMAS_DIR="$SPEC_HOME/schemas"
STEPS_DIR="$SPEC_HOME/steps"
TEMPLATES_DIR="$SPEC_HOME/templates"

# Find project.yaml — walk up from cwd to find spec/project.yaml
find_project_yaml() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/spec/project.yaml" ]]; then
      echo "$dir/spec/project.yaml"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

ERRORS=0
WARNINGS=0
CHECKS=0
SCHEMA_COUNT=0

pass() { CHECKS=$((CHECKS + 1)); echo "  PASS: $1"; }
fail() { CHECKS=$((CHECKS + 1)); ERRORS=$((ERRORS + 1)); echo "  FAIL: $1"; }
warn() { WARNINGS=$((WARNINGS + 1)); echo "  WARN: $1"; }

echo "=== Schema Validator ==="
echo "SPEC_HOME: $SPEC_HOME"
echo ""

# Collect all schema files
SCHEMA_FILES=("$SCHEMAS_DIR"/*.yaml)
if [[ ${#SCHEMA_FILES[@]} -eq 0 ]]; then
  echo "FAIL: No schema files found in $SCHEMAS_DIR"
  exit 1
fi

# Stale reference patterns to check across ALL files
STALE_PATTERNS=("fill_forward" "explore-or-diagnose" "auto_approve_phase[^s]")

# --- Per-schema checks ---
for schema_file in "${SCHEMA_FILES[@]}"; do
  schema_name=$(basename "$schema_file" .yaml)
  SCHEMA_COUNT=$((SCHEMA_COUNT + 1))
  echo "--- Schema: $schema_name ---"

  # Check 1: Required fields
  for field in "^name:" "^version:" "^uses:" "^phases:"; do
    if grep -q "$field" "$schema_file"; then
      pass "Required field: $field"
    else
      fail "Missing required field: $field"
    fi
  done

  # Check 2: Step resolution — every step ID resolves to a file
  # Extract step IDs from steps: blocks only using awk
  unique_steps=()
  while IFS= read -r step; do
    [[ -n "$step" ]] && unique_steps+=("$step")
  done < <(awk '
    /^[[:space:]]+steps:/ { in_steps=1; next }
    in_steps && /^[[:space:]]*[a-z]/ && !/^[[:space:]]{6,}/ { in_steps=0 }
    in_steps && /^[[:space:]]+-[[:space:]]/ {
      line = $0
      # Remove leading whitespace and "- "
      gsub(/^[[:space:]]*- /, "", line)
      # Skip object entries, rules, etc
      if (line ~ /^id:/) { gsub(/^id:[[:space:]]*/, "", line); print line; next }
      if (line ~ /^(file:|template:|requires:|rules_when:|extra_rules:|repeat_until:)/) next
      if (line ~ /^-[[:space:]]/) next
      # Extract step ID (before "if" or "repeat")
      gsub(/ if .*$/, "", line)
      gsub(/ repeat .*$/, "", line)
      # Only print if looks like a step ID (lowercase with hyphens)
      if (line ~ /^[a-z][a-z0-9-]*$/) print line
    }
  ' "$schema_file" | sort -u)

  for step in "${unique_steps[@]}"; do
    if [[ -f "$STEPS_DIR/$step.yaml" ]]; then
      pass "Step resolves: $step"
    else
      fail "Step missing: $step → $STEPS_DIR/$step.yaml not found"
    fi
  done

  # Check 3: Flag consistency — flags in "if" conditions exist in defaults or flags block
  # Extract known flag keys from defaults: block
  known_flags=""
  in_defaults=false
  while IFS= read -r line; do
    if echo "$line" | grep -q "^defaults:"; then in_defaults=true; continue; fi
    if $in_defaults; then
      if echo "$line" | grep -qE "^[a-z]|^$"; then in_defaults=false; continue; fi
      key=$(echo "$line" | sed 's/^[[:space:]]*//' | cut -d: -f1)
      [[ -n "$key" ]] && known_flags="$known_flags $key"
    fi
  done < "$schema_file"
  # Extract flag effect keys from sets: { key: value }
  while IFS= read -r line; do
    keys=$(echo "$line" | sed 's/.*{//' | sed 's/}.*//' | tr ',' '\n' | sed 's/^[[:space:]]*//' | cut -d: -f1)
    for k in $keys; do
      [[ -n "$k" ]] && known_flags="$known_flags $k"
    done
  done < <(grep "sets:" "$schema_file")

  # Extract "if <flag>" conditions from steps: blocks and check
  checked_flags=""
  while IFS= read -r cond_line; do
    flag=$(echo "$cond_line" | grep -oE 'if (not )?[a-z_]+' | tail -1 | sed 's/if //' | sed 's/not //')
    [[ -z "$flag" ]] && continue
    echo "$checked_flags" | grep -qw "$flag" && continue
    checked_flags="$checked_flags $flag"
    if echo "$known_flags" | grep -qw "$flag"; then
      pass "Flag in condition exists: $flag"
    else
      fail "Flag in condition unknown: '$flag' not in defaults or flags"
    fi
  done < <(awk '/^[[:space:]]+steps:/{s=1} s && /if /{print} /^[[:space:]]*[a-z]/ && !/^[[:space:]]{4,}/ && s{s=0}' "$schema_file")

  # Check 4: Phase dependencies — requires references existing phase
  # Extract phase names (lines matching "  - name: <value>" under phases:)
  phase_names_str=""
  while IFS= read -r line; do
    name=$(echo "$line" | sed 's/^[[:space:]]*- name:[[:space:]]*//')
    # Also handle non-list form "    name: <value>"
    [[ "$name" == "$line" ]] && name=$(echo "$line" | sed 's/^[[:space:]]*name:[[:space:]]*//')
    [[ -n "$name" && "$name" != "$line" ]] && phase_names_str="$phase_names_str $name"
  done < <(grep -E '^\s+(- )?name:' "$schema_file")

  # Check requires: references
  while IFS= read -r line; do
    req=$(echo "$line" | sed 's/^[[:space:]]*requires:[[:space:]]*//')
    [[ -z "$req" ]] && continue
    # Skip array-style requires (output dependencies like [discovery.md])
    [[ "$req" =~ ^\[ ]] && continue
    if echo "$phase_names_str" | grep -qw "$req"; then
      pass "Phase dependency: $req exists"
    else
      fail "Phase dependency: $req not found in schema phases"
    fi
  done < <(grep -E '^\s+requires:' "$schema_file")

  # Check 5: Template existence — output templates exist
  schema_templates_dir="$TEMPLATES_DIR/$schema_name"
  while IFS= read -r line; do
    template=$(echo "$line" | sed 's/^[[:space:]]*template:[[:space:]]*//')
    [[ -z "$template" ]] && continue
    if [[ -f "$schema_templates_dir/$template" ]]; then
      pass "Template exists: $schema_name/$template"
    else
      fail "Template missing: $schema_templates_dir/$template"
    fi
  done < <(grep -E '^\s+template:' "$schema_file")

  echo ""
done

# --- Cross-schema checks ---
echo "--- Cross-Schema Checks ---"

# Check 6: Stale references across all spec files
for pattern in "${STALE_PATTERNS[@]}"; do
  matches=$(grep -rl "$pattern" "$SCHEMAS_DIR" "$STEPS_DIR" 2>/dev/null || true)
  if [[ -z "$matches" ]]; then
    pass "No stale reference: $pattern"
  else
    fail "Stale reference '$pattern' found in: $(echo "$matches" | tr '\n' ', ')"
  fi
done

# Check 7: Signoff policy coverage
PROJECT_YAML=$(find_project_yaml 2>/dev/null || echo "")
if [[ -n "$PROJECT_YAML" ]]; then
  # Collect all phase names from all schemas
  all_phases=()
  for schema_file in "${SCHEMA_FILES[@]}"; do
    while IFS= read -r line; do
      name=$(echo "$line" | sed 's/^[[:space:]]*name:[[:space:]]*//')
      [[ -n "$name" ]] && all_phases+=("$name")
    done < <(grep -E '^\s+name:' "$schema_file" | head -20)
  done
  unique_phases=($(printf '%s\n' "${all_phases[@]}" | sort -u))

  for phase in "${unique_phases[@]}"; do
    if grep -q "^  $phase:" "$PROJECT_YAML"; then
      pass "Signoff policy covers phase: $phase"
    else
      fail "Signoff policy missing for phase: $phase"
    fi
  done

  # Check schemas list in project.yaml
  for schema_file in "${SCHEMA_FILES[@]}"; do
    sname=$(basename "$schema_file" .yaml)
    if grep -q "^  - $sname$" "$PROJECT_YAML"; then
      pass "Schema listed in project.yaml: $sname"
    else
      fail "Schema not in project.yaml: $sname"
    fi
  done
else
  warn "project.yaml not found — skipping signoff policy checks"
fi

echo ""

# --- Summary ---
echo "=== Summary ==="
echo "Schemas: $SCHEMA_COUNT"
echo "Checks: $CHECKS"
echo "Passed: $((CHECKS - ERRORS))"
echo "Failed: $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "RESULT: FAIL ($ERRORS errors)"
  exit 1
else
  echo ""
  echo "RESULT: PASS"
  exit 0
fi
