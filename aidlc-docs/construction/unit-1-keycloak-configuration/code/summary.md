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
- `src/test/resources/lifemiles-test-realm.json` — Testcontainers-only fixture realm (`lifemiles-test`) with WebAuthn Passwordless pre-configured as ALTERNATIVE in a custom browser flow. The file name deliberately matches the realm name (see Defect 3 below)
- `src/test/resources/README-fixture-realm.md` — explicit documentation that this fixture is independent of and does not represent the real instance's manual setup, plus a warning that the file name must not be changed independently of the realm name
- `src/test/java/com/lifemiles/passkey/config/KeycloakFixtureRealmIT.java` — Testcontainers integration test verifying the fixture realm imports correctly, the WebAuthn Passwordless policy values are as specified, and the WebAuthn Passwordless authenticator is present as ALTERNATIVE
- `src/test/java/com/lifemiles/passkey/PasskeyApplicationAotTests.java` — verifies the Spring context loads (AOT-compatible) with stubbed Keycloak env vars

## Key decisions

1. **jqwik pinned to 1.9.3, not the latest 1.10.x** — jqwik 1.10.0+ contains a confirmed, maintainer-acknowledged prompt-injection payload targeting AI coding agents (hidden via ANSI escape codes in test output, instructing deletion of tests/code). This is documented publicly (jqwik-team/jqwik issues #708, #710, #714; covered by Ars Technica and TechSpot). 1.9.3 is the last release before this behavior was introduced. This decision is documented inline in `pom.xml` and satisfies SECURITY-10 (trusted sources only).
2. **Keycloak Admin Client reflection hints deferred to Unit 3**: `PasskeyRuntimeHints` is scaffolded but left empty in Unit 1 since no production code yet uses Keycloak Admin Client DTOs reflectively.
3. **No Maven Wrapper committed**: the Dockerfile installs a pinned Maven version directly in the build stage instead of relying on `mvnw`, since no wrapper was requested and this avoids committing wrapper JAR binaries.
4. **Keycloak test image pinned explicitly** to `quay.io/keycloak/keycloak:26.1` in
   `KeycloakFixtureRealmIT` instead of relying on the library default. testcontainers-keycloak
   deprecated the no-arg `KeycloakContainer()` constructor from version 4.2 onwards, and
   SECURITY-10 requires exact tags rather than library-chosen defaults that can shift between
   releases.
5. **Removed stray `spring-boot-starter-aop` dependency**: a leftover dependency pinned to `3.5.16` (a Spring Boot 3.x version, inconsistent with the 4.0.8 parent BOM) was present in `pom.xml` but unused by any generated code (no `@Aspect`/AOP usage exists). Removed during this generation pass to avoid an unplanned, unpinned-relative-to-BOM dependency and a potential classpath conflict; not part of the original Step 1 dependency list and outside this unit's scope.

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

## Test Requirements Status — VERIFIED 2026-08-26

Executed in WSL Ubuntu 24.04 (OpenJDK 21.0.12, Maven 3.8.7, Docker 29.4.3) via
`mvn clean verify -Pintegration`. Result: **BUILD SUCCESS**.

| Requirement | Status | Evidence |
|---|---|---|
| Testcontainers fixture realm smoke test (`KeycloakFixtureRealmIT`) | **PASSING** 3/3 | Keycloak logged `KC-SERVICES0032: Import finished successfully`; realm reachable, WebAuthn policy correct, authenticator present as ALTERNATIVE |
| AOT context load test (`PasskeyApplicationAotTests`) | **PASSING** 1/1 | Surefire |
| Native image build (`mvn -Pnative native:compile`) | **NOT EXECUTED** | Requires a GraalVM installation, absent from the WSL environment (only OpenJDK 21 present). Remains a manual verification step for the developer/CI, consistent with the plan's Task 1 demo criteria |

## Defects found and fixed during first execution

The code in this unit had been generated but never compiled or run. The first execution
surfaced three real defects, all of which are now fixed and verified. Full diagnostic
trail, including two incorrect hypotheses that were raised and refuted along the way, is
recorded in `aidlc-docs/audit.md`.

**Defect 1 — `commons-io` version conflict (blocking).** `keycloak-admin-client:26.0.12` pulls
`resteasy-multipart-provider`, which brings `commons-io:2.11.0` at compile scope. That version
won dependency resolution over the `2.20.0` required by `commons-compress:1.28.0`, which
Testcontainers uses in `MountableFile`. The result was
`NoClassDefFoundError: org.apache.commons.io.file.attribute.FileTimes` thrown on background
thread `Thread-1` while copying the realm file into the container. Because the exception was
not on the main thread, Testcontainers did not fail: the container started **without** the
realm file, no import was attempted, and the test failed later with a misleading HTTP 404.
Fixed by a `<dependencyManagement>` entry forcing `commons-io:2.20.0`.

**Defect 2 — Testcontainers version misalignment.** `org.testcontainers:junit-jupiter` was
pinned to `1.21.4` while the Spring Boot 4.0.8 BOM resolved core `testcontainers` to `2.0.5`,
and `testcontainers-keycloak:3.6.0` declared core `1.20.4`. The `junit-jupiter` module has no
2.x release. Fixed by upgrading `testcontainers-keycloak` to `4.3.1` (which declares
`testcontainers 2.0.5`, matching the BOM) and removing the `junit-jupiter` dependency, which
is unnecessary because the integration test manages the container lifecycle explicitly in
`@BeforeAll`/`@AfterAll`.

**Defect 3 — fixture file name incompatible with Keycloak's directory import.** Keycloak
imports everything in `/opt/keycloak/data/import` through `DirImportProvider`, which derives
the realm name from the **file name** using the `<realmName>-realm.json` convention. The
fixture was generated as `keycloak-test-realm.json`, so Keycloak derived realm `keycloak-test`,
imported the JSON (which declares `lifemiles-test`), then bound the session to the
non-existent derived realm and aborted startup with `Session not bound to a realm`. Fixed by
renaming the fixture to `lifemiles-test-realm.json`. Fixture content is unchanged from the
approved Step 7 design.
