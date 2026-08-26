# Unit 1 — Keycloak Configuration: Code Generation Summary

## What was generated

### Application code (workspace root)
- `pom.xml` — Spring Boot 4.0.8 / Java 21 Maven project, native profile (GraalVM), integration test profile (Failsafe), CycloneDX SBOM plugin, all dependency versions pinned exactly (SECURITY-10)
- `src/main/java/com/lifemiles/passkey/{controller,service,model,security,exception,audit}/package-info.java` — placeholder packages per `unit-of-work.md`'s package-based separation, populated in Unit 3
- `src/main/java/com/lifemiles/passkey/PasskeyApplication.java` — main application class
- `src/main/java/com/lifemiles/passkey/config/SecurityConfig.java` — baseline deny-by-default `SecurityFilterChain` (stateless, JWT resource-server validation on every request)
- `src/main/java/com/lifemiles/passkey/config/LifeMilesKeycloakProperties.java` — `@ConfigurationProperties` binding for the 4 Keycloak admin env vars, with `@NotBlank` fail-fast validation
- `src/main/java/com/lifemiles/passkey/config/PasskeyRuntimeHints.java` — scaffolded `RuntimeHintsRegistrar` registration point (empty; populated in Unit 3)
- `src/main/resources/application.yml` — Keycloak OIDC settings, 100% environment-variable driven, no defaults/hardcoded credentials
- `src/main/resources/META-INF/native-image/reflect-config.json` — empty placeholder for future reflection hints
- `Dockerfile` — multi-stage native image build (GraalVM native-image-community base + distroless runtime), pinned tags, non-root user
- `docs/keycloak-console-setup.md` — step-by-step manual Admin Console guide for the real standalone Keycloak instance (no JSON export), covering standalone install, realm creation, WebAuthn Passwordless Policy configuration, and adding the authenticator as ALTERNATIVE in the Browser flow

### Test code
- `src/test/resources/keycloak-test-realm.json` — Testcontainers-only fixture realm (`lifemiles-test`) with WebAuthn Passwordless pre-configured as ALTERNATIVE in a custom browser flow
- `src/test/resources/README-fixture-realm.md` — explicit documentation that this fixture is independent of and does not represent the real instance's manual setup
- `src/test/java/com/lifemiles/passkey/config/KeycloakFixtureRealmIT.java` — Testcontainers integration test verifying the fixture realm imports correctly and the WebAuthn Passwordless authenticator is present as ALTERNATIVE
- `src/test/java/com/lifemiles/passkey/PasskeyApplicationAotTests.java` — verifies the Spring context loads (AOT-compatible) with stubbed Keycloak env vars

## Key decisions

1. **jqwik pinned to 1.9.3, not the latest 1.10.x** — jqwik 1.10.0+ contains a confirmed, maintainer-acknowledged prompt-injection payload targeting AI coding agents (hidden via ANSI escape codes in test output, instructing deletion of tests/code). This is documented publicly (jqwik-team/jqwik issues #708, #710, #714; covered by Ars Technica and TechSpot). 1.9.3 is the last release before this behavior was introduced. This decision is documented inline in `pom.xml` and satisfies SECURITY-10 (trusted sources only).
2. **Keycloak Admin Client reflection hints deferred to Unit 3**: `PasskeyRuntimeHints` is scaffolded but left empty in Unit 1 since no production code yet uses Keycloak Admin Client DTOs reflectively.
3. **No Maven Wrapper committed**: the Dockerfile installs a pinned Maven version directly in the build stage instead of relying on `mvnw`, since no wrapper was requested and this avoids committing wrapper JAR binaries.
4. **Removed stray `spring-boot-starter-aop` dependency**: a leftover dependency pinned to `3.5.16` (a Spring Boot 3.x version, inconsistent with the 4.0.8 parent BOM) was present in `pom.xml` but unused by any generated code (no `@Aspect`/AOP usage exists). Removed during this generation pass to avoid an unplanned, unpinned-relative-to-BOM dependency and a potential classpath conflict; not part of the original Step 1 dependency list and outside this unit's scope.

## Security Compliance (Task 1 targets)

| Rule | Status | Notes |
|---|---|---|
| SECURITY-01 | Compliant | `docs/keycloak-console-setup.md` mandates TLS for staging/production; issuer-uri expected to be `https://` outside local dev |
| SECURITY-09 | Compliant | No default credentials anywhere; all Keycloak admin values are required env vars with fail-fast validation; console guide instructs against default admin credentials |
| SECURITY-10 | Compliant | All dependency versions pinned exactly; CycloneDX SBOM plugin configured; jqwik supply-chain risk explicitly avoided; Dockerfile uses pinned tags, no `latest` |

## PBT Compliance (Task 1 targets)

| Rule | Status | Notes |
|---|---|---|
| PBT-09 | Compliant | jqwik selected and added as a pinned test dependency (1.9.3) |

## Test Requirements Status

- Testcontainers fixture realm smoke test: generated (`KeycloakFixtureRealmIT`) — **not yet executed** (requires Docker + Maven, to be run in Build and Test phase or on request)
- AOT context load test: generated (`PasskeyApplicationAotTests`) — **not yet executed**
- Native image build (`mvn -Pnative native:compile`): **deferred** — requires a local GraalVM installation, not available in this environment (only Corretto 21 JDK detected); documented as a manual verification step for the developer/CI, consistent with the plan's Task 1 demo criteria

## Known local environment limitations (disclosed)

This development environment has OpenJDK Corretto 21 installed, but **no Maven and no Docker**
were found on the system PATH. As a result:
- `mvn` commands (compile, test, native build) could not be executed locally to verify the generated code compiles and passes tests.
- The generated `pom.xml`, Java sources, and test classes have been carefully reviewed for correctness against Spring Boot 4.0 / Spring Security 7 APIs, but **have not been build-verified in this session**.
- Recommended next step before merging: run `mvn -q compile test-compile` (and, if Docker is available, `mvn -q verify -Pintegration`) in an environment with Maven and Docker installed.
