# Unit 3 — Open Questions (answer before generation)

Four decisions where the approved implementation plan and the reality of Keycloak's API do not
line up. Write your choice on each `[Answer]:` line. Option E lets you describe something else.

---

## Question 1 — `lastUsed` cannot be populated from Keycloak

**Why I am asking.** Task 5 specifies
`PasskeyResponse(String id, String name, Instant createdAt, Instant lastUsed)`. Keycloak's
`CredentialRepresentation` — the only thing the Admin API returns for a user's credentials —
exposes `id`, `type`, `userLabel` and `createdDate`. **There is no last-used timestamp.** I can
either drop the field or source it from somewhere else, but I cannot invent it.

**Options:**

**A) Drop `lastUsed`.** `PasskeyResponse(id, name, createdAt)`. Honest, simple, and the list
still supports the FR-9 operations (list, rename, revoke). The UI loses "last used", which is
useful for helping a user identify which passkey to delete.

**B) Derive it from Keycloak login events.** Enable event storage in the realm and query the
admin events API for the most recent successful WebAuthn authentication per credential. Gives
real data, but: it needs event storage enabled and retained (an operational change), events
expire, and it adds a second Keycloak call per list request, which pushes against NFR-1.

**C) Track it ourselves.** The backend records last-used on each successful passkey login. That
needs a datastore this service does not currently have, and the service would only see logins it
mediates — Keycloak-native logins would be missed. I do not recommend this.

**E) Other** — describe what you want.

[Answer]: A

---

## Question 2 — The Task 3 registration endpoints would be dead code as written

**Why I am asking.** Task 3 specifies `POST /api/v1/passkeys/register/initiate` and
`POST /api/v1/passkeys/register/complete`. In Unit 2 we implemented registration through
Keycloak's **own** required-action ceremony (`webauthn-register.ftl`): Keycloak issues the
challenge, the browser calls `navigator.credentials.create`, and the attestation is posted back
to Keycloak, which stores the credential. Keycloak never calls a Spring Boot endpoint during that
flow.

So `/register/complete` has nothing to complete, and `/register/initiate` as literally specified
would be a second, parallel WebAuthn implementation that nothing invokes.

**Options:**

**A) Reshape `initiate`, drop `complete`.** `POST /api/v1/passkeys/register/initiate` adds the
`webauthn-register-passwordless` required action to the authenticated user, so enrolment is
triggered on their next login. This is a real, Keycloak-native operation that a "Register a
Passkey" button in the LifeMiles panel can call. `/complete` is dropped, and the reason is
documented.

**B) Keep both as thin pass-throughs.** Implement them, accepting that `/complete` will be
unreachable in the current architecture. Faithful to the task wording, but it ships dead code.

**C) Implement WebAuthn server-side in Spring Boot.** Full challenge generation and attestation
verification in our service, bypassing Keycloak's authenticator. This duplicates Keycloak, means
we store or verify credentials ourselves, and contradicts SECURITY-12. I do not recommend it.

**E) Other** — describe what you want.

[Answer]: A

---

## Question 3 — SECURITY-06 (least privilege) vs. the Unit 1 environment contract

**Why I am asking.** `application.yml` from Unit 1 binds `KEYCLOAK_ADMIN_USER` and
`KEYCLOAK_ADMIN_PASSWORD` — a password grant with what the naming implies is a full realm admin.
SECURITY-06 requires the service to hold only the permissions it needs. Managing passkey
credentials needs `view-users` and `manage-users`, nothing more.

Changing this touches a Unit 1 artifact and the deployment contract, so I am not doing it
unilaterally.

**Options:**

**A) Switch to a service account (recommended).** A confidential Keycloak client with
`serviceAccountsEnabled`, granted only `view-users` and `manage-users` from `realm-management`.
The backend uses the client-credentials grant. Env vars become
`KEYCLOAK_CLIENT_ID` + `KEYCLOAK_CLIENT_SECRET`, replacing the admin user/password. I would
update `application.yml`, the fixture realm, and `docs/keycloak-console-setup.md`.

**B) Keep the admin user/password grant.** No change to Unit 1. SECURITY-06 is then only
partially met and needs a documented exception like EX-001, stating that the service holds
broader rights than it uses.

**E) Other** — describe what you want.

[Answer]: B

---

## Question 4 — Rate limiting (SECURITY-11): where should it actually live?

**Why I am asking.** An in-process limiter is per-instance. Behind a load balancer with N
replicas the effective limit is N times what it looks like, so it is not the control it appears to
be. I would rather be explicit about that than ship something that reads as protection.

**Options:**

**A) In-process, documented as defence in depth (recommended).** A small in-memory
per-user token bucket in a servlet filter, no new dependency, with the documentation stating
plainly that the authoritative limit belongs at the API gateway or WAF. Protects a single
instance from a runaway client; does not bound distributed abuse.

**B) Bucket4j with a shared store.** A real distributed limit, but it adds a dependency and needs
Redis or Hazelcast, which this service does not have today.

**C) Gateway only.** No application-level limiter; the requirement is met by infrastructure and
SECURITY-11 is documented as satisfied outside this codebase. Needs you to confirm the gateway
actually enforces it.

**E) Other** — describe what you want.

[Answer]: C
