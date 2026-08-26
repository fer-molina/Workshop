# Passkey Management API

Base path `/api/v1/passkeys`. Every endpoint requires a valid JWT issued by the Keycloak realm named
by `KEYCLOAK_ISSUER_URI`; there is no anonymous endpoint.

**No endpoint accepts a user identifier.** The subject is always taken from the `sub` claim of the
validated token. That is deliberate: because no request can name a user, there is no request that
can target another user's credentials, so object-level authorization is a property of the API shape
rather than a check that a future endpoint might omit.

---

## `GET /api/v1/passkeys`

Lists the caller's Passkeys, newest first.

```json
[
  { "id": "2f1c…", "name": "iPhone personal", "createdAt": "2026-08-20T14:03:11Z" }
]
```

`name` is Keycloak's `userLabel` and **may be null** when the user never named the device. Clients
must render a fallback.

There is no `lastUsed` field. Keycloak's `CredentialRepresentation` does not carry one, and the field
was dropped rather than fabricated — see `unit-3-questions.md`, Q1.

Only `webauthn-passwordless` credentials are returned. A user's password and OTP credentials are
never listed here, even though the underlying Keycloak endpoint returns them.

## `PUT /api/v1/passkeys/{id}/name`

Renames a Passkey. `{id}` must be a UUID.

```json
{ "name": "iPad de casa" }
```

`name`: required, non-blank, at most 100 characters, no control characters. The control-character
rule is not cosmetic — the label is written to the audit log, and a newline would allow forged log
lines.

`204 No Content` on success.

## `DELETE /api/v1/passkeys/{id}`

Revokes a Passkey. `{id}` must be a UUID. `204 No Content` on success.

Refuses with `403` if the id names a credential that exists on the user but is not a Passkey. Without
that guard this endpoint would delete passwords.

## `POST /api/v1/passkeys/register/initiate`

Schedules Passkey enrolment for the caller. Returns `202 Accepted`:

```json
{ "requiredAction": "webauthn-register-passwordless", "alreadyPending": true }
```

**This does not perform a WebAuthn ceremony.** It adds Keycloak's
`webauthn-register-passwordless` required action to the user, so the ceremony runs at their next
login, driven by Keycloak and the theme templates. Idempotent: calling it twice leaves one pending
action and reports `alreadyPending: true`.

There is deliberately no `/register/complete`: Keycloak completes the ceremony itself, so such an
endpoint would be unreachable. See `unit-3-questions.md`, Q2.

---

## Errors

Every failure returns the same shape:

```json
{
  "code": "PASSKEY_NOT_FOUND",
  "message": "Passkey not found.",
  "timestamp": "2026-08-26T19:12:44Z",
  "traceId": "0f4c…",
  "fieldErrors": []
}
```

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Malformed body or a non-UUID `{id}` |
| 401 | *(Spring Security)* | Missing, expired or invalid token |
| 403 | `NOT_A_PASSKEY` | The credential exists but is not a Passkey |
| 404 | `PASSKEY_NOT_FOUND` | No such credential on this user |
| 503 | `PASSKEY_SERVICE_UNAVAILABLE` | Keycloak unreachable or timed out |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

Two properties of this contract worth relying on:

- **No response ever contains a stack trace, exception name, Keycloak URL or version.** `traceId` is
  the handle for correlating with server logs, which is where the detail stays.
- **`fieldErrors` names the field and the violated constraint but never the rejected value.** Echoing
  input back is how a validation error becomes a reflection gadget.

A credential belonging to another user returns **404, not 403**. Distinguishing the two would let a
caller enumerate valid credential ids belonging to other users.

---

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `KEYCLOAK_ISSUER_URI` | yes | Realm issuer for JWT validation |
| `KEYCLOAK_ADMIN_URL` | yes | Keycloak base URL for Admin API calls |
| `KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD` | yes | Admin credentials — see **EX-002** |
| `KEYCLOAK_CLIENT_ID` | yes | Client used for the admin token (`admin-cli`) |
| `KEYCLOAK_REALM` | yes | Realm whose users own the Passkeys |
| `KEYCLOAK_AUTH_REALM` | no (`master`) | Realm the admin account lives in |
| `KEYCLOAK_CONNECT_TIMEOUT_MS` | no (`3000`) | Keycloak connect timeout |
| `KEYCLOAK_READ_TIMEOUT_MS` | no (`5000`) | Keycloak read timeout |
| `LIFEMILES_CORS_ALLOWED_ORIGINS` | yes | Exact allowed origins, comma-separated. No wildcards |

Everything marked required has **no default**, so a missing value fails startup rather than letting
the service run with a guess.

### Keycloak permissions

The service needs `view-users` and `manage-users` on the target realm. It currently holds
considerably more — see **EX-002** in `docs/security-exceptions.md`.

### Rate limiting

Not enforced by this service. It is expected at the API gateway — see **EX-003**, including what must
be true for that to be a real control.

## Audit log

Every operation emits one structured event on the `PASSKEY_AUDIT` logger with `action`, `subject`,
`credentialId` and `outcome`. Failures are recorded as well as successes.

Never logged: access tokens, the `Authorization` header, email addresses, usernames, device labels,
or any WebAuthn key material. The only identifier is the Keycloak user UUID, which is pseudonymous.
Device labels are excluded even though support would find them useful, because they are user-supplied
free text.
