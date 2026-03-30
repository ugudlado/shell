#!/bin/bash
# flux-serve.sh — start flux web UI as a background service
# Managed by launchd: ~/Library/LaunchAgents/dev.flux.serve.plist
# Source build: ~/code/flux-src (built with: bun install && bun run build)
# Data file: ~/code/shell/.flux/data.json (shell repo = global task store)
# URL: https://flux.localhost (via portless alias flux 3589)

FLUX_SRC="$HOME/code/flux-src"
DATA_FILE="$HOME/code/shell/.flux/data.json"
PORT=3589

export DATA_FILE
export PORT

exec /Users/spidey/.local/share/mise/installs/node/24.14.1/bin/node \
  "$FLUX_SRC/packages/server/dist/index.js"
