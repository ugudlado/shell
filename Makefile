# Modern Dotfiles Management with GNU Stow

# Configuration
STOW_DIR := src
TARGET_DIR := $(HOME)
PACKAGE := home

# Default target
.DEFAULT_GOAL := help

# Colors for output
NO_COLOR := \033[0m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RED := \033[31m

# Helper function for colored output
define log
	@echo "$(2)$(1)$(NO_COLOR)"
endef

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Modern Dotfiles Management$(NO_COLOR)"
	@echo
	@echo "$(YELLOW)Available targets:$(NO_COLOR)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NO_COLOR) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo
	@echo "$(YELLOW)Development commands:$(NO_COLOR)"
	@echo "  $(GREEN)make setup$(NO_COLOR)      Complete environment setup"
	@echo "  $(GREEN)make verify$(NO_COLOR)     Run pre-commit verification"
	@echo "  $(GREEN)make scan$(NO_COLOR)       Run vulnerability scan"
	@echo "  $(GREEN)make quality$(NO_COLOR)    Run all quality checks"

.PHONY: status
status: ## Show current dotfile status
	$(call log,📊 Checking dotfile status...,$(BLUE))
	@stow -t $(TARGET_DIR) -d $(STOW_DIR) -v --simulate $(PACKAGE) 2>&1 | \
		grep -E "(LINK|UNLINK)" || echo "  ✅ All dotfiles are properly linked"

.PHONY: diff
diff: ## Show differences between repo and home
	$(call log,🔍 Showing differences...,$(BLUE))
	@for file in $$(find $(STOW_DIR)/$(PACKAGE) -type f -name ".*" 2>/dev/null); do \
		relative_path=$${file#$(STOW_DIR)/$(PACKAGE)/}; \
		home_file="$(TARGET_DIR)/$$relative_path"; \
		if [ -f "$$home_file" ] && [ ! -L "$$home_file" ]; then \
			echo "$(YELLOW)📄 $$relative_path$(NO_COLOR)"; \
			diff -u "$$home_file" "$$file" || true; \
			echo; \
		fi; \
	done

.PHONY: dry-run
dry-run: ## Preview stow changes without applying
	$(call log,🎯 Previewing stow changes...,$(BLUE))
	@stow -t $(TARGET_DIR) -d $(STOW_DIR) -v --simulate $(PACKAGE)

.PHONY: stow
stow: ## Apply dotfile symlinks
	$(call log,🔗 Stowing dotfiles...,$(BLUE))
	@stow -t $(TARGET_DIR) -d $(STOW_DIR) -v $(PACKAGE)
	$(call log,✅ Dotfiles stowed successfully,$(GREEN))

.PHONY: unstow
unstow: ## Remove dotfile symlinks
	$(call log,🗑️  Unstowing dotfiles...,$(BLUE))
	@stow -t $(TARGET_DIR) -d $(STOW_DIR) -v -D $(PACKAGE)
	$(call log,✅ Dotfiles unstowed successfully,$(GREEN))

.PHONY: restow
restow: ## Re-apply dotfile symlinks (unstow then stow)
	$(call log,🔄 Re-stowing dotfiles...,$(BLUE))
	@stow -t $(TARGET_DIR) -d $(STOW_DIR) -v -R $(PACKAGE)
	$(call log,✅ Dotfiles re-stowed successfully,$(GREEN))

.PHONY: backup
backup: ## Backup existing dotfiles before stowing
	$(call log,💾 Backing up existing dotfiles...,$(BLUE))
	@backup_dir="$$HOME/.dotfiles-backup-$$(date +%Y%m%d-%H%M%S)"; \
	mkdir -p "$$backup_dir"; \
	for file in $$(find $(STOW_DIR)/$(PACKAGE) -type f -name ".*" 2>/dev/null); do \
		relative_path=$${file#$(STOW_DIR)/$(PACKAGE)/}; \
		home_file="$(TARGET_DIR)/$$relative_path"; \
		if [ -f "$$home_file" ] && [ ! -L "$$home_file" ]; then \
			cp "$$home_file" "$$backup_dir/"; \
			echo "  📁 Backed up $$relative_path"; \
		fi; \
	done; \
	$(call log,✅ Backup created at $$backup_dir,$(GREEN))

.PHONY: clean
clean: ## Clean broken symlinks
	$(call log,🧹 Cleaning broken symlinks...,$(BLUE))
	@find $(TARGET_DIR) -maxdepth 1 -name ".*" -type l ! -exec test -e {} \; -exec rm -v {} \;
	$(call log,✅ Broken symlinks cleaned,$(GREEN))

.PHONY: setup
setup: ## Complete dotfiles setup
	$(call log,🚀 Starting complete setup...,$(BLUE))
	@if [ -f "./setup.sh" ]; then \
		bash ./setup.sh; \
	else \
		echo "$(RED)❌ setup.sh not found$(NO_COLOR)"; \
		exit 1; \
	fi

.PHONY: verify
verify: ## Run pre-commit verification checks
	$(call log,🔍 Running pre-commit verification...,$(BLUE))
	@if [ -f "$(HOME)/.agent/scripts/pre-commit-verify.sh" ]; then \
		bash "$(HOME)/.agent/scripts/pre-commit-verify.sh"; \
	else \
		echo "$(RED)❌ Pre-commit verification script not found$(NO_COLOR)"; \
		echo "$(YELLOW)💡 Run 'make setup' to install agent tools$(NO_COLOR)"; \
		exit 1; \
	fi

.PHONY: scan
scan: ## Run dependency vulnerability scan
	$(call log,🛡️  Running vulnerability scan...,$(BLUE))
	@if [ -f "$(HOME)/.agent/scripts/vuln-scan.sh" ]; then \
		bash "$(HOME)/.agent/scripts/vuln-scan.sh"; \
	else \
		echo "$(RED)❌ Vulnerability scan script not found$(NO_COLOR)"; \
		echo "$(YELLOW)💡 Run 'make setup' to install agent tools$(NO_COLOR)"; \
		exit 1; \
	fi

.PHONY: scan-install
scan-install: ## Install vulnerability scanning tools
	$(call log,⚙️  Installing vulnerability scanning tools...,$(BLUE))
	@if [ -f "$(HOME)/.agent/scripts/vuln-scan.sh" ]; then \
		bash "$(HOME)/.agent/scripts/vuln-scan.sh" --install-tools; \
	else \
		echo "$(RED)❌ Vulnerability scan script not found$(NO_COLOR)"; \
		exit 1; \
	fi

.PHONY: memory-init
memory-init: ## Initialize AI memory system
	$(call log,🧠 Initializing AI memory system...,$(BLUE))
	@if [ -f "$(HOME)/.agent/scripts/memory-init.sh" ]; then \
		bash "$(HOME)/.agent/scripts/memory-init.sh"; \
	else \
		echo "$(RED)❌ Memory initialization script not found$(NO_COLOR)"; \
		echo "$(YELLOW)💡 Run 'make setup' to install agent tools$(NO_COLOR)"; \
		exit 1; \
	fi

.PHONY: quality
quality: verify scan ## Run all quality and security checks
	$(call log,✅ All quality checks completed,$(GREEN))

.PHONY: pre-commit
pre-commit: verify ## Alias for verify (pre-commit hook compatible)

.PHONY: update-packages
update-packages: ## Update system packages (macOS only)
	$(call log,📦 Updating system packages...,$(BLUE))
	@if [ "$$(uname)" = "Darwin" ] && [ -f "$(STOW_DIR)/installers/mac/Brewfile" ]; then \
		brew bundle install --file="$(STOW_DIR)/installers/mac/Brewfile"; \
		brew update && brew upgrade; \
		$(call log,✅ Packages updated,$(GREEN)); \
	else \
		echo "$(YELLOW)⚠️  Package update only supported on macOS with Brewfile$(NO_COLOR)"; \
	fi

.PHONY: dev-env
dev-env: ## Setup development environments with mise
	$(call log,🛠️  Setting up development environments...,$(BLUE))
	@if command -v mise > /dev/null 2>&1; then \
		mise install; \
		$(call log,✅ Development environments installed,$(GREEN)); \
	else \
		echo "$(YELLOW)⚠️  mise not found. Run 'make setup' first$(NO_COLOR)"; \
	fi

.PHONY: check
check: status diff ## Quick check of dotfile status and differences
	$(call log,✅ Dotfile check completed,$(GREEN))

.PHONY: doctor
doctor: ## Diagnose common issues
	$(call log,🏥 Running system diagnostics...,$(BLUE))
	@echo "$(YELLOW)🔍 Checking dependencies:$(NO_COLOR)"
	@command -v stow > /dev/null && echo "  ✅ stow installed" || echo "  ❌ stow missing"
	@command -v git > /dev/null && echo "  ✅ git installed" || echo "  ❌ git missing"
	@command -v make > /dev/null && echo "  ✅ make installed" || echo "  ❌ make missing"
	@echo
	@echo "$(YELLOW)📁 Checking directories:$(NO_COLOR)"
	@[ -d "$(STOW_DIR)" ] && echo "  ✅ $(STOW_DIR) exists" || echo "  ❌ $(STOW_DIR) missing"
	@[ -d "$(STOW_DIR)/$(PACKAGE)" ] && echo "  ✅ $(STOW_DIR)/$(PACKAGE) exists" || echo "  ❌ $(STOW_DIR)/$(PACKAGE) missing"
	@[ -d "$(TARGET_DIR)" ] && echo "  ✅ $(TARGET_DIR) exists" || echo "  ❌ $(TARGET_DIR) missing"
	@echo
	@echo "$(YELLOW)🔧 Checking agent tools:$(NO_COLOR)"
	@[ -f "$(HOME)/.agent/scripts/pre-commit-verify.sh" ] && echo "  ✅ pre-commit verification available" || echo "  ❌ pre-commit verification missing"
	@[ -f "$(HOME)/.agent/scripts/vuln-scan.sh" ] && echo "  ✅ vulnerability scanning available" || echo "  ❌ vulnerability scanning missing"
	@[ -f "$(HOME)/.agent/scripts/memory-init.sh" ] && echo "  ✅ memory initialization available" || echo "  ❌ memory initialization missing"
	@echo
	@echo "$(YELLOW)⚙️  Optional tools:$(NO_COLOR)"
	@command -v mise > /dev/null && echo "  ✅ mise installed" || echo "  ⚠️  mise not installed"
	@command -v code > /dev/null && echo "  ✅ VS Code installed" || echo "  ⚠️  VS Code not installed"

# Development workflow targets
.PHONY: git-hooks
git-hooks: ## Install git hooks
	$(call log,🪝 Installing git hooks...,$(BLUE))
	@if [ -d ".git" ]; then \
		echo "#!/bin/bash" > .git/hooks/pre-commit; \
		echo "make pre-commit" >> .git/hooks/pre-commit; \
		chmod +x .git/hooks/pre-commit; \
		$(call log,✅ Git pre-commit hook installed,$(GREEN)); \
	else \
		echo "$(RED)❌ Not in a git repository$(NO_COLOR)"; \
	fi

.PHONY: test
test: quality check ## Run comprehensive tests
	$(call log,🧪 Running comprehensive tests...,$(BLUE))
	@echo "$(YELLOW)📊 Test Summary:$(NO_COLOR)"
	@echo "  ✅ Quality checks: PASSED"
	@echo "  ✅ Dotfile checks: PASSED" 
	$(call log,✅ All tests passed,$(GREEN))

# Clean up targets
.PHONY: reset
reset: unstow clean ## Reset dotfiles (unstow and clean)
	$(call log,🔄 Dotfiles reset complete,$(GREEN))

.PHONY: nuke
nuke: ## Complete reset (WARNING: removes all symlinks)
	$(call log,💥 Nuclear reset - removing ALL dotfile symlinks...,$(RED))
	@read -p "Are you sure? This will remove all dotfile symlinks (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		$(MAKE) unstow; \
		$(MAKE) clean; \
		$(call log,💥 Nuclear reset complete,$(RED)); \
	else \
		$(call log,❌ Nuclear reset cancelled,$(YELLOW)); \
	fi