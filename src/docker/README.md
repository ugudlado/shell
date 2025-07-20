# Alpine CLI Tools Docker Image

Docker image based on Alpine Linux with modern CLI productivity tools installed via the setup.sh script.

## Features

- **Image**: `alpine-cli-tools:latest`
- **Size**: ~80MB
- **Method**: Uses `setup.sh` script with Linux/Alpine support
- **Benefits**: Consistent with local development setup, maintains our installation logic

## Installed Tools

The image includes these modern CLI productivity tools:

- **ripgrep (rg)** - Fast text search (replaces grep)
- **fd** - Fast file finder (replaces find)
- **eza** - Enhanced directory listing (replaces ls)
- **tree** - Directory structure visualization
- **tealdeer (tldr)** - Quick command help
- **bat** - Better cat with syntax highlighting
- **fzf** - Fuzzy finder
- **jq** - JSON processor

## Quick Start

### Build the Image

```bash
# Simple build with script
cd src/docker
./build.sh

# Or use Docker directly
docker build -f Dockerfile -t alpine-cli-tools:latest \
  --build-arg GIT_USER_NAME="Your Name" \
  --build-arg GIT_USER_EMAIL="your@email.com" \
  ..
```

### Use the Image

```bash
# Interactive shell with modern tools
docker run --rm -it alpine-cli-tools:latest

# Mount current directory for file operations
docker run --rm -v $(pwd):/workspace alpine-cli-tools:latest eza --tree -L 2

# Search in mounted directory
docker run --rm -v $(pwd):/workspace alpine-cli-tools:latest rg "pattern" .

# Quick project analysis
docker run --rm -v $(pwd):/workspace alpine-cli-tools:latest project-overview
```

### Setup Aliases

The image automatically configures useful aliases. You can also manually set them up:

```bash
# Inside the container
setup-modern-cli ~/.bashrc
source ~/.bashrc

# Now use aliases
ll              # eza -la --git --group-directories-first
lt              # eza --tree --level=2
rgjs "pattern"  # rg -t js -t jsx -t ts -t tsx "pattern"
fdrecent 1d     # fd --changed-within 1d
```

## Productivity Aliases

The image includes aliases from our CLI productivity cheatsheet:

### File Listing
- `ll` - Enhanced listing with git status
- `lt` - Tree view (2 levels)
- `lg` - Git-aware listing
- `lst` - Full tree view

### Search & Find
- `rgjs` - Search in JS/TS files
- `rgpy` - Search in Python files
- `rgmd` - Search in Markdown files
- `fdd` - Find directories only
- `fdf` - Find files only
- `fdr` - Find recently changed files

### Development Workflow
- `findfuncs` - Find function definitions
- `findtests` - Locate test files
- `codepatterns` - Find TODO/FIXME/HACK/BUG
- `project-overview` - Quick project analysis
- `dev-check` - Development quality check

## Use as Base Image

```dockerfile
FROM alpine-cli-tools:latest

# Your application setup
COPY . /app
WORKDIR /app

# Modern CLI tools are already available
RUN rg "TODO" . || echo "No TODOs found"
RUN fd "*.js" | head -5
```

## Build Script Options

```bash
./build.sh [OPTIONS]

OPTIONS:
  -n, --name NAME       Image name (default: alpine-cli-tools)
  -t, --tag TAG         Image tag (default: latest)  
  -p, --push            Push to registry after build
  -m, --multi-platform  Build multi-platform images
  --platform PLATFORMS Platform(s) to build for
  --git-name NAME      Git user name (default: "Container User")
  --git-email EMAIL    Git user email (default: "user@container.local")
  -h, --help           Show help
```

## Development Workflow Integration

These images are designed to work seamlessly with our development workflow:

1. **Consistent tooling** - Same tools as local development (via setup.sh)
2. **Container development** - Use as dev container or CI/CD base
3. **File analysis** - Mount project directories for quick analysis
4. **CI/CD integration** - Fast, reliable builds with modern tools

## Examples

### Quick File Analysis
```bash
# Analyze project structure
docker run --rm -v $(pwd):/workspace alpine-cli-tools:latest \
  bash -c "cd /workspace && project-overview"

# Find recent changes
docker run --rm -v $(pwd):/workspace alpine-cli-tools:latest \
  fd --changed-within 7d /workspace

# Search for patterns
docker run --rm -v $(pwd):/workspace alpine-cli-tools:latest \
  rg "TODO|FIXME" /workspace --stats
```

### Development Container
```bash
# Long-running development session
docker run -it -v $(pwd):/workspace --name dev-container \
  alpine-cli-tools:latest bash

# Inside container
cd /workspace
setup-modern-cli ~/.bashrc
source ~/.bashrc
project-overview  # Use the alias
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Build custom image
  run: |
    docker build \
      --build-arg GIT_USER_NAME="${{ github.actor }}" \
      --build-arg GIT_USER_EMAIL="${{ github.actor }}@users.noreply.github.com" \
      -t alpine-cli-tools:ci .
      
- name: Analyze codebase
  run: |
    docker run --rm -v ${{ github.workspace }}:/workspace \
      alpine-cli-tools:ci rg "TODO|FIXME" /workspace --stats
```

## Git Configuration

The image supports flexible git configuration through build arguments:

### Default Configuration
```bash
# Default build uses generic container credentials
docker build -t alpine-cli-tools:latest .
# Result: git config user.name = "Container User"
#         git config user.email = "user@container.local"
```

### Custom Configuration
```bash
# Build with your personal credentials
docker build \
  --build-arg GIT_USER_NAME="Jane Developer" \
  --build-arg GIT_USER_EMAIL="jane@example.com" \
  -t alpine-cli-tools:personal .

# Verify configuration
docker run --rm alpine-cli-tools:personal git config --global --list | grep user
```

### Runtime Configuration
```bash
# You can also override at runtime (though build-time is preferred)
docker run --rm \
  -e GIT_USER_NAME="Runtime User" \
  -e GIT_USER_EMAIL="runtime@example.com" \
  alpine-cli-tools:latest git config --global user.name
```

## Technical Details

### Setup Variant
- Based on `alpine:3.20`
- Uses our `setup.sh` script with `SETUP_SKIP_INTERACTIVE=true`
- Includes Alpine Linux package detection and installation
- Auto-configures modern CLI aliases
- Non-root user (`developer:developer`)

### Repository Structure
```
docker/
├── Dockerfile                       # Main Dockerfile using setup.sh
├── build.sh                         # Build script
└── README.md                        # This file
```

### Environment Variables
- `LANG=C.UTF-8`
- `LC_ALL=C.UTF-8` 
- `TERM=xterm-256color`
- `SHELL=/bin/bash`
- `GIT_USER_NAME` - Git user name (set from build args)
- `GIT_USER_EMAIL` - Git user email (set from build args)

The images provide a consistent, modern CLI environment perfect for development, analysis, and automation tasks.