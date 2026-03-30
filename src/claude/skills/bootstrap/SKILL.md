---
name: bootstrap
description: Verify and install project tooling before feature development. Detects language (Node/TS, Python, Rust, Go), installs linter, formatter, type checker, dead code detection, pre-commit hooks, test framework, and standardized scripts. Idempotent — tracks state in .tooling-state.json. Use when starting a new project, when /develop Phase 4c runs, or when the user says "bootstrap", "setup tooling", "install dev tools", "quality gates".
user-invocable: true
args:
  - name: project
    description: Path to the project (defaults to current directory)
    required: false
---

# Bootstrap — Project Tooling Setup

Set up quality gate tooling for a project. Detects the project language, installs opinionated modern defaults, and establishes a clean baseline. Runs once per project — subsequent calls skip via `.tooling-state.json`.

$ARGUMENTS

---

## Step 0: Check State

Read `.tooling-state.json` at the project root.

- If it exists with `"checks_passed": true` AND `"version": 1` → print status and **stop**:
  ```
  [bootstrap] Tooling already verified (completed <completed_at>). Skipping.
  ```
- If it exists but `checks_passed` is `false` or `version` is outdated → continue (re-bootstrap)
- If it doesn't exist → continue (first run)

---

## Step 1: Detect Language

Check for indicator files at the project root. Multiple languages can be detected (monorepo).

| Indicator | Language | Key |
|-----------|----------|-----|
| `package.json` | Node/TypeScript | `node` |
| `pyproject.toml` or `setup.py` or `requirements.txt` | Python | `python` |
| `Cargo.toml` | Rust | `rust` |
| `go.mod` | Go | `go` |

If **none** match, ask the user what kind of project this is.

### Sub-detection (Node only)

| Check | Signal |
|-------|--------|
| `tsconfig.json` exists OR `typescript` in devDependencies | TypeScript project → key becomes `node-ts` |
| `next`, `vite`, `react`, `astro`, `nuxt`, `svelte`, `angular` in dependencies | Web project → flag for portless in Step 7 |
| `pnpm-lock.yaml` exists | Package manager = pnpm |
| `yarn.lock` exists | Package manager = yarn |
| `package-lock.json` exists | Package manager = npm |
| None of the above | Default to pnpm |

### Sub-detection (Python only)

| Check | Signal |
|-------|--------|
| `pyproject.toml` with `[tool.poetry]` | Uses poetry |
| `pyproject.toml` with `[tool.uv]` or `uv.lock` exists | Uses uv |
| Otherwise | Uses pip |

**Status:**
```
[bootstrap] Detected: <language(s)> | PM: <package-manager> | Web: yes/no
```

---

## Step 2: Apply Tooling Matrix

For each detected language, apply the corresponding tooling. Each tool follows the same pattern:

1. **Check** — is it already installed? (skip if yes)
2. **Install** — add the package
3. **Configure** — create config file (separate files, not inline)
4. **Script** — add standardized script name
5. **Verify** — run the tool to confirm it works

**Important reminders (from CLAUDE.md lessons):**
- Prefix all `pnpm add` / `pnpm install` with `CI=true`
- **Re-read `package.json`** after every `pnpm add` — the file changes on disk and cached reads become stale
- Respect the detected package manager — use `pnpm`, `yarn`, or `npm` accordingly

---

### 2a: Node / TypeScript

#### Linter — ESLint (flat config)

**Check**: `eslint` in devDependencies AND `eslint.config.js` exists
**Install**:
```bash
CI=true pnpm add -D eslint @eslint/js globals
# If TypeScript:
CI=true pnpm add -D typescript-eslint
```
**Configure** — create `eslint.config.js`:
```js
import js from '@eslint/js';
import globals from 'globals';
// If TypeScript:
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  // If TypeScript:
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        // If web project, add: ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'off', // TypeScript handles this
      // If TypeScript:
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
```
**Script**: `"lint": "eslint src/"`
**Verify**: `pnpm lint`

#### Formatter — Prettier

