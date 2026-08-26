import { defineConfig } from "cypress"

/**
 * Cypress configuration for the Passkey end-to-end suite (Unit 4).
 *
 * WRITTEN BUT NOT EXECUTED. Running these specs needs the Cypress binary (a separate download) and,
 * on Ubuntu, additional system libraries. Consent for both was declined (Unit 4 question 2 = C), so
 * the suite is reported as unverified rather than presented as passing. See
 * docs/build-and-test.md for what running it requires.
 *
 * Harness the specs assume:
 *   1. Keycloak with the lifemiles-test realm on http://localhost:8080
 *   2. A login theme whose template loads assets from http://localhost:8012 and defaults cms_env
 *   3. This SPA running via `yarn dev` on port 8012
 *
 * baseUrl points at Keycloak rather than the SPA, because the flow under test is Keycloak's: the
 * browser is driven through Keycloak's authentication endpoints, and the SPA is what Keycloak's
 * template loads.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.KEYCLOAK_BASE_URL ?? "http://localhost:8080",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    // WebAuthn ceremonies wait on an authenticator; the virtual one answers instantly, but Keycloak
    // page transitions in a cold container do not.
    defaultCommandTimeout: 15000,
    // Traces are what make a failed E2E run diagnosable after the fact.
    video: true,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
    env: {
      realm: "lifemiles-test",
      username: "testuser",
      password: "test-only-password"
    }
  }
})
