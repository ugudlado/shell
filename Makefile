# Makefile for dotfiles management using GNU Stow
# Usage: make <target>

# Variables
SHELL := /bin/bash
DOTFILES_DIR := $(shell pwd)
HOME_DIR := $(HOME)
STOW_DIR := $(DOTFILES_DIR)/src
BACKUP_DIR := $(HOME)/.dotfiles-backup

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Show this help message
	@echo "Dotfiles Management with GNU Stow"
	@echo
	@echo "Usage: make <target>"
	@echo
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Setup - complete initial installation
.PHONY: setup
setup: ## Complete initial setup (install everything)
	@echo -e "$(BLUE)[INFO]$(NC) Starting dotfile setup from: $(DOTFILES_DIR)"
	@./setup.sh


# Show differences between repo and home
.PHONY: diff
diff: ## Show differences between repo and home files
	@echo "=== Dotfiles Differences ==="
	@echo "Repository: $(DOTFILES_DIR)"
	@echo
	@if [ -d .git ]; then \
		echo "Git status:"; \
		git status --porcelain; \
		echo; \
	fi
	@echo "Stow sync status:"
	@echo "Package: home"
	@stow -n -v -d src -t $(HOME_DIR) home 2>&1 | grep -E "(LINK|UNLINK|would)" || echo "  ✓ Up to date"


# Backup existing files
.PHONY: backup
backup: ## Backup existing dotfiles before stowing
	@echo -e "$(BLUE)[INFO]$(NC) Creating backup of existing dotfiles..."
	@backup_dir="$(BACKUP_DIR)/$$(date +%Y%m%d_%H%M%S)"; \
	mkdir -p "$$backup_dir"; \
	echo -e "$(BLUE)[INFO]$(NC) Backing up conflicts for package: home"; \
	find "$(STOW_DIR)/home" -type f | while IFS= read -r repo_file; do \
		rel_path="$${repo_file#$(STOW_DIR)/home/}"; \
		home_file="$(HOME_DIR)/$$rel_path"; \
		if [ -f "$$home_file" ] && [ ! -L "$$home_file" ]; then \
			backup_file="$$backup_dir/$$rel_path"; \
			mkdir -p "$$(dirname "$$backup_file")"; \
			mv "$$home_file" "$$backup_file"; \
			echo -e "$(BLUE)[INFO]$(NC) Backed up: $$rel_path"; \
		fi; \
	done; \
	echo -e "$(GREEN)[SUCCESS]$(NC) Backup created at: $$backup_dir"

# Stow specific package
.PHONY: stow
stow: ## Stow the home package (usage: make stow)
	@echo -e "$(BLUE)[INFO]$(NC) Stowing package: home"
	@stow -d src -t $(HOME_DIR) home
	@echo -e "$(GREEN)[SUCCESS]$(NC) Stowed: home"


# Unstow the home package
.PHONY: unstow
unstow: ## Unstow the home package (usage: make unstow)
	@echo -e "$(BLUE)[INFO]$(NC) Unstowing package: home"
	@stow -D -d src -t $(HOME_DIR) home
	@echo -e "$(GREEN)[SUCCESS]$(NC) Unstowed: home"

# Dry run - show what would be stowed
.PHONY: dry-run
dry-run: ## Show what would be stowed without making changes
	@echo -e "$(BLUE)[INFO]$(NC) Dry run for package: home"
	@stow -n -v -d src -t $(HOME_DIR) home


# Clean up broken symlinks
.PHONY: clean
clean: ## Clean up broken symlinks in home directory
	@echo -e "$(BLUE)[INFO]$(NC) Cleaning up broken symlinks..."
	@find $(HOME_DIR) -maxdepth 3 -type l -not -path "*/.*" | while read link; do \
		if [ ! -e "$$link" ]; then \
			echo -e "$(YELLOW)[WARNING]$(NC) Removing broken symlink: $$link"; \
			rm "$$link"; \
		fi; \
	done
	@echo -e "$(GREEN)[SUCCESS]$(NC) Cleanup completed"


# Show current status of managed files
.PHONY: status
status: ## Show current status of managed files
	@echo "Files managed by stow:"
	@echo -e "\n$(BLUE)Package: home$(NC)"
	@echo "Directory links:"
	@find "$(STOW_DIR)/home" -type d -mindepth 1 | while IFS= read -r dir; do \
		rel_path="$${dir#$(STOW_DIR)/home/}"; \
		home_dir="$(HOME_DIR)/$$rel_path"; \
		if [ -L "$$home_dir" ]; then \
			file_count=$$(find "$$dir" -type f | wc -l | tr -d ' '); \
			echo -e "  ✓ $$rel_path/ ($$file_count files)"; \
		fi; \
	done
	@echo "Individual file links:"
	@find "$(STOW_DIR)/home" -type f | while IFS= read -r file; do \
		rel_path="$${file#$(STOW_DIR)/home/}"; \
		home_file="$(HOME_DIR)/$$rel_path"; \
		parent_dir="$(HOME_DIR)/$$(dirname "$$rel_path")"; \
		if [ -L "$$home_file" ] && [ ! -L "$$parent_dir" ]; then \
			echo -e "  ✓ $$rel_path"; \
		fi; \
	done
	@echo -e "\n$(GREEN)All files accessible via symlinks$(NC)"
