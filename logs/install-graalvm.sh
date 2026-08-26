#!/usr/bin/env bash
# Installs GraalVM for Linux via SDKMAN (Unit 4, Q3 = A).
# User-level and contained: SDKMAN already manages the current JDK, nothing outside $HOME changes,
# and the existing JDK 25 candidate stays installed.
# NOTE: no `set -u`. SDKMAN's init script references unbound variables internally, so strict mode
# makes sourcing it fail with "SDKMAN_CANDIDATES_API: unbound variable".
export SDKMAN_DIR="$HOME/.sdkman"
# shellcheck disable=SC1091
. "$SDKMAN_DIR/bin/sdkman-init.sh"

echo "=== GraalVM candidates offered by SDKMAN ==="
sdk list java 2>/dev/null | grep -iE 'graal' | head -25

echo
echo "=== attempting install ==="
INSTALLED=""
for CANDIDATE in $(sdk list java 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9]+)?-graal' | head -6); do
  echo "--- trying ${CANDIDATE} ---"
  if yes n | sdk install java "${CANDIDATE}" 2>&1 | tail -5; then
    if [ -x "$SDKMAN_DIR/candidates/java/${CANDIDATE}/bin/java" ]; then
      INSTALLED="${CANDIDATE}"
      break
    fi
  fi
done

if [ -z "${INSTALLED}" ]; then
  echo "GRAALVM_INSTALL_FAILED"
  echo "--- what is installed now ---"
  ls -1 "$SDKMAN_DIR/candidates/java/" 2>&1
  exit 1
fi

GRAAL_HOME="$SDKMAN_DIR/candidates/java/${INSTALLED}"
echo "INSTALLED_CANDIDATE=${INSTALLED}"
echo "GRAAL_HOME=${GRAAL_HOME}"
"${GRAAL_HOME}/bin/java" -version 2>&1
echo "--- native-image present? ---"
if [ -x "${GRAAL_HOME}/bin/native-image" ]; then
  "${GRAAL_HOME}/bin/native-image" --version 2>&1 | head -3
else
  echo "native-image NOT FOUND in ${GRAAL_HOME}/bin"
fi
echo "GRAALVM_SETUP_DONE"
