# Modern Dotfiles Management with GNU Stow

# Configuration
STOW_DIR := src
TARGET_DIR := $(HOME)
PACKAGE := home

# Default target
.DEFAULT_GOAL := help

# Colors for output
NO_COLOR := \\033[0m
GREEN := \\033[32m
YELLOW := \\033[33m
BLUE := \\033[34m
RED := \\033[31m

# Helper function for colored output
define log
	@echo "$(2)$(1)$(NO_COLOR)"
endef

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Modern Dotfiles Management$(NO_COLOR)"
	@echo
	@echo "$(YELLOW)Available targets:$(NO_COLOR)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NO_COLOR) %s\\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: setup
setup: ## Run complete setup script
	$(call log,🚀 Starting complete setup...,$(BLUE))
	@if [ -f "./setup.sh" ]; then \
		bash ./setup.sh; \
	else \
		echo "$(RED)❌ setup.sh not found$(NO_COLOR)"; \
		exit 1; \
	fi

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
stow: ## Apply dotfile symlinks (excludes .claude, use deploy for full setup)
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

.PHONY: test
test: ## Run hook and workflow tests
	@$(MAKE) -C tests test

.PHONY: clean
clean: ## Clean broken symlinks
	$(call log,🧹 Cleaning broken symlinks...,$(BLUE))
	@find $(TARGET_DIR) -maxdepth 1 -name ".*" -type l ! -exec test -e {} \\; -exec rm -v {} \\;
	$(call log,✅ Broken symlinks cleaned,$(GREEN))

.PHONY: deploy
deploy: ## Backup conflicts and stow in one step
	$(call log,🚀 Deploying dotfiles...,$(BLUE))
	@source scripts/setup-common.sh && \
		backup_dotfiles_common && \
		stow_dotfiles_common
	$(call log,✅ Deploy complete,$(GREEN))

.PHONY: doctor
doctor: ## Diagnose common issues
	$(call log,🏥 Running system diagnostics...,$(BLUE))
	@echo "$(YELLOW)🔍 Required tools:$(NO_COLOR)"
	@command -v stow > /dev/null && echo "  ✅ stow" || echo "  ❌ stow (brew install stow / apt install stow)"
	@command -v git > /dev/null && echo "  ✅ git" || echo "  ❌ git"
	@command -v make > /dev/null && echo "  ✅ make" || echo "  ❌ make"
	@echo
	@echo "$(YELLOW)🔧 CLI tools:$(NO_COLOR)"
	@command -v eza > /dev/null && echo "  ✅ eza" || echo "  ⚠️  eza (brew install eza / cargo install eza)"
	@command -v bat > /dev/null && echo "  ✅ bat" || echo "  ⚠️  bat (brew install bat / apt install bat)"
	@command -v rg > /dev/null && echo "  ✅ ripgrep" || echo "  ⚠️  ripgrep (brew install ripgrep / apt install ripgrep)"
	@command -v fd > /dev/null && echo "  ✅ fd" || echo "  ⚠️  fd (brew install fd / apt install fd-find)"
	@command -v fzf > /dev/null && echo "  ✅ fzf" || echo "  ⚠️  fzf (brew install fzf / apt install fzf)"
	@command -v jq > /dev/null && echo "  ✅ jq" || echo "  ⚠️  jq (brew install jq / apt install jq)"
	@command -v mise > /dev/null && echo "  ✅ mise" || echo "  ⚠️  mise (brew install mise / curl https://mise.run | sh)"
	@command -v starship > /dev/null && echo "  ✅ starship" || echo "  ⚠️  starship (brew install starship / cargo install starship)"
	@command -v claude > /dev/null && echo "  ✅ claude" || echo "  ⚠️  claude (brew install claude-code / npm i -g @anthropic-ai/claude-code)"
	@echo
	@echo "$(YELLOW)📁 Checking directories:$(NO_COLOR)"
	@[ -d "$(STOW_DIR)" ] && echo "  ✅ $(STOW_DIR) exists" || echo "  ❌ $(STOW_DIR) missing"
	@[ -d "$(STOW_DIR)/$(PACKAGE)" ] && echo "  ✅ $(STOW_DIR)/$(PACKAGE) exists" || echo "  ❌ $(STOW_DIR)/$(PACKAGE) missing"
	@[ -d "$(TARGET_DIR)" ] && echo "  ✅ $(TARGET_DIR) exists" || echo "  ❌ $(TARGET_DIR) missing"
	@echo
	@echo "$(YELLOW)🔗 Checking symlinks:$(NO_COLOR)"
	@[ -L "$(HOME)/.zshrc" ] && echo "  ✅ .zshrc linked" || echo "  ⚠️  .zshrc not linked"
	@[ -L "$(HOME)/.gitconfig" ] && echo "  ✅ .gitconfig linked" || echo "  ⚠️  .gitconfig not linked"
	@[ -f "$(HOME)/.claude/settings.json" ] && echo "  ✅ Claude settings exists" || echo "  ⚠️  Claude settings missing"
