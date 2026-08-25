# Execution Plan — Autenticación Passwordless con Passkey en LifeMiles

## Detailed Analysis Summary

### Transformation Scope
- **Type**: Greenfield — new Spring Boot module and Keycloak-side artifacts (console guide, theme, fixture realm). No existing application code found in workspace.
- **Primary Changes**: New authentication method (Passkey/WebAuthn) integrated with an existing, separately-managed Keycloak deployment.
- **Related Components**: Keycloak (external, not managed by this codebase), FreeMarker login theme, Spring Boot backend, Account Console customization.

### Change Impact Assessment
- **User-facing changes**: Yes — new "Iniciar sesión con Passkey" option on login, new Passkey management panel.
- **Structural changes**: Yes — new Spring Boot module with package-based separation (`config`, `controller`, `service`, `model`, `security`, `exception`, `audit`).
- **Data model changes**: Minimal — Passkey metadata stored via Keycloak credential attributes, not a new database.
- **API changes**: Yes — new REST endpoints under `/api/v1/passkeys/**`.
- **NFR impact**: Yes — security (15 baseline rules), native image readiness, accessibility, performance targets.

### Risk Assessment
- **Risk Level**: Medium-High — authentication is security-critical; native image compatibility with Keycloak Admin Client is an open technical risk (flagged in Background); coexistence with existing auth methods must not regress.
- **Rollback Complexity**: Moderate — Passkey is additive (ALTERNATIVE execution in Browser flow), so disabling it in Keycloak console reverts to prior behavior without code rollback.
- **Testing Complexity**: Complex — 4 test layers (unit, integration/Testcontainers, E2E/Playwright+WebAuthn, BDD/Cucumber) plus PBT.

## Workflow Visualization

```mermaid
flowchart TD
    Start(["User Request: Add Passkey Auth"])

    subgraph INCEPTION["Inception Phase"]
        WD["Workspace Detection<br/>COMPLETED"]
        RE["Reverse Engineering<br/>SKIP - greenfield"]
        RA["Requirements Analysis<br/>COMPLETED - minimal depth"]
        US["User Stories<br/>SKIP - BDD file already exists"]
        WP["Workflow Planning<br/>COMPLETED"]
        AD["Application Design<br/>COMPLETED - lightweight"]
        UG["Units Generation<br/>COMPLETED - 4 units"]
    end

    subgraph CONSTRUCTION["Construction Phase"]
        U1["Unit 1: Keycloak Configuration<br/>Code Generation EXECUTE"]
        U2["Unit 2: Custom Login Theme<br/>Code Generation EXECUTE"]
        U3["Unit 3: Spring Boot Backend<br/>Code Generation EXECUTE"]
        U4["Unit 4: Testing and Integration<br/>Code Generation EXECUTE"]
        BT["Build and Test<br/>EXECUTE"]
    end

    subgraph OPERATIONS["Operations Phase"]
        OPS["Operations<br/>PLACEHOLDER"]
    end

    Start --> WD
    WD --> RA
    RA --> WP
    WP --> AD
    AD --> UG
    UG --> U1
    U1 --> U2
    U2 --> U3
    U3 --> U4
    U4 --> BT
    BT -.-> OPS
    BT --> End(["Complete"])

    style WD fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RA fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style WP fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style AD fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style UG fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style U1 fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style U2 fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style U3 fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style U4 fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style BT fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RE fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style US fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style OPS fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style INCEPTION fill:#BBDEFB,stroke:#1565C0,stroke-width:3px,color:#000
    style CONSTRUCTION fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px,color:#000
    style OPERATIONS fill:#FFF59D,stroke:#F57F17,stroke-width:3px,color:#000
    style Start fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000
    style End fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000

    linkStyle default stroke:#333,stroke-width:2px
```

### Text Alternative

