# Units of Work — Autenticación Passwordless con Passkey en LifeMiles

**Decomposition rationale**: The implementation plan already groups the 10 tasks into 4 coherent logical units (per `implementation-plan-passkey-lifemiles.md` → "Proposed Solution"). This maps cleanly to a monolith-with-logical-modules deployment model: a single Spring Boot module (`com.lifemiles.passkey`) plus Keycloak-side artifacts (realm config docs, themes) that are deployed to the existing Keycloak installation, not as a separate service.

**Code organization strategy (Greenfield, single-module monolith)**:
```
<workspace-root>/
├── pom.xml
├── src/main/java/com/lifemiles/passkey/
│   ├── config/         (SecurityFilterChain, CORS, Keycloak Admin Client beans, RuntimeHints)
│   ├── controller/      (PasskeyController)
│   ├── service/         (PasskeyRegistrationService, PasskeyManagementService)
│   ├── model/           (DTO records: PasskeyResponse, RenamePasskeyRequest)
│   ├── security/         (JWT validation support, rate limiting filter)
│   ├── exception/       (Custom exceptions, @RestControllerAdvice)
│   └── audit/            (AOP audit interceptor)
├── src/main/resources/
│   ├── application.yml
│   └── META-INF/native-image/   (reflection/proxy hints)
├── src/test/java/com/lifemiles/passkey/   (unit + integration tests)
├── src/test/resources/keycloak-test-realm.json   (Testcontainers fixture)
├── themes/lifemiles-passkey/login/    (FreeMarker theme: login.ftl, webauthn-authenticate.ftl, webauthn-register.ftl, theme.properties, messages/)
├── docs/keycloak-console-setup.md     (manual Admin Console setup guide)
├── Dockerfile.native / Dockerfile.jvm
└── README.md
```

## Unit 1: Keycloak Configuration

**Responsibility**: Establish the Keycloak-side foundation — standalone install guidance, manual Admin Console configuration of the WebAuthn Passwordless authenticator on the real dev/staging instance, and the Testcontainers fixture realm used by automated tests.

**Maps to Tasks**: Task 1 (scaffolding + Keycloak standalone config)

**Key artifacts produced**:
- `docs/keycloak-console-setup.md` — step-by-step manual console guide
- `src/test/resources/keycloak-test-realm.json` — test-only fixture realm
- Spring Boot project skeleton, Maven native profile, `application.yml` (env-var driven)
- `Dockerfile` (native build, backend only)

**No Keycloak REST/UI code is written by this unit for the real instance** — it is documentation-driven per the user's explicit decision.

## Unit 2: Custom Login Theme

**Responsibility**: FreeMarker login theme changes (login page + WebAuthn ceremony templates) presenting the Passkey option alongside existing methods, with device compatibility detection and accessibility compliance.

**Maps to Tasks**: Task 2 (login theme), Task 3 (registration ceremony UI — `webauthn-register.ftl`), Task 4 (authentication ceremony UI adjustments), Task 6 (Account Console customization)

**Key artifacts produced**: `themes/lifemiles-passkey/login/*.ftl`, CSS, `messages_es.properties`, Account Console customizations

## Unit 3: Spring Boot Backend (Native-Ready)

**Responsibility**: All backend business logic — Passkey registration orchestration, passwordless login token validation, Passkey management REST API, security hardening (rate limiting, CORS, audit logging), coexistence validation logic, native image readiness.

**Maps to Tasks**: Task 3 (registration endpoints/service), Task 4 (login token validation), Task 5 (management API), Task 7 (coexistence/fallback logic), Task 8 (security hardening/audit), Task 10 (native optimization/deployment docs)

**Key artifacts produced**: `PasskeyController`, `PasskeyRegistrationService`, `PasskeyManagementService`, DTOs, exception handling, `RateLimitFilter`, audit `@Aspect`, `RuntimeHintsRegistrar` implementations, `Dockerfile.native`/`Dockerfile.jvm`, deployment docs, SBOM config

## Unit 4: Testing & Integration

**Responsibility**: Comprehensive automated verification across all units — BDD (Cucumber) automation of the 7 feature files, E2E (Playwright with virtual WebAuthn authenticators), PBT (jqwik, Partial mode) for serialization/invariant properties, and integration tests (Testcontainers) validating cross-unit behavior (coexistence, token equivalence, rate limiting).

**Maps to Tasks**: Task 9 (BDD & E2E automation), plus integration test requirements distributed across Tasks 1, 3, 4, 5, 7, 8

**Key artifacts produced**: Cucumber step definitions (7 classes), Playwright E2E specs, jqwik property tests + custom `@Provide` generators, Testcontainers integration test classes, `jqwik.properties`

## Dependency Note

Units 2, 3, and 4 all depend on Unit 1 being complete (Keycloak console guide + Testcontainers fixture realm must exist before login theme, backend, or tests can be meaningfully built/verified). See `unit-of-work-dependency.md`.

## Build Sequence Decision

Given the dependency structure, units will be executed in this order during Construction: **Unit 1 → Unit 2 → Unit 3 → Unit 4**, matching the Task 1–10 numbering already established in the implementation plan. This preserves the incremental, testable structure already approved by the user (registration → login → management → coexistence → hardening → test automation → native optimization).
