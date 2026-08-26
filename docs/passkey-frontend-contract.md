# Passkey — Front-end and CMS contract

This is the hand-off document for everything the Passkey login experience needs that does not
live in the Keycloak theme. It covers three consumers: the login SPA
(`hub-keycloack-login-ui`), the CMS content team, and whoever configures Keycloak.

Nothing here is optional. If any one of the three is missing, the Passkey option simply does
not appear — by design, so a partial rollout degrades to the current behaviour rather than to
a broken screen.

---

## 1. Keycloak → SPA: `renderLogin` payload addition

`authTheme/login/login.ftl` now forwards Keycloak's authenticator choices:

```js
window.renderLogin({
  /* ...existing fields unchanged... */
  authenticationSelections: [
    {
      authExecId: "f1c2...",                             // execution id to post back
      providerId: "webauthn-authenticator-passwordless",  // stable identifier
      displayName: "webauthn-passwordless-display-name",
      helpText: "webauthn-passwordless-help-text"
    }
  ]
})
```

`providerId` is the field to match on. Do **not** match on `displayName`: it is a localized
message key and changes with the user's language.

The array is empty when Keycloak is not offering a choice at that step. That is a normal
state, not an error.

### How the SPA hands control to Keycloak

Passkey is an authenticator inside the browser flow, not a federated identity provider, so
there is no URL to redirect to. Selecting it means **POSTing** to the flow's action URL:

```
POST {action_url}
Content-Type: application/x-www-form-urlencoded

authenticationExecution={authExecId}
```

This is exactly what Keycloak's own `select-authenticator.ftl` does. Implemented in
`components/SocialManager/index.tsx` (`selectPasskey`).

---

## 2. CMS: the `passkey` provider entry

The Passkey option is rendered from the same CMS-driven list as the other login methods.
**Without this entry the option will never render**, regardless of code or Keycloak config.

Add to `mod_login` → `social_manager.providers`:

| Field | Value |
|---|---|
| `id` | `passkey` — must be exactly this string |
| `provider_name` | User-facing label, e.g. `Iniciar sesión con Passkey` |
| `logo` | Icon URL (24×24 recommended, SVG preferred) |
| `logo_white` | Not used by this control; may be left empty |
| `button_style` | Not used by this control; the Passkey button carries its own styling |

Two notes on how this entry differs from the others:

- Every other entry is only shown when a Keycloak **identity provider alias** matches its
  `id`. `passkey` is not an IdP alias, so `SocialManager` has an explicit branch for it.
- The Passkey control is rendered as a native `<button>`, not as the `<a onClick>` used by
  the other entries, because the latter is not keyboard operable. That is why `button_style`
  is ignored here.

### Position in the list

The order of `social_manager.providers` controls the on-screen order. Recommended placement is
directly after `email`, so the passwordless option is prominent without displacing the
familiar one.

---

## 3. Feature flag

Follows the existing convention in `views/App`:

```
id:            social-manager-view
micrositeName: hub-keycloak-login-ui
functionality: show-passkey-{client_id}
```

This is the kill switch. With the flag off, the Passkey entry is hidden and every other login
method behaves exactly as before — which is how FR-7 (coexistence) and NFR-3 (graceful
degradation) are satisfied operationally rather than only in code.

---

## 4. Ceremony screens: `renderPasskeyAuthenticate` / `renderPasskeyRegister`

Keycloak renders the ceremony screens itself, using two new templates that mount the SPA the
same way `login.ftl` does.

### `webauthn-authenticate.ftl` → `window.renderPasskeyAuthenticate(props)`

| Prop | Meaning |
|---|---|
| `action_url` | Flow action URL to post the assertion to |
| `challenge` | base64url challenge from Keycloak |
| `rpId` | Relying-party id from the realm's WebAuthn Passwordless Policy |
| `allowCredentials` | base64url credential ids; empty means discoverable/usernameless |
| `userVerification` | `required` \| `preferred` \| `discouraged` |
| `createTimeout` | Seconds; `0` means no timeout |
| `isUserIdentified` | Whether Keycloak already knows the user |

The template also renders a hidden form `#webauth` with the fields Keycloak expects back:
`clientDataJSON`, `authenticatorData`, `signature`, `credentialId`, `userHandle`, `error`.
The view fills them and submits. **These field names are Keycloak's and must not change.**

### `webauthn-register.ftl` → `window.renderPasskeyRegister(props)`

Adds `rpEntityName`, `userId`, `username`, `signatureAlgorithms`, `requireResidentKey`,
`attestationConveyancePreference`, `authenticatorAttachment` and `excludeCredentialIds`.

Hidden form `#register` fields: `clientDataJSON`, `attestationObject`,
`publicKeyCredentialId`, `authenticatorLabel`, `transports`, `error`.

### Copy

Ceremony copy currently lives in the SPA (`views/PasskeyAuthenticate`,
`views/PasskeyRegister`) with Spanish and English variants, so the screens work before any CMS
entry exists. Moving it to the CMS is a reasonable follow-up; the structure is deliberately a
single `COPY` object per view to make that a small change.

---

## 5. Known external dependency: `cms_env`

`login-template.ftl` — and therefore the two new ceremony templates, which reuse it — depends
on the FreeMarker variable `cms_env` to choose the CloudFront bucket. **This variable is not
standard Keycloak.** It is injected by a LifeMiles provider that is not part of this
repository. Any environment running this theme needs that provider deployed, or the templates
will fail to render.

---

## 6. What is verified and what is not

| Item | Verification |
|---|---|
| Capability detection logic (FR-2) | `src/test/utils/webauthn.test.ts` — **15/15 passing** |
| Passkey button accessibility (NFR-4) | `src/test/components/PasskeyButton.test.tsx` — **10/10 passing** |
| Show/hide rules and execution POST (FR-1, FR-7) | `src/test/components/SocialManager.passkey.test.tsx` — **8/8 passing** |
| Security headers (SECURITY-04) | `SecurityHeadersIT` against a real Keycloak container — **7/7 passing** |
| Resolution against the real design system | **Verified** — faithful install, lockfile enforced |
| Type-check and lint of the new files | **Not executed** — environment issue, commands provided |
| WebAuthn ceremony end to end | Requires a virtual authenticator — **deferred to Unit 4** |
| axe-core accessibility audit | Requires a browser — **deferred to Unit 4** |

**Status of the SPA runs.** Node 20.15.0 and Yarn 1.22.22 are installed in WSL, and with a real
token in `.npmrc` a faithful `yarn install --frozen-lockfile` now succeeds. The 33 Passkey tests
pass against the real `@lm-tecnologias-interactivas-*` packages, so the earlier stubbed run is
superseded.

The full suite reports 17 failures across 12 files. None are Passkey files. They fall into three
pre-existing categories: three suites whose subject module is missing from the workspace
(`components/Alert`, `components/GrafanaFaro`, `views/TemplateController`), tests whose `vi.mock`
factories omit exports the component uses (`isEmptyObject`, `SuccessOrErrorComponent`, `getFlag`,
`IconResolver`), and `api/*` tests asserting URL shapes that no longer match the implementation.

Still outstanding: `tsc --noEmit`, `eslint` and `stylelint` over the new files were not executed,
because the shell integration stopped executing commands during the session. See the unit summary
for the exact commands.
