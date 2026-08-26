# Unit 2 — Open Questions (answer before generation)

Please write your choice on the `[Answer]:` line of each question. Option E lets you describe
something different.

---

## Question 1 — Account Console (Task 6) scope

**Why I am asking.** Task 6 says "Customize Keycloak Account Console (v3) to display
user-friendly Passkey management" with a list, rename and delete-with-confirmation. That wording
predates a constraint that matters: from Keycloak 24 onward the Account Console is a **React
application** (Account v3), not a FreeMarker theme. Its supported customization surface is CSS,
logos and message bundles. Replacing its content with a bespoke Passkey list, rename dialog and
delete confirmation means forking and rebuilding the upstream React app, then maintaining that
fork across Keycloak upgrades.

Separately, Keycloak 26 **already ships** a Passkey/WebAuthn credential list under
Account Console → "Signing in", with delete support built in.

There is also FR-11, which asks for Passkey management in **both** the custom LifeMiles panel and
the Account Console. The custom LifeMiles panel is Unit 3 work and is unaffected by this choice.

**Options:**

**A) Branding and localization only.** Style the existing Account Console to LifeMiles (CSS,
logo, Spanish message overrides) and rely on Keycloak's native "Signing in" section for the
Passkey list and delete. Lowest effort, zero fork to maintain, upgrade-safe. Rename is limited to
whatever Keycloak natively supports.

**B) Branding and localization now, bespoke UI deferred.** Same as A for Unit 2, and record a
follow-up item to evaluate a forked Account v3 later, once the Unit 3 management API exists and
we know whether the native section is actually insufficient.

**C) Fork Account Console v3 now.** Build the full bespoke Passkey section as originally worded.
Highest fidelity to Task 6, but adds a Node/React build to a Maven project, a fork to maintain
across Keycloak upgrades, and it cannot be verified by the current test setup without browser
automation.

**E) Other** — describe what you want.

[Answer]: A

---

## Question 2 — Scope of the LifeMiles branding in the login theme

**Why I am asking.** I have no LifeMiles brand assets, colour palette or logo in the workspace,
and NFR-4 requires a documented contrast ratio of at least 4.5:1. I can either invent neutral
placeholder values or wait for the real ones.

**Options:**

**A) Neutral placeholders now.** Use clearly-marked placeholder CSS custom properties
(`--lm-color-primary` and similar) with accessible default values, documented so they are easy to
replace. Contrast ratios are computed and documented against those defaults.

**B) Provide the real brand tokens.** You supply the palette, logo and font, and I build the
stylesheet against them. Blocks Step 8 until provided.

**E) Other** — describe what you want.

[Answer]: B. In the folder authTheme you can find all the required assets.

---

## Question 3 — Test execution during this unit

**Why I am asking.** The Unit 2 rendering test starts a Keycloak container and takes roughly one
to two minutes, in the same range as Unit 1's suite. I can now run it myself, since the shell
integration is repaired.

**Options:**

**A) I run it.** I execute the suite in WSL after generation and report verified results, as I
did for Unit 1.

**B) You run it.** I hand you the commands and you execute them manually.

[Answer]: A

---
---

# Part 2 — Questions raised AFTER inspecting `authTheme` (blocking)

Answering Q2 with `authTheme` gave me the real LifeMiles theme, and it contradicts several
assumptions in the plan you approved. I have stopped before generating anything, because building
against these assumptions would produce a theme that is not the one you run.

**What I found:**

1. Your login UI is **not** FreeMarker. `login-template.ftl` loads a separately-deployed
   single-page application (`hub-keycloack-login-ui`) from CloudFront, and `login.ftl` only hands a
   data model to `window.renderLogin({...})`. MFA does the same with `hub-mfa-auth-ui`. Neither
   front-end repository is in this workspace.
2. The theme targets a **much older Keycloak** than the 26.1 I verified Unit 1 against:
   `parent=keycloak`, a legacy FreeMarker `account` theme, and an AngularJS `admin` theme — all of
   which newer Keycloak versions removed.
