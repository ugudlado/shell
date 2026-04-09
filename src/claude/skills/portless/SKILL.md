---
name: portless
description: Set up portless named .localhost dev URLs for any project. Detects project type (static, Vite, Next.js, Express, etc.), adds the dev script with portless, installs dependencies, and verifies the setup works. Use when adding a new project to the portless dev environment or when the user says "add portless", "set up dev server", "named localhost", or "portless".
user-invokable: true
args:
  - name: project
    description: Path to the project or project name (optional — defaults to current directory)
    required: false
---

# Portless Setup

Add named `.localhost` dev URLs to any project using [portless](https://port1355.dev/).

## How Portless Works

```
Browser → https://<name>.localhost → proxy (port 1355) → app (random port 4000-4999)
```

- With `--https`, URLs are clean: `https://myapp.localhost` (no port needed)
- Without `--https`, port is required: `http://myapp.localhost:1355`
- `PORTLESS_HTTPS=1` in `.zshrc` makes HTTPS the default
- `sudo portless trust` adds CA to system trust store (no browser warnings)
- Portless sets `PORT`, `HOST`, and `PORTLESS_URL` env vars for the child process
- Git worktrees auto-prefix: `https://<branch>.<name>.localhost`
- Wildcard subdomains: `tenant.myapp.localhost` routes to `myapp`

### One-time setup
```bash
portless proxy start --https     # Start HTTPS/2 proxy (generates certs, auto-trusts on first run)
sudo portless trust              # If you skipped sudo on first run, trust CA later
```

## Step 1: Detect Project Type

Read `package.json` and determine how to serve:

| Type | Indicators | Portless dev command | Notes |
|------|-----------|---------------------|-------|
| **Static HTML** | No framework/build tool | `portless run serve .` | Add `serve` as devDep |
| **Next.js** | `next` in deps | `portless run next dev` | Respects `PORT` natively |
| **Nuxt** | `nuxt` in deps | `portless run nuxt dev` | Respects `PORT` natively |
| **Express/Fastify** | Server framework | `portless run node server.js` | Must use `process.env.PORT` |
| **Vite** | `vite` in deps/scripts | `portless run vite` | Auto-injects `--port --host` |
| **Astro** | `astro` in deps | `portless run astro dev` | Auto-injects `--port --host` |
| **React Router** | `react-router` in deps | `portless run react-router dev` | Auto-injects `--port --host` |
| **Angular** | `angular` in deps | `portless run ng serve` | Auto-injects `--port --host` |

**Key**: Always prefer `portless run` over `portless <name>`. The `run` command auto-infers the app name from `package.json` and auto-handles git worktree subdomain prefixing.

If the project already has a `dev` script, rename it to `dev:base` and wrap:
```json
"dev:base": "<original dev command>",
"dev": "portless run pnpm run dev:base"
```

## Step 2: Install Dependencies

```bash
# Verify portless is installed globally
portless --version || npm install -g portless

# If static site needs a file server
CI=true pnpm add -D serve
```

## Step 3: Add Dev Script

```json
{
  "scripts": {
    "dev": "portless run serve ."
  }
}
```

The `run` command reads `name` from `package.json` — no hardcoded names.

## Step 4: Update Makefile

Add a `dev` target to the project's Makefile if not already present:

```makefile
dev:
	pnpm dev
```

## Step 5: Verify

```bash
pnpm dev &
sleep 3
curl -sk -o /dev/null -w "%{http_code}" https://<name>.localhost/
# Should return 200
```

If verification fails:
1. Is the proxy running? → `portless proxy start --https`
2. Is CA trusted? → `sudo portless trust`
3. Does the app respect `PORT`? → Portless auto-injects `--port` for Vite/Astro/Angular/React Router
4. Custom server? → Ensure `process.env.PORT` is the listen port

## CLI Reference

```bash
# Proxy management
portless proxy start --https     # Start HTTPS/2 proxy (clean URLs, no port needed)
portless proxy start             # Start HTTP proxy (URLs need :1355)
portless proxy stop              # Stop proxy
sudo portless trust              # Add CA to system trust store (one-time)
portless list                    # Show active routes

# Running apps
portless run <cmd>               # Infer name from package.json + worktree prefix
portless run --name myapp <cmd>  # Override inferred name (keeps worktree prefix)
portless <name> <cmd>            # Explicit name (no worktree detection)

# Cross-service references
portless get <name>              # Print URL for a service (use in scripts/env)

# Static routes (e.g., Docker containers)
portless alias <name> <port>     # Register static route
portless alias --remove <name>   # Remove static route

# DNS / Safari fix
sudo portless hosts sync         # Add routes to /etc/hosts
sudo portless hosts clean        # Remove portless entries from /etc/hosts

# Escape hatch
PORTLESS=0 pnpm dev              # Run without portless proxy
```

## Key Flags

| Flag | Purpose |
|------|---------|
| `--https` | Enable HTTP/2 + TLS (clean URLs, no port needed) |
| `-p, --port <n>` | Proxy listen port (default: 1355) |
| `--tld <tld>` | Custom TLD (e.g., `test` instead of `localhost`) |
| `--app-port <n>` | Fixed port for the app (skip auto-assignment) |
| `--force` | Override an existing route from another process |
| `--foreground` | Run proxy in foreground (for debugging) |
| `--cert/--key` | Custom TLS certificate paths |

## Environment Variables

| Variable | Purpose | Where to set |
|----------|---------|-------------|
| `PORTLESS_HTTPS=1` | Always enable HTTPS (clean URLs) | `.zshrc` (already set) |
| `PORTLESS_PORT=<n>` | Override default proxy port | `.zshrc` |
| `PORTLESS_APP_PORT=<n>` | Fixed app port | per-project `.envrc` |
| `PORTLESS_TLD=<tld>` | Custom TLD | `.zshrc` |
| `PORTLESS_SYNC_HOSTS=1` | Auto-sync `/etc/hosts` | `.zshrc` (for Safari) |
| `PORTLESS=0` | Disable portless for a single run | inline |

### Child Process Env (set by portless)

| Variable | Value |
|----------|-------|
| `PORT` | Random port (4000-4999) the app should listen on |
| `HOST` | Always `127.0.0.1` |
| `PORTLESS_URL` | Full public URL (e.g., `https://algoviz.localhost`) |

## Existing Portless Apps

| App | URL | Project |
|-----|-----|---------|
| algoviz | `https://algoviz.localhost` | `tools/algoviz/` |
| designviz | `https://designviz.localhost` | `tools/designviz/` |
| paperlens | `https://paperlens.localhost` | `~/code/paperlens/` |

Update this table when adding new apps.
