# Code Generation Plan — Unit 1: Keycloak Configuration

## Unit Context

- **Unit**: Unit 1 — Keycloak Configuration (Project Scaffolding & Standalone Keycloak Setup)
- **Maps to**: Task 1 of `implementation-plan-passkey-lifemiles.md`
- **Requirements covered**: FR-10, ENV-1, ENV-2, ENV-3, ENV-4, ENV-5, NFR-6 (native readiness scaffolding), NFR-7 (Security Baseline: SECURITY-01, 09, 10), NFR-8 (PBT-09 framework selection)
- **Dependencies**: None — this is the foundational unit. Units 2, 3, 4 depend on its output (env var contract, Testcontainers fixture realm, project skeleton).
- **Code organization**: Single-module monolith, package-based separation (`com.lifemiles.passkey`), per `unit-of-work.md`.

## Deliverables Summary

1. Maven-based Spring Boot 4.x project skeleton (Java 21+)
2. Native image build configuration (GraalVM native profile)
3. `docs/keycloak-console-setup.md` — manual Admin Console step-by-step guide (no JSON export)
4. `src/test/resources/keycloak-test-realm.json` — Testcontainers-only fixture realm with WebAuthn Passwordless pre-configured
5. `application.yml` (env-var driven Keycloak connection settings)
6. `Dockerfile` (native image build for the backend, unrelated to Keycloak itself)
7. Smoke test class verifying Testcontainers starts Keycloak with the fixture realm and the WebAuthn authenticator active

## Steps

- [x] **Step 1: Maven project scaffolding**
  - Create `pom.xml` using `spring-boot-starter-parent` 4.0.x, Java 21
  - Dependencies: `spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-validation`
  - Keycloak Admin Client dependency (`org.keycloak:keycloak-admin-client`, pinned version)
  - Test dependencies: `spring-boot-starter-test`, `spring-boot-testcontainers`, `testcontainers-keycloak` (dasniko), `jqwik`, `cucumber-java`, `cucumber-spring`, `playwright` (declared now, used starting Unit 4)
  - CycloneDX Maven plugin for SBOM (SECURITY-10)
  - Path: `pom.xml` (workspace root)

- [x] **Step 2: Package structure setup**
  - Create empty package-info placeholders (or `.gitkeep`) under `src/main/java/com/lifemiles/passkey/{config,controller,service,model,security,exception,audit}`
  - Path: `src/main/java/com/lifemiles/passkey/**`

- [x] **Step 3: Native image Maven profile**
  - Add `native` profile to `pom.xml`: `org.graalvm.buildtools:native-maven-plugin`, `spring-boot-maven-plugin` with `<aot>` goal wiring
  - Add GraalVM reachability metadata repository dependency
  - Path: `pom.xml` (native profile section)

- [x] **Step 4: Native hints scaffolding**
  - Create `src/main/resources/META-INF/native-image/` directory with a placeholder `reflect-config.json` (empty array, to be populated in Unit 3 when Keycloak Admin Client DTOs are used)
  - Create `PasskeyRuntimeHints` class (implements `RuntimeHintsRegistrar`) in `config` package — placeholder registration point, to be extended in Unit 3
  - Path: `src/main/resources/META-INF/native-image/reflect-config.json`, `src/main/java/com/lifemiles/passkey/config/PasskeyRuntimeHints.java`

- [x] **Step 5: `application.yml` — environment-variable driven Keycloak config**
  - Define `spring.security.oauth2.resourceserver.jwt.issuer-uri: ${KEYCLOAK_ISSUER_URI}`
  - Define custom properties block `lifemiles.keycloak.admin-url`, `admin-user`, `admin-password`, `client-id` bound to `${KEYCLOAK_ADMIN_URL}`, `${KEYCLOAK_ADMIN_USER}`, `${KEYCLOAK_ADMIN_PASSWORD}`, `${KEYCLOAK_CLIENT_ID}`
  - No hardcoded defaults for credentials (fail fast if unset in non-test profiles)
  - Path: `src/main/resources/application.yml`

