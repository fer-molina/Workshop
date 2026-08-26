# Unit 3 — Spring Boot Backend: Code Generation Summary

All 18 plan steps complete, with two steps producing documentation instead of code as a direct
consequence of the answers to Q3 and Q4.

## Verification — executed and passing

`mvn clean verify -Pintegration` in WSL (Maven 3.8.7, Docker 29.4.3, JDK 25.0.4 compiling with
`--release 21`):

| Suite | Result |
|---|---|
| `PasskeyApplicationAotTests` | 1/1 |
| `PasskeyRegistrationServiceTest` | 6/6 |
| `PasskeyManagementServiceTest` | 12/12 |
| **Surefire total** | **19/19** |
| `KeycloakFixtureRealmIT` (Unit 1 regression) | 3/3 |
| `SecurityHeadersIT` (Unit 2 regression) | 7/7 |
| `PasskeyManagementIT` (new) | 7/7 |
| **Failsafe total** | **17 completed, 0 errors, 0 failures, 0 flakes** |

Both earlier units were re-run as regression checks: Unit 3 modifies `application.yml`,
`SecurityConfig`, `PasskeyRuntimeHints`, `LifeMilesKeycloakProperties` and
`PasskeyApplicationAotTests`, all of which they depend on. Both still pass.

**Property tests confirmed not executed**: `target/surefire-reports/` contains no report for any
class under `property/`, which is the observable evidence that the Surefire exclusion works rather
than an assertion that it should.

One defect was found and fixed during verification: `CharacterArbitrary.or(...)` does not exist in
jqwik 1.9.3, so `RenamePasskeyRequestProperties` failed to compile. Replaced with
`Arbitraries.oneOf(...)`. Worth noting that the property tests are excluded from *execution* but
still *compiled*, which is what caught this.

## What was generated

### Model (`model/`)
`PasskeyResponse`, `RenamePasskeyRequest`, `RegistrationInitiatedResponse`, `ApiErrorResponse` — all
records, so JSON serialisation needs no reflection configuration (NFR-6).

### Exceptions (`exception/`)
`PasskeyNotFoundException`, `PasskeyOperationForbiddenException`, `KeycloakUnavailableException`,
`GlobalExceptionHandler`.

### Services (`service/`)
`PasskeyManagementService` (list/rename/delete), `PasskeyRegistrationService` (schedules the required
action).

### Security and audit
`security/AuthenticatedUser`, `audit/PasskeyAuditLogger`.

### HTTP and configuration
`controller/PasskeyController`, `config/KeycloakAdminClientConfig`, and extensions to
`config/SecurityConfig` (CORS), `config/PasskeyRuntimeHints` (Keycloak representations),
`config/LifeMilesKeycloakProperties` (realm, auth realm, timeouts, CORS origins),
`src/main/resources/application.yml`.

### Tests
`PasskeyManagementServiceTest`, `PasskeyRegistrationServiceTest`, `PasskeyManagementIT`, and three
property classes under `property/` (generated, not executed).

### Documentation
`docs/passkey-api.md`, `docs/security-exceptions.md` (EX-002, EX-003).

## Design decisions

1. **IDOR is prevented structurally, not by a check.** No endpoint accepts a user identifier; the
   subject comes only from the validated JWT. There is therefore no request shape that targets
   another user, and no ownership check that a future endpoint could forget.
2. **The API refuses to manage non-Passkey credentials.** Keycloak's credentials endpoint returns
   every credential type for a user, so a naive passthrough would have made this a
   password-deletion API. `PasskeyOperationForbiddenException` closes that, and it is the assertion
   the integration test exercises against a real password credential.
3. **A credential belonging to another user returns 404, not 403.** Distinguishing them would turn
   the endpoint into an oracle for enumerating other users' credential ids.
4. **`lastUsed` was dropped rather than faked** (Q1 = A). Keycloak does not expose it.
5. **`/register/complete` was dropped rather than shipped dead** (Q2 = A). Keycloak owns the
   ceremony; `initiate` now does the one useful Keycloak-native thing — scheduling the required
   action — and is idempotent.
6. **Explicit Keycloak timeouts.** Without them a stalled Keycloak holds servlet threads until the
   pool is exhausted, which would make the NFR-3 graceful-degradation claim untrue.
7. **CORS uses exact origins from required configuration**, never patterns. A wildcard combined with
   `allowCredentials` is the standard way to make a credentialed API readable by any site.
8. **Structured logging via Spring Boot's built-in support**, so no JSON-encoder dependency was
   added (SECURITY-10).
9. **Control characters rejected in device labels.** The label reaches the audit log; a newline would
   permit forged log lines and corrupt the trail NFR-5 depends on.
10. **Actuator deliberately not added.** Health probes will need it, but adding a dependency was not
    in scope; the note in `SecurityConfig` records that only `health` should ever be exposed.

## Security compliance

| Rule | Status |
|---|---|
| SECURITY-03 | Compliant — structured audit events, explicit field deny-list, failures audited |
| SECURITY-05 | Compliant — Bean Validation, UUID-constrained path ids, control characters rejected, rejected values never echoed |
| SECURITY-06 | **Exception EX-002** — the service authenticates as a full realm admin (Q3 = B) |
| SECURITY-08 | Compliant — deny by default, subject only from the JWT, credential ownership and type verified, CORS allowlisted |
| SECURITY-09 | Compliant — single opaque error shape, no stack traces or internal detail |
| SECURITY-11 | **Exception EX-003** — no in-process limiter; assigned to the gateway (Q4 = C) |
| SECURITY-12 | Compliant — Keycloak remains the sole credential store |
| SECURITY-15 | Compliant — fail closed, explicit timeouts, typed exceptions, no partial mutations |

Both exceptions weaken the posture relative to the enabled blocking baseline. EX-003 deserves
particular attention: unlike every other rule in this project, it rests on an attestation about
infrastructure this repository does not contain, so no test here can fail if the control is absent.

## Honest verification boundaries

- **No test registers a real Passkey.** WebAuthn credentials cannot be created through the Admin
  API — only through the browser ceremony with a virtual authenticator. `PasskeyManagementIT`
  therefore exercises the refusal paths against the fixture user's real password credential, which
  is the more valuable half, and leaves ceremony coverage to Unit 4.
- **Token validation is only partially covered.** The resource-server configuration is exercised by
  the context load, but asserting that a WebAuthn-issued token carries the same claims as a
  password-issued one (Task 4's "unified token") requires completing a WebAuthn login. Unit 4.
- **Native image still not built.** No Linux GraalVM in the environment; unchanged since Unit 1. The
  hints added here are therefore reviewed, not proven.
- **Rate limiting is unverified by construction** — see EX-003.

## Follow-ups worth scheduling

1. Replace the admin password grant with a service account (EX-002) — contained change, currently
   blocked only by the deployment contract.
2. Confirm the gateway rate limit, or add the in-process bucket as defence in depth (EX-003).
3. Add Actuator with only `health` exposed, for deployment probes.
4. The Java 21 target vs JDK 25 build gap, open since Unit 1.
