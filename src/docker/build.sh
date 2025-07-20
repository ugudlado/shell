#!/bin/bash

# Simple Docker build script for Alpine CLI tools
# Just builds the image with standard docker commands

set -euo pipefail

# Default values
IMAGE_NAME="shell"
TAG="latest"
GIT_USER_NAME="Container User"
GIT_USER_EMAIL="user@container.local"

echo "Building Docker image: $IMAGE_NAME:$TAG"
echo "Git config: $GIT_USER_NAME <$GIT_USER_EMAIL>"
echo ""

# Change to project root directory (where setup.sh is located)
cd "$(dirname "$0")/../.."

# Simple docker build command from project root
docker build \
  -f src/docker/Dockerfile \
  -t "$IMAGE_NAME:$TAG" \
  --build-arg GIT_USER_NAME="$GIT_USER_NAME" \
  --build-arg GIT_USER_EMAIL="$GIT_USER_EMAIL" \
  .

echo ""
echo "✅ Build completed!"
echo ""
echo "To run the container:"
echo "  docker run --rm -it $IMAGE_NAME:$TAG"
echo ""
echo "To use with current directory:"
echo "  docker run --rm -v \$(pwd):/workspace $IMAGE_NAME:$TAG eza --tree"
