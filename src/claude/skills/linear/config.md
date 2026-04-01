---
name: Linear Config
description: Centralized Linear settings — team, project, and per-repo label IDs. Read by create-ticket.yaml and bootstrap.
type: reference
---

# Linear Configuration

## Team Settings

```yaml
team:
  name: Home Labs
  id: 80452c36-1579-49d6-9e6e-59afbb82bce5
  prefix: HL
  project_id: 99ec4b7c-2ab3-41b3-9924-4499952b4228  # "Tickets" project
```

## Repo Settings

Each repo is keyed by its directory name (basename of the repo root).
If a repo is not listed here, Linear integration is disabled (`--no-linear`).

```yaml
repos:
  shell:
    label_ids:
      - a1948a92-9028-4671-8f70-ae7b8a7120a1  # shell (product label)
  algoviz:
    label_ids:
      - a116a1a4-7384-42f8-bec5-c32c21ebd743  # algoviz (product label)
```

## How to Add a New Repo

1. Create a product label in Linear for the repo
2. Add an entry under `repos:` above with the label UUID
3. Run `/bootstrap` in the repo to verify

## Usage

- **Schema step files** (`create-ticket.yaml`): Read `~/.claude/skills/linear/config.md` for team settings and repo-specific labels
- **Bootstrap**: Checks if current repo is listed; if not, Linear is disabled for that repo
- **Repo detection**: Uses `basename $(git rev-parse --show-toplevel)` to match repo key
