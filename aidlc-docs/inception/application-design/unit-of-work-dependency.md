# Unit Dependency Matrix — Autenticación Passwordless con Passkey en LifeMiles

| Unit | Depends On | Dependency Reason |
|---|---|---|
| Unit 1: Keycloak Configuration | — (none) | Foundational: standalone Keycloak console guide + Testcontainers fixture realm |
| Unit 2: Custom Login Theme | Unit 1 | Theme templates must reference the WebAuthn Passwordless flow configured in Unit 1; theme testing needs the Testcontainers fixture realm |
| Unit 3: Spring Boot Backend | Unit 1 | Backend connects to Keycloak (real instance via env vars, tests via Testcontainers fixture realm) established in Unit 1 |
| Unit 4: Testing & Integration | Unit 1, Unit 2, Unit 3 | BDD/E2E/integration tests exercise the full stack — theme (Unit 2) + backend (Unit 3) — against the fixture realm (Unit 1) |

## Update Strategy

- **Update Approach**: Sequential (Unit 1 → Unit 2 → Unit 3 → Unit 4), consistent with the incremental Task 1–10 breakdown already approved in the implementation plan.
- **Critical Path**: Unit 1 blocks all others — the Keycloak console guide and test fixture realm are prerequisites for theme, backend, and test work.
- **Coordination Points**:
  - The Testcontainers fixture realm JSON (Unit 1) is the shared contract consumed by Unit 2 (theme rendering tests), Unit 3 (integration tests), and Unit 4 (BDD/E2E/PBT).
  - Environment variable names for real Keycloak connectivity (Unit 1) are the shared contract consumed by Unit 3's `application.yml`.
- **Testing Checkpoints**: After each unit's Code Generation stage, its own test requirements (unit/integration) are verified before moving to the next unit. Full BDD/E2E/PBT suite (Unit 4) runs after Units 1-3 are complete, then a final Build and Test phase validates everything together.
- **Rollback Strategy**: Each unit's code lives in isolated package/directory boundaries (see `unit-of-work.md` code organization), so a unit can be reverted independently without affecting completed prior units, since later units only consume earlier units' public contracts (fixture realm, env var names, REST endpoints).
