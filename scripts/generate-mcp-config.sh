#!/usr/bin/env bash
# Optional MCP generator stub — extend to emit .mcp.json and .cursor/mcp.json from tools/mcp-registry.yaml
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REG="$ROOT/tools/mcp-registry.yaml"
EXAMPLE="$ROOT/tools/mcp-registry.example.yaml"

if [[ ! -f "$REG" ]]; then
    echo "No $REG"
    echo "  Copy $EXAMPLE → tools/mcp-registry.yaml and add servers, then extend this script to generate JSON."
    exit 0
fi

echo "tools/mcp-registry.yaml exists — generation not implemented yet."
echo "  Manually sync MCP entries to .mcp.json (Claude) and .cursor/mcp.json (Cursor)."
exit 0
