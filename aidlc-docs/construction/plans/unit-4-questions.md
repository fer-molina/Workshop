# Unit 4 — Open Questions (answer before generation)

Four decisions, all of them about what is actually reachable in this environment rather than about
preference. Write your choice on each `[Answer]:` line.

---

## Question 1 — What should the E2E tests drive?

**Why I am asking.** Task 9 wants Playwright E2E against the login page. The real LifeMiles login
page cannot be rendered in this workspace, for two independent reasons:

- `authTheme/login/login-template.ftl` uses `${cms_env}`, a FreeMarker variable that is **not**
  standard Keycloak. It is injected by a LifeMiles provider that is not in this repository. Without
  it the template fails to render at all.
- The page body is a SPA loaded from CloudFront (`hub-keycloack-login-ui`), plus CMS-driven text and
  feature flags fetched at runtime.

So "E2E against the LifeMiles login page" is not available locally. What *is* available:

**Options:**

**A) E2E against Keycloak's built-in login theme.** Playwright plus a CDP virtual authenticator
drives the real WebAuthn Passwordless flow in a Keycloak container: enrolment, authentication,
cancellation, timeout, no-credential. Verifies the Keycloak flow configured in Unit 1 and the Unit 3
backend against real assertions. **Does not** verify any LifeMiles UI. Lowest cost, real value,
clearly labelled scope.

**B) Serve the SPA locally and point a test theme at it.** The SPA already supports this: it has a
`dev` script, an `index-local.html`, and `vite.config.ts` defines
`LOCAL_FOLDER_URL = http://localhost:8012`. I would add a test-only theme variant whose template
loads from localhost instead of CloudFront and supplies a default for `cms_env`, then run the Vite
dev server alongside the Keycloak container during the E2E profile. Highest fidelity available.
Costs: real orchestration (two servers plus a container), the CMS and flag endpoints still need
stubbing, and the test theme is a second artifact that can drift from `authTheme`.

**C) Defer E2E entirely** and deliver only the API-level and configuration-level automation, with
E2E documented as requiring a deployed environment.

**E) Other** — describe what you want.

[Answer]: E. the test should be donde using Cypress

---

## Question 2 — May I install Playwright browsers and their system libraries?

**Why I am asking.** Playwright needs a Chromium build (~300 MB download) and usually extra shared
libraries on Ubuntu (`libnss3`, `libatk`, `libgbm` and similar). Installing those needs
`sudo apt-get`. Both are changes to your machine beyond this repository, so I am not doing either
without consent. This only matters if Question 1 is answered A or B.

**Options:**

**A) Yes to both** — download the browser and `sudo apt-get install` the missing libraries.

**B) Browser download only** — try `playwright install chromium` without apt packages, and report
honestly if it fails for missing libraries rather than working around it.

**C) No** — write the E2E tests but do not run them, reporting them as unverified, the way the SPA
tests were handled before the token arrived.

[Answer]: C. The test should be donde using Cypress

---

## Question 3 — Native image (Task 10)

**Why I am asking.** Task 10 wants the native binary built, the reflection hints validated at
runtime, and startup/memory benchmarked against NFR-6 (< 100 ms, < 128 MB). The only GraalVM in this
environment is a **Windows** installation at `Programs/Java/graalvm-jdk-25.0.2`, which cannot produce
the Linux binary `Dockerfile` expects. This has been open since Unit 1.

**Options:**

**A) Install GraalVM for Linux in WSL via SDKMAN** and attempt the native build. SDKMAN is already
present and manages the current JDK, so this is a contained change. The build itself is slow
(commonly 5-15 minutes) and memory-hungry, and may still fail on missing hints — which would be a
genuinely useful finding.

**B) Build the native image inside a container** using a GraalVM builder image. No change to your
machine, same slowness, and it matches how CI would do it.

**C) Keep it deferred** and close Unit 4 with the native criterion explicitly unmet, as it has been
since Unit 1.

[Answer]: A

---

## Question 4 — The Task 8 items that are configuration, not code

**Why I am asking.** Several Task 8 requirements are Keycloak or infrastructure settings rather than
anything this codebase can contain: the Keycloak event listener for
`REGISTER_CREDENTIAL`/`REMOVE_CREDENTIAL`, brute-force detection, event-log retention of at least 90
days, and SECURITY-14 alerting on authentication failures. Unit 3 delivered the application-side
audit logging; these are the other half.

**Options:**

**A) Document them as console procedures** in `docs/keycloak-console-setup.md`, and assert what is
assertable — event-listener configuration and retention can be verified through the Admin API in an
integration test against the fixture realm. Alerting stays a documented infrastructure requirement.

**B) Out of scope for Unit 4**, recorded as an infrastructure hand-off with the relevant SECURITY
rules marked as satisfied outside this codebase (like EX-003).

**E) Other** — describe what you want.

[Answer]: A
