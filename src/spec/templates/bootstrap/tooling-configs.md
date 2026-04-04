# Bootstrap Tooling Config Templates

Reference file for `install-tooling` step contract. Contains exact config file
contents for each language. Only create files that don't already exist.

---

## Node / TypeScript

### eslint.config.js

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
      'no-unused-vars': 'off',
      // If TypeScript:
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
```

### .prettierrc

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```

### .prettierignore

```
dist
node_modules
coverage
pnpm-lock.yaml
```

### knip.json

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [],
  "ignoreDependencies": []
}
```

Adjust `entry` based on what actually exists (src/index.ts, src/main.ts, src/app.ts).

### tsconfig.json

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

### vitest.config.ts

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

### .husky/pre-commit

```bash
pnpm exec lint-staged
```

### lint-staged (in package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,html,yml,yaml}": ["prettier --write"]
  }
}
```

### Standardized Scripts (package.json)

| Script | Command |
|--------|---------|
| build | `tsc` (or existing build tool) |
| test | `vitest run` |
| lint | `eslint src/` |
| format | `prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"` |
| format:check | `prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"` |
| type-check | `tsc --noEmit` |
| knip | `knip` |

---

## Python

### ruff.toml

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
"tests/**/*.py" = ["S101"]

[format]
quote-style = "double"
indent-style = "space"
```

### pyproject.toml additions

```toml
[tool.mypy]
strict = true
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --tb=short"
```

### .pre-commit-config.yaml

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

### Makefile

```makefile
.PHONY: lint format format-check type-check test fix

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

## Rust

### rustfmt.toml

```toml
edition = "2021"
max_width = 100
use_field_init_shorthand = true
```

### Makefile

```makefile
.PHONY: lint format format-check test build

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

## Go

### .golangci.yml

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

### Makefile

```makefile
.PHONY: lint format format-check test build

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
