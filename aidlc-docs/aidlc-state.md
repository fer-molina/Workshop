# AI-DLC State Tracking

## Project Information
- **Project Name**: Autenticación Passwordless con Passkey en LifeMiles
- **Project Type**: Greenfield (new Spring Boot module; Keycloak realm configured against an existing, separately-managed Keycloak deployment)
- **Start Date**: 2026-08-25T00:00:00Z
- **Current Stage**: INCEPTION - Workflow Planning / Units Generation (consolidated)

## Extension Configuration
| Extension | Enabled | Mode | Decided At |
|---|---|---|---|
| Security Baseline | Yes | Full (blocking, all 15 rules) | Pre-existing in implementation-plan-passkey-lifemiles.md, carried into Requirements Analysis |
| Resiliency Baseline | No | Skipped | Pre-existing in implementation-plan-passkey-lifemiles.md |
| Property-Based Testing | Yes (generation only — **execution disabled**) | Partial (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09 only) | Pre-existing in implementation-plan-passkey-lifemiles.md; execution disabled by user instruction 2026-08-26 ("De ahora en adelante no ejecutes las property test") |

## Execution Plan Summary
- **Total Units**: 4 (Keycloak Configuration, Custom Login Theme, Spring Boot Backend, Testing & Integration) — see `unit-of-work.md`
- **Total Tasks (within units)**: 10 (see `aidlc-docs/inception/plans/execution-plan.md`)
- **Stages to Execute**: Requirements Analysis (minimal — pre-existing), Workflow Planning, Application Design (lightweight — pre-existing), Units Generation, Code Generation (per unit), Build and Test
- **Stages to Skip**: Reverse Engineering (greenfield), User Stories (BDD feature file `bdd-passkey-lifemiles.md` already serves this purpose)

## Stage Progress

### 🔵 INCEPTION PHASE
- [x] Workspace Detection — Greenfield confirmed, no existing application code in workspace
- [x] Reverse Engineering — SKIPPED (greenfield)
- [x] Requirements Analysis — COMPLETE (minimal depth; consolidated from `caso-de-uso.md`, `bdd-passkey-lifemiles.md`, `implementation-plan-passkey-lifemiles.md`, and the confirmed conversation decisions on Keycloak standalone/console strategy)
- [x] User Stories — SKIPPED (equivalent artifact already exists: `bdd-passkey-lifemiles.md`)
- [x] Workflow Planning — COMPLETE
- [x] Application Design — COMPLETE (lightweight; package/service/controller structure already defined per-task in the implementation plan)
- [x] Units Generation — COMPLETE
- [x] **Consolidated Inception Approval** — APPROVED (user committed/pushed Inception artifacts, then requested "Procede con la siguiente fase")

### 🟢 CONSTRUCTION PHASE
- [ ] Unit 1: Keycloak Configuration (Project Scaffolding + Standalone Keycloak Console Setup) — Code Generation COMPLETE (all 12 plan steps [x]) and **BUILD/TEST VERIFIED** in WSL on 2026-08-26 (`mvn clean verify -Pintegration` → BUILD SUCCESS; Surefire 1/1, Failsafe 3/3). Three defects found and fixed during first execution (commons-io conflict, Testcontainers version misalignment, fixture file-name convention) — see unit summary and audit.md. Awaiting user review/approval
- [ ] Unit 2: Passkey Login Experience — Code Generation COMPLETE (all 14 steps of plan rev. 2 marked [x]). Java/Keycloak **VERIFIED**: `mvn clean verify -Pintegration` → BUILD SUCCESS, Surefire 1/1 + Failsafe 10/10 (incl. new `SecurityHeadersIT` 7/7 and Unit 1 regression check 3/3). SPA **VERIFIED**: faithful `yarn install --frozen-lockfile` (real token) then `vitest run` → all 33 Passkey tests passing against the real private packages. Suite-wide 17 failures across 12 files are pre-existing and unrelated (missing source modules, incomplete `vi.mock` factories, `api/*` assertion drift). **Outstanding**: `tsc --noEmit`/`eslint`/`stylelint` not executed due to shell-integration failure. SECURITY-04 carries approved exception EX-001. Awaiting user review/approval
- [ ] Unit 3: Spring Boot Backend (Native-Ready) — Code Generation COMPLETE (all 18 steps [x]) and **VERIFIED**: `mvn clean verify -Pintegration` → Surefire 19/19, Failsafe 17/17 (incl. new `PasskeyManagementIT` 7/7 plus Unit 1 and Unit 2 regression checks). Answers Q1=A, Q2=A, Q3=B, Q4=C. Two steps produced documented exceptions instead of code: **EX-002** (SECURITY-06, full admin credential) and **EX-003** (SECURITY-11, rate limiting at the gateway, unverifiable here). Property tests generated but excluded from execution via `pom.xml`, verified by the absence of their reports. Awaiting user review/approval
- [ ] Unit 4: Testing & Integration — Code Generation **PARTIALLY COMPLETE**. Answers Q1=E (Cypress), Q2=C (written not executed), Q3=A, Q4=A. Delivered: `TokenEquivalenceIT`, `GracefulDegradationIT`, `RealmSecurityConfigurationIT`, Keycloak event/brute-force config, Cypress suite (unexecuted), `docs/build-and-test.md` with the BDD coverage classification, EX-004. **NOT done**: Cucumber steps 1-3 (deliberate, flagged), local SPA harness, axe audit, `docs/deployment.md`. **Two defects found**: the fixture realm had no `direct grant` flow so password grants were impossible (present since Unit 1); the native build fails at AOT placeholder resolution. Both fixes applied but **NOT re-verified** — the shell integration stopped executing commands. Last verified: Surefire 19/19, Failsafe 21 completed / 2 errors. **FR-5 not verified at all**
- [ ] Build and Test — NOT STARTED

