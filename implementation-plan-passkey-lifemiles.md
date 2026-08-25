# Implementation Plan — Autenticación Passwordless con Passkey en LifeMiles

## Problem Statement

LifeMiles currently offers two authentication methods (username/password and social login via Google/Apple). The goal is to add Passkey (FIDO2/WebAuthn) as a third option, leveraging Keycloak's native WebAuthn support, while ensuring coexistence with existing methods, comprehensive security, and a seamless user experience.

## Requirements

- Full-stack: Keycloak configuration + FreeMarker login theme + Spring Boot backend (token validation, passkey management API) + tests
- Keycloak 24+ (Quarkus) already deployed
- Single Spring Boot module, package-based separation
- **Spring Boot 4.x, Java 21+, GraalVM Native Image ready**
- Passkey management in both Keycloak Account Console and a custom LifeMiles panel
- Security Baseline enforced (all 15 rules), PBT Partial (rules 02, 03, 07, 08, 09)
- Comprehensive testing: Unit + Integration (Testcontainers) + E2E (Playwright with WebAuthn) + BDD automation (Cucumber)

## Background

- Spring Boot 4.x requires Java 21+ and has first-class GraalVM native image support via `spring-boot-starter-parent` native profile and AOT processing
- Native compilation requires: no runtime reflection without hints, no dynamic proxies without registration, all beans resolvable at build time
- Keycloak Admin Client must be validated for native compatibility (may need reflection hints)
- jqwik and Cucumber need native-test configuration or run in JVM mode during test phase

## Extension Configuration

| Extension | Status | Mode |
|-----------|--------|------|
| Security Baseline | ✅ Enabled | Full (blocking) |
| Resiliency Baseline | ❌ Disabled | Skipped |
| Property-Based Testing | ✅ Enabled | Partial (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09 only) |

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Identity Provider | Keycloak 24+ (Quarkus) with WebAuthn Passwordless Authenticator |
| Login Theme | FreeMarker (HTML/CSS/JavaScript) |
| Backend | Java 21+ / Spring Boot 4.x |
| Native Compilation | GraalVM Native Image |
| Build Tool | Maven |
| Testing - Unit | JUnit 5 |
| Testing - PBT | jqwik |
| Testing - Integration | Testcontainers (Keycloak) |
| Testing - BDD | Cucumber-JVM 7.x |
| Testing - E2E | Playwright-Java (with virtual WebAuthn authenticator) |

## Proposed Solution

Four logical units of work, built incrementally:

1. **Keycloak Configuration** — WebAuthn Passwordless authenticator setup, authentication flow, realm config
2. **Custom Login Theme** — FreeMarker theme with Passkey button, WebAuthn JS integration, device compatibility detection
3. **Spring Boot Backend (Native-Ready)** — Token validation, Passkey management API, AOT hints, native profile
4. **Testing & Integration** — BDD automation, E2E with WebAuthn virtual authenticators, PBT for serialization/crypto helpers

---

## Task Breakdown

### Task 1: Project Scaffolding & Keycloak Realm Configuration

**Objective**: Set up the Spring Boot 4.x / Java 21+ project structure with GraalVM native compilation support and configure Keycloak's WebAuthn Passwordless authenticator in the existing realm.

**Implementation guidance**:

- Initialize a Spring Boot 4.x project (Java 21+, Maven) using `spring-boot-starter-parent` 4.x
- Package structure: `com.lifemiles.passkey` with sub-packages: `config`, `controller`, `service`, `model`, `security`, `exception`, `audit`
- Add dependencies:
  - `spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`
  - `spring-boot-starter-validation`
  - Keycloak Admin Client (validate native compatibility, add reflection hints if needed)
  - Test: `spring-boot-starter-test`, `spring-boot-testcontainers`, `testcontainers-keycloak`, `cucumber-java`, `cucumber-spring`, `jqwik`, `playwright-java`
