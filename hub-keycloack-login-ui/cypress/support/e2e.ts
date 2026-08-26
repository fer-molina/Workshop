/// <reference types="cypress" />

/**
 * Global support file for the Passkey E2E suite.
 *
 * WRITTEN BUT NOT EXECUTED — see cypress.config.ts.
 */

// Fail the spec on an unexpected browser exception rather than swallowing it. The default Cypress
// behaviour of failing is correct here: a WebAuthn ceremony that throws in the page is exactly the
// kind of defect these specs exist to catch, so it must not be suppressed.
Cypress.on("uncaught:exception", (error) => {
  // Vite's dev server injects an HMR websocket that can report a benign disconnect on teardown.
  // Ignoring only that one avoids masking real failures.
  if (error.message.includes("WebSocket closed without opened")) {
    return false
  }
  return true
})

/**
 * Navigates to the realm's account console, which redirects into the login flow.
 *
 * Used rather than a hand-built authorization URL so the specs exercise whatever browser flow the
 * realm actually has bound — the point of Unit 1's ALTERNATIVE execution being real configuration
 * rather than a test fixture.
 */
Cypress.Commands.add("visitLogin", () => {
  const realm = Cypress.env("realm")
  cy.visit(`/realms/${realm}/account/`)
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitLogin(): Chainable<void>
    }
  }
}
