---
name: rtk
description: This skill should be used when running any shell command that has an RTK equivalent — including "git status", "ls", "grep", "find", "cat/head/tail", "pnpm test", "cargo build", "curl", "gh", "docker", "kubectl", "vitest", "pytest", "tsc", "eslint", and any other CLI operation where token savings apply. Also use when the user asks about "rtk gain", "token savings", "rtk discover", or "why use rtk".
---

# RTK — Rust Token Killer

A high-performance CLI proxy that filters and summarizes command output before it reaches the LLM context window. Savings range from 60–90% on common dev operations.

## How It Works

The Claude Code hook (`rtk-rewrite.sh`) intercepts every `Bash` tool call via `PreToolUse` and rewrites supported commands transparently. No manual `rtk` prefix needed — `git status` becomes `rtk git status` automatically.

**Requirement**: `rtk >= 0.23.0` and `jq` must be in PATH. The hook exits cleanly if either is missing.

---

## Command Reference

Always prefer the RTK equivalent when running these commands. The hook handles rewrites automatically, but knowing the mapping helps when debugging or calling rtk directly.

### File System

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `ls -la` | `rtk ls` | Compact directory listing |
| `tree` | `rtk tree` | Token-optimized directory tree |
| `find …` | `rtk find` | Compact tree output, accepts native find flags |
| `head -5 file` | `rtk read file` | Intelligent file reading with filtering |
| `cat file` | `rtk read file` | Same — filters noise before returning |
| `wc -l …` | `rtk wc` | Compact word/line/byte count |

### Git & GitHub

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `git status` / `git add` / `git diff` | `rtk git` | Compact git output |
| `git log` | `rtk git log` | Filtered log |
| `gh api …` | `rtk gh` | Token-optimized GitHub CLI |
| `gt …` | `rtk gt` | Graphite stacked PR commands |

### Search & Text

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `grep -n` | `rtk grep` | Strips whitespace, truncates, groups by file |
| `diff` | `rtk diff` | Ultra-condensed — only changed lines |

### JavaScript / Node

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `pnpm test` / `pnpm run` | `rtk pnpm` | Ultra-compact pnpm output |
| `npm run …` | `rtk npm` | Filtered output, strips boilerplate |
| `npx …` | `rtk npx` | Auto-routes to tsc/eslint/prisma filters |
| `npx eslint` / `eslint` | `rtk lint` | Grouped rule violations |
| `npx prettier --check` | `rtk prettier` | Compact format checker |
| `prettier` / `black` / `ruff format` | `rtk format` | Universal format checker |
| `vitest` | `rtk vitest` | Only failures shown |
| `npx tsc` / `tsc` | `rtk tsc` | TypeScript errors grouped |
| `next build` | `rtk next` | Next.js build, compact output |
| `npx prisma …` | `rtk prisma` | No ASCII art |

### Python

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `python -m pytest` | `rtk pytest` | Only failures shown |
| `mypy` | `rtk mypy` | Grouped error output |
| `ruff check` / `ruff format` | `rtk ruff` | Compact linter output |
| `pip install` / `uv pip install` | `rtk pip` | Auto-detects uv |

### Rust / Go

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `cargo build` / `cargo test` | `rtk cargo` | Compact cargo output |
| `go build` / `go test` | `rtk go` | Compact go output |
| `golangci-lint run` | `rtk golangci-lint` | Compact linter output |

### Infrastructure & APIs

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| `curl -s …` | `rtk curl` | Auto-detects JSON, shows schema not values |
| `aws …` | `rtk aws` | Forces JSON, compresses output |
| `docker …` | `rtk docker` | Compact docker output |
| `kubectl …` | `rtk kubectl` | Compact kubectl output |
| `psql …` | `rtk psql` | Strips table borders, compresses |
| `wget …` | `rtk wget` | Strips progress bars |
| `dotnet build` / `dotnet test` | `rtk dotnet` | Compact .NET output |

### Testing (Generic)

| Native | RTK Equivalent | What It Does |
|--------|---------------|--------------|
| Any test runner | `rtk test <cmd>` | Shows only failures |
| Any command | `rtk err <cmd>` | Shows only errors/warnings |
| Any command | `rtk summary <cmd>` | Heuristic 1-line summary |

### Utilities

| Command | What It Does |
|---------|--------------|
| `rtk json <file>` | Shows JSON structure without values |
| `rtk deps` | Summarizes project dependencies |
| `rtk env` | Shows env vars, masks sensitive values |
| `rtk log <cmd>` | Filters and deduplicates log output |
| `rtk smart <cmd>` | 2-line technical summary (heuristic) |

---

## Meta Commands (always call rtk directly — not rewritten by hook)

```bash
rtk gain              # Token savings analytics
rtk gain --history    # Command usage history with per-command savings
rtk discover          # Scan Claude Code history for missed RTK opportunities
rtk cc-economics      # Claude Code spend (ccusage) vs RTK savings comparison
rtk proxy <cmd>       # Execute without filtering (for debugging)
rtk verify            # Verify hook integrity and run inline filter tests
rtk config            # Show or create configuration file
rtk hook-audit        # Show hook rewrite audit metrics (requires RTK_HOOK_AUDIT=1)
```

---

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z (need >= 0.23.0)
rtk gain              # Should show savings analytics
which rtk             # Verify correct binary path
```

**Name collision warning**: If `rtk gain` fails or shows "Type Kit", you have `reachingforthejack/rtk` (Rust Type Kit) installed instead. The correct RTK is from `rtk-ai/rtk`.

---

## Flags

| Flag | Effect |
|------|--------|
| `-u` / `--ultra-compact` | ASCII icons, inline format (Level 2 optimizations) |
| `--skip-env` | Sets `SKIP_ENV_VALIDATION=1` for child processes (Next.js, tsc, lint, prisma) |
| `-v` / `-vv` / `-vvv` | Verbosity levels for debugging |

---

## When RTK Does NOT Apply

- Interactive commands (`git rebase -i`, `git add -p`, REPL sessions)
- Commands that produce binary or non-text output
- Commands already producing minimal output (single-line results)
- `rtk proxy <cmd>` — explicitly bypasses filtering for debugging

For unhandled commands, `rtk rewrite` exits 1 and the hook passes through transparently — there is no penalty for commands RTK doesn't support.
