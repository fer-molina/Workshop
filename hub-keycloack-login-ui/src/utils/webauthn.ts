/**
 * WebAuthn / Passkey capability detection and encoding helpers.
 *
 * Covers FR-2 (hide the Passkey option on devices that cannot use it) and NFR-2
 * (Chrome 67+, Safari 14+, Firefox 60+, Edge 18+, and mobile browsers).
 *
 * Every function here is defensive on purpose: capability detection must never be the
 * reason a user cannot log in. If anything is missing, throws, or behaves unexpectedly,
 * we report "not supported" and the existing email/social options carry the user through
 * unchanged (FR-7, NFR-3 graceful degradation — degrade closed, never fail open).
 */

/**
 * True only when the browser exposes the WebAuthn API *and* reports an available
 * user-verifying platform authenticator (biometrics / PIN / passkey provider).
 *
 * `isUserVerifyingPlatformAuthenticatorAvailable` is a static method on
 * `PublicKeyCredential`. Some browsers expose `PublicKeyCredential` without it, and some
 * embedded webviews reject the call outright, so both cases are handled.
 */
export async function isPasskeySupported(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false

    const publicKeyCredential = window.PublicKeyCredential
    if (typeof publicKeyCredential === "undefined" || publicKeyCredential === null) return false

    if (!window.navigator?.credentials) return false

    const isAvailable = publicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    if (typeof isAvailable !== "function") return false

    return (await isAvailable.call(publicKeyCredential)) === true
  } catch {
    // Unsupported, blocked by permissions policy, or a hostile/embedded webview.
    return false
  }
}

/**
 * Decodes a base64url string (the format Keycloak uses for challenges and credential ids)
 * into the `Uint8Array` the WebAuthn API expects.
 */
export function base64UrlToUint8Array(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4))
  const binary = window.atob(base64 + padding)

  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

/**
 * Encodes an `ArrayBuffer` returned by the authenticator into base64url, which is what
 * Keycloak expects back on the form post.
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

/**
 * Classifies a ceremony failure into a stable, non-technical reason code.
 *
 * The reason codes exist so the UI can show human copy without ever surfacing the raw
 * `DOMException` message, which can leak browser and platform detail (SECURITY-09).
 */
export type PasskeyFailureReason = "cancelled" | "timeout" | "no-credential" | "not-supported" | "unknown"

export function classifyPasskeyFailure(error: unknown): PasskeyFailureReason {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError": {
        // The spec deliberately uses one error for both user cancellation and timeout so
        // that sites cannot distinguish them. We surface the softer of the two.
        return "cancelled"
      }
      case "AbortError": {
        return "timeout"
      }
      case "InvalidStateError": {
        return "no-credential"
      }
      case "NotSupportedError":
      case "SecurityError": {
        return "not-supported"
      }
      default: {
        return "unknown"
      }
    }
  }

  return "unknown"
}
