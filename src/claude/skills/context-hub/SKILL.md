---
name: context-hub
description: Fetch curated, agent-optimized library documentation via Context Hub (chub). Use when implementing features that use external libraries, when Context7 returns noisy/incomplete docs, when you need language-specific or version-specific API docs, or when the user says "chub", "context hub", "get docs for X". Prefer this over Context7 for libraries in chub's registry — curated docs have less noise and better code examples.
---

# Context Hub — Curated Library Documentation

Fetch agent-optimized documentation for libraries via the `chub` CLI. Curated docs are cleaner than auto-indexed alternatives — less marketing prose, more code examples and parameter tables.

## When to Use

| Scenario | Action |
|----------|--------|
| Need docs for a library during implementation | Search chub first, fall back to Context7 |
| Context7 returned noisy/incomplete results | Try `chub get` for curated alternative |
| Need language-specific variant (JS vs Python) | Use `--lang` flag |
| Need specific package version docs | Use `--version` flag |
| Discovered an API gotcha worth remembering | Use `chub annotate` to persist it |

## Workflow

### 1. Search for available documentation

```bash
chub search <library-or-topic>
```

If the library exists in chub, use `chub get`. If not, fall back to Context7's `resolve-library-id` + `query-docs`.

### 2. Fetch documentation

```bash
# Basic fetch
chub get <id>

# Language-specific (infer from project context)
chub get <id> --lang js    # js, ts, py, rb, cs

# Specific version
chub get <id> --version 4.0.0

# Fetch additional reference files when entry point isn't enough
chub get <id> --full

# Fetch only a specific reference file
chub get <id> --file streaming.md
```

**Language detection**: Check the project for `package.json` (js/ts), `pyproject.toml`/`requirements.txt` (py), `Gemfile` (rb), or `*.csproj` (cs) to auto-select `--lang`.

### 3. Annotate discoveries

When you discover something non-obvious while using a library (API quirks, version-specific behavior, undocumented gotchas), persist it:

```bash
chub annotate <id> "Description of the discovery"
```

Annotations are stored locally in `~/.chub/` and appear automatically on future `chub get` calls — cross-session memory scoped to documentation.

### 4. Provide feedback on doc quality

```bash
# Rate documentation quality
chub feedback <id> up|down "reason"

# Tag specific issues
chub feedback <id> down --label outdated "v5 API changed, examples use v4"
chub feedback <id> down --label inaccurate "Return type is Promise<T>, not T"
```

## Decision: chub vs Context7

```
Has curated chub entry? ──yes──▶ Use chub get (better signal-to-noise)
         │
         no
         │
         ▼
Library is popular/mainstream? ──yes──▶ Use Context7 (broad coverage)
         │
         no
         │
         ▼
Check official docs via WebFetch
```

## JSON Output for Programmatic Use

All commands support `--json` for structured output:

```bash
chub search drizzle --json
chub get drizzle/orm --lang js --json
```

## Cache Management

```bash
chub update          # Refresh registry from remote sources
chub cache status    # Check cache size and age
chub cache clear     # Reset cache
```
