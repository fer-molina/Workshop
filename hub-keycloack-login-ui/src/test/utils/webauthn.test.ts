import { describe, it, expect, vi, afterEach } from "vitest"
import { arrayBufferToBase64Url, base64UrlToUint8Array, classifyPasskeyFailure, isPasskeySupported } from "utils/webauthn"

/**
 * These tests are what makes FR-2 (device compatibility detection) genuinely verifiable.
 * jsdom lets us stub `window.PublicKeyCredential` and `navigator.credentials`, so every
 * branch of the detection logic is exercised without a real browser.
 */

const originalPublicKeyCredential = (globalThis.window as any).PublicKeyCredential
const originalCredentials = (globalThis.window.navigator as any).credentials

function stubCredentials(value: unknown) {
  Object.defineProperty(window.navigator, "credentials", { value, writable: true, configurable: true })
}

function stubPublicKeyCredential(value: unknown) {
  Object.defineProperty(window, "PublicKeyCredential", { value, writable: true, configurable: true })
}

afterEach(() => {
  stubPublicKeyCredential(originalPublicKeyCredential)
  stubCredentials(originalCredentials)
})

describe("isPasskeySupported", () => {
  it("returns true when a user-verifying platform authenticator is available", async () => {
    stubCredentials({ get: vi.fn(), create: vi.fn() })
    stubPublicKeyCredential({
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
    })

    await expect(isPasskeySupported()).resolves.toBe(true)
  })

  it("returns false when the browser has no PublicKeyCredential", async () => {
    stubCredentials({ get: vi.fn(), create: vi.fn() })
    stubPublicKeyCredential(undefined)

    await expect(isPasskeySupported()).resolves.toBe(false)
  })

  it("returns false when navigator.credentials is missing", async () => {
    stubCredentials(undefined)
    stubPublicKeyCredential({
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
    })

    await expect(isPasskeySupported()).resolves.toBe(false)
  })

  it("returns false when PublicKeyCredential exists without the availability helper", async () => {
    stubCredentials({ get: vi.fn(), create: vi.fn() })
    stubPublicKeyCredential({})

    await expect(isPasskeySupported()).resolves.toBe(false)
  })

  it("returns false when the platform reports no authenticator", async () => {
    stubCredentials({ get: vi.fn(), create: vi.fn() })
    stubPublicKeyCredential({
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(false)
    })

    await expect(isPasskeySupported()).resolves.toBe(false)
  })

  it("degrades to false instead of throwing when the call is rejected", async () => {
    // Embedded webviews and permissions-policy blocks reject rather than resolve. Login
    // must never break because capability detection failed (NFR-3).
    stubCredentials({ get: vi.fn(), create: vi.fn() })
    stubPublicKeyCredential({
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockRejectedValue(new Error("blocked"))
    })

    await expect(isPasskeySupported()).resolves.toBe(false)
  })

  it("treats a non-boolean resolution as unsupported", async () => {
    stubCredentials({ get: vi.fn(), create: vi.fn() })
    stubPublicKeyCredential({
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue("yes")
    })

    await expect(isPasskeySupported()).resolves.toBe(false)
  })
})

describe("base64url encoding helpers", () => {
  it("round-trips bytes through base64url", () => {
    const original = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255])

    const encoded = arrayBufferToBase64Url(original.buffer)
    const decoded = base64UrlToUint8Array(encoded)

    expect([...decoded]).toEqual([...original])
  })

  it("produces url-safe output with no padding", () => {
    // 0xFB 0xFF encodes to "+/8" in standard base64, which must become "-_8" here.
    const encoded = arrayBufferToBase64Url(new Uint8Array([251, 255]).buffer)

    expect(encoded).not.toContain("+")
    expect(encoded).not.toContain("/")
    expect(encoded).not.toContain("=")
  })

  it("decodes input that needs padding restored", () => {
    // "AQID" is exactly 4 chars; "AQI" needs one '=' added back before atob.
    expect([...base64UrlToUint8Array("AQI")]).toEqual([1, 2])
  })
})

describe("classifyPasskeyFailure", () => {
  it("maps NotAllowedError to cancelled", () => {
    expect(classifyPasskeyFailure(new DOMException("no", "NotAllowedError"))).toBe("cancelled")
  })

  it("maps AbortError to timeout", () => {
    expect(classifyPasskeyFailure(new DOMException("no", "AbortError"))).toBe("timeout")
  })

  it("maps InvalidStateError to no-credential", () => {
    expect(classifyPasskeyFailure(new DOMException("no", "InvalidStateError"))).toBe("no-credential")
  })

  it("maps NotSupportedError and SecurityError to not-supported", () => {
    expect(classifyPasskeyFailure(new DOMException("no", "NotSupportedError"))).toBe("not-supported")
    expect(classifyPasskeyFailure(new DOMException("no", "SecurityError"))).toBe("not-supported")
  })

  it("falls back to unknown for anything else", () => {
    expect(classifyPasskeyFailure(new Error("boom"))).toBe("unknown")
    expect(classifyPasskeyFailure("boom")).toBe("unknown")
    expect(classifyPasskeyFailure(undefined)).toBe("unknown")
  })
})
