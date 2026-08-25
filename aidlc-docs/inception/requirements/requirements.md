# Requirements — Autenticación Passwordless con Passkey en LifeMiles

## Intent Analysis

- **User Request**: Implement Passkey (FIDO2/WebAuthn) as a third authentication method in LifeMiles, alongside existing username/password and social login (Google/Apple), leveraging Keycloak's native WebAuthn support.
- **Request Type**: New Feature (full-stack: identity provider configuration, login theme, backend API, tests)
- **Scope Estimate**: Multiple Components (Keycloak realm/theme, Spring Boot backend, Account Console customization, BDD/E2E test suites)
- **Complexity Estimate**: Complex (security-sensitive authentication flow, native image constraints, multiple test layers, coexistence requirement with existing auth methods)
- **Requirements Depth**: Minimal — the request arrived with a comprehensive, pre-negotiated specification (`caso-de-uso.md`, `bdd-passkey-lifemiles.md`, `implementation-plan-passkey-lifemiles.md`) and all ambiguities on the Keycloak deployment strategy were already resolved through direct conversation with the user (see `aidlc-docs/audit.md` for the full Q&A trail). No new clarifying questions are needed at this stage.

## Source Artifacts

This requirements document consolidates and formalizes (without altering) the following pre-existing, user-approved artifacts:
- `caso-de-uso.md` — business case and proposal narrative
- `bdd-passkey-lifemiles.md` — 7 Gherkin features, 18 minimum requirements table (functions as the User Stories equivalent)
- `implementation-plan-passkey-lifemiles.md` — full task breakdown, tech stack, extension configuration
- Conversation decisions (logged in `audit.md`) on standalone Keycloak vs. docker-compose, Testcontainers retention, and admin credential handling

## Functional Requirements

| # | Requirement | Source |
|---|---|---|
| FR-1 | Display "Iniciar sesión con Passkey" alongside existing login options | BDD: Selección del método de autenticación |
| FR-2 | Detect WebAuthn support client-side; hide Passkey option on incompatible devices | BDD: Selección del método de autenticación |
| FR-3 | Passkey registration (enrolamiento) flow for authenticated users, including cancel/timeout/incompatible-device handling | BDD: Registro de Passkey |
| FR-4 | Support multiple Passkeys per user account | BDD: Registro de Passkey |
| FR-5 | Passwordless login flow (username-first, then device verification) | BDD: Autenticación sin contraseña |
| FR-6 | Unified session/token issuance regardless of authentication method used | BDD: Convivencia con métodos existentes |
| FR-7 | Coexistence: Passkey must not disrupt or replace password/social login | BDD: Convivencia con métodos existentes |
| FR-8 | Resistance to phishing (origin validation) and credential stuffing (per-domain key binding) | BDD: Seguridad reforzada |
| FR-9 | User-facing Passkey management: list, rename, revoke/delete | BDD: Gestión de Passkeys |
| FR-10 | Keycloak WebAuthn Passwordless authenticator configured as ALTERNATIVE in Browser flow | BDD: Configuración de Keycloak |
| FR-11 | Passkey management surfaced in both the custom LifeMiles panel and Keycloak Account Console | implementation-plan-passkey-lifemiles.md |

## Non-Functional Requirements

| # | Requirement | Source |
|---|---|---|
| NFR-1 | Full authentication flow completes in < 3s; Keycloak validation < 2s | BDD: Requerimientos no funcionales |
| NFR-2 | Browser compatibility: Chrome 67+, Safari 14+, Firefox 60+, Edge 18+, Android/iOS mobile browsers | BDD: Requerimientos no funcionales |
| NFR-3 | Availability: WebAuthn service failure must not affect password/social login (graceful degradation, not fail-open) | BDD: Requerimientos no funcionales |
| NFR-4 | Accessibility: WCAG 2.1 AA on all Passkey UI (ARIA labels, keyboard nav, ≥4.5:1 contrast, screen reader support) | BDD: Requerimientos no funcionales |
| NFR-5 | Audit logging of all Passkey lifecycle events (register/authenticate/delete) with timestamp, action, user, result | BDD: Requerimientos no funcionales |
| NFR-6 | Spring Boot 4.x, Java 21+, GraalVM Native Image readiness (startup < 100ms, memory < 128MB target) | implementation-plan-passkey-lifemiles.md |
| NFR-7 | Security Baseline extension: all 15 SECURITY rules enforced (blocking) | Extension Configuration |
| NFR-8 | Property-Based Testing extension: Partial enforcement (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09) | Extension Configuration |

## Technical/Environment Requirements (resolved via conversation)

| # | Decision | Rationale |
|---|---|---|
| ENV-1 | Real Keycloak instance (dev/staging) is installed **standalone** (`bin/kc.sh start-dev` / `start`) — **no Docker/docker-compose** | User explicitly requested moving away from docker-compose |
| ENV-2 | WebAuthn Passwordless is configured **manually via the Admin Console**, documented step-by-step in `docs/keycloak-console-setup.md` — no realm JSON export for the real instance | User confirmed option 3a in conversation |
| ENV-3 | Admin credentials for the real Keycloak instance are supplied via **environment variables** (`KEYCLOAK_ISSUER_URI`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_ADMIN_URL`, `KEYCLOAK_ADMIN_USER`, `KEYCLOAK_ADMIN_PASSWORD`) — never committed to the repo | Security baseline SECURITY-09, SECURITY-12 |
| ENV-4 | **Testcontainers is retained** for automated integration tests (Docker is available in dev/CI) — this is independent of ENV-1/ENV-2 | User confirmed Docker is available; recommendation to keep test isolation accepted |
| ENV-5 | Testcontainers uses a **test-only fixture realm** (`keycloak-test-realm.json`) with WebAuthn pre-configured, imported automatically on ephemeral container startup — independent of and not representative of the real instance's manual console setup | User confirmed option 1a in conversation |

## Out of Scope

- Docker-compose based Keycloak provisioning for the real dev/staging instance (explicitly removed per user request)
- Automated realm JSON import for the real instance's WebAuthn configuration (manual console setup only)
- Resiliency Baseline extension rules (explicitly disabled)
- Full PBT enforcement (only Partial mode rules apply: PBT-02, 03, 07, 08, 09)

## Summary

Requirements are considered complete and approved. This document formalizes decisions already reached through direct conversation with the user (see `audit.md`) and pre-existing planning artifacts, without introducing new scope or open questions.
