# Code Generation Plan — Unit 4: Testing & Integration

> **Steps marked ⚠ depend on answers in `unit-4-questions.md`.** The API-level and
> configuration-level work can proceed regardless.

## Unit Context

- **Responsibility** (`unit-of-work.md`): BDD automation, E2E with virtual authenticators,
  coexistence verification, native-image test profile, final build and deployment documentation
- **Maps to**: Task 7 (coexistence tests), Task 8 (the configuration half), Task 9, Task 10
- **Requirements**: FR-6, FR-7, FR-8, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-8
- **Depends on**: Units 1, 2 and 3 — all delivered and verified

## The honest starting point: what the ~35 BDD scenarios actually admit of

This classification is the substance of the unit. Claiming "all 30+ scenarios automated" without it
would be false, because one group cannot be automated even in principle.

### Group 1 — Automatable at API level, no browser (Testcontainers)

| Scenario | Approach |
|---|---|
| Keycloak has WebAuthn Passwordless enabled as ALTERNATIVE | Admin API assertion — already covered by `KeycloakFixtureRealmIT` |
| WebAuthn policy correctly configured (RP name, resident key, user verification) | Admin API assertion — already covered |
| Registering a Passkey does not invalidate the existing password | Admin API: assert the password credential survives enrolment |
| The user without a Passkey is unaffected | Assert password login still issues a token |
| Keycloak manages all methods uniformly / same claims and session duration | Decode tokens from password login and compare claim sets |
| The user lists their Passkeys | Backend API against a real Keycloak |
| The user renames a Passkey | Backend API |
| The user deletes a Passkey | Backend API |
| Revoking one Passkey leaves the others working | Backend API, multi-credential |
| Passkey failure does not affect other methods | Fault injection: point the backend at a dead Keycloak, assert password login unaffected |

### Group 2 — Need a browser and a virtual authenticator ⚠

Enrolment (happy, cancel, timeout, unsupported device), authentication (happy, verification failure,
no credential on device, unknown username, timeout), the username-first flow, and the device-
compatibility hiding of the Passkey option. Scope depends on **Question 1**.

### Group 3 — Assertions about configuration, not behaviour

Browser compatibility (NFR-2) cannot be tested by running one Chromium. It is a claim about a
support matrix, verified by the capability-detection logic (already unit-tested in Unit 2) plus a
documented matrix. Stating it as "automated" would be misleading.

### Group 4 — Not automatable in principle, and the plan says so

| Scenario | Why not |
|---|---|
| The Passkey resists phishing | This is a property of WebAuthn's origin binding, enforced by the browser and the authenticator. A test would be asserting that Chromium implements the spec |
| The private key never leaves the device | Property of the authenticator hardware/platform. Nothing in our stack could observe a violation |
| Protection against credential stuffing | Property of per-origin key binding; there is no credential to stuff |
| Attestation is verified during registration | Keycloak performs this. We can assert the *policy* is set to require it; we cannot re-verify Keycloak's cryptography |

These four are documented as **inherited from the WebAuthn standard and Keycloak's implementation**,
with the configuration that makes them hold asserted where possible. That is an honest coverage
claim; "automated" would not be.

## Steps

### Part A — BDD structure and API-level scenarios

- [ ] **Step 1: Cucumber runner and Spring integration**
  - JUnit Platform suite with `cucumber-spring`, a shared Keycloak container reused across scenarios
    (starting one per scenario would make the suite unusably slow)
  - New Maven profile `bdd`, so the default build stays fast
  - Path: `src/test/java/com/lifemiles/passkey/bdd/`, `pom.xml`

- [ ] **Step 2: Feature files extracted from `bdd-passkey-lifemiles.md`**
  - Eight `.feature` files in Spanish, matching the source document, each scenario tagged
    `@api`, `@e2e`, `@config` or `@inherited` per the classification above
  - Tagging is what lets the suite report coverage honestly: `@inherited` scenarios are reported as
    documented-not-executed rather than quietly passing
  - Path: `src/test/resources/features/`

- [ ] **Step 3: Step definitions for Group 1**
  - Management steps (list/rename/delete/revoke), coexistence steps (password survives enrolment,
    unaffected user), Keycloak configuration steps
  - Path: `src/test/java/com/lifemiles/passkey/bdd/steps/`

