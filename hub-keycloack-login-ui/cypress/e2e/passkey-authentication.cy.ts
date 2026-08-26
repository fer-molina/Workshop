import {
  addVirtualAuthenticator,
  clearCredentials,
  enableWebAuthn,
  getCredentials,
  removeVirtualAuthenticator,
  setUserVerified
} from "../support/webauthn"

/**
 * E2E coverage of the Passkey ceremonies (FR-2, FR-3, FR-5).
 *
 * WRITTEN BUT NOT EXECUTED. The Cypress binary and its system libraries were not installed
 * (Unit 4 question 2 = C), so these specs are reported as unverified. They are complete and
 * intended to run unchanged once the harness described in cypress.config.ts exists.
 *
 * Maps to the BDD scenarios tagged @e2e in src/test/resources/features. Each `it` name references
 * the Gherkin scenario it automates so the mapping stays auditable.
 */
describe("Passkey ceremonies", () => {
  let authenticatorId: string

  beforeEach(() => {
    enableWebAuthn()
    addVirtualAuthenticator().then((id) => {
      authenticatorId = id
    })
  })

  afterEach(() => {
    if (authenticatorId) {
      removeVirtualAuthenticator(authenticatorId)
    }
  })

  /** BDD: "La opción Passkey solo se muestra en dispositivos compatibles" (FR-2). */
  it("hides the Passkey option when the browser cannot do WebAuthn", () => {
    // Removing PublicKeyCredential before any app script runs is what makes this a real test of the
    // detection logic: the SPA sees a browser that genuinely lacks the API.
    cy.visitLogin()
    cy.window().then((win) => {
      // @ts-expect-error deliberately deleting a platform API to simulate an old browser
      delete win.PublicKeyCredential
    })
    cy.reload()

    cy.get('[data-testid="emailButton"]').should("exist")
    cy.get('[data-testid="passkeyButton"]').should("not.exist")
  })

  /** BDD: "El usuario visualiza Passkey como opción de login" (FR-1). */
  it("offers Passkey alongside the existing methods on a capable device", () => {
    cy.visitLogin()

    cy.get('[data-testid="passkeyButton"]').should("be.visible")
    cy.get('[data-testid="emailButton"]').should("be.visible")
  })

  /** BDD: "El usuario registra una Passkey exitosamente" (FR-3). */
  it("enrols a Passkey and the authenticator ends up holding a credential", () => {
    cy.visitLogin()
    cy.get('[data-testid="emailButton"]').click()
    cy.get('input[name="username"]').type(Cypress.env("username"))
    cy.get('input[name="password"]').type(Cypress.env("password"), { log: false })
    cy.get('button[type="submit"]').click()

    // Keycloak presents the enrolment ceremony because the required action is pending.
    cy.get('[data-testid="passkeyDeviceLabel"]').type("Cypress device")
    cy.get('[data-testid="passkeyCeremonyPrimary"]').click()

    // The assertion that matters: a credential really exists in the authenticator afterwards.
    // Asserting only on a success message would pass even if the ceremony had been faked.
    cy.then(() => getCredentials(authenticatorId)).should("have.length", 1)
  })

  /** BDD: "El usuario cancela el registro de Passkey durante la verificación del dispositivo". */
  it("reports a cancelled enrolment without registering anything", () => {
    cy.visitLogin()
    cy.get('[data-testid="passkeyCeremonySecondary"]').click()

    cy.get('[data-testid="passkeyCeremonyStatus"]').should("contain.text", "Cancel")
    cy.then(() => getCredentials(authenticatorId)).should("have.length", 0)
  })

  /** BDD: "El usuario se autentica exitosamente con Passkey" (FR-5). */
  it("authenticates with an enrolled Passkey", () => {
    cy.visitLogin()
    cy.get('[data-testid="passkeyButton"]').click()

    cy.get('[data-testid="passkeyCeremonyStatus"]').should("exist")
    // Landing on the account console means Keycloak validated the assertion and issued a session.
    cy.url().should("include", "/account")
  })

  /** BDD: "El usuario falla la verificación local del dispositivo". */
  it("shows a retryable message when local verification fails", () => {
    cy.then(() => setUserVerified(authenticatorId, false))

    cy.visitLogin()
    cy.get('[data-testid="passkeyButton"]').click()

    cy.get('[data-testid="passkeyCeremonyStatus"]').should("not.be.empty")
    // The retry control must remain available — a dead end here would strand the user.
    cy.get('[data-testid="passkeyCeremonyPrimary"]').should("be.enabled")
    cy.get('[data-testid="passkeyCeremonySecondary"]').should("be.enabled")
  })

  /** BDD: "El usuario intenta autenticarse con Passkey desde un dispositivo sin Passkey registrada". */
  it("offers alternatives when the device holds no credential", () => {
    cy.then(() => clearCredentials(authenticatorId))

    cy.visitLogin()
    cy.get('[data-testid="passkeyButton"]').click()

    cy.get('[data-testid="passkeyCeremonyStatus"]').should("not.be.empty")
    cy.get('[data-testid="passkeyCeremonySecondary"]').should("be.visible")
  })

  /**
   * BDD: "Fallback a otros métodos cuando Passkey no está disponible" (FR-7, NFR-3).
   *
   * The coexistence guarantee: with Passkey unusable, the existing methods must still be reachable
   * and functional, not merely displayed.
   */
  it("leaves password login working when Passkey is unusable", () => {
    cy.then(() => clearCredentials(authenticatorId))

    cy.visitLogin()
    cy.get('[data-testid="emailButton"]').click()
    cy.get('input[name="username"]').type(Cypress.env("username"))
    cy.get('input[name="password"]').type(Cypress.env("password"), { log: false })
    cy.get('button[type="submit"]').click()

    cy.url().should("include", "/account")
  })
})
