# Code Generation Plan — Unit 2: Passkey Login Experience (rev. 2)

> **Revision note.** Revision 1 of this plan was written before `authTheme` and
> `hub-keycloack-login-ui` were available, and assumed the login UI was FreeMarker. It was placed on
> hold and is superseded by this revision. The invalidated assumptions and the evidence are recorded
> in `aidlc-docs/audit.md`.

## Answers driving this revision

| Q | Answer | Consequence for this plan |
|---|---|---|
| Q4 — Keycloak version | **A** — Keycloak 26.x; `authTheme` is legacy/stale | Unit 1 stands as verified. `authTheme/account/` (FreeMarker) and `authTheme/admin/` (AngularJS) are **dead artifacts on 26.x** and must not be built upon |
| Q5 — SPA in scope | **A** — `hub-keycloack-login-ui` provided; `hub-mfa-auth-ui` **out of scope** | FR-1 and FR-2 are implemented in the React SPA. Ceremony screens must not depend on the MFA SPA |
| Q6 — Account Console | **A** — branding and localization only | On 26.x this means CSS/message overrides for Account Console v3; no bespoke Passkey UI |
| Q7 — SECURITY-04 | **A** — documented exception | CSP allowlists the CloudFront origins and permits `unsafe-inline`; existing templates untouched; residual risk recorded |

## Unit Context

- **Maps to**: Task 2 (login method selection), Task 3 / Task 4 (ceremony UI only), Task 6 (Account Console branding)
- **Requirements**: FR-1, FR-2, FR-3 (UI), FR-5 (UI), FR-7 (no regression), FR-11 (partial), NFR-2, NFR-4, NFR-7 (SECURITY-04/05/09)
- **Depends on**: Unit 1 (WebAuthn Passwordless as ALTERNATIVE in the browser flow)
- **NOT in this unit**: backend endpoints and services (Unit 3); BDD/E2E/axe automation (Unit 4)

## Architecture as it actually is

```
Keycloak 26.x
  └── authTheme/login/  (FreeMarker, thin shell)
        login.ftl            -> window.renderLogin({ providers, action_url, ... })
        login-template.ftl   -> loads main.js / main.css from CloudFront
                                  │
                                  ▼
                    hub-keycloack-login-ui  (React 18 + TS + Vite, this workspace)
                      views/App                     orchestration, CMS texts, feature flags
                      components/SocialManager       METHOD SELECTION screen  <- FR-1 lives here
                      components/Templates/
                        LifemilesLoginForm           email/password form
```

`SocialManager` renders its options from **CMS content** (`social_manager.providers`), showing an
entry only when a matching Keycloak IdP alias exists or the id is `email`. Labels, icons and copy
come from the CMS, not from Keycloak message bundles.

## Three external dependencies this unit cannot satisfy by itself

These are stated up front because they determine what "done" can mean for Unit 2.

1. **CMS content.** A `passkey` entry in `social_manager.providers` (name, icon, copy) must be
   created in the CMS. I can define the exact contract and ship a fallback, but I cannot author CMS
   content from this repository.
2. **Keycloak execution id.** Selecting the Passkey authenticator requires posting
   `authenticationExecution` to `url.loginAction`. Keycloak exposes the available choices to the
   template as `auth.authenticationSelections`; `login.ftl` currently does not forward them to the
   SPA. Step 6 adds that contract.
3. **SPA toolchain and registry credentials.** See "Execution feasibility" below — the SPA's tests
   cannot currently be run in this environment.

## Steps

### Part A — React SPA (`hub-keycloack-login-ui`)

- [x] **Step 1: WebAuthn support detection utility**
  - `isPasskeySupported()`: verify `window.PublicKeyCredential` exists and await
    `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`, returning `false` on any
    throw or on unsupported browsers (NFR-2, FR-2)
  - Path: `hub-keycloack-login-ui/src/utils/webauthn.ts`

- [x] **Step 2: Passkey types and Keycloak contract**
  - Types for the new `renderLogin` inputs: `authenticationSelections` (execution id + provider id)
    and the passkey CMS provider entry
  - Path: `hub-keycloack-login-ui/src/types/models/passkey.ts`, extend `views/App` `AppProps`