- Configure Maven native profile:
  - `org.graalvm.buildtools:native-maven-plugin`
  - AOT processing enabled via `spring-boot-maven-plugin` with `<aot>` configuration
  - GraalVM reachability metadata repository dependency
- Create `src/main/resources/META-INF/native-image/` directory for reflection/resource/proxy hints
- Add `RuntimeHintsRegistrar` implementation for any classes requiring runtime reflection (e.g., Keycloak Admin Client DTOs)
- Create Keycloak realm export JSON or configuration script:
  - Registers WebAuthn Passwordless Authenticator
  - RP name = "LifeMiles", RP ID = lifemiles domain
  - User verification = "required", resident key = "required"
  - Attestation conveyance per security policy
  - WebAuthn Passwordless as ALTERNATIVE execution in Browser flow
- Provide `docker-compose.yml` for local Keycloak 24 instance with realm auto-import
- `application.yml` with Keycloak OIDC settings (issuer URI, client-id, reference to secrets — no hardcoded credentials)
- Dockerfile for native image build: `FROM ghcr.io/graalvm/jdk-community:21 AS build` → native compile → `FROM gcr.io/distroless/base-debian12` runtime

**Test requirements**:

- Verify Keycloak starts with Testcontainers, realm imports successfully, WebAuthn authenticator is active
- Verify application context loads in AOT mode (`SpringBootTest` with AOT processing)
- Verify native image builds successfully (CI step or local `mvn -Pnative native:compile`)

**Security compliance**: SECURITY-01 (TLS for Keycloak connection), SECURITY-09 (no default credentials), SECURITY-10 (pinned dependencies with lock file, CycloneDX SBOM plugin configured)

**PBT compliance**: PBT-09 (jqwik selected and added as dependency)

**Demo**: `docker-compose up` starts Keycloak with Passkey-enabled realm. `mvn spring-boot:run` starts the app in JVM mode. `mvn -Pnative native:compile` produces a native binary that starts in < 100ms. Tests prove WebAuthn authenticator is registered.

---

### Task 2: Custom FreeMarker Login Theme with Passkey Option

**Objective**: Create a Keycloak FreeMarker theme that displays "Iniciar sesión con Passkey" alongside existing methods, with device compatibility detection.

**Implementation guidance**:

- Theme directory: `themes/lifemiles-passkey/login/` with `theme.properties`, `login.ftl`, `webauthn-authenticate.ftl`, `messages/messages_es.properties`
- `login.ftl`:
  - Username/password form
  - Social providers (Google, Apple) buttons
  - "Iniciar sesión con Passkey" button — conditionally rendered
  - JavaScript: feature-detect `window.PublicKeyCredential` via `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`; hide Passkey button if unsupported
- `webauthn-authenticate.ftl`: Challenge/response UI for the WebAuthn ceremony
- CSS: LifeMiles branding (CSS custom properties), responsive design
- Accessibility (WCAG 2.1 AA):
  - ARIA labels on all interactive elements
  - Keyboard navigation (tab order, focus indicators)
  - Color contrast ≥ 4.5:1
  - Screen reader announcements for dynamic content
- Security headers in theme (meta tags + Keycloak realm config for CSP)

**Test requirements**: Template rendering unit tests (verify conditional logic). Manual browser verification. Accessibility audit with axe-core.

**Security compliance**: SECURITY-04 (security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy), SECURITY-05 (no raw user input in templates), SECURITY-09 (no default Keycloak pages exposed)

**Demo**: Access Keycloak login page → see "Iniciar sesión con Passkey" alongside other options. On non-WebAuthn device → button hidden. Keyboard tab through all options. axe-core scan passes.

---

### Task 3: Passkey Registration (Enrolamiento) Flow

**Objective**: Implement the complete Passkey registration flow for authenticated users.

**Implementation guidance**:

