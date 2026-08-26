/**
 * Contract between the Keycloak login theme and this SPA for the Passkey option.
 *
 * See `docs/passkey-frontend-contract.md` in the backend repository for the authoritative
 * description, including what the CMS content team must create.
 */

/**
 * Id of the CMS entry in `social_manager.providers` that represents Passkey.
 *
 * Unlike every other entry in that list, this id is NOT a Keycloak identity-provider
 * alias — Passkey is an authenticator inside the browser flow, not a federated IdP. That
 * is why `SocialManager` needs an explicit exception for it.
 */
export const PASSKEY_PROVIDER_ID = "passkey"

/**
 * Keycloak's provider id for the WebAuthn Passwordless authenticator, as configured in
 * Unit 1 as an ALTERNATIVE execution of the browser flow.
 */
export const WEBAUTHN_PASSWORDLESS_AUTHENTICATOR = "webauthn-authenticator-passwordless"

/**
 * Feature-flag functionality prefix, following the existing convention in
 * `views/App` (`skip-social-{client_id}`, `show-social-buttons-{client_id}`).
 *
 * This is the per-client kill switch required by FR-7 and NFR-3: Passkey can be turned off
 * without a deploy, and the other login methods are unaffected.
 */
export const PASSKEY_FLAG_PREFIX = "show-passkey-"

/**
 * One entry of Keycloak's `auth.authenticationSelections`, forwarded by `login.ftl`.
 *
 * `providerId` is what lets us find the WebAuthn execution reliably; matching on
 * `displayName` would break as soon as the locale changes.
 */
export interface AuthenticationSelection {
  authExecId: string
  providerId?: string
  displayName?: string
  helpText?: string
}

/** Props for the passwordless authentication ceremony screen. */
export interface PasskeyAuthenticateProps {
  [key: string]: unknown
  action_url?: string
  language?: string
  client_id?: string
  /** base64url challenge issued by Keycloak. */
  challenge?: string
  /** Relying-party id configured in the realm's WebAuthn Passwordless policy. */
  rpId?: string
  /** base64url credential ids allowed for this user; empty means usernameless/discoverable. */
  allowCredentials?: string[]
  userVerification?: "required" | "preferred" | "discouraged"
  createTimeout?: number
  isUserIdentified?: boolean
  errorCode?: string
  restartFlow?: string
}

/** Props for the registration (enrolamiento) ceremony screen. */
export interface PasskeyRegisterProps {
  [key: string]: unknown
  action_url?: string
  language?: string
  client_id?: string
  challenge?: string
  rpId?: string
  rpEntityName?: string
  userId?: string
  username?: string
  signatureAlgorithms?: number[]
  userVerification?: "required" | "preferred" | "discouraged"
  requireResidentKey?: string
  attestationConveyancePreference?: string
  authenticatorAttachment?: string
  createTimeout?: number
  excludeCredentialIds?: string[]
  errorCode?: string
  restartFlow?: string
}

/**
 * Maximum length accepted for the user-facing device label.
 *
 * Enforced here only to keep the UI honest; the authoritative validation is server-side in
 * Unit 3 (SECURITY-05 — never trust a client-side bound).
 */
export const PASSKEY_DEVICE_LABEL_MAX_LENGTH = 64
