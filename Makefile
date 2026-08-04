ARCHES := x86 arm

BASE_NAME := crawl4ai

DEFAULT_GOAL := all

.PHONY: all x86 arm riscv universal install clean

all: $(ARCHES)

x86: $(BASE_NAME)_x86_64.s9pk
arm: $(BASE_NAME)_aarch64.s9pk
riscv: $(BASE_NAME)_riscv64.s9pk
universal: $(BASE_NAME).s9pk

javascript/index.js: $(shell find startos -type f) tsconfig.json node_modules
	npm run check
	npm run build

$(BASE_NAME)_%.s9pk: javascript/index.js
	@echo "   Packing '$@'..."
	start-cli s9pk pack . -o $@ --arch=$*

install:
	@if [ -z "$$(ls *.s9pk 2>/dev/null)" ]; then \
		echo "Error: No .s9pk file found. Run 'make' first."; \
		exit 1; \
	fi; \
	S9PK=$$(start-cli s9pk select) || exit 1; \
	printf "\n🚀 Installing %s ...\n" "$$S9PK"; \
	start-cli package install -s "$$S9PK"

clean:
	@echo "Cleaning up build artifacts..."
	@rm -rf javascript *.s9pk
