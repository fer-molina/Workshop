#!/usr/bin/env bash
# Type-check and lint the SPA now that a faithful `yarn install` is possible.
# Runs against ~/spa-build, which already has the real node_modules installed.
set -u

NODE_VERSION="20.15.0"
export NVM_DIR="$HOME/.nvm"
PATH="$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '^/mnt/' | paste -sd ':' -)"
export PATH="$NVM_DIR/versions/node/v${NODE_VERSION}/bin:$PATH"

cd "$HOME/spa-build" || exit 1

echo "=== tsc --noEmit (whole project) ==="
npx tsc --noEmit 2>&1 | tail -60
echo "TSC_RC=${PIPESTATUS[0]}"

echo
echo "=== eslint on the Passkey files only ==="
npx eslint \
  src/utils/webauthn.ts \
  src/types/models/passkey.ts \
  src/components/PasskeyButton/index.tsx \
  src/components/PasskeyCeremony/index.tsx \
  src/components/SocialManager/index.tsx \
  src/views/PasskeyAuthenticate/index.tsx \
  src/views/PasskeyRegister/index.tsx \
  src/main.tsx \
  --ext ts,tsx 2>&1 | tail -60
echo "ESLINT_RC=${PIPESTATUS[0]}"

echo
echo "=== stylelint on the new CSS modules ==="
npx stylelint \
  "src/components/PasskeyButton/main.module.css" \
  "src/components/PasskeyCeremony/main.module.css" 2>&1 | tail -30
echo "STYLELINT_RC=${PIPESTATUS[0]}"
echo "VERIFY_DONE"
