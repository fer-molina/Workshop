# Unit 2 — Passkey Login Experience: Code Generation Summary

All 14 steps of plan revision 2 are complete. The Java/Keycloak side is **verified by
execution**; the SPA side is **written but not executed**, for reasons measured and stated
below rather than assumed.

## Verification status

Executed in WSL Ubuntu 24.04 (Maven 3.8.7, Docker 29.4.3, JDK 25.0.4 compiling with
`--release 21`) via `mvn clean verify -Pintegration` → **BUILD SUCCESS**.

| Suite | Result |
|---|---|
| Surefire — `PasskeyApplicationAotTests` | 1/1 passed |
| Failsafe — `KeycloakFixtureRealmIT` (Unit 1, regression check) | 3/3 passed |
| Failsafe — `SecurityHeadersIT` (new) | 7/7 passed |
| **Failsafe total** | **10 completed, 0 errors, 0 failures, 0 flakes** |

The Unit 1 integration test was re-run deliberately: this unit modifies
`lifemiles-test-realm.json`, a Unit 1 artifact, so a regression check was required rather than
optional. It still passes.

### SPA tests — executed against a faithful install

Node 20.15.0 and Yarn 1.22.22 (Classic, matching `yarn lockfile v1`) were installed in WSL via
nvm, and the user then supplied a real token in `.npmrc`. That made a faithful install possible:

```
yarn install --frozen-lockfile   ->  INSTALL_RC=0   (no 401; private packages resolved)
```

Full suite result, with the **real** private packages installed and the lockfile enforced:

```
Test Files  12 failed | 12 passed (24)
     Tests  17 failed | 65 passed (82)
```

**All 33 Passkey tests pass**, and none of the 17 failures are in files this unit created or
modified:

| File | Result |
|---|---|
| `src/test/utils/webauthn.test.ts` | 15/15 passed |
| `src/test/components/PasskeyButton.test.tsx` | 10/10 passed |
| `src/test/components/SocialManager.passkey.test.tsx` | 8/8 passed |

This supersedes the earlier stubbed run: the components now resolve against the real
`@lm-tecnologias-interactivas-*` packages rather than local stubs.

### The 17 pre-existing failures, categorised

Recorded so they are not mistaken for regressions from this unit. All three categories are
independent of the Passkey work:

1. **Three suites cannot resolve their subject module** — `components/Alert`,
   `components/GrafanaFaro`, `views/TemplateController`. Only the test files exist in this
   workspace; the source modules are absent. Verified by search: no `Alert/`, `GrafanaFaro` or
   `TemplateController` source file is present anywhere in `hub-keycloack-login-ui/src`.
2. **Incomplete `vi.mock` factories** in existing tests — `isEmptyObject`,
   `SuccessOrErrorComponent`, `getFlag` and `IconResolver` are used by the components under test
   but not returned from the mocks (`ErrorController`, `ErrorModal`, `IntelsatLoginForm`,
   `LifemilesLoginForm`). A factory mock replaces the module wholesale, so these fail regardless
   of whether the real package is installed.
3. **Assertion drift in `api/*` tests** — `app`, `errorMessages`, `languageCatalog` and
   `partnerStyles` assert on URL shapes and `fetchApiService` arguments that no longer match the
   implementation.

None of the 12 failing files import `SocialManager`, `main.tsx`, `global.d.ts` or any Passkey
module, and there was no pre-existing `SocialManager` test that this unit could have broken —
`SocialManager.passkey.test.tsx` is the only one. The attribution rests on that inspection, not
on a pristine baseline run, because the SPA is untracked in git so no baseline can be checked out.

### Not completed: type-check and lint of the Passkey files

`npx tsc --noEmit`, `npx eslint` and `npx stylelint` over the new files were **not executed**.
Repeated attempts failed because the shell integration stopped executing commands partway
through this session (scripts were never delivered to WSL, `/tmp/tsc.out` was never created).
This is an environment problem, not a result. The commands are listed at the end of this
document for manual execution.

### Commands to finish the verification

```bash
cd ~/spa-build   # already has the faithful node_modules installed
export PATH="$HOME/.nvm/versions/node/v20.15.0/bin:$PATH"

npx tsc --noEmit

npx eslint src/utils/webauthn.ts src/types/models/passkey.ts \
  src/components/PasskeyButton/index.tsx src/components/PasskeyCeremony/index.tsx \
  src/components/SocialManager/index.tsx src/views/PasskeyAuthenticate/index.tsx \
  src/views/PasskeyRegister/index.tsx src/main.tsx

npx stylelint src/components/PasskeyButton/main.module.css \
  src/components/PasskeyCeremony/main.module.css
```

## What was generated