- [x] **Step 3: `PasskeyButton` component (FR-1, NFR-4)**
  - A real `<button type="button">` with an accessible name, `aria-describedby` for the explanatory
    copy, and a visible focus style
  - **Deliberate divergence from the existing pattern**: `SocialManager` currently renders its
    options as `<a>` elements with `onClick`, no `href`, no `role` and no key handling, which is not
    keyboard operable and does not meet WCAG 2.1 AA (2.1.1, 4.1.2). NFR-4 applies to Passkey UI, so
    the new control uses a native button rather than replicating that defect. The pre-existing gap
    on the other options is reported, not silently changed
  - Renders only when `isPasskeySupported()` resolves true **and** the feature flag is on
  - Path: `hub-keycloack-login-ui/src/components/PasskeyButton/index.tsx` + `main.module.css`

- [x] **Step 4: Wire Passkey into `SocialManager` (FR-1, FR-7)**
  - Allow the `passkey` CMS entry through the existing render guard (today: `keycloackProvider || item.id == "email"`)
  - `buttonRedirect` gains a `passkey` branch that submits the Keycloak `authenticationExecution`
    form instead of redirecting to an IdP URL
  - Follow the established feature-flag convention (`show-passkey-{client_id}`) so the option can be
    switched off per client without a deploy — this is also the FR-7/NFR-3 kill switch
  - Existing email and social paths must remain byte-for-byte unchanged in behaviour
  - Path: `hub-keycloack-login-ui/src/components/SocialManager/index.tsx`

- [x] **Step 5: Vitest unit tests**
  - `webauthn.ts`: supported, unsupported, and throwing-`isUserVerifying...` cases via jsdom stubs of
    `window.PublicKeyCredential` — this is what makes FR-2 genuinely testable, which the FreeMarker-only
    approach could not do
  - `PasskeyButton`: accessible name, keyboard activation, focus visibility
  - `SocialManager`: passkey entry hidden when unsupported, hidden when the flag is off, shown and
    submitting the correct execution id when both hold, and existing providers unaffected
  - Follows the existing convention of mirroring `src/` under `src/test/`
  - Path: `hub-keycloack-login-ui/src/test/utils/webauthn.test.ts`, `src/test/components/PasskeyButton/index.test.tsx`, `src/test/components/SocialManager/passkey.test.tsx`

### Part B — Keycloak theme (`authTheme/login`)

- [x] **Step 6: Forward the authenticator selections to the SPA**
  - In `login.ftl`, serialise `auth.authenticationSelections` (execution id, provider id, display
    name) into the `window.renderLogin({...})` payload, each value escaped with `?js_string`
  - This is the contract the SPA needs in Step 4; without it the Passkey button has nothing to post
  - Path: `authTheme/login/login.ftl`

- [x] **Step 7: `webauthn-authenticate.ftl` (FR-5, UI)**
  - Ceremony screen for passwordless login. Reuses `login-template.ftl` for the LifeMiles chrome and
    delegates to a new `window.renderPasskeyAuthenticate({...})` export, matching the established
    pattern. Must not reference `hub-mfa-auth-ui` (out of scope per Q5)
  - Consumes the challenge and `allowCredentials` Keycloak already places in this template's model
  - Distinct, non-technical messages for: no credential on device, timeout, verification failure,
    unknown user; `aria-live="polite"` status region (NFR-4)
  - Path: `authTheme/login/webauthn-authenticate.ftl`

- [x] **Step 8: `webauthn-register.ftl` (FR-3, UI)**
  - Registration ceremony with a device-name field (client-side max length; authoritative validation
    is Unit 3), plus cancel and timeout states
  - Path: `authTheme/login/webauthn-register.ftl`

- [x] **Step 9: SPA entry points for the ceremony screens**
  - Add `window.renderPasskeyAuthenticate` and `window.renderPasskeyRegister` to `main.tsx` with
    their views, so Steps 7 and 8 have something to mount
  - Path: `hub-keycloack-login-ui/src/main.tsx`, `src/views/PasskeyAuthenticate/`, `src/views/PasskeyRegister/`

- [x] **Step 10: Message bundle additions**
  - Add Passkey keys to `authTheme/login/messages/messages_{es,en,fr,pt}.properties` for the strings
    rendered server-side; SPA-rendered copy comes from the CMS (see dependency 1)
  - Path: `authTheme/login/messages/*.properties`

### Part C — Security, Account Console, documentation

