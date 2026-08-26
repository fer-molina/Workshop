# Documented Security Exceptions

Every entry here is a deliberate, approved deviation from an enabled blocking rule. The
Security Baseline extension is configured as **Full (blocking, all 15 rules)**, so an
exception is only valid while it is recorded here with its residual risk.

---

## EX-001 — SECURITY-04: Content-Security-Policy permits `unsafe-inline` for scripts

- **Rule clause not met**: SECURITY-04 verification requires that the CSP "does not use
  `unsafe-inline` or `unsafe-eval` without documented justification".
- **Status**: Approved by the user on 2026-08-26 (Unit 2 question 7, option A).
- **Scope**: The Keycloak login theme (`authTheme/login`) and every screen it renders.

### What is compliant

Four of the five required headers are fully met and are asserted by an automated test
(`SecurityHeadersIT`):

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |

A CSP **is** set, and it is restrictive in every other respect: `default-src 'self'`,
`object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, and
an explicit allowlist rather than wildcards for the CDN origins.

### What is not compliant, and why

`script-src` includes `'unsafe-inline'`, and `script-src`/`style-src` allowlist two
CloudFront origins. Two properties of the existing architecture force this:

1. **The LifeMiles templates render inline `<script>` blocks.** `login.ftl`,
   `general-error.ftl`, `verify-otp.ftl`, `sms-*.ftl`, `mfa-*.ftl` and others all build a
   JavaScript object from FreeMarker values and call `window.render*` inline. Removing
   `'unsafe-inline'` would break every one of those screens.
2. **The login UI is delivered from a CDN.** `login-template.ftl` loads `main.js` and
   `main.css` for `hub-keycloack-login-ui` from
   `d296xu67oj0g2g.cloudfront.net` (production) or `d2ptwux79zic3h.cloudfront.net`
   (non-production), so `'self'` alone cannot work.

### Residual risk

**Inline-script injection is not mitigated by CSP on these pages.** If an attacker can get
markup into a login screen, CSP will not stop it from executing. This matters most where
untrusted-ish content already reaches the DOM as HTML: `SocialManager` and `LoginLayout`
pass CMS fields to `dangerouslySetInnerHTML`, which makes the **CMS a trusted-input
boundary**. A CMS compromise or an unreviewed content edit is therefore a path to script
execution on the login page.

Compensating controls that remain in force: server-side escaping of all FreeMarker values
(`?js_string`, `?html`), the CDN allowlist (an attacker cannot point `script-src` at an
arbitrary host), `form-action 'self'` (credentials cannot be posted off-origin), and
`frame-ancestors 'none'` (no clickjacking).

### Remediation path (not scheduled)

Move to a **nonce-based CSP**: emit a per-request nonce from Keycloak and add
`nonce="..."` to every inline `<script>` in the theme, then drop `'unsafe-inline'`. This is
mechanical but touches every template in `authTheme/login`, which is production code well
outside Unit 2's scope, so it was not undertaken here. Tightening CMS content review, or
replacing the `dangerouslySetInnerHTML` usages with sanitised rendering, would reduce the
residual risk independently and is the cheaper first step.

### Verification

- `SecurityHeadersIT` asserts the four deterministic headers and that the CSP matches this
  exception exactly, so the policy cannot silently drift.
- The test deliberately does **not** assert page markup: the login page body is rendered by
  the CDN-hosted SPA, so asserting it from the backend test suite would prove nothing about
  what a user actually receives.

---

## EX-002 — SECURITY-06: the service authenticates as a full Keycloak admin

- **Rule clause not met**: SECURITY-06 requires that a component hold only the permissions it
  needs.
- **Status**: Approved by the user on 2026-08-26 (Unit 3 question 3, option B).
- **Scope**: `passkey-service` backend, all Keycloak Admin API calls.

### What the service actually needs

Two realm-management roles: `view-users` (to read a user's credentials) and `manage-users` (to set
a credential label, remove a credential, and set a required action). Nothing else.

### What it holds instead

`KeycloakAdminClientConfig` uses the OAuth2 **password grant** with the account supplied in
`KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD`. By the naming of the deployment contract this is
a realm administrator, which carries every management permission in the realm — creating clients,
editing authentication flows, reading and modifying every user, exporting the realm.

A least-privilege alternative was offered during planning: a confidential client with
`serviceAccountsEnabled` granted only the two roles above, using the client-credentials grant. It
was declined in order to keep the Unit 1 environment contract unchanged.

### Residual risk

**A compromise of this service is a compromise of the whole realm.** If an attacker obtains the
process environment, a heap dump, or remote code execution in the service, they hold full realm
administration rather than the ability to manage passkey labels. Concretely they could disable the
WebAuthn policy, add an identity provider, or reset any user's password — none of which the
service's own API allows, but all of which the credential it carries permits.

Two secondary consequences: a long-lived human-style credential is harder to rotate than a client
secret, and audit events in Keycloak are attributed to a shared admin account rather than to this
service, which makes forensic attribution weaker.

### Compensating controls in force

The service's own surface is narrow and does not widen the blast radius by itself: no endpoint
accepts a user identifier (the subject always comes from the validated JWT), the API refuses to
touch any credential that is not `webauthn-passwordless`, and every operation is audited. Those
protect API callers. They do **not** mitigate the risk above, which comes from the credential the
process holds, not from the API it exposes.

### Remediation path

Create the confidential client with a service account, grant `view-users` and `manage-users`, and
replace `KEYCLOAK_ADMIN_USER`/`KEYCLOAK_ADMIN_PASSWORD` with `KEYCLOAK_CLIENT_SECRET`. The change is
contained: `KeycloakAdminClientConfig` swaps `OAuth2Constants.PASSWORD` for
`OAuth2Constants.CLIENT_CREDENTIALS`, and `LifeMilesKeycloakProperties` loses two fields and gains
one. The reason it was not done is contractual, not technical.

---

## EX-003 — SECURITY-11: no application-level rate limiting

- **Rule clause not met**: SECURITY-11 requires rate limiting on sensitive operations.
- **Status**: Approved by the user on 2026-08-26 (Unit 3 question 4, option C).
- **Scope**: all `/api/v1/passkeys/**` endpoints.

### The decision

Rate limiting is assigned to the API gateway. No limiter was implemented in the service, and none
should be added without revisiting this entry, so that there is one place where the control lives.

### Residual risk, stated plainly

**This codebase cannot verify that the control exists.** Nothing in `passkey-service` enforces or
observes a rate limit, and no test here can fail if the gateway is misconfigured, bypassed, or
reached directly inside the cluster. The requirement is recorded as satisfied on the strength of an
attestation about infrastructure this repository does not contain — that is weaker evidence than the
other SECURITY rules in this project rest on, and it is recorded as such rather than marked
compliant.

The specific exposure if the gateway does not enforce it: `DELETE /api/v1/passkeys/{id}` is
destructive and authenticated. A caller with one valid token cannot reach another user's
credentials, but can enumerate UUIDs against their own account or repeatedly call
`POST /register/initiate`, each call producing a Keycloak write. Unbounded, that is both a Keycloak
load amplifier and a way to flood the audit log — which degrades the NFR-5 audit trail precisely
when it would be most useful.

### What must be true for this exception to hold

1. The gateway or WAF enforces a per-subject limit on `/api/v1/passkeys/**`, with `DELETE` and
   `POST /register/initiate` limited more tightly than `GET`.
2. The service is not reachable except through that gateway, including from inside the cluster.
3. The limit is monitored, so exhaustion is visible.

None of these are verified by this repository. If (2) in particular does not hold, the exception is
void and an in-process limiter becomes necessary.

### Remediation path

An in-memory per-subject token bucket in a servlet filter, returning 429 with `Retry-After`, is a
small change with no new dependency — it was designed during planning and simply not built. It would
bound a single instance's exposure without claiming to be a distributed limit. Recommended as
defence in depth even if the gateway control is confirmed.

---

## EX-004 — SECURITY-14: alerting and tamper-evident audit retention

- **Rule clause not met**: alerting on authentication failures, and tamper-evident log storage.
- **Status**: Approved by the user on 2026-08-26 (Unit 4 question 4, option A — document and assert
  what is assertable).
- **Scope**: Keycloak event pipeline and log storage.

### What is now asserted rather than assumed

`RealmSecurityConfigurationIT` reads the realm back from a live Keycloak and asserts: user events
enabled; `REGISTER_CREDENTIAL`, `REMOVE_CREDENTIAL`, `LOGIN` and `LOGIN_ERROR` captured; the
corresponding `_ERROR` types captured so the trail is not success-only; retention of at least 90 days;
admin events with detail enabled; brute-force protection on with temporary rather than permanent
lockout.

That converts most of SECURITY-14's Keycloak-side requirements from a console instruction into a test
that fails on drift.

### What remains unmet

**Alerting.** Nothing sends a notification when authentication failures spike. Keycloak stores the
events; no consumer watches them. This needs a log pipeline and an alerting rule, neither of which
exists in this repository.

**Tamper-evidence.** Events live in Keycloak's own database, where anyone with database or realm-admin
access can alter or delete them. Note the interaction with **EX-002**: the passkey service holds full
realm-admin rights, so a compromise of that service could also tamper with the audit trail that would
record it. The two exceptions compound, and that is worth stating explicitly rather than leaving for a
reader to notice.

Retention is also only as good as the database's backup policy, which is outside this project.

### Remediation path

Ship Keycloak events to append-only storage outside the realm database — the standard shape is an
event-listener SPI or a log shipper into a WORM bucket or SIEM — and add an alerting rule on
`LOGIN_ERROR` rate. Both are infrastructure. Closing EX-002 would also reduce the tamper surface.