3. Because of (1), all inline `<script>` blocks plus CloudFront-hosted assets make the strict CSP
   I planned for SECURITY-04 impossible as written.

---

## Question 4 — What Keycloak version does the real LifeMiles instance run?

**Why this is the most important question.** Unit 1 (console setup guide, WebAuthn policy fields,
browser-flow steps, fixture realm) was built and test-verified against Keycloak 26.1. The evidence
in `authTheme` points to something considerably older. If it is older, Unit 1 needs re-targeting
and Unit 2's approach changes with it.

**Options:**

**A) Keycloak 26.x** — the theme in `authTheme` is stale/legacy and not representative of the
current deployment. Unit 1 stands as verified.

**B) An older version** — please state it (for example 22.x, 24.x). I will re-target Unit 1's guide
and fixture realm to that version and re-run the tests against the matching image.

**C) I don't know** — I will add a short diagnostic step: query the real instance's
`/realms/{realm}/.well-known/openid-configuration` and admin `serverInfo` to determine the version
before continuing.

[Answer]: A

---

## Question 5 — Is the login front-end (`hub-keycloack-login-ui`) in scope?

**Why I am asking.** FR-1 and FR-2 are user-facing login UI requirements. In your architecture that
UI lives in an external SPA repository, not in the Keycloak theme. I cannot implement them here.

**Options:**

**A) Add the SPA repo to the workspace.** You provide `hub-keycloack-login-ui` (and
`hub-mfa-auth-ui` if the ceremony screens belong there) and I implement the Passkey button, feature
detection and ceremony UI in it.

**B) Keycloak-side only, and define the contract.** I stay in this repository and deliver the
FreeMarker ceremony templates plus the data-model contract the SPA must consume (the fields
`renderLogin` needs for Passkey, challenge and `allowCredentials` plumbing), documented as a
hand-off specification for the front-end team. FR-1/FR-2 are then explicitly *not* delivered by
this project, only specified.

**C) Standalone Keycloak-native theme.** Deliver Passkey screens using plain Keycloak FreeMarker
templates that bypass the SPA entirely, accepting that the Passkey screens will look different
from the rest of the LifeMiles login experience.

**E) Other** — describe what you want.

[Answer]: A. I included the folder hub-keycloack-login-ui. the repo hub-mfa-auth-ui is out of the scope of this solution

---

## Question 6 — Revisit Q1 (Account Console) now that the premise changedIn

**Why I am asking.** I told you the Account Console is React v3 and that a bespoke Passkey section
means forking a React app. `authTheme/account/` is FreeMarker, so on the version that theme targets
a bespoke section is ordinary template work. Your answer **A** was based on my incorrect framing.

**Options:**

**A) Keep A** — branding and localization only, rely on Keycloak's native Passkey section.

**B) Bespoke FreeMarker Passkey section** in the legacy account theme — viable only if Question 4
confirms the older Keycloak.

**C) Decide after Question 4** — defer until the version is known.

[Answer]:

--- A

## Question 7 — SECURITY-04 approach given inline scripts and CloudFront assets

**Why I am asking.** SECURITY-04 is a blocking rule and requires a CSP without `unsafe-inline` or
`unsafe-eval` unless the exception is documented. Your existing templates use inline `<script>` and
load assets from CloudFront, so a compliant strict policy is not reachable without touching
production templates.

**Options:**

**A) Documented exception.** CSP allowlists the CloudFront origins and permits `unsafe-inline` for
scripts, recorded as an explicit, justified deviation from SECURITY-04 with the residual risk
stated. Nothing in the existing theme changes.

**B) Nonce-based CSP.** Remove `unsafe-inline` by adding per-request nonces to every inline script
in the LifeMiles templates. Compliant, but it modifies existing production templates across the
whole theme, beyond Unit 2's scope.

**C) Only the new Passkey screens are strict.** New templates I author carry no inline script and a
strict policy; the pre-existing screens keep their current posture, and the gap is documented.

[Answer]: A
