#!/usr/bin/env bash
# Attempts `yarn install` for hub-keycloack-login-ui, then runs the Vitest suite.
#
# Runs against a WSL-native copy under ~/spa-build rather than the OneDrive path on /mnt/c:
# node_modules on a DrvFs mount is very slow and OneDrive sync can corrupt it mid-install.
set -u

NODE_VERSION="20.15.0"
export NVM_DIR="$HOME/.nvm"
SRC="/mnt/c/Users/fjmolina/OneDrive - Aerovias del Continente Americano S.A. AVIANCA/Documents/Work/Workshop/hub-keycloack-login-ui"
DEST="$HOME/spa-build"

# Strip Windows PATH entries so the Windows node/npm/corepack shims cannot be picked up.
PATH="$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '^/mnt/' | paste -sd ':' -)"
export PATH
export PATH="$NVM_DIR/versions/node/v${NODE_VERSION}/bin:$PATH"

echo "=== environment ==="
echo "NODE=$(node -v)"
echo "YARN=$(yarn -v)"

echo
echo "=== sync source to WSL-native filesystem ==="
mkdir -p "$DEST"
rsync -a --delete --exclude node_modules --exclude dist "$SRC/" "$DEST/"
cd "$DEST" || exit 1

echo
echo "=== yarn install ==="
# --frozen-lockfile: the lockfile is authoritative; a silent resolution change would make
# any test result meaningless.
yarn install --frozen-lockfile --network-timeout 120000
INSTALL_RC=$?
echo "INSTALL_RC=${INSTALL_RC}"

if [ "${INSTALL_RC}" -ne 0 ]; then
  echo "INSTALL_FAILED — stopping before tests"
  exit "${INSTALL_RC}"
fi

echo
echo "=== vitest (run once, no watch) ==="
npx vitest run --reporter=verbose
TEST_RC=$?
echo "TEST_RC=${TEST_RC}"
echo "SPA_DONE"
