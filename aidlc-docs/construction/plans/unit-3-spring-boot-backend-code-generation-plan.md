# Code Generation Plan — Unit 3: Spring Boot Backend (Native-Ready)

> **Four steps are blocked on answers in `unit-3-questions.md`** (marked ⚠ below). The rest can
> proceed regardless. I would rather flag the conflicts than implement a specification that does
> not match how Keycloak actually works.

## Unit Context

- **Responsibility** (`unit-of-work.md`): all backend business logic — Passkey registration
  orchestration, passwordless login token validation, the Passkey management REST API, security
  hardening (rate limiting, CORS, audit logging), coexistence logic, native-image readiness
- **Maps to**: Task 3 (backend), Task 4 (backend), Task 5, Task 7 (coexistence logic), Task 8
- **Requirements**: FR-3, FR-5, FR-6, FR-7, FR-8, FR-9, FR-11; NFR-1, NFR-3, NFR-5, NFR-6, NFR-7, NFR-8
- **Depends on**: Unit 1 (issuer URI and Keycloak connectivity contract, fixture realm)
- **NOT in this unit**: UI (Unit 2, delivered); BDD/E2E/PBT execution and the axe-core audit (Unit 4)

**On size.** This is the largest unit in the project: five tasks' worth of backend work. The steps
are grouped into four parts that build on each other, and Part D is the verification pass. If you
would rather approve and review it in smaller slices, say so and I will split generation at the
part boundaries.

## Existing baseline (Unit 1)

`PasskeyApplication`, `SecurityConfig`, `LifeMilesKeycloakProperties`, `PasskeyRuntimeHints`, plus
`package-info.java` placeholders in `audit`, `controller`, `exception`, `model`, `security`,
`service`. `SecurityConfig` and `PasskeyRuntimeHints` both carry comments naming Unit 3 as the
point where they are extended, so this unit fills that scaffolding in rather than building beside it.

## Steps

### Part A — Domain model, Keycloak access, error handling

- [x] **Step 1: DTOs as records (Task 5, NFR-6)**
  - `PasskeyResponse` — shape depends on **Question 1**. ⚠
  - `RenamePasskeyRequest(String name)` with `@NotBlank @Size(max = 100)` and a pattern that
    rejects control characters, so a label cannot be used to inject into logs (SECURITY-03/05)
  - `RegistrationInitiatedResponse` — shape depends on **Question 2**. ⚠
  - `ApiErrorResponse(String code, String message, Instant timestamp, String traceId)` — a fixed
    shape with no stack traces and no internal detail (SECURITY-09, SECURITY-15)
  - Records are used throughout: they serialise without reflection configuration, which is what
    keeps NFR-6 cheap
  - Path: `src/main/java/com/lifemiles/passkey/model/`

- [x] **Step 2: Keycloak admin client bean (SECURITY-06)** ⚠
  - A `@Configuration` producing a `Keycloak` admin client. The grant type depends on
    **Question 3**: client-credentials with a service account (option A) or the current
    user/password grant (option B)
  - Connection and read timeouts set explicitly; no unbounded waits, so a Keycloak stall degrades
    into a fast, clean 503 rather than exhausting the servlet pool (NFR-1, NFR-3)
  - Path: `src/main/java/com/lifemiles/passkey/config/KeycloakAdminClientConfig.java`

- [x] **Step 3: Typed exceptions**
  - `PasskeyNotFoundException`, `PasskeyAccessDeniedException`, `KeycloakUnavailableException`,
    `RegistrationTimeoutException`
  - Path: `src/main/java/com/lifemiles/passkey/exception/`

- [x] **Step 4: Global exception handler (SECURITY-09, SECURITY-15)**
  - `@RestControllerAdvice` mapping each typed exception and Bean Validation failures to
    `ApiErrorResponse`. Validation errors report **which field** failed and the constraint, never
    the rejected value, so hostile input is not reflected back
  - A catch-all for unexpected exceptions returning a generic 500 with a correlation id; the real
    cause is logged, never returned (fail closed)
  - Path: `src/main/java/com/lifemiles/passkey/exception/GlobalExceptionHandler.java`

### Part B — Services and audit