**Check**: `prettier` in devDependencies AND `.prettierrc` exists
**Install**:
```bash
CI=true pnpm add -D prettier
```
**Configure** — create `.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```
Create `.prettierignore`:
```
dist
node_modules
coverage
pnpm-lock.yaml
```
**Scripts**:
- `"format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""`
- `"format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""`

**Verify**: `pnpm format:check`

#### Dead Code — Knip

**Check**: `knip` in devDependencies AND `knip.json` exists
**Install**:
```bash
CI=true pnpm add -D knip
```
**Configure** — create `knip.json`. Detect entry points from existing files:
```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [],
  "ignoreDependencies": []
}
```
Adjust `entry` based on what actually exists (`src/index.ts`, `src/main.ts`, `src/app.ts`, etc.). Adjust file extensions if JavaScript-only.
**Script**: `"knip": "knip"`
**Verify**: `pnpm knip`

#### Type Check — TypeScript

**Check**: `typescript` in devDependencies AND `tsconfig.json` exists
**Install** (if TypeScript detected but `typescript` not in deps):
```bash
CI=true pnpm add -D typescript
```
**Configure** — create `tsconfig.json` if missing:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```
**Script**: `"type-check": "tsc --noEmit"`
**Verify**: `pnpm type-check`

#### Test Framework — Vitest

**Check**: `vitest` in devDependencies AND `vitest.config.ts` exists
**Install**:
```bash
CI=true pnpm add -D vitest
# If web project:
CI=true pnpm add -D @vitest/browser
```
**Configure** — create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use 'jsdom' for web projects
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
    },
  },
});
```
**Script**: `"test": "vitest run"`
**Verify**: `pnpm test` (may exit 0 with "no tests" — that's fine for bootstrap)

#### Pre-commit — Husky + lint-staged

**Check**: `husky` in devDependencies AND `.husky/pre-commit` exists
**Install**:
```bash
CI=true pnpm add -D husky lint-staged
pnpm exec husky init
```
**Configure** — write `.husky/pre-commit`:
```bash
pnpm exec lint-staged
```
Add `lint-staged` config to `package.json` (this is the one config that goes inline):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,html,yml,yaml}": ["prettier --write"]
  }
}
```
**Verify**: `pnpm exec lint-staged --diff="HEAD~0"` (dry run on empty diff)

#### Standardized Scripts Summary (Node/TS)

Ensure these exist in `package.json` scripts. Don't overwrite existing scripts — only add missing ones:

| Script | Command |
|--------|---------|
| `dev` | (leave existing or skip — project-specific) |
| `build` | `tsc` (or existing build tool) |
| `test` | `vitest run` |
| `lint` | `eslint src/` |
| `format` | `prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"` |
| `format:check` | `prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"` |
| `type-check` | `tsc --noEmit` |
| `knip` | `knip` |

---

### 2b: Python

#### Linter + Formatter — ruff

**Check**: `ruff` in `[project.optional-dependencies]` dev group or installed globally (`ruff --version`)
**Install**:
```bash
pip install ruff
# Or add to pyproject.toml [project.optional-dependencies] dev = ["ruff"]
```
**Configure** — create `ruff.toml`:
```toml
line-length = 88
target-version = "py311"

[lint]
select = [
    "E",   # pycodestyle errors
    "F",   # pyflakes
    "I",   # isort
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
    "SIM", # flake8-simplify
    "RUF", # ruff-specific
]

[lint.per-file-ignores]
"tests/**/*.py" = ["S101"]  # allow assert in tests

[format]
quote-style = "double"
indent-style = "space"
```
**Verify**: `ruff check .` and `ruff format --check .`

#### Type Check — mypy

**Check**: `mypy` installed (`mypy --version`) or in dev dependencies
**Install**:
```bash
pip install mypy
```
**Configure** — add to `pyproject.toml`:
```toml
[tool.mypy]
strict = true
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
```
**Verify**: `mypy src/` or `mypy <package_name>/`

#### Test Framework — pytest