```
INCEPTION PHASE
- Workspace Detection: COMPLETED (greenfield)
- Reverse Engineering: SKIPPED (greenfield, no existing code)
- Requirements Analysis: COMPLETED (minimal depth, pre-existing artifacts)
- User Stories: SKIPPED (bdd-passkey-lifemiles.md already covers this)
- Workflow Planning: COMPLETED (this document)
- Application Design: COMPLETED (lightweight, package structure pre-defined)
- Units Generation: COMPLETED (4 units)

CONSTRUCTION PHASE
- Unit 1: Keycloak Configuration - EXECUTE
- Unit 2: Custom Login Theme - EXECUTE
- Unit 3: Spring Boot Backend - EXECUTE
- Unit 4: Testing and Integration - EXECUTE
- Build and Test - EXECUTE

OPERATIONS PHASE
- Operations: PLACEHOLDER
```

## Phases to Execute

### Inception Phase
- [x] Workspace Detection (COMPLETED)
- [x] Reverse Engineering (SKIPPED — greenfield)
- [x] Requirements Analysis (COMPLETED — minimal depth, since scope/decisions were already fully negotiated in conversation and prior artifacts)
- [x] User Stories (SKIPPED — `bdd-passkey-lifemiles.md` already provides equivalent Gherkin coverage and a requirements traceability table)
- [x] Workflow Planning (COMPLETED — this document)
- [x] Application Design (EXECUTE — lightweight; needed to confirm package/service boundaries map cleanly onto units, but the implementation plan had already defined most of this per-task)
- [x] Units Generation (EXECUTE — needed to formally group the 10 tasks into buildable, dependency-ordered units)

### Construction Phase
- [ ] Unit 1: Keycloak Configuration — Code Generation EXECUTE (ALWAYS)
  - **Rationale**: Foundational; all other units depend on it
- [ ] Unit 2: Custom Login Theme — Code Generation EXECUTE (ALWAYS)
  - **Rationale**: User-facing Passkey entry points required
- [ ] Unit 3: Spring Boot Backend — Code Generation EXECUTE (ALWAYS)
  - **Rationale**: Core business logic, security, and API surface
- [ ] Unit 4: Testing & Integration — Code Generation EXECUTE (ALWAYS)
  - **Rationale**: Comprehensive automated verification explicitly required (BDD, E2E, PBT)
- [ ] Build and Test — EXECUTE (ALWAYS)
  - **Rationale**: Final build/test instructions across all units

**Per-unit design stages (Functional Design, NFR Requirements, NFR Design, Infrastructure Design) are SKIPPED for all units**: the implementation plan already specifies, per task, the exact business logic, security compliance mapping, tech stack, and infrastructure (Dockerfiles, native profile) needed. Re-deriving these through separate design stages would duplicate content already approved by the user. Design decisions are embedded directly in each unit's code generation plan.

### Operations Phase
- [ ] Operations — PLACEHOLDER

## Package/Unit Update Sequence

1. **Unit 1: Keycloak Configuration** — no dependencies, unblocks everything else
2. **Unit 2: Custom Login Theme** — depends on Unit 1 (flow/theme wiring)
3. **Unit 3: Spring Boot Backend** — depends on Unit 1 (Keycloak connectivity contract)
4. **Unit 4: Testing & Integration** — depends on Units 1-3 (exercises the full stack)

## Estimated Timeline

- **Total Units**: 4 (10 tasks)
- **Estimated Duration**: Multi-session effort given the scope (full-stack auth feature + native image + 4 test layers); each unit executed as its own Code Generation Planning → Generation cycle with checkpoints.

## Success Criteria

- **Primary Goal**: Passkey available as a coexisting, secure, accessible third authentication method in LifeMiles.
- **Key Deliverables**: Keycloak console guide + test fixture realm, FreeMarker theme, Spring Boot backend (native-ready), full BDD/E2E/PBT test automation, native image + deployment docs.
- **Quality Gates**: All 15 Security Baseline rules compliant (blocking), PBT Partial rules (02/03/07/08/09) compliant (blocking), all BDD scenarios automated, native image builds and starts successfully.
