#!/bin/bash
# flux-serve.sh — start flux web UI as a background service
# Managed by launchd: ~/Library/LaunchAgents/dev.flux.serve.plist
# Source build: ~/code/flux-src (built with: bun install && bun run build)
# Data file: ~/code/shell/.flux/data.json (GLOBAL task store — all repos use this file)
# CLI usage: FLUX_DATA="$HOME/code/shell/.flux/data.json" flux <cmd>
# Never use `flux init --git` — it creates per-repo data files the UI cannot see
# URL: http://flux.localhost:1355 (via portless alias flux 3589)

FLUX_SRC="$HOME/code/shell/tools/flux-src"
DATA_FILE="$HOME/code/shell/.flux/data.json"
PORT=3589

export DATA_FILE
export FLUX_DATA="$DATA_FILE"
export PORT

exec /Users/spidey/.local/share/mise/installs/node/24.14.1/bin/node \
  "$FLUX_SRC/packages/server/dist/index.js"