**Check**: `pytest` installed or in dev dependencies
**Install**:
```bash
pip install pytest pytest-cov
```
**Configure** — add to `pyproject.toml`:
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --tb=short"
```
**Verify**: `pytest` (may show "no tests collected" — fine for bootstrap)

#### Pre-commit — pre-commit framework

**Check**: `.pre-commit-config.yaml` exists
**Install**:
```bash
pip install pre-commit
```
**Configure** — create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.13.0
    hooks:
      - id: mypy
        additional_dependencies: []
```
Run: `pre-commit install`
**Verify**: `pre-commit run --all-files`

#### Standardized Scripts (Python — Makefile)

Create or update `Makefile`:
```makefile
.PHONY: lint format type-check test

lint:
	ruff check .

format:
	ruff format .

format-check:
	ruff format --check .

type-check:
	mypy src/

test:
	pytest

fix:
	ruff check --fix .
	ruff format .
```

---

### 2c: Rust

#### Linter — clippy

**Check**: `cargo clippy --version` succeeds
**Install**: Included with rustup. If missing: `rustup component add clippy`
**Verify**: `cargo clippy -- -D warnings`

#### Formatter — rustfmt

**Check**: `cargo fmt --version` succeeds
**Install**: Included with rustup. If missing: `rustup component add rustfmt`
**Configure** — create `rustfmt.toml`:
```toml
edition = "2021"
max_width = 100
use_field_init_shorthand = true
```
**Verify**: `cargo fmt --check`

#### Test + Build — cargo

**Check**: Built-in with Rust toolchain
**Verify**: `cargo test` and `cargo build`

#### Standardized Scripts (Rust — Makefile)

Create or update `Makefile`:
```makefile
.PHONY: lint format test build

lint:
	cargo clippy -- -D warnings

format:
	cargo fmt

format-check:
	cargo fmt --check

test:
	cargo test

build:
	cargo build --release
```

---

### 2d: Go

#### Linter — golangci-lint

**Check**: `golangci-lint --version` succeeds
**Install**:
```bash
go install github.com/golangci-lint/golangci-lint/cmd/golangci-lint@latest
```
**Configure** — create `.golangci.yml`:
```yaml
linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - unused
    - gosimple
    - gofumpt
    - ineffassign
    - typecheck

linters-settings:
  gofumpt:
    extra-rules: true

run:
  timeout: 5m
```
**Verify**: `golangci-lint run`

#### Formatter — gofumpt

**Check**: `gofumpt --version` succeeds
**Install**:
```bash
go install mvdan.cc/gofumpt@latest
```
**Verify**: `gofumpt -d .` (shows diff of unformatted files)

#### Test + Build — go

**Check**: Built-in with Go toolchain
**Verify**: `go test ./...` and `go build ./...`

#### Standardized Scripts (Go — Makefile)

Create or update `Makefile`:
```makefile
.PHONY: lint format test build

lint:
	golangci-lint run

format:
	gofumpt -w .

format-check:
	gofumpt -d .

test:
	go test ./...

build:
	go build ./cmd/...
```

---

## Step 3: .gitignore Baseline

Read the existing `.gitignore`. Append any missing entries from the list below. **Never remove** existing entries.

**Always include:**
```
.tooling-state.json
```

**Per language:**

| Language | Required entries |
|----------|-----------------|
| Node/TS | `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.local`, `.env*.local` |
| Python | `__pycache__/`, `*.pyc`, `.venv/`, `.mypy_cache/`, `.ruff_cache/`, `htmlcov/`, `.coverage`, `dist/`, `*.egg-info/` |
| Rust | `target/` |
| Go | `bin/` |

---

## Step 4: src/ Directory Convention

Check if source files follow a standard layout:

| Language | Convention | Action |
|----------|-----------|--------|
| Node/TS | `src/` directory | Note if missing, but don't move files |
| Python | `src/<package>/` or `<package>/` | Note convention |
| Rust | `src/` (cargo default) | Already enforced by cargo |
| Go | `cmd/` + `internal/` (Go convention) | Note if missing |

If the project has source files at root with no `src/` directory, log a note but **do not** reorganize files — that's a separate refactor decision.

---

## Step 5: CLAUDE.md

### If no CLAUDE.md exists at project root:

Create one using the template at `src/claude/templates/product-claude-md.md`. Fill in:
- Product name from `package.json` name or directory name
- Development commands based on detected scripts
- Quality gates table from installed tools