### React SPA — `hub-keycloack-login-ui`
- `src/utils/webauthn.ts` — capability detection (`isPasskeySupported`), base64url helpers, and
  `classifyPasskeyFailure` which maps `DOMException` names to stable, non-technical reason codes
- `src/types/models/passkey.ts` — the Keycloak↔SPA contract: `AuthenticationSelection`, ceremony
  prop types, the CMS provider id, the feature-flag prefix, the device-label bound
- `src/components/PasskeyButton/` — the login-method control (`index.tsx`, `main.module.css`)
- `src/components/PasskeyCeremony/` — shared chrome and the accessible status region used by both
  ceremony screens
- `src/views/PasskeyAuthenticate/` — passwordless login ceremony (`navigator.credentials.get`)
- `src/views/PasskeyRegister/` — registration ceremony (`navigator.credentials.create`)
- `src/components/SocialManager/index.tsx` — **modified**: Passkey branch in the render guard,
  `selectPasskey()` which POSTs `authenticationExecution`, capability + flag gating
- `src/views/App/index.tsx` — **modified**: `authenticationSelections` added to `AppProps`
- `src/main.tsx`, `src/global.d.ts` — **modified**: `renderPasskeyAuthenticate` and
  `renderPasskeyRegister` entry points
- Tests: `src/test/utils/webauthn.test.ts` (15 cases), `src/test/components/PasskeyButton.test.tsx`
  (10 cases), `src/test/components/SocialManager.passkey.test.tsx` (8 cases) — 33 total, all passing

### Keycloak theme — `authTheme/login`
- `login.ftl` — **modified**: serialises `auth.authenticationSelections` into the `renderLogin`
  payload, every value escaped with `?js_string` and every access guarded with FreeMarker's
  default operator so a missing `auth` degrades to an empty list instead of breaking the page
- `webauthn-authenticate.ftl`, `webauthn-register.ftl` — new ceremony templates
- `messages/messages_es.properties`, `messages_en.properties` — **modified**: LifeMiles wording for
  the WebAuthn keys Keycloak renders server-side

### Account Console — `themes/lifemiles-account`
- `account/theme.properties` (`parent=keycloak.v3`), `resources/css/lifemiles-account.css`,
  `messages/messages_es.properties`, `META-INF/keycloak-themes.json`

### Security and documentation
- `src/test/resources/lifemiles-test-realm.json` — **modified**: `browserSecurityHeaders` block
- `src/test/java/com/lifemiles/passkey/theme/SecurityHeadersIT.java` — new
- `docs/security-exceptions.md` — new (EX-001)
- `docs/passkey-frontend-contract.md` — new
- `docs/keycloak-console-setup.md` — **modified**: theme installation, Security Defenses values,
  and a fix to two stale references to the pre-rename fixture filename

## Key decisions

1. **FR-1 was implemented in the SPA, not in FreeMarker.** `login.ftl` is a shell that calls
   `window.renderLogin(...)`; the method-selection screen is `components/SocialManager`, and its
   options come from CMS content. A FreeMarker button would never have been rendered.
2. **Passkey needed an explicit branch in `SocialManager`.** The existing guard is
   `keycloackProvider || item.id == "email"`, which hides anything that is not a Keycloak IdP
   alias. Passkey is an authenticator, not an IdP, so it would always have been hidden.
3. **Selection is a POST, not a redirect.** Choosing an ALTERNATIVE execution means posting
   `authenticationExecution` to the flow action URL, which is why `selectPasskey()` builds and
   submits a form rather than assigning `window.location.href`.
4. **`providerId`, not `displayName`, identifies the WebAuthn execution.** `displayName` is a
   localized message key and would break on a language change.
5. **All JavaScript for the new screens is externalised**, and the ceremony templates use
   FreeMarker default operators throughout, so a missing optional value cannot 500 the page.
6. **The Passkey control is a native `<button>`** rather than the `<a onClick>` used by its
   siblings — see the accessibility finding below.
7. **Security headers live in realm configuration, not the theme.** A theme cannot set response
   headers and `<meta>` cannot set HSTS, so `browserSecurityHeaders` was added to the fixture realm
   and documented for the real instance. This is what turned SECURITY-04 from a claim into an
   assertion.

## Security compliance

| Rule | Status | Evidence |
|---|---|---|
| SECURITY-04 | **Compliant with a documented exception** | Four headers asserted exactly by `SecurityHeadersIT`; CSP pinned to EX-001 in `docs/security-exceptions.md`, including a separate assertion that `unsafe-eval` never appears |
| SECURITY-05 | Compliant for new code | All FreeMarker interpolation escaped with `?js_string`; device label trimmed and bounded client-side with authoritative validation deferred to Unit 3 |
| SECURITY-08 | N/A | No endpoints or authorization logic in this unit |
| SECURITY-09 | Compliant | Every ceremony failure renders generic copy from a fixed message table; raw `DOMException` text is never surfaced |