- Keycloak: Configure WebAuthn Passwordless Register as a required action or custom flow triggered from account settings
- FreeMarker template `webauthn-register.ftl` for registration ceremony UI
- Spring Boot endpoints:
  - `POST /api/v1/passkeys/register/initiate` — initiates registration via Keycloak Admin API
  - `POST /api/v1/passkeys/register/complete` — handles registration completion callback
- Service: `PasskeyRegistrationService` — orchestrates Keycloak Admin Client calls
- Error handling: timeout (`RegistrationTimeoutException`), user cancellation, incompatible device — all return appropriate HTTP responses
- Store metadata (device name, registration timestamp) via Keycloak user credential attributes
- Native compatibility: Register `RuntimeHints` for Keycloak Admin Client request/response classes used in registration

**Test requirements**:

- Integration test with Testcontainers: Full registration flow with virtual authenticator
- Unit tests: Service layer with mocked Keycloak Admin Client, error handling paths
- PBT (PBT-02): Round-trip for registration request/response DTO serialization (JSON ↔ Java)
- PBT (PBT-07): Domain-specific generators for registration requests (valid email, valid device names)

**Security compliance**: SECURITY-05 (validate all parameters: device name length, format), SECURITY-08 (authenticated user only, verify user owns the session), SECURITY-12 (credential storage by Keycloak), SECURITY-15 (handle failures safely, fail closed — no partial registrations)

**Demo**: Logged-in user → security settings → "Registrar Passkey" → device verification → success message. Cancel → "Registro cancelado". Timeout → "Tiempo agotado". Incompatible device → informational message.

---

### Task 4: Passwordless Authentication (Login con Passkey) Flow

**Objective**: Implement the Passkey login flow (username-first) where users authenticate via device verification.

**Implementation guidance**:

- Username-first flow in Keycloak:
  1. User enters email on login page
  2. Keycloak sends challenge with allowed credential IDs for that user
  3. Device prompts local verification (biometrics/PIN/security key)
  4. Device signs the challenge
  5. Keycloak validates signature against stored public key
  6. Token issued (same format as other methods)
- FreeMarker: Adjust `webauthn-authenticate.ftl` for username input step before WebAuthn ceremony
- JavaScript: `navigator.credentials.get({ publicKey: { challenge, allowCredentials, ... } })`
- Handle: no credentials on device, timeout, verification failure, unknown username
- Ensure unified token: Same claims, same session duration, same refresh token behavior regardless of auth method
- Spring Boot: Token validation in `SecurityFilterChain` does not differentiate by auth method (standard `JwtDecoder` from issuer)

**Test requirements**:

- Integration test: Full login with Testcontainers + virtual WebAuthn authenticator
- Unit tests: Token validation filter, security configuration
- BDD: Automate "El usuario se autentica exitosamente con Passkey" and failure scenarios

**Security compliance**: SECURITY-08 (token validated server-side, JWT signature/expiration/audience/issuer), SECURITY-11 (rate limiting on login), SECURITY-12 (session: secure/httpOnly/sameSite cookies, server-side expiration), SECURITY-15 (fail closed on verification failure)

**Demo**: User with registered Passkey → login page → enters email → Passkey prompt → device verification → authenticated & redirected. Wrong email → "No Passkey asociada". Timeout → "Tiempo agotado". Token decoded shows same claims as password login.

---

### Task 5: Passkey Management API (Spring Boot Backend)

**Objective**: Build the REST API for Passkey CRUD operations (list, rename, delete/revoke), calling Keycloak Admin API.

**Implementation guidance**:

- Controller: `PasskeyController`
  - `GET /api/v1/passkeys` — list user's Passkeys
  - `PUT /api/v1/passkeys/{id}/name` — rename
  - `DELETE /api/v1/passkeys/{id}` — delete/revoke
- Service: `PasskeyManagementService` — wraps Keycloak Admin Client credential operations
- Model DTOs (Java records — native-friendly):
  - `PasskeyResponse(String id, String name, Instant createdAt, Instant lastUsed)`
  - `RenamePasskeyRequest(String name)` with `@NotBlank @Size(max=100)`
