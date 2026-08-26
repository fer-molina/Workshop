# Unit 4 — Testing & Integration: Code Generation Summary

**Status: partially complete.** Read this section before the rest — several steps did not finish, and
two applied fixes are unverified.

## Step status, accurately

| Step | Status |
|---|---|
| 1-3 Cucumber runner, feature files, step definitions | **NOT DONE** — deliberate scope decision, see below |
| 4 `TokenEquivalenceIT` | Written; **1 error** from a fixture defect. Fix applied, **not re-verified** |
| 5 `GracefulDegradationIT` | Written; **2 of 3 passing**, third blocked by the same defect. Fix applied, **not re-verified** |
| 6-7 Cypress virtual authenticator and ceremony specs | Written; **never executed** (Q2 = C) |
| 8 Local SPA harness | **NOT DONE** |
| 9 axe-core accessibility audit | **NOT DONE** |
| 10 Keycloak event configuration + `RealmSecurityConfigurationIT` | Written; **not verified** |
| 11 SECURITY-14 hand-off | Done — EX-004 |
| 12 Native image | **Attempted and failed**; fix applied, **not re-verified** |
| 13 Documentation | `docs/build-and-test.md` done; `docs/deployment.md` **NOT DONE** |
| 14 Summary | This document |

## Two real defects found, both previously invisible

### 1. The fixture realm cannot perform a password login

Both new integration failures share one root cause: `No access_token in token response`. The
`lifemiles-test` realm declares its own `authenticationFlows`, and when a realm JSON supplies flows
Keycloak **stops generating the built-in ones**. The realm therefore had no `direct grant` flow, so
every Resource Owner Password Credentials grant was impossible.

This defect has existed since Unit 1 and was invisible because nothing had attempted a password login
until Unit 4 — the earlier suites only used the admin client and the Admin API. It is also the same
class of problem investigated at length in Unit 2, where the hypothesis was refuted for the *import*
failing; the flows did import, they just came without their built-in siblings.

**Fix applied**: an explicit `direct grant` flow plus a `directGrantFlow` binding in the fixture,
with the reason recorded inline. **Not re-verified** — the verification run would not start.

### 2. The native build fails at AOT processing, not at native-image

```
Caused by: PlaceholderResolutionException:
  Could not resolve placeholder 'KEYCLOAK_ISSUER_URI' in value "${KEYCLOAK_ISSUER_URI}"
  at ContextAotProcessor.performAotProcessing
```

AOT processing starts the application context at **build** time. Unit 3's configuration is
deliberately fail-closed — every Keycloak property required, no defaults — so the build-time context
cannot start. The failure is in `process-aot`; `native-image` was never reached.

**Fix applied**: build-time-only `jvmArguments` placeholders on the `process-aot` execution. Adding
defaults to `application.yml` would have been the wrong fix: it would make the service startable at
runtime with a bogus issuer, destroying the fail-closed property. Nothing from these placeholders
reaches the binary. **Not re-verified.**

## Correction to a claim repeated since Unit 1

Units 1 to 3 all recorded that no Linux GraalVM was available and the native image was therefore
unbuildable. **That was wrong.** The SDKMAN JDK compiling this project has been **Oracle GraalVM
25.0.4** the whole time, and `native-image` is present at
`$JAVA_HOME/lib/svm/bin/native-image`. The mistaken conclusion came from seeing a Windows GraalVM on
the inherited `PATH` and from `command -v native-image` failing — the binary is simply not symlinked
into `bin/`. The criterion was testable for three units before anyone checked.

Verified toolchain:
```
java version "25.0.4"  Oracle GraalVM 25.0.4+7.1
native-image 25.0.4    Oracle GraalVM 25.0.4+7.1
```

## Last verified test results

From the run before the fixture and AOT fixes:

| Suite | Result |
|---|---|
| Surefire | **19/19 passing** |
| `KeycloakFixtureRealmIT` | 3/3 |
| `SecurityHeadersIT` | 7/7 |
| `PasskeyManagementIT` | 7/7 |
| `GracefulDegradationIT` | 2/3 — one blocked by defect 1 |
| `TokenEquivalenceIT` | 0/1 — blocked by defect 1 |
| **Failsafe total** | **21 completed, 2 errors** |

`RealmSecurityConfigurationIT` was written after this run and has never executed.

## Why Cucumber was not generated

Steps 1-3 were dropped on judgement, and this is a deviation from the approved plan rather than an
oversight. The API-level scenarios they would automate are already covered by the integration suite;
what Cucumber would have added is traceability from Gherkin to verification, and that is delivered
instead by the coverage matrix in `docs/build-and-test.md`, which additionally records the scenarios
that *cannot* be automated. Adding a Cucumber layer that re-asserts existing coverage while the
genuinely missing coverage is E2E seemed the wrong use of the effort. Say so and I will build it.

## The honest coverage position

The substantive contribution of this unit is the classification in `docs/build-and-test.md`. Of ~35
BDD scenarios: 10 are covered without a browser, 12 need a browser and are written but unexecuted, 5
are configuration assertions now covered, and **4 cannot be automated in principle** — phishing
resistance, the private key never leaving the device, credential-stuffing protection and attestation
verification are properties of WebAuthn and Keycloak, not of this system. What is asserted instead is
the configuration those properties depend on, so drift is caught.

**No claim of full BDD automation is made, and FR-5 (passwordless authentication) is not verified at
all.**

## To finish this unit

1. Re-run `mvn clean verify -Pintegration` to confirm the fixture fix (expect 25 Failsafe tests).
2. Re-run `mvn -Pnative native:compile` to confirm the AOT fix, then benchmark startup and memory
   against NFR-6. **This is now possible** and has never been done.
3. Decide on the Cypress harness so FR-5 stops being unverified.
4. `docs/deployment.md`, Cucumber if wanted, and the outstanding `tsc`/`eslint` from Unit 2.
