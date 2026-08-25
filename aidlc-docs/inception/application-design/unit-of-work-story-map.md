# Story/Requirement to Unit Mapping — Autenticación Passwordless con Passkey en LifeMiles

Since a dedicated User Stories stage was skipped (the BDD feature file already serves this purpose per `bdd-passkey-lifemiles.md`), this map traces BDD features and functional requirements (from `requirements.md`) to units of work.

| BDD Feature / Requirement | Unit(s) | Task(s) |
|---|---|---|
| Selección del método de autenticación (FR-1, FR-2) | Unit 2 (theme rendering + device detection), Unit 1 (Keycloak flow config) | Task 1, Task 2 |
| Registro de Passkey / Enrolamiento (FR-3, FR-4) | Unit 2 (registration UI), Unit 3 (registration endpoints/service) | Task 3 |
| Autenticación sin contraseña (FR-5) | Unit 2 (auth ceremony UI), Unit 3 (token validation) | Task 4 |
| Convivencia con métodos existentes (FR-6, FR-7) | Unit 3 (coexistence logic), Unit 4 (coexistence integration tests) | Task 7 |
| Seguridad reforzada (FR-8) | Unit 1 (Keycloak WebAuthn policy), Unit 3 (security hardening) | Task 3, Task 8 |
| Gestión de Passkeys del usuario (FR-9, FR-11) | Unit 2 (Account Console customization), Unit 3 (Management API) | Task 5, Task 6 |
| Configuración de Keycloak para Passkey (FR-10) | Unit 1 | Task 1 |
| Requerimientos no funcionales — Rendimiento, Compatibilidad, Disponibilidad, Accesibilidad, Auditoría (NFR-1 to NFR-5) | Unit 2 (accessibility/compat), Unit 3 (audit/perf), Unit 4 (verification) | Task 2, Task 8, Task 9, Task 10 |
| Native readiness (NFR-6) | Unit 1 (scaffolding), Unit 3 (RuntimeHints), Unit 4 (native test profile) | Task 1, Task 3, Task 5, Task 8, Task 9, Task 10 |
| Security Baseline (NFR-7) | All units | All tasks (per-task Security Compliance table in implementation plan) |
| PBT Partial (NFR-8) | Unit 3 (DTOs/invariants), Unit 4 (PBT test automation) | Task 3, Task 5, Task 8, Task 9 |
| Environment/deployment decisions (ENV-1 to ENV-5) | Unit 1 | Task 1 |

All 18 minimum requirements from `bdd-passkey-lifemiles.md`'s summary table are covered by at least one unit above; none are unassigned.
