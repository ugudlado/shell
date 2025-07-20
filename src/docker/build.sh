#!/bin/bash
# Build script for Alpine CLI Tools Docker images

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
IMAGE_NAME="alpine-cli-tools"
TAG="latest"
PUSH=false
PLATFORM="linux/amd64,linux/arm64"
GIT_USER_NAME="Container User"
GIT_USER_EMAIL="user@container.local"

# Help function
show_help() {
    cat << EOF
Alpine CLI Tools Docker Build Script

Usage: $0 [OPTIONS]

OPTIONS:
    -n, --name NAME       Image name (default: alpine-cli-tools)
    -t, --tag TAG         Image tag (default: latest)
    -p, --push            Push to registry after build
    -m, --multi-platform  Build multi-platform images
    --platform PLATFORMS Platform(s) to build for (default: linux/amd64,linux/arm64)
    --git-name NAME      Git user name (default: "Container User")
    --git-email EMAIL    Git user email (default: "user@container.local")
    -h, --help           Show this help

EXAMPLES:
    $0                           # Build with default settings
    $0 -t v1.0                  # Build with tag v1.0
    $0 --git-name "John Doe" --git-email "john@example.com"  # Custom git config
    $0 -p -m                    # Build and push multi-platform image
    $0 -n my-cli-tools          # Build with custom name

FEATURES:
    • Uses setup.sh script for consistent tool installation (clean approach)
    • Alpine Linux 3.20 base with modern CLI productivity tools
    • Environment variable git configuration (no interactive prompts)
    • Let setup.sh handle everything like a new Linux machine
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        -m|--multi-platform)
            MULTI_PLATFORM=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --git-name)
            GIT_USER_NAME="$2"
            shift 2
            ;;
        --git-email)
            GIT_USER_EMAIL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set Dockerfile and build information
DOCKERFILE="Dockerfile"
SIZE_INFO="Clean setup.sh approach"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

log_info "Building Alpine CLI Tools Docker image"
log_info "======================================"
log_info "Image: $FULL_IMAGE_NAME"
log_info "Method: $SIZE_INFO"
log_info "Dockerfile: $DOCKERFILE"
log_info "Platform(s): $PLATFORM"
log_info "Git Name: $GIT_USER_NAME"
log_info "Git Email: $GIT_USER_EMAIL"
log_info "Push: $PUSH"
echo ""

# Check if Dockerfile exists
if [[ ! -f "$DOCKERFILE" ]]; then
    log_error "Dockerfile not found: $DOCKERFILE"
    exit 1
fi

# Build command preparation
BUILD_CMD="docker build"
BUILD_ARGS="-f $DOCKERFILE -t $FULL_IMAGE_NAME"
BUILD_ARGS="$BUILD_ARGS --build-arg GIT_USER_NAME='$GIT_USER_NAME'"
BUILD_ARGS="$BUILD_ARGS --build-arg GIT_USER_EMAIL='$GIT_USER_EMAIL'"

# Add platform support if multi-platform build
if [[ "${MULTI_PLATFORM:-false}" == "true" ]]; then
    log_info "Building multi-platform image for: $PLATFORM"
    BUILD_CMD="docker buildx build"
    BUILD_ARGS="$BUILD_ARGS --platform $PLATFORM"
    
    if [[ "$PUSH" == "true" ]]; then
        BUILD_ARGS="$BUILD_ARGS --push"
    fi
fi

# Add parent directory as build context (where setup.sh and Brewfile are located)
BUILD_ARGS="$BUILD_ARGS .."

# Execute build
log_info "Executing: $BUILD_CMD $BUILD_ARGS"
echo ""

if $BUILD_CMD $BUILD_ARGS; then
    log_success "Build completed successfully!"
    
    # Show image information (only for single-platform builds)
    if [[ "${MULTI_PLATFORM:-false}" != "true" ]]; then
        echo ""
        log_info "Image information:"
        docker images "$FULL_IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
        
        echo ""
        log_info "Test the image:"
        echo "  docker run --rm -it $FULL_IMAGE_NAME"
        echo "  docker run --rm -it $FULL_IMAGE_NAME setup-modern-cli"
        echo "  docker run --rm -v \$(pwd):/workspace $FULL_IMAGE_NAME eza --tree"
    fi
    
    # Push if requested and not already pushed
    if [[ "$PUSH" == "true" && "${MULTI_PLATFORM:-false}" != "true" ]]; then
        log_info "Pushing image to registry..."
        if docker push "$FULL_IMAGE_NAME"; then
            log_success "Image pushed successfully!"
        else
            log_error "Failed to push image"
            exit 1
        fi
    fi
    
else
    log_error "Build failed!"
    exit 1
fi

echo ""
log_success "All operations completed!"

# Usage examples
echo ""
log_info "Usage examples:"
echo "  # Interactive shell with modern tools"
echo "  docker run --rm -it $FULL_IMAGE_NAME"
echo ""
echo "  # Mount current directory and explore with modern tools"
echo "  docker run --rm -v \$(pwd):/workspace $FULL_IMAGE_NAME eza --tree -L 2"
echo ""
echo "  # Search in mounted directory"
echo "  docker run --rm -v \$(pwd):/workspace $FULL_IMAGE_NAME rg 'pattern' ."
echo ""
echo "  # Use as base image in your Dockerfile:"
echo "  FROM $FULL_IMAGE_NAME"