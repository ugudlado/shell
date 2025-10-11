# Project-Specific VS Code Extensions

This directory contains extension lists for different project types.

## Usage

Copy the appropriate extension file to your project's `.vscode/extensions.json`:

```bash
# For JavaScript/Node.js projects
cp extensions/javascript.json myproject/.vscode/extensions.json

# For Python projects
cp extensions/python.json myproject/.vscode/extensions.json

# For DevOps/Infrastructure projects
cp extensions/devops.json myproject/.vscode/extensions.json
```

## Available Extension Sets

- `core.json` - Essential extensions for all projects
- `javascript.json` - JavaScript/TypeScript/Node.js development
- `python.json` - Python development
- `go.json` - Go development
- `devops.json` - Docker, Kubernetes, Terraform