- [x] **Step 6: Keycloak Admin Console manual setup guide**
  - Create `docs/keycloak-console-setup.md` documenting, step by step (no realm JSON export):
    - Standalone install: `bin/kc.sh start-dev` (local dev) / `bin/kc.sh start` (staging-like)
    - Create/select the LifeMiles realm
    - Authentication → Policies → WebAuthn Passwordless Policy: RP name = "LifeMiles", RP ID = LifeMiles domain, user verification = required, resident key = required, attestation conveyance per security policy
    - Authentication → Flows: add WebAuthn Passwordless as ALTERNATIVE execution in the Browser flow
    - Setting the 5 required environment variables for the Spring Boot app to connect
  - Path: `docs/keycloak-console-setup.md`

- [x] **Step 7: Testcontainers fixture realm (test-only)**
  - Create `src/test/resources/keycloak-test-realm.json`: realm `lifemiles-test` with WebAuthn Passwordless authenticator pre-registered as ALTERNATIVE in browser flow, RP name "LifeMiles", RP ID `localhost` (test-appropriate), user verification required, resident key required, plus one test client and one test user
  - Explicitly documented via a header comment (as a JSON-adjacent `.md` note, since JSON doesn't support comments) that this fixture is test-only and independent of the real instance's manual setup
  - Path: `src/test/resources/keycloak-test-realm.json`, `src/test/resources/README-fixture-realm.md`

- [x] **Step 8: Testcontainers smoke test**
  - `KeycloakFixtureRealmIT` — starts a Keycloak Testcontainer (dasniko/testcontainers-keycloak) importing `keycloak-test-realm.json`, asserts realm is reachable and the WebAuthn Passwordless authenticator is present in the browser flow via Admin REST API query
  - Path: `src/test/java/com/lifemiles/passkey/config/KeycloakFixtureRealmIT.java`

- [x] **Step 9: AOT context load test**
  - `PasskeyApplicationAotTests` — verifies the Spring context loads under AOT processing (`@SpringBootTest` + AOT-friendly config, no external Keycloak dependency needed for this test)
  - Path: `src/test/java/com/lifemiles/passkey/PasskeyApplicationAotTests.java`

- [x] **Step 10: Dockerfile (native image build, backend only)**
  - Multi-stage: `FROM ghcr.io/graalvm/native-image-community:21` (pinned digest/tag) build stage → `FROM gcr.io/distroless/base-debian12` runtime stage
  - Path: `Dockerfile`

- [x] **Step 11: Main application class + minimal SecurityFilterChain placeholder**
  - `PasskeyApplication` (`@SpringBootApplication`) main class
  - Minimal `SecurityConfig` in `config` package establishing JWT resource-server auth (to be extended in Unit 3) — required for the AOT test (Step 9) and smoke test to have a valid application context
  - Path: `src/main/java/com/lifemiles/passkey/PasskeyApplication.java`, `src/main/java/com/lifemiles/passkey/config/SecurityConfig.java`

- [x] **Step 12: Documentation summary**
  - Create `aidlc-docs/construction/unit-1-keycloak-configuration/code/summary.md` documenting what was generated, decisions made (pinned versions used), and how it satisfies FR-10, ENV-1 through ENV-5
  - Path: `aidlc-docs/construction/unit-1-keycloak-configuration/code/summary.md`

## Test Requirements (from implementation plan, Task 1)

- Testcontainers starts Keycloak with `keycloak-test-realm.json`; verify WebAuthn authenticator is active (Step 8)
- Application context loads in AOT mode (Step 9)
- Native image build is deferred to manual verification (`mvn -Pnative native:compile`) — documented in summary, not run automatically in this stage since it requires GraalVM installed locally (flagged as a build/test-time verification, not blocking Unit 1 code generation)

## Security Compliance Targets (SECURITY Baseline — blocking)

- **SECURITY-01** (TLS for Keycloak connection): `application.yml` issuer URI expected to be `https://` in real deployments; documented in console setup guide
- **SECURITY-09** (no default credentials): No hardcoded credentials anywhere; env vars required, fail-fast if missing
- **SECURITY-10** (pinned dependencies, SBOM): All Maven dependency versions pinned exactly; CycloneDX plugin configured; no `latest` tag in Dockerfile

## PBT Compliance Targets (Partial mode)

- **PBT-09** (framework selection): jqwik added as a pinned test dependency in `pom.xml`

## Native-Readiness Notes

- Keycloak Admin Client reflection hints are deferred to Unit 3 (where actual DTO usage occurs) per the plan's Task 3 guidance; Step 4 only scaffolds the registration point.
