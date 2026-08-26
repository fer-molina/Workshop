#!/usr/bin/env bash
# Installs Node 20.15.0 (the version pinned in hub-keycloack-login-ui/.node-version) and
# Yarn Classic 1.x (the project's yarn.lock is "yarn lockfile v1") into the WSL user's home.
#
# nvm is used deliberately: it is user-level (no sudo, nothing touched outside $HOME), it
# honours .node-version, and it keeps the distro's apt-managed node 18 intact so nothing
# else on the machine changes behaviour.
set -u

NVM_VERSION="v0.40.1"
NODE_VERSION="20.15.0"
YARN_VERSION="1.22.22"

export NVM_DIR="$HOME/.nvm"

echo "=== 1. install nvm ${NVM_VERSION} ==="
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm already present, skipping download"
else
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
fi

# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
echo "nvm version: $(nvm --version)"

echo
echo "=== 2. install node ${NODE_VERSION} ==="
nvm install "${NODE_VERSION}"
nvm alias default "${NODE_VERSION}"
nvm use "${NODE_VERSION}"

echo
echo "=== 3. install yarn ${YARN_VERSION} (classic) ==="
npm install -g "yarn@${YARN_VERSION}"

echo
echo "=== 4. verify ==="
echo "NODE=$(node -v)"
echo "NPM=$(npm -v)"
echo "YARN=$(yarn -v)"
echo "NODE_PATH=$(command -v node)"
echo "YARN_PATH=$(command -v yarn)"
echo "SETUP_DONE"