- Input validation: Bean Validation (`jakarta.validation`), `@Valid` on controller parameters
- Object-level authorization: Extract user ID from JWT, verify Passkey belongs to the authenticated user (prevent IDOR)
- Structured logging: SLF4J + structured JSON format, log all CRUD operations (userId, action, passkey ID, timestamp, result)
- Global exception handler (`@RestControllerAdvice`): Generic error responses, no stack traces
- CORS: Restrict to LifeMiles domain origins
- Native hints: Register `RuntimeHints` for DTO records if needed (Spring Boot 4.x typically handles records natively)

**Test requirements**:

- Unit tests: Service layer with mocked Keycloak Admin Client, validation, authorization checks
- Integration tests: Full API flow with Testcontainers Keycloak (create user, register passkey, then list/rename/delete)
- PBT (PBT-02): Round-trip for `PasskeyResponse` JSON serialization/deserialization
- PBT (PBT-03): Invariant — list after delete has size = original - 1; list after register has size = original + 1
- PBT (PBT-07): Custom generators for `RenamePasskeyRequest` (valid names within constraints)

**Security compliance**: SECURITY-03 (structured logging, no PII/tokens logged), SECURITY-05 (input validation on all params, max-length, format), SECURITY-06 (Keycloak service account with minimal permissions — only credential management), SECURITY-08 (deny by default, object-level auth, CORS restricted), SECURITY-15 (exception handling, fail closed, resource cleanup)

**Demo**: `GET /api/v1/passkeys` → returns list. `PUT /api/v1/passkeys/{id}/name` → renames. `DELETE /api/v1/passkeys/{id}` → removes. Accessing another user's Passkey → 403. Invalid input → 400 with validation details.

---

### Task 6: Keycloak Account Console Customization

**Objective**: Customize Keycloak Account Console (v3) to display user-friendly Passkey management.

**Implementation guidance**:

- Extend Account Console theme (Keycloak 24+ uses React-based Account v3)
- Passkey section showing: registered Passkeys list (name, device, registration date, last use)
- Actions: rename, delete with confirmation dialog
- Informational content about Passkey security and device compatibility
- LifeMiles branding consistency, responsive design
- Localization: Spanish (`messages_es.properties`)

**Test requirements**: Manual verification of Account Console UI. Integration test verifying operations through console trigger correct Keycloak state changes.

**Security compliance**: SECURITY-04 (security headers), SECURITY-08 (session-based authentication in console)

**Demo**: User → Account Console → Security → Passkeys section → sees list → renames one → deletes another with confirmation → changes reflected.

---

### Task 7: Coexistence & Fallback Handling

**Objective**: Validate and ensure Passkey coexists with existing methods without interference, with graceful degradation.

**Implementation guidance**:

- Keycloak flow validation: WebAuthn Passwordless as ALTERNATIVE (not REQUIRED) — existing methods unaffected
- Token equivalence: Verify JWT claims structure is identical across all auth methods (same `iss`, `aud`, `exp`, `scope`, `realm_access`)
- FreeMarker fallback: When Keycloak WebAuthn service errors, catch and hide Passkey option; show informational toast; other methods remain functional
- Spring Boot `SecurityFilterChain`: Token validation is method-agnostic (validates signature, issuer, expiration — does not inspect `acr` or `amr` for access decisions unless explicitly required)
- Users without Passkey: No change to their experience

**Test requirements**:

- Integration test: Password login works after Passkey flow added
- Integration test: Social provider login works
- Integration test: Token claims identical across methods (`assertEquals` on relevant claims)
- BDD automation: All coexistence scenarios from BDD file
- Fault injection test: Simulate WebAuthn service unavailability → verify other methods unaffected

