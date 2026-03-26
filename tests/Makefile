.PHONY: test test-hooks test-scenarios validate install-bats

install-bats:
	@command -v bats >/dev/null 2>&1 || { echo "Installing bats..."; brew install bats-core 2>/dev/null || sudo apt-get install -y bats; }

test: install-bats test-hooks test-scenarios validate

test-hooks: install-bats
	@echo "=== Hook Unit Tests ==="
	bats hooks/

test-scenarios: install-bats
	@echo "=== Scenario Tests ==="
	bats scenarios/

validate:
	@echo "=== Structural Validation ==="
	bash validate-commands.sh
