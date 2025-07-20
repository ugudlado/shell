# Alpine Linux Docker image using setup.sh for modern CLI tools
# Clean approach: Let setup.sh handle everything like a new Linux machine
FROM alpine:3.20

# Metadata
LABEL maintainer="dotfiles-project"
LABEL description="Alpine Linux with modern CLI tools installed via setup.sh"
LABEL version="2.0-clean"

# Set environment variables
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV TERM=xterm-256color
ENV SHELL=/bin/bash

# Accept build arguments for git configuration
ARG GIT_USER_NAME="Container User"
ARG GIT_USER_EMAIL="user@container.local"

# Set git environment variables
ENV GIT_USER_NAME=$GIT_USER_NAME
ENV GIT_USER_EMAIL=$GIT_USER_EMAIL

# Install minimal prerequisites for setup.sh
RUN apk update && apk add --no-cache \
    bash \
    curl \
    ca-certificates

# Copy setup script and run it (let it handle everything)
COPY setup.sh /tmp/setup.sh

# Make setup script executable and run it in container mode
RUN chmod +x /tmp/setup.sh && \
    cd /tmp && \
    SETUP_SKIP_INTERACTIVE=true \
    ./setup.sh

# Create non-root user with git configuration
RUN adduser -D -s /bin/bash developer && \
    su developer -c "git config --global user.name '$GIT_USER_NAME'" && \
    su developer -c "git config --global user.email '$GIT_USER_EMAIL'" && \
    su developer -c "git config --global init.defaultBranch main"

# Clean up
RUN rm -rf /tmp/* /var/cache/apk/* /var/tmp/* /root/.cache

# Set working directory and default user
WORKDIR /workspace
USER developer

# Default command
CMD ["/bin/bash"]