### 🟡 OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER

## Current Status
- **Lifecycle Phase**: CONSTRUCTION
- **Current Stage**: Unit 4 — Code Generation, Part 2 partially complete; two fixes pending re-verification
- **CORRECTION on record**: Units 1-3 wrongly reported no Linux GraalVM. The SDKMAN JDK is **Oracle GraalVM 25.0.4** with `native-image` at `$JAVA_HOME/lib/svm/bin/`. NFR-6 was testable for three units before it was checked
- **Verification Environment**: WSL Ubuntu 24.04 — Maven 3.8.7, Docker 29.4.3, JDK 25.0.4 via SDKMAN (note: project targets Java 21 and compiles with `--release 21`; toolchain gap open). Node **20.15.0** via nvm 0.40.1 and Yarn **1.22.22** installed 2026-08-26 at user request
- **Outstanding items**:
  - Native image build (`mvn -Pnative native:compile`) still NOT executed — the only GraalVM present is a Windows installation, unusable for the Linux binary the Dockerfile expects
  - Build runs on JDK 25 while targeting Java 21 — reproducibility gap, not yet addressed
  - Keycloak version risk **CLOSED** by Q4 = A (26.x confirmed); Unit 1 stands as verified. `authTheme/account/` and `authTheme/admin/` are legacy artifacts unusable on 26.x
  - **SPA toolchain fully RESOLVED**: Node 20.15.0, Yarn 1.22.22, and a real registry token in `.npmrc`. `yarn install --frozen-lockfile` succeeds and the full Vitest suite runs
  - **Outstanding for Unit 2**: `tsc --noEmit`, `eslint` and `stylelint` over the new Passkey files were not executed — the shell integration stopped executing commands. Commands recorded in the unit summary
  - **Security observation**: `.npmrc` is committed and now holds a live GitLab `_authToken`. Recommend moving it to a local/CI-injected location and restoring the placeholder. Flagged, not changed
  - **Outside this repo's reach for Unit 2**: the CMS `passkey` entry in `social_manager.providers`
  - **Approved security exception EX-001** (SECURITY-04 CSP permits `unsafe-inline`) — see `docs/security-exceptions.md`
  - **Approved security exceptions EX-002** (SECURITY-06: service authenticates as full realm admin) and **EX-003** (SECURITY-11: no in-process rate limiter, assigned to the gateway and unverifiable from this codebase) — see `docs/security-exceptions.md`
  - **Approved exception EX-004** (SECURITY-14: alerting and tamper-evident retention are infrastructure; compounds with EX-002)
- **Next Stage**: finish Unit 4 — re-run `verify -Pintegration` and `-Pnative native:compile` to confirm the two fixes, then decide on the Cypress harness
- **Status**: Unit 4 incomplete; awaiting user direction
