import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SocialManager from "components/SocialManager"
import { WEBAUTHN_PASSWORDLESS_AUTHENTICATOR } from "types/models/passkey"

/**
 * Behavioural coverage for FR-1 (Passkey offered alongside existing methods), FR-2 (hidden
 * when the device cannot use it) and FR-7 (existing methods keep working untouched).
 */

const isPasskeySupportedMock = vi.fn()
const getFlagMock = vi.fn()

vi.mock("utils/webauthn", () => ({
  isPasskeySupported: () => isPasskeySupportedMock()
}))

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  getCookieByName: vi.fn().mockReturnValue("wst"),
  getFlag: (payload: unknown) => getFlagMock(payload)
}))

vi.mock("utils/GA360/login", () => ({
  getProviderBtnGA: vi.fn(),
  setProviderDateLogin: vi.fn()
}))

vi.mock("utils/cookies", () => ({
  setHydraCookie: vi.fn()
}))

vi.mock("utils/common", () => ({
  getBrandName: vi.fn().mockReturnValue("Lifemiles")
}))

vi.mock("stores/app", () => ({
  useAppStore: Object.assign(
    (selector: (state: any) => unknown) => selector({ keycloakConfig: { clientId: "lm-qa", login_hint: "wst" } }),
    { getState: () => ({ keycloakConfig: { clientId: "lm-qa", login_hint: "wst" } }) }
  )
}))

vi.mock("stores/partnerConfigs", () => ({
  useMicrositeConfigsStore: (selector: (state: any) => unknown) => selector({ configs: { flags: { config: {} } } })
}))

const texts = {
  social_manager: {
    title: "Elige cómo ingresar",
    description: "Selecciona un método",
    terms_and_conditions: "",
    providers: [
      { id: "email", logo: "", logo_white: "", provider_name: "Correo y contraseña", button_style: {} },
      { id: "google", logo: "", logo_white: "", provider_name: "Google", button_style: {} },
      { id: "passkey", logo: "", logo_white: "", provider_name: "Iniciar sesión con Passkey", button_style: {} }
    ]
  }
} as any

const keycloakProviders = [{ alias: "google", displayName: "Google", url: "https://accounts.google.com/o/oauth2" }]

const authenticationSelections = [
  { authExecId: "exec-webauthn-1", providerId: WEBAUTHN_PASSWORDLESS_AUTHENTICATOR, displayName: "Passkey" },
  { authExecId: "exec-otp-9", providerId: "auth-otp-form", displayName: "OTP" }
]

function renderSocialManager(overrides: Record<string, unknown> = {}) {
  return render(
    <SocialManager
      texts={texts}
      providers={keycloakProviders as any}
      action_url="/realms/lifemiles/login-actions/authenticate?code=abc"
      authenticationSelections={authenticationSelections}
      language="es"
      client_id="lm-qa"
      setRenderSocial={vi.fn()}
      setError={vi.fn()}
      {...overrides}
    />
  )
}

let submitSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  isPasskeySupportedMock.mockResolvedValue(true)
  getFlagMock.mockReturnValue(true)
  // jsdom does not implement form submission; spying keeps it from logging "not implemented".
  submitSpy = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.clearAllMocks()
  submitSpy.mockRestore()
})

describe("SocialManager — Passkey option", () => {
  it("shows the Passkey option when supported, flagged on, and offered by Keycloak", async () => {
    renderSocialManager()

    expect(await screen.findByTestId("passkeyButton")).toBeInTheDocument()
  })

  it("hides the Passkey option when the device does not support WebAuthn (FR-2)", async () => {
    isPasskeySupportedMock.mockResolvedValue(false)

    renderSocialManager()

    await waitFor(() => expect(screen.getByTestId("emailButton")).toBeInTheDocument())
    expect(screen.queryByTestId("passkeyButton")).not.toBeInTheDocument()
  })

  it("hides the Passkey option when the feature flag is off (FR-7 kill switch)", async () => {
    getFlagMock.mockReturnValue(false)

    renderSocialManager()

    await waitFor(() => expect(screen.getByTestId("emailButton")).toBeInTheDocument())
    expect(screen.queryByTestId("passkeyButton")).not.toBeInTheDocument()
  })

  it("hides the Passkey option when Keycloak is not offering the WebAuthn authenticator", async () => {
    renderSocialManager({ authenticationSelections: [{ authExecId: "exec-otp-9", providerId: "auth-otp-form" }] })

    await waitFor(() => expect(screen.getByTestId("emailButton")).toBeInTheDocument())
    expect(screen.queryByTestId("passkeyButton")).not.toBeInTheDocument()
  })

  it("posts the WebAuthn execution id to the flow action url when selected", async () => {
    const user = userEvent.setup()
    renderSocialManager()

    await user.click(await screen.findByTestId("passkeyButton"))

    expect(submitSpy).toHaveBeenCalledTimes(1)

    const form = submitSpy.mock.instances[0] as HTMLFormElement
    expect(form.method.toUpperCase()).toBe("POST")
    expect(form.getAttribute("action")).toBe("/realms/lifemiles/login-actions/authenticate?code=abc")

    const field = form.querySelector<HTMLInputElement>('input[name="authenticationExecution"]')
    expect(field?.value).toBe("exec-webauthn-1")
  })

  it("does not submit when the action url is missing (fail closed)", async () => {
    const user = userEvent.setup()
    renderSocialManager({ action_url: undefined })

    await user.click(await screen.findByTestId("passkeyButton"))

    expect(submitSpy).not.toHaveBeenCalled()
  })

  it("leaves the existing email and social options intact (FR-7)", async () => {
    renderSocialManager()

    expect(await screen.findByTestId("passkeyButton")).toBeInTheDocument()
    expect(screen.getByTestId("emailButton")).toBeInTheDocument()
    expect(screen.getByTestId("googleButton")).toBeInTheDocument()
  })

  it("still renders the other options when Passkey is unavailable", async () => {
    isPasskeySupportedMock.mockResolvedValue(false)

    renderSocialManager()

    await waitFor(() => expect(screen.getByTestId("emailButton")).toBeInTheDocument())
    expect(screen.getByTestId("googleButton")).toBeInTheDocument()
  })
})