- [x] **Step 5: Authenticated-user resolution (SECURITY-08)**
  - `AuthenticatedUser` helper extracting the Keycloak user id from the JWT `sub`
  - **The user id is never accepted from the request** — not from a path variable, query parameter
    or body. This is the structural reason IDOR is impossible here rather than merely checked for
  - Path: `src/main/java/com/lifemiles/passkey/security/AuthenticatedUser.java`

- [x] **Step 6: Audit logging (NFR-5, SECURITY-03)**
  - `PasskeyAuditLogger` emitting one structured event per lifecycle operation with timestamp,
    action, subject id, target credential id and outcome
  - Uses Spring Boot 4's built-in structured logging (`logging.structured.format`), so **no new
    dependency** is introduced for JSON output
  - Explicitly never logs: access tokens, the raw `Authorization` header, email addresses, device
    labels, or any WebAuthn public-key material. The subject is the Keycloak UUID, which is
    pseudonymous
  - Failures are audited as well as successes — an audit trail that only records happy paths is
    not an audit trail
  - Path: `src/main/java/com/lifemiles/passkey/audit/PasskeyAuditLogger.java`

- [x] **Step 7: `PasskeyManagementService` (Task 5, FR-9)**
  - `list`, `rename`, `delete`, all scoped to the JWT subject via
    `realm.users().get(subject).credentials()`
  - Filters to WebAuthn passwordless credentials only, so the API can never list, rename or delete
    a user's password or OTP credential — a bug class that a naive `credentials()` passthrough
    would introduce
  - Before rename and delete, confirms the credential id is present in that user's own list:
    yields a correct 404 instead of a misleading 403, and is defence in depth behind Step 5
  - Wraps Keycloak client failures into `KeycloakUnavailableException` so transport detail never
    reaches the caller
  - Path: `src/main/java/com/lifemiles/passkey/service/PasskeyManagementService.java`

- [x] **Step 8: `PasskeyRegistrationService` (Task 3, FR-3)** ⚠
  - Behaviour depends on **Question 2**. Under the recommended option A: adds the
    `webauthn-register-passwordless` required action to the authenticated user, idempotently, so
    calling it twice does not duplicate the action
  - Path: `src/main/java/com/lifemiles/passkey/service/PasskeyRegistrationService.java`

- [x] **Step 9: Coexistence guard (Task 7, FR-6, FR-7, NFR-3)**
  - A small service answering "is passkey management currently available?" by probing Keycloak
    readiness, so the LifeMiles panel can hide passkey features when the dependency is down
  - Deliberately **degrades closed for passkey features while leaving password and social login
    untouched** — the backend has no involvement in those paths, which is precisely what NFR-3
    demands. Documented explicitly, because "graceful degradation" is easy to claim and easy to
    get backwards
  - Path: `src/main/java/com/lifemiles/passkey/service/PasskeyAvailabilityService.java`

### Part C — HTTP layer and hardening

- [x] **Step 10: `PasskeyController` (Task 5, FR-9, FR-11)**
  - `GET /api/v1/passkeys`, `PUT /api/v1/passkeys/{id}/name`, `DELETE /api/v1/passkeys/{id}`,
    `POST /api/v1/passkeys/register/initiate`
  - `@Valid` on request bodies; `{id}` constrained to a UUID pattern so malformed ids are rejected
    at the edge (SECURITY-05)
  - Path: `src/main/java/com/lifemiles/passkey/controller/PasskeyController.java`

- [x] **Step 11: CORS restricted to LifeMiles origins (SECURITY-08)**
  - Allowed origins from a required env var with **no default**, so a missing configuration fails
    startup instead of silently allowing nothing or everything
  - Credentials allowed, methods limited to those the API actually serves, `Authorization` only in
    allowed headers, and a bounded max-age
  - Path: `SecurityConfig.java` (extended), `LifeMilesKeycloakProperties.java` (extended)

- [x] **Step 12: Rate limiting (SECURITY-11)** ⚠
  - Approach depends on **Question 4**. Under the recommended option A: an in-memory per-subject
    token bucket in a filter, returning 429 with `Retry-After`, and documentation stating plainly
    that the authoritative limit belongs at the gateway
  - Path: `src/main/java/com/lifemiles/passkey/security/RateLimitFilter.java`

