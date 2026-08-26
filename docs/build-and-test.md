# Build, test and coverage

## Toolchain

| Tool | Version | Notes |
|---|---|---|
| JDK | **Oracle GraalVM 25.0.4** | Managed by SDKMAN as candidate `25.0.4-graal`. Compiles with `--release 21` |
| `native-image` | 25.0.4 | At `$JAVA_HOME/lib/svm/bin/native-image` — **not** symlinked into `bin/`, which is why a `command -v native-image` check reports it missing |
| Maven | 3.8.7 | Non-interactive shells do not source `~/.bashrc`, so `JAVA_HOME` must be exported explicitly |
| Node | 20.15.0 | Via nvm, matching `.node-version` |
| Yarn | 1.22.22 | Classic; `yarn.lock` is v1 |
| Docker | 29.4.3 | Required by every integration test |

> **Correction on record.** From Unit 1 through Unit 3 this project reported that no Linux GraalVM was
> available and that the native image was therefore unbuildable. That was wrong. The conclusion was
> drawn from a Windows GraalVM on the inherited `PATH` and from `command -v native-image` failing,
> without checking what the SDKMAN JDK actually was — it has been Oracle GraalVM all along. The native
> criterion was testable for three units before anyone looked.

## Profiles

| Command | Runs | Containers |
|---|---|---|
| `mvn test` | Unit tests only | No |
| `mvn verify -Pintegration` | Unit + all `*IT` integration tests | Yes |
| `mvn -Pnative native:compile` | GraalVM native binary | No |
| `yarn vitest run` (in `hub-keycloack-login-ui`) | SPA unit tests | No |
| `yarn cypress run` (in `hub-keycloack-login-ui`) | E2E — **never executed**, see below | Yes, plus a dev server |

`JAVA_HOME` must be set for Maven:

```bash
export JAVA_HOME="$HOME/.sdkman/candidates/java/25.0.4-graal"
export GRAALVM_HOME="$JAVA_HOME"
```

### Property-based tests are excluded by design

jqwik property classes under `src/test/java/com/lifemiles/passkey/property/` are **generated but never
executed**, per a standing instruction. The exclusion is a Surefire `<excludes>` entry in `pom.xml`,
placed there rather than left as a habit so it survives whoever builds next. Failsafe needs no
equivalent: its `<includes>` is already limited to `**/*IT.java`.

They are still compiled, which is worth keeping — a jqwik API incompatibility was caught this way.

### The Cypress E2E suite has never been run

`hub-keycloack-login-ui/cypress/` is complete and unexecuted. Running it needs the Cypress binary
download and, on Ubuntu, extra system libraries; consent for both was declined. It also needs a
harness that does not exist yet:

1. Keycloak with the `lifemiles-test` realm on `localhost:8080`
2. A login theme whose template loads assets from `localhost:8012` and defaults `cms_env` — the real
   `authTheme` cannot render locally because `cms_env` is injected by a LifeMiles provider absent from
   this repository, and its assets come from CloudFront
3. `yarn dev` serving the SPA on port 8012, with the CMS text and feature-flag endpoints stubbed

Until that exists, **no E2E coverage should be claimed**.

---

## Coverage matrix

### Functional requirements

| # | Requirement | Verified by | Status |
|---|---|---|---|
| FR-1 | Passkey offered alongside existing methods | `SocialManager.passkey.test.tsx` (8) | **Verified** (unit) |
| FR-2 | Device-compatibility detection | `webauthn.test.ts` (15) | **Verified** (unit) |
| FR-3 | Passkey registration | `PasskeyRegistrationServiceTest` (6), `PasskeyManagementIT` | **Partial** — scheduling verified; ceremony needs E2E |
| FR-4 | Registration metadata | `PasskeyManagementServiceTest` | **Partial** — label round-trip verified; `lastUsed` dropped (Q1) |
| FR-5 | Passwordless authentication | — | **Not verified** — needs a virtual authenticator |
| FR-6 | Unified session across methods | `TokenEquivalenceIT` | **Partial** — password token asserted; no WebAuthn token obtainable |
| FR-7 | Coexistence, no regression | `GracefulDegradationIT`, `SocialManager.passkey.test.tsx` | **Verified** |
| FR-8 | Phishing and credential-stuffing resistance | `RealmSecurityConfigurationIT` (policy only) | **Inherited** — property of WebAuthn, not testable here |
| FR-9 | List, rename, revoke | `PasskeyManagementServiceTest` (12), `PasskeyManagementIT` (7) | **Verified** |
| FR-10 | WebAuthn Passwordless as ALTERNATIVE | `KeycloakFixtureRealmIT` (3) | **Verified** |
| FR-11 | Management in both surfaces | Backend verified; Account Console branding only | **Partial** |

### Non-functional requirements

| # | Requirement | Verified by | Status |
|---|---|---|---|
| NFR-1 | Flow under 3s | Keycloak timeouts configured and asserted | **Not measured** — needs E2E timing |
| NFR-2 | Browser matrix | Detection logic unit-tested | **Not verifiable** — one Chromium cannot prove a matrix |
| NFR-3 | Degradation without fail-open | `GracefulDegradationIT` | **Verified** — both halves |
| NFR-4 | WCAG 2.1 AA | `PasskeyButton.test.tsx` (10); axe-core in unexecuted Cypress | **Partial** |
| NFR-5 | Audit logging | `PasskeyAuditLogger`, `RealmSecurityConfigurationIT` | **Verified** |
| NFR-6 | Native readiness | `PasskeyApplicationAotTests`, native build | See the native section |
| NFR-7 | Security baseline | Per-rule, with EX-001/002/003 | **Partial** — three exceptions |
| NFR-8 | PBT Partial | Generated, not executed | **By instruction** |

### BDD scenarios — the four groups

Of roughly 35 Gherkin scenarios:

- **Group 1, automatable without a browser** (10): covered by the integration suite.
- **Group 2, needs a browser and virtual authenticator** (12): written as Cypress specs, **unexecuted**.
- **Group 3, configuration assertions** (5): covered by `RealmSecurityConfigurationIT` and
  `KeycloakFixtureRealmIT`.
- **Group 4, not automatable in principle** (4): phishing resistance, the private key never leaving the
  device, credential-stuffing protection, and attestation verification. These are properties of the
  WebAuthn standard and Keycloak's implementation. A test would be asserting that Chromium and
  Keycloak implement their specifications. What *is* asserted is the configuration they depend on —
  `userVerification: required` and `requireResidentKey: Yes` — so drift would be caught.

**No claim of "all BDD scenarios automated" is made**, because groups 2 and 4 are not.

---

## Known gaps

1. **E2E never executed** — the largest gap. Blocks FR-5 outright and weakens FR-3, FR-6, NFR-1, NFR-4.
2. **`cms_env` provider absent**, so the real LifeMiles theme cannot render locally at all.
3. **CMS `passkey` entry and the `show-passkey-{client_id}` flag** do not exist; without them the
   option never appears regardless of code.
4. **EX-002** — the service holds full realm admin rights.
5. **EX-003** — no verified rate limit.
6. **`tsc --noEmit` / `eslint` over the Passkey SPA files** never ran, from the Unit 2 shell failure.
7. **Cucumber step definitions not generated** — a deliberate scope decision, see the Unit 4 summary.
