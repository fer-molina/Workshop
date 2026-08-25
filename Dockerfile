# syntax=docker/dockerfile:1
#
# Native-image build for the LifeMiles Passkey service (backend only).
# This Dockerfile is unrelated to the Keycloak deployment; Keycloak itself is deployed and
# configured separately per docs/keycloak-console-setup.md.
#
# Pinned base image tags per SECURITY-10 (no "latest" tags in production Dockerfiles).

FROM ghcr.io/graalvm/native-image-community:21.0.2 AS build

# The native-image-community base image does not ship Maven; install a pinned version.
ENV MAVEN_VERSION=3.9.9
RUN microdnf install -y tar gzip && \
    curl -fsSL "https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz" \
      -o /tmp/maven.tar.gz && \
    tar -xzf /tmp/maven.tar.gz -C /opt && \
    ln -s "/opt/apache-maven-${MAVEN_VERSION}/bin/mvn" /usr/local/bin/mvn && \
    rm /tmp/maven.tar.gz

WORKDIR /workspace

COPY pom.xml .
COPY src ./src

# Download dependencies first for better layer caching, then compile the native binary.
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -Pnative native:compile -DskipTests

FROM gcr.io/distroless/base-debian12:nonroot

WORKDIR /app
COPY --from=build /workspace/target/passkey-service /app/passkey-service

USER nonroot
EXPOSE 8080
ENTRYPOINT ["/app/passkey-service"]
