#!/bin/bash
# WorktreeCreate: Set up a feature worktree with our conventions
#
# Convention:
#   Path:   ~/code/feature_worktrees/<NAME>
#   Branch: feature/<NAME>
#
# Setup:
#   1. git worktree add at our conventional path
#   2. Symlink .env* files from main repo
#   3. Install dependencies (pnpm/npm)
#
# Input:  { "name": "HL-80-add-auth", "cwd": "/Users/.../shell", ... }
# Output: absolute path to created worktree (stdout)
#         all other output to stderr

set -euo pipefail

INPUT=$(cat)
NAME=$(echo "$INPUT" | jq -r '.name // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$NAME" ]]; then
  echo "ERROR: No worktree name provided" >&2
  exit 1
fi

# Find the main repo root (top-level worktree)
if [[ -n "$CWD" ]]; then
  MAIN_REPO=$(cd "$CWD" && git worktree list 2>/dev/null | head -1 | awk '{print $1}')
else
  MAIN_REPO=$(git worktree list 2>/dev/null | head -1 | awk '{print $1}')
fi

if [[ -z "$MAIN_REPO" ]]; then
  echo "ERROR: Not in a git repository" >&2
  exit 1
fi

WORKTREE_PATH="$HOME/code/feature_worktrees/$NAME"
BRANCH_NAME="feature/$NAME"

# Create parent directory
mkdir -p "$HOME/code/feature_worktrees" 2>&2

# Create the worktree with a new branch
cd "$MAIN_REPO"
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" >&2 2>&1

# Symlink all gitignored .env* files from main repo
find "$MAIN_REPO" -maxdepth 4 -name '.env*' \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' 2>/dev/null | while read -r env_file; do
  rel_path="${env_file#$MAIN_REPO/}"
  target_dir="$WORKTREE_PATH/$(dirname "$rel_path")"
  mkdir -p "$target_dir"
  ln -sf "$env_file" "$WORKTREE_PATH/$rel_path" 2>/dev/null || true
done
echo "Symlinked .env files from main repo" >&2

# Spec change artifacts live in ~/.config/spec/changes/$REPO_NAME/$NAME/
# No need to move them — they're decoupled from the worktree.

# Install dependencies if package manager is detected
cd "$WORKTREE_PATH"
if [[ -f "pnpm-lock.yaml" ]]; then
  echo "Installing dependencies with pnpm..." >&2
  CI=true pnpm install --frozen-lockfile >&2 2>&1 || CI=true pnpm install >&2 2>&1 || true
elif [[ -f "package-lock.json" ]]; then
  echo "Installing dependencies with npm..." >&2
  npm ci >&2 2>&1 || npm install >&2 2>&1 || true
elif [[ -f "yarn.lock" ]]; then
  echo "Installing dependencies with yarn..." >&2
  yarn install --frozen-lockfile >&2 2>&1 || true
fi

# Print the worktree path to stdout (required by WorktreeCreate contract)
echo "$WORKTREE_PATH"
