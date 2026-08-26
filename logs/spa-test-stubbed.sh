#!/usr/bin/env bash
# Runs the Unit 2 SPA tests in a SCRATCH copy with the two private GitLab packages replaced
# by local stubs.
#
# Why: `yarn install` fails with 401 on
# @lm-tecnologias-interactivas-c/website-components and -u/website-utils because .npmrc
# carries a placeholder token. Without node_modules nothing can run at all.
#
# This is NOT a substitute for a real install. It verifies the logic I authored — capability
# detection, the accessible button, and SocialManager's show/hide and POST behaviour — while
# the design-system and utils packages are stubbed. Anything that depends on the real
# implementation of those packages is out of scope for this run.
#
# Everything happens in ~/spa-stub. The user's repository is not modified.
set -u

NODE_VERSION="20.15.0"
export NVM_DIR="$HOME/.nvm"
SRC="/mnt/c/Users/fjmolina/OneDrive - Aerovias del Continente Americano S.A. AVIANCA/Documents/Work/Workshop/hub-keycloack-login-ui"
DEST="$HOME/spa-stub"

PATH="$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '^/mnt/' | paste -sd ':' -)"
export PATH="$NVM_DIR/versions/node/v${NODE_VERSION}/bin:$PATH"

echo "NODE=$(node -v)  YARN=$(yarn -v)"

echo
echo "=== sync to scratch copy ==="
mkdir -p "$DEST"
rsync -a --delete --exclude node_modules --exclude dist "$SRC/" "$DEST/"
cd "$DEST" || exit 1

echo
echo "=== drop the private deps and the private registry config ==="
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const section of ["dependencies", "devDependencies"]) {
  if (!pkg[section]) continue;
  for (const name of Object.keys(pkg[section])) {
    if (name.startsWith("@lm-tecnologias-interactivas")) {
      delete pkg[section][name];
      console.log("removed", name);
    }
  }
}
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
'
rm -f .npmrc

echo
echo "=== write stubs for the private packages ==="
mkdir -p src/test/stubs

cat > src/test/stubs/website-components.tsx <<'STUB'
// Minimal stand-in for @lm-tecnologias-interactivas-c/website-components.
import type { ReactNode } from "react"
export const Loader = () => null
export const Input = () => null
export const Button = ({ children }: { children?: ReactNode }) => <button>{children}</button>
export const RootErrorBoundary = ({ children }: { children?: ReactNode }) => <>{children}</>
STUB

cat > src/test/stubs/website-utils.ts <<'STUB'
// Minimal stand-in for @lm-tecnologias-interactivas-u/website-utils.
// Individual tests override these with vi.mock where the behaviour matters.
export const getCookieByName = (_name?: string): string => ""
export const getFlag = (_payload?: unknown): boolean => false
export const replaceTexts = (text: string, _replacements?: Record<string, string>): string => text
export const fetchApiService = () => ({ fetchApi: async () => ({ response: {}, status: 200, success: true }) })
export const createCircuitBreaker = () => async () => ({ response: {}, status: 200, success: true })
STUB

cat > vitest.stub.config.ts <<'STUB'
/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react-swc"
import path from "path"

// Mirrors the aliases in vite.config.ts, plus redirects the two private packages to stubs.
export default defineConfig({
  plugins: [react()],
  css: { modules: { scopeBehaviour: "local", generateScopedName: "hub-keycloak-login-ui__[local]" } },
  resolve: {
    alias: {
      "@lm-tecnologias-interactivas-c/website-components": path.resolve(__dirname, "./src/test/stubs/website-components.tsx"),
      "@lm-tecnologias-interactivas-u/website-utils": path.resolve(__dirname, "./src/test/stubs/website-utils.ts"),
      api: path.resolve(__dirname, "./src/api"),
      css: path.resolve(__dirname, "./src/css"),
      views: path.resolve(__dirname, "./src/views"),
      assets: path.resolve(__dirname, "./src/assets"),
      components: path.resolve(__dirname, "./src/components"),
      request: path.resolve(__dirname, "./src/request"),
      stores: path.resolve(__dirname, "./src/stores"),
      utils: path.resolve(__dirname, "./src/utils"),
      types: path.resolve(__dirname, "./src/types"),
      src: path.resolve(__dirname, "./src"),
      constants: path.resolve(__dirname, "./src/constants.ts")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.ts"
  }
})
STUB

echo
echo "=== yarn install (public deps only, lockfile not enforced) ==="
yarn install --network-timeout 180000 2>&1 | tail -25
INSTALL_RC=${PIPESTATUS[0]}
echo "INSTALL_RC=${INSTALL_RC}"
if [ "${INSTALL_RC}" -ne 0 ]; then
  echo "INSTALL_FAILED"
  exit "${INSTALL_RC}"
fi

echo
echo "=== vitest: Unit 2 tests only ==="
npx vitest run --config vitest.stub.config.ts \
  src/test/utils/webauthn.test.ts \
  src/test/components/PasskeyButton.test.tsx \
  src/test/components/SocialManager.passkey.test.tsx
echo "TEST_RC=$?"
echo "STUBBED_RUN_DONE"