**Security compliance**: SECURITY-08 (unified authorization regardless of auth method), SECURITY-15 (Passkey failure → fail closed for Passkey only, other methods still work — graceful degradation, not fail-open)

**Demo**: Login with password ✅, login with Google ✅, login with Apple ✅, login with Passkey ✅ — all produce equivalent sessions. Disable WebAuthn in Keycloak → Passkey option disappears, other methods work.

---

### Task 8: Security Hardening & Audit Logging

**Objective**: Implement security event logging, monitoring, rate limiting, and hardening for the Passkey feature.

**Implementation guidance**:

- Keycloak event listener: Capture `REGISTER_CREDENTIAL`, `LOGIN`, `LOGIN_ERROR`, `REMOVE_CREDENTIAL` for WebAuthn type
- Spring Boot audit interceptor (AOP `@Aspect`): Log all Passkey management API calls — action, userId, passkey ID, timestamp, result (success/failure)
- Rate limiting: Spring Boot filter (e.g., Bucket4j or custom `RateLimitFilter`) on `/api/v1/passkeys/**` and login-related endpoints — configurable thresholds
- CORS: `CorsConfigurationSource` bean restricted to `https://www.lifemiles.com` (and staging origins)
- CSP in theme: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` (unsafe-inline for Keycloak theme CSS — document justification)
- Brute-force: Configure Keycloak's built-in brute force detection (max failures, lockout duration)
- Log retention: Configure Keycloak event log retention ≥ 90 days
- Native compatibility: Ensure AOP aspects and filter chains are AOT-compatible (avoid dynamic proxies where possible — use interface-based proxies or `@Aspect` with compile-time weaving hints)

**Test requirements**:

- Unit tests: Audit interceptor captures events correctly
- Integration tests: Keycloak events fire for registration/authentication
- Integration tests: Rate limiter rejects after threshold
- PBT (PBT-03): Invariant — audit log count increases by exactly 1 per Passkey operation

**Security compliance**: SECURITY-02 (access logging on load balancer/gateway), SECURITY-03 (structured application logging), SECURITY-04 (all headers set), SECURITY-07 (CORS restrictive), SECURITY-11 (rate limiting active), SECURITY-14 (alerting for auth failures, log retention ≥ 90 days, tamper-evident logs)

**Demo**: Register Passkey → Keycloak event log shows event. 10 rapid login attempts → rate limiter returns 429. Audit log query returns structured JSON with all fields. Brute-force lockout after configured failures.

---

### Task 9: Comprehensive BDD & E2E Test Automation

**Objective**: Automate all Gherkin BDD scenarios and implement E2E tests with virtual WebAuthn authenticators.

**Implementation guidance**:

- Cucumber-JVM 7.x + `cucumber-spring` with Spring Boot 4.x test context
- Step definitions organized per feature file (7 feature files → 7 step definition classes)
- Playwright-Java with virtual authenticator:
  - `BrowserContext.addInitScript()` or CDP `WebAuthn.enable` + `WebAuthn.addVirtualAuthenticator` for simulating WebAuthn
  - Test scenarios: registration (happy, cancel, timeout), authentication (happy, failure, timeout, no credential), management (list, rename, delete), coexistence, device compatibility
- jqwik PBT tests (Partial enforcement):
  - PBT-02: Round-trip for all DTOs (JSON serialize ↔ deserialize)
  - PBT-02: Round-trip for Base64URL encoding/decoding of WebAuthn challenge bytes
  - PBT-03: Invariants — collection size after operations, valid range for timestamps
  - PBT-07: Custom `@Provide` generators for domain types (`PasskeyResponse`, `RenamePasskeyRequest`, email format, device names)
  - PBT-08: Seed logging configured in `jqwik.properties` (reporting seed on failure), shrinking enabled by default
- Test profiles:
  - `mvn test` — unit + PBT (fast, no containers)
  - `mvn verify -Pintegration` — integration with Testcontainers
  - `mvn verify -Pe2e` — Playwright E2E tests
  - `mvn verify -Pbdd` — Cucumber BDD scenarios
- CI configuration: All profiles run in pipeline, PBT seed logged per run
- Test reporting: Cucumber HTML, Playwright traces, Surefire/Failsafe XML reports

**Test requirements**: All 30+ BDD scenarios automated. All E2E flows covered. PBT for applicable properties with domain generators.

**Security compliance**: SECURITY-10 (test dependencies pinned)

**PBT compliance**: PBT-02 ✅, PBT-03 ✅, PBT-07 ✅, PBT-08 ✅, PBT-09 ✅

**Demo**: `mvn verify -Pall-tests` → all tests green. Cucumber HTML report shows 30+ passing scenarios. Playwright traces available for debugging. jqwik reports seed values. Native image tests pass (`mvn -Pnative test`).

---

### Task 10: Native Image Optimization & Build/Deployment Documentation

**Objective**: Finalize native image build, create deployment documentation, and validate production readiness.

**Implementation guidance**:

- Native image validation:
  - Run full test suite against native binary (`mvn -Pnative native:compile` + `native-image-testing`)
  - Validate all reflection hints are complete (no `ClassNotFoundException` at runtime)
  - Performance benchmark: startup time < 100ms, memory footprint < 128MB
- `Dockerfile.native`:
  ```dockerfile
  FROM ghcr.io/graalvm/native-image-community:21 AS build
  # ... multi-stage native build
  FROM gcr.io/distroless/base-debian12
  COPY --from=build /app/target/passkey-service /app/passkey-service
  ENTRYPOINT ["/app/passkey-service"]
  ```
- `Dockerfile.jvm` for JVM fallback deployment
- `README.md`: Architecture overview, setup instructions, API documentation
- Deployment guide:
  - How to deploy FreeMarker theme to existing Keycloak (`/opt/keycloak/themes/`)
  - How to deploy native binary (container or bare metal)
  - Environment variables reference (all configurable properties)
  - Keycloak realm configuration import steps
- SBOM generation: CycloneDX Maven plugin produces `bom.json`
- Security checklist for production: TLS, secrets management, CORS origins, rate limit tuning, log forwarding
- Performance test instructions: k6 or Gatling script for load testing auth flow (< 3s target)
- Accessibility audit instructions: axe-core CLI scan of login theme

**Test requirements**: Native binary starts and passes health check. Full test suite passes in both JVM and native modes. SBOM generated.

**Security compliance**: SECURITY-09 (no default credentials in deployment docs, no sample apps), SECURITY-10 (SBOM, pinned dependencies, no `latest` tags in Dockerfiles)

**Demo**: `docker build -f Dockerfile.native -t lifemiles-passkey:native .` → image < 100MB. `docker run` → starts in < 100ms. Full API functional. `README.md` enables any developer to set up the project from scratch.

---

## Summary of Security Compliance per Task

| Task | Security Rules Addressed |
|------|-------------------------|
| 1 | SECURITY-01, 09, 10 |
| 2 | SECURITY-04, 05, 09 |
| 3 | SECURITY-05, 08, 12, 15 |
| 4 | SECURITY-08, 11, 12, 15 |
| 5 | SECURITY-03, 05, 06, 08, 15 |
| 6 | SECURITY-04, 08 |
| 7 | SECURITY-08, 15 |
| 8 | SECURITY-02, 03, 04, 07, 11, 14 |
| 9 | SECURITY-10 |
| 10 | SECURITY-09, 10 |

## Summary of PBT Compliance per Task

| Task | PBT Rules Addressed |
|------|---------------------|
| 1 | PBT-09 (framework selected) |
| 3 | PBT-02, PBT-07 |
| 5 | PBT-02, PBT-03, PBT-07 |
| 8 | PBT-03 |
| 9 | PBT-02, PBT-03, PBT-07, PBT-08, PBT-09 |