- [ ] **Step 4: Token equivalence test (Task 7)**
  - Obtain a token by password grant from the fixture realm, decode it, and assert the claim set,
    audience, issuer and lifetime are exactly what the backend's resource server accepts
  - Honest limit: a WebAuthn-issued token can only be obtained if Question 1 yields a working E2E
    flow. Without it, this asserts one method and documents the other as pending, rather than
    claiming equivalence it did not observe
  - Path: `src/test/java/com/lifemiles/passkey/integration/TokenEquivalenceIT.java`

- [ ] **Step 5: Fault-injection test for graceful degradation (Task 7, NFR-3)**
  - Point the backend's Keycloak client at an unreachable address and assert: the Passkey API returns
    503, and a password authentication against the real Keycloak still succeeds
  - This is the test that substantiates NFR-3 as *degrade closed for Passkey, unaffected elsewhere*
    rather than the fail-open reading
  - Path: `src/test/java/com/lifemiles/passkey/integration/GracefulDegradationIT.java`

### Part B — E2E ⚠ (shape set by Question 1)

- [ ] **Step 6: Playwright fixture with a CDP virtual authenticator** ⚠
  - `WebAuthn.enable` and `WebAuthn.addVirtualAuthenticator` over a Chromium CDP session, with
    helpers to simulate user cancellation and timeout
  - New Maven profile `e2e`
  - Path: `src/test/java/com/lifemiles/passkey/e2e/`

- [ ] **Step 7: E2E enrolment and authentication flows** ⚠
  - Happy path, cancellation, timeout, no credential present, unknown user
  - Path: `src/test/java/com/lifemiles/passkey/e2e/`

- [ ] **Step 8: Local SPA harness** ⚠ — only if Question 1 is answered B
  - Test-only theme variant loading assets from `localhost:8012` with a default for `cms_env`, plus
    stubs for the CMS text and feature-flag endpoints
  - Path: `src/test/resources/themes/`, `src/test/java/com/lifemiles/passkey/e2e/`

- [ ] **Step 9: Accessibility audit with axe-core (NFR-4)** ⚠
  - Inject axe-core into the rendered Passkey screens and assert no violations at WCAG 2.1 AA. Only
    meaningful under option B, since option A would audit Keycloak's theme rather than LifeMiles'
  - Path: `src/test/java/com/lifemiles/passkey/e2e/AccessibilityE2ETest.java`

### Part C — Task 8 configuration half ⚠ (Question 4)

- [ ] **Step 10: Keycloak event configuration** ⚠
  - Enable event storage for `REGISTER_CREDENTIAL`, `REMOVE_CREDENTIAL`, `LOGIN`, `LOGIN_ERROR`;
    retention of at least 90 days; brute-force detection. Applied to the fixture realm, documented
    for the real instance, and asserted through the Admin API where assertable
  - Path: `src/test/resources/lifemiles-test-realm.json`, `docs/keycloak-console-setup.md`

- [ ] **Step 11: SECURITY-14 hand-off**
  - Alerting and tamper-evident retention are infrastructure. Documented as requirements with the
    same explicit "this codebase cannot verify it" caveat used for EX-003, rather than marked
    compliant
  - Path: `docs/security-exceptions.md`

### Part D — Native image and closing documentation

- [ ] **Step 12: Native image** ⚠ (Question 3)
  - Under A or B: attempt the build, run the suite against the binary, and benchmark startup and
    memory against NFR-6. A failure on missing hints is a useful result and would be reported as one
  - Under C: record the criterion as unmet, as it has been since Unit 1

- [ ] **Step 13: Build and deployment documentation (Task 10)**
  - `docs/build-and-test.md`: every profile and what it does and does not cover
  - `docs/deployment.md`: env vars, Keycloake console steps, theme installation, the CMS entry, the
    feature flag, and the gateway rate-limit requirement
  - Consolidated coverage matrix: every FR and NFR against how it is verified, or why it is not

- [ ] **Step 14: Unit summary**
  - `aidlc-docs/construction/unit-4-testing-integration/code/summary.md`

## Verification plan

`mvn clean verify -Pintegration` must stay green, including the Unit 1, 2 and 3 suites. New profiles
`bdd` and `e2e` are separate so the default build stays fast. Property tests remain excluded from
execution per the standing instruction.

## What this unit will not claim

- Automated coverage of Group 4 scenarios
- Browser-matrix verification from a single Chromium
- LifeMiles UI coverage if Question 1 is answered A
- A verified rate limit (EX-003) or least-privilege Keycloak access (EX-002)
