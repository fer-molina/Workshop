/**
 * Virtual WebAuthn authenticator helpers for Cypress.
 *
 * Cypress reaches the Chrome DevTools Protocol through
 * `Cypress.automation('remote:debugger:protocol', ...)` rather than through a session object, which
 * is why these are thin wrappers instead of a class. Chrome only.
 *
 * A virtual authenticator is what makes the ceremony testable at all: without one, every spec would
 * stop at an OS-level biometric prompt that no automation can answer.
 */

export interface VirtualAuthenticatorOptions {
  /** `internal` models a platform authenticator (Touch ID, Windows Hello); `usb` models a key. */
  transport?: "usb" | "nfc" | "ble" | "internal"
  /** Discoverable credentials are what passwordless (resident-key) flows require. */
  hasResidentKey?: boolean
  /** Whether the authenticator can verify the user (biometrics or PIN). */
  hasUserVerification?: boolean
  /**
   * When true the authenticator reports a successful user verification automatically.
   * Set false to simulate a failed local verification.
   */
  isUserVerified?: boolean
}

function cdp(command: string, parameters: Record<string, unknown> = {}) {
  return Cypress.automation("remote:debugger:protocol", { command, params: parameters })
}

/** Enables the WebAuthn domain. Must be called before adding an authenticator. */
export function enableWebAuthn() {
  return cdp("WebAuthn.enable")
}

export function disableWebAuthn() {
  return cdp("WebAuthn.disable")
}

/**
 * Adds a virtual authenticator and yields its id.
 *
 * Defaults model a platform authenticator with a resident key and successful user verification,
 * which is the configuration the LifeMiles WebAuthn Passwordless policy requires (RP `LifeMiles`,
 * resident key `Yes`, user verification `required`).
 */
export function addVirtualAuthenticator(options: VirtualAuthenticatorOptions = {}) {
  return cdp("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: options.transport ?? "internal",
      hasResidentKey: options.hasResidentKey ?? true,
      hasUserVerification: options.hasUserVerification ?? true,
      isUserVerified: options.isUserVerified ?? true,
      automaticPresenceSimulation: true
    }
  }).then((result: any) => result.authenticatorId as string)
}

export function removeVirtualAuthenticator(authenticatorId: string) {
  return cdp("WebAuthn.removeVirtualAuthenticator", { authenticatorId })
}

/** Lists the credentials the authenticator holds — used to assert enrolment actually happened. */
export function getCredentials(authenticatorId: string) {
  return cdp("WebAuthn.getCredentials", { authenticatorId }).then(
    (result: any) => result.credentials as unknown[]
  )
}

/**
 * Simulates a failed local verification (wrong biometric, wrong PIN).
 *
 * Implemented by flipping `isUserVerified` off rather than by intercepting the API: the point is to
 * exercise the real failure path the browser produces, not a stubbed rejection.
 */
export function setUserVerified(authenticatorId: string, isUserVerified: boolean) {
  return cdp("WebAuthn.setUserVerified", { authenticatorId, isUserVerified })
}

/**
 * Simulates "no credential on this device" by removing every stored credential while leaving the
 * authenticator present. That is the realistic shape of the scenario: the device works, it simply
 * has nothing enrolled for this account.
 */
export function clearCredentials(authenticatorId: string) {
  return cdp("WebAuthn.clearCredentials", { authenticatorId })
}