### EX-001 in brief

CSP permits `'unsafe-inline'` for scripts and allowlists two CloudFront origins, because the
existing LifeMiles templates use inline `<script>` and the login UI is CDN-hosted. Residual
risk: inline-script injection is not mitigated by CSP on these pages, and
`dangerouslySetInnerHTML` on CMS content makes the CMS a trusted-input boundary. Remediation
path is a nonce-based CSP, which would touch every template in the theme and was out of scope.

## Findings reported, deliberately not changed

1. **Accessibility defect in `SocialManager` (pre-existing).** Each login option is an `<a>` with
   an `onClick`, no `href`, no `role` and no key handling. It is not keyboard operable and has no
   accessible role, failing WCAG 2.1 AA 2.1.1 and 4.1.2. `PasskeyButton` uses a native `<button>`
   instead of replicating the pattern, but the existing options remain affected. Fixing them
   changes behaviour on screens outside this unit and should be its own change.
2. **CMS as a trusted-input boundary.** `SocialManager` and `LoginLayout` pass CMS fields to
   `dangerouslySetInnerHTML`.
3. **`authTheme/account/` and `authTheme/admin/` are dead on Keycloak 26.x.** They are the legacy
   FreeMarker account theme and the AngularJS admin theme, both removed from modern Keycloak.
   Not extended; `themes/lifemiles-account` was created against `keycloak.v3` instead.
4. **`cms_env` is a non-standard FreeMarker variable** injected by a LifeMiles provider that is not
   in this repository. Any environment running this theme needs that provider, or the templates
   fail to render. This also means the theme's login page cannot be rendered end to end from this
   repository's test suite.

## External dependencies this unit cannot satisfy

1. **CMS**: a `passkey` entry in `social_manager.providers`. Without it the option never renders.
   The contract is specified in `docs/passkey-frontend-contract.md`.
2. **Feature flag**: `show-passkey-{client_id}` under `social-manager-view`.
3. **Keycloak**: WebAuthn Passwordless as an ALTERNATIVE execution (delivered in Unit 1) and the
   Security Defenses values from the console guide.

## SPA toolchain — what was fixed and what remains

Originally five blockers were measured (`logs/nodecheck.log`). Four are now resolved:

| Blocker | Before | After |
|---|---|---|
| Node | v18.19.1 | **v20.15.0** via nvm 0.40.1 (user-level, `~/.nvm`) |
| Yarn | not installed | **1.22.22** (Classic, matches `yarn lockfile v1`) |
| npm under WSL | resolved to the Windows shim, `WSL 1 is not supported` | nvm's npm 10.7.0; scripts strip `/mnt/` from PATH so Windows shims cannot win |
| `node_modules` | absent | installed from the enforced lockfile |
| `.npmrc` token | placeholder `_authToken=TOKEN_J` → 401 | **RESOLVED** — user supplied a real token; `yarn install --frozen-lockfile` returns 0 |

Installation notes:

- nvm was chosen over apt/NodeSource because it is user-level, needs no sudo, honours
  `.node-version`, and leaves the distro's apt-managed Node 18 intact so nothing else on the
  machine changes behaviour.
- The first install attempt failed because `npm install -g yarn` was executed by the **Windows**
  npm that WSL inherits on PATH through `/mnt/c` interop; it tried to write to
  `C:\Users\...\AppData\Roaming\npm`. Fixed by stripping `/mnt/` entries from PATH and calling
  nvm's npm by absolute path.
- Interactive shells activate Node 20 correctly once `nvm.sh` is sourced (verified:
  `nvm current → v20.15.0`). Non-interactive shells do not source `~/.bashrc`, so automation must
  source nvm or set PATH explicitly — every script under `logs/` does.
- Work is done in a WSL-native copy rather than the OneDrive path, because `node_modules` on a
  DrvFs mount is slow and OneDrive sync can corrupt it mid-install.

All five blockers are now resolved. A security note for the repository owner: `.npmrc` is
committed and now holds a live `_authToken` for two GitLab registries. That is a credential in
source control. Preferably it should be moved to a developer-local `~/.npmrc` or injected from CI,
with the committed file keeping a placeholder — which appears to have been the original intent
given the `TOKEN_J` marker.

## PBT

No property-based tests were introduced, and per the standing instruction of 2026-08-26 none were
executed.

## Deferred to Unit 4

Real-browser WebAuthn ceremonies with a virtual authenticator, the axe-core accessibility audit,
and screen-reader verification of the `aria-live` status region.
