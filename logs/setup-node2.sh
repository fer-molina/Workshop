#!/usr/bin/env bash
# Second pass: complete the Node 20 / Yarn Classic install.
#
# The first pass installed nvm correctly but `npm install -g yarn` was executed by the
# WINDOWS npm, which WSL inherits on PATH through /mnt/c interop. It failed trying to write
# to C:\Users\...\AppData\Roaming\npm.
#
# Fix: strip the Windows entries from PATH for the duration of this script and call nvm's
# node/npm by absolute path, so there is no ambiguity about which binary runs.
set -u

NODE_VERSION="20.15.0"
YARN_VERSION="1.22.22"
export NVM_DIR="$HOME/.nvm"

# Drop every /mnt/ entry so Windows shims cannot win the lookup.
PATH="$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '^/mnt/' | paste -sd ':' -)"
export PATH

# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

echo "=== state ==="
echo "nvm: $(nvm --version)"
echo "installed nodes:"
nvm ls --no-colors || true

echo
echo "=== install node ${NODE_VERSION} ==="
nvm install "${NODE_VERSION}"
nvm alias default "${NODE_VERSION}"
nvm use "${NODE_VERSION}"

NODE_BIN="$NVM_DIR/versions/node/v${NODE_VERSION}/bin"
echo "NODE_BIN=${NODE_BIN}"

echo
echo "=== install yarn ${YARN_VERSION} (classic) using nvm's npm ==="
"${NODE_BIN}/npm" install -g "yarn@${YARN_VERSION}"

echo
echo "=== verify ==="
echo "NODE=$("${NODE_BIN}/node" -v)"
echo "NPM=$("${NODE_BIN}/npm" -v)"
echo "YARN=$("${NODE_BIN}/yarn" -v)"
echo "NODE_PATH=$(command -v node)"
echo "YARN_PATH=$(command -v yarn)"
echo "SETUP_DONE"
