# Troubleshooting Guide

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