### If CLAUDE.md already exists:

Update **only** the Quality Gates section. Find the `## Quality Gates` heading and replace the table:

```markdown
## Quality Gates

| Check | Command | When |
|-------|---------|------|
| Lint | `pnpm lint` | Every phase |
| Format | `pnpm format:check` | Every phase |
| Type check | `pnpm type-check` | Every phase |
| Dead code | `pnpm knip` | Every phase |
| Tests | `pnpm test` | Every phase |
```

Adapt commands to the detected language (e.g., `make lint` for Python/Rust/Go).

---

## Step 6: Run All Quality Gates

Execute every installed quality gate. Auto-fix where possible, then re-run:

1. **Auto-fix pass**: `eslint --fix`, `prettier --write`, `ruff format`, `cargo fmt`, `gofumpt -w .`
2. **Verification pass**: Run each gate. If any fail with non-fixable issues, report them but continue.
3. **Baseline established**: All gates should pass (or have documented exceptions).

```
[bootstrap] Quality gate baseline:
  Lint: ✓ | Format: ✓ | Type check: ✓ | Dead code: ✓ | Tests: ✓
```

---

## Step 7: Portless (Web Projects Only)

If a web framework was detected in Step 1 (Node with `next`, `vite`, `react`, `astro`, `nuxt`, `svelte`, `angular`), invoke the `/portless` skill:

```
/portless
```

Skip this step for:
- CLI tools
- Libraries
- Backend-only services (Express/Fastify without a frontend)
- Non-Node projects (Python, Rust, Go)

---

## Step 8: Flux Init

Register the project in the Flux board so it's visible at `http://flux.localhost:1355`.

The Flux UI reads a single global data file (`~/code/shell/.flux/data.json`). All CLI commands must target this file via `FLUX_DATA` — never use `flux init --git`, which creates a separate per-repo data file that the UI cannot see.

**Check availability**: `which flux 2>/dev/null` — if not found, skip with: `[bootstrap] flux not installed — skipping`.

**Check idempotency**:
```bash
flux project list --json 2>/dev/null | jq -r '.[].name' | grep -qx "$REPO_NAME" && echo "already registered"
```
If found, skip.

**Steps:**
```bash
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
flux project create "$REPO_NAME"
```

No `flux init`, no per-repo `.flux/` dir. `FLUX_DATA` is set globally in `.zshrc` → all flux commands route to the shared data file the UI reads, regardless of which repo you're in.

**Status:**
```
[bootstrap] Flux registered: "<repo-name>" visible at http://flux.localhost:1355
```

If Flux was skipped: `[bootstrap] Flux: skipped (not installed)`

---

## Step 10: Write State File

Write `.tooling-state.json` at the project root:

```json
{
  "version": 1,
  "completed_at": "<ISO 8601 timestamp>",
  "language": "<detected language key or array for multi-lang>",
  "package_manager": "<pnpm|yarn|npm|pip|uv|poetry|cargo|go>",
  "tools": {
    "linter": { "name": "<tool>", "version": "<version>" },
    "formatter": { "name": "<tool>", "version": "<version>" },
    "dead_code": { "name": "<tool>", "version": "<version>" },
    "type_check": { "name": "<tool>", "version": "<version>" },
    "test": { "name": "<tool>", "version": "<version>" },
    "pre_commit": { "name": "<tool>", "version": "<version>" }
  },
  "checks_passed": true
}
```

Get actual versions by running `<tool> --version` for each installed tool.

**Language key values**: `node-ts`, `node-js`, `python`, `rust`, `go`. For multi-language projects, use an array: `["node-ts", "python"]`.

---

## Final Status

```
[bootstrap] Tooling installed for <project-name>
  Language: <detected>
  Lint: <tool> <ver> | Format: <tool> <ver> | Dead code: <tool> <ver> | Type check: <tool> <ver>
  Tests: <tool> <ver> | Pre-commit: <tool>
  Scripts: <standardized script names added>
  Baseline: all quality gates pass
  Flux: project "<repo-name>" created → http://flux.localhost:1355
  State: .tooling-state.json written
```