- [x] **Step 11: SECURITY-04 documented exception (per Q7 = A)**
  - Add `browserSecurityHeaders` to the fixture realm and document the same for the real instance:
    `xContentTypeOptions=nosniff`, `xFrameOptions=DENY`,
    `referrerPolicy=strict-origin-when-cross-origin`,
    `strictTransportSecurity=max-age=31536000; includeSubDomains`, and a CSP that allowlists the two
    CloudFront origins and the CMS/API origins while permitting `unsafe-inline` for scripts
  - Write the exception up explicitly: which rule clause is not met, why (inline `<script>` in the
    existing LifeMiles templates plus CDN-hosted assets), the residual risk (inline-script XSS is not
    mitigated by CSP), and the remediation path (per-request nonces, deferred as it would modify
    production templates across the whole theme)
  - **This modifies a Unit 1 artifact** (`lifemiles-test-realm.json`)
  - Path: `src/test/resources/lifemiles-test-realm.json`, `docs/keycloak-console-setup.md`, `docs/security-exceptions.md`

- [x] **Step 12: Account Console branding (Task 6, per Q6 = A)**
  - On Keycloak 26.x the Account Console is v3 (React); customization is limited to CSS and message
    overrides. Create `themes/lifemiles-account/account/` with `theme.properties`
    (`parent=keycloak.v3`), LifeMiles CSS and `messages_es.properties`
  - Record that `authTheme/account/` and `authTheme/admin/` are legacy and unusable on 26.x, so they
    are deliberately not extended
  - Path: `themes/lifemiles-account/account/`

- [x] **Step 13: Header assertion integration test**
  - `SecurityHeadersIT`: start Keycloak with the fixture realm, `GET` the login page, assert the four
    deterministic SECURITY-04 headers and that the CSP matches the documented exception exactly
  - Deliberately scoped to headers: the login page body is rendered by the CloudFront SPA, so
    asserting page markup from this repository's tests would prove nothing about what users see
  - Path: `src/test/java/com/lifemiles/passkey/theme/SecurityHeadersIT.java`

- [x] **Step 14: Hand-off and documentation**
  - `docs/passkey-frontend-contract.md`: the `renderLogin` payload additions, the CMS
    `social_manager.providers` entry the content team must create, the feature-flag names, and the
    ceremony render contracts
  - `aidlc-docs/construction/unit-2-custom-login-theme/code/summary.md`: what was generated, what was
    verified, what could not be
  - Path: `docs/passkey-frontend-contract.md`, `aidlc-docs/construction/unit-2-custom-login-theme/code/summary.md`

## Execution feasibility — the SPA tests cannot be run here yet

Q3 asked whether I run the tests, and the answer was A. That holds for the Java/Keycloak side
(Steps 11 and 13) but **not** for the SPA, for four measured reasons:

| Blocker | Measured value | Required |
|---|---|---|
| Node version | v18.19.1 | 20.15.0 (`.node-version`) |
| Yarn | not installed | project uses `yarn.lock` |
| npm in WSL | resolves to the Windows shim and errors `WSL 1 is not supported` | a working Linux npm |
| Private registries | `.npmrc` has placeholder `_authToken=TOKEN_J` for two GitLab registries | real tokens for `@lm-tecnologias-interactivas-c/website-components` and `-u/website-utils` |
| `node_modules` | absent | installed |

So Steps 1-5 and 9 will be **written but not executed**. I will report them as unverified rather
than implying otherwise. To lift this, the environment needs Node 20 plus Yarn in WSL and valid
GitLab package tokens; say the word and I will set up Node 20 and Yarn, but the tokens have to come
from you.

## Security Compliance

| Rule | Status | Note |
|---|---|---|
| SECURITY-04 | **Documented exception** (Q7 = A) | Four headers fully compliant and asserted; CSP is a justified deviation with residual risk recorded in `docs/security-exceptions.md` |
| SECURITY-05 | Compliant for new code | Server-side values escaped with `?js_string`/`?html`; device-name bounded client-side. **Pre-existing finding**: `SocialManager` and `LoginLayout` pass CMS content to `dangerouslySetInnerHTML`, so the CMS is a trusted-input boundary — reported, not changed, as it is outside this unit |
| SECURITY-08 | N/A | No endpoints or authorization logic in this unit |
| SECURITY-09 | Compliant | Ceremony error states render generic, non-technical messages with no stack traces or version data |

## PBT

No property-based tests are introduced by this unit, and per the standing instruction of
2026-08-26 none will be executed.

## Accessibility (NFR-4) — what is and is not verifiable here

- Verifiable now: accessible name, keyboard operability and focus behaviour of `PasskeyButton` and
  the ceremony status region, through Vitest and React Testing Library — **once the SPA toolchain is
  available**
- Deferred to Unit 4: axe-core audit and real-browser screen-reader behaviour
- Reported, not fixed: the existing non-keyboard-operable `<a onClick>` options in `SocialManager`
