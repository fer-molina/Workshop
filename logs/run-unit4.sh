#!/usr/bin/env bash
# Unit 4 verification: full JVM suite, then the GraalVM native image build.
#
# Finding that made the native step possible: the SDKMAN "current" JDK is
# 25.0.4-graal — GraalVM Oracle 25.0.4 for Linux — which has been compiling this project since
# Unit 1. native-image is present at lib/svm/bin/native-image (not symlinked into bin/, which is why
# a `command -v native-image` check missed it).
export SDKMAN_DIR="$HOME/.sdkman"
export JAVA_HOME="$SDKMAN_DIR/candidates/java/25.0.4-graal"
export GRAALVM_HOME="$JAVA_HOME"
export PATH="$JAVA_HOME/bin:$JAVA_HOME/lib/svm/bin:$PATH"

SRC="/mnt/c/Users/fjmolina/OneDrive - Aerovias del Continente Americano S.A. AVIANCA/Documents/Work/Workshop"

echo "=== toolchain ==="
java -version 2>&1
native-image --version 2>&1 | head -2

echo
echo "=== sync ==="
rsync -a --delete --exclude target --exclude .git --exclude node_modules "$SRC/" ~/passkey-build/ || exit 1
cd ~/passkey-build || exit 1

echo
echo "=== JVM suite: mvn clean verify -Pintegration ==="
mvn -B -ntp clean verify -Pintegration > /tmp/u4-verify.log 2>&1
echo "VERIFY_RC=$?"
grep -E 'Tests run:|BUILD SUCCESS|BUILD FAILURE|ERROR\]' /tmp/u4-verify.log | tail -25

echo
echo "=== native image: mvn -Pnative native:compile ==="
echo "(slow; this is the first time it has been attempted in this project)"
mvn -B -ntp -Pnative native:compile -DskipTests > /tmp/u4-native.log 2>&1
echo "NATIVE_RC=$?"
tail -35 /tmp/u4-native.log

echo
echo "=== native binary ==="
ls -la target/passkey-service 2>&1 || echo "no binary produced"

echo "UNIT4_RUN_DONE"
