# tools/

Optional **MCP registry** source for generating editor-specific MCP config.

## Files

| File | Purpose |
|------|---------|
| `mcp-registry.example.yaml` | Example shape for listing MCP servers; copy to `mcp-registry.yaml` (gitignored if you add it to `.gitignore`) for local use. |

## Claude vs Cursor outputs

- **Claude Code** often uses project or user `.mcp.json` (see `src/claude/skills/shadcn/mcp.md`).
- **Cursor** uses `.cursor/mcp.json`.

There is **no** one-size-fits-all JSON schema in this repo yet. When you add servers, duplicate the JSON into both places or extend `scripts/generate-mcp-config.sh` to emit them from a future structured registry.

## Script

`scripts/generate-mcp-config.sh` — stub: exits 0 with instructions if `mcp-registry.yaml` is missing; otherwise reminds you to sync MCP JSON manually until generation is implemented.
