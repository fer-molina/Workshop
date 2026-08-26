#!/usr/bin/env bash
# Diagnose why an interactive login shell is not activating the nvm-managed Node 20.
export NVM_DIR="$HOME/.nvm"

echo "=== before sourcing nvm ==="
echo "node: $(command -v node)"

echo
echo "=== default alias file ==="
cat "$NVM_DIR/alias/default" 2>&1

echo
echo "=== source nvm.sh and inspect ==="
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
echo "nvm loaded: $(command -v nvm >/dev/null 2>&1 && echo yes || echo no)"
echo "nvm current: $(nvm current 2>&1)"
echo "node after source: $(command -v node)"

echo
echo "=== explicit nvm use default ==="
nvm use default
echo "node after use: $(command -v node)"
echo "node version: $(node -v 2>&1)"
echo "yarn: $(command -v yarn) $(yarn -v 2>&1)"

echo
echo "=== PATH entries containing nvm or /usr/bin ==="
printf '%s' "$PATH" | tr ':' '\n' | grep -nE 'nvm|^/usr/bin$' | head -10
echo "DIAG_DONE"
