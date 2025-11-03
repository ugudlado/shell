# Troubleshooting Guide

## Claude Code Installation

### Installing via Node.js (Recommended)

Claude Code should be installed via npm for better compatibility with MCP servers like Linear:

```bash
# Install Claude Code globally via npm
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

# Check installation location
which claude
```

### Common Issues with Homebrew Installation

If you previously installed Claude Code via Homebrew and MCP servers (like Linear) aren't working properly:

1. **Remove Homebrew installation** (if exists):
```bash
brew uninstall claude-code
```

2. **Install via npm instead**:
```bash
npm install -g @anthropic-ai/claude-code
```

3. **Verify MCP servers are working**:
```bash
claude doctor
```

The npm installation ensures better compatibility with Node.js-based MCP servers.

## Stow Conflicts

### Error: "cannot stow ... over existing target"

When you see this error:
```
WARNING! stowing home would cause conflicts:
  * cannot stow ... over existing target ... since neither a link nor a directory and --adopt not specified
```

**Solution: Adopt existing files into stow**
```bash
# Move existing files into the stow directory and create symlinks
stow -t ~ -d src -v --adopt home

# Review what was adopted
git diff src/home/

# Commit if the changes look good
git add src/home/
git commit -m "chore: Adopt existing config files into stow"
```

This preserves your existing configs and brings them under dotfiles management.