- [x] **Step 13: Native hints (NFR-6)**
  - Extend `PasskeyRuntimeHints` with the Keycloak Admin Client representation classes actually
    used (`CredentialRepresentation`, `UserRepresentation`) and the JAX-RS proxy interfaces
  - Path: `src/main/java/com/lifemiles/passkey/config/PasskeyRuntimeHints.java`

- [x] **Step 14: Configuration and structured logging**
  - `application.yml`: CORS origins, rate-limit settings, Keycloak timeouts,
    `logging.structured.format.console`
  - Path: `src/main/resources/application.yml`

### Part D — Tests and documentation

- [x] **Step 15: Unit tests**
  - `PasskeyManagementService` with a mocked Keycloak client: happy paths; credential belonging to
    another user; non-WebAuthn credential filtered out; Keycloak failure mapped to
    `KeycloakUnavailableException`
  - `GlobalExceptionHandler`: every mapping, and that no response body contains a stack trace or
    the rejected input value
  - `RateLimitFilter`: allows under the limit, returns 429 over it, buckets are per-subject
  - Path: `src/test/java/com/lifemiles/passkey/**`

- [x] **Step 16: Integration tests with Testcontainers**
  - `PasskeyManagementIT` against the Unit 1 fixture realm: list, rename, delete round-trip using
    a real Keycloak; a second user cannot reach the first user's credential; 404 for an unknown id
  - `TokenValidationIT`: a token from the fixture realm is accepted; a token from a different
    issuer is rejected; an expired token is rejected (Task 4, SECURITY-08)
  - Honest limit: the WebAuthn **ceremony** cannot be exercised without a virtual authenticator, so
    credentials are seeded through the Admin API. Full ceremony coverage is Unit 4
  - Path: `src/test/java/com/lifemiles/passkey/**`

- [x] **Step 17: Property-based tests — generated, not executed (NFR-8)**
  - PBT-02 round-trip for `PasskeyResponse` JSON; PBT-03 invariant that a list after delete has
    size `n-1`; PBT-07 domain generators for `RenamePasskeyRequest`
  - **Per the standing instruction of 2026-08-26, these are not executed.** Surefire and Failsafe
    will be configured to exclude jqwik property tests, so the build honours the instruction while
    the enabled PBT Partial rules still get their artifacts. Excluding them in the build — rather
    than just declining to run them once — is what makes the instruction durable
  - Path: `src/test/java/com/lifemiles/passkey/property/`, `pom.xml`

- [x] **Step 18: Documentation**
  - `docs/passkey-api.md`: endpoints, request/response shapes, error codes, rate limits, the
    required Keycloak permissions
  - `docs/keycloak-console-setup.md`: the service-account client setup if Question 3 is answered A
  - `aidlc-docs/construction/unit-3-spring-boot-backend/code/summary.md`
  - Any new documented exception in `docs/security-exceptions.md`

## Security compliance targets

| Rule | How this unit addresses it |
|---|---|
| SECURITY-03 | Structured audit logging with an explicit deny-list of fields; failures audited too |
| SECURITY-05 | Bean Validation on every input; UUID pattern on path ids; control characters rejected in labels; rejected values never echoed |
| SECURITY-06 | Depends on **Question 3** — least-privilege service account, or a documented exception |
| SECURITY-08 | Deny by default retained; subject taken only from the JWT; credential ownership confirmed; CORS allowlisted from required config |
| SECURITY-09 | Generic error bodies, no stack traces, no version or path disclosure |
| SECURITY-11 | Depends on **Question 4** |
| SECURITY-12 | Credentials remain stored by Keycloak; this service never persists credential material |
| SECURITY-15 | Fail closed on every failure path; explicit timeouts; typed exceptions; no partial mutations |

## Verification plan

Executable here: `mvn clean verify -Pintegration` — unit tests, integration tests against a real
Keycloak container, and the existing Unit 1 and Unit 2 suites as a regression check. Property tests
are excluded by configuration. Native image build remains unexecutable (no Linux GraalVM), as
recorded since Unit 1.
