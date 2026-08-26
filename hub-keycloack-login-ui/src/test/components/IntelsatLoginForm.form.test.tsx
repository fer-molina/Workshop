import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import IntelsatLoginForm from "components/Templates/IntelsatLoginForm"
import { loginTextsMock } from "../mocks/loginTextsMock"
const { getCookieByName } = await import("@lm-tecnologias-interactivas-u/website-utils")

// Mock external UI library components similar to LifemilesLoginForm tests
vi.mock("@lm-tecnologias-interactivas-c/website-components", () => {
  return {
    // Simplified Input that calls onValidation on change; respects regex when provided
    Input: ({ id, label, onValidation, regex, placeholder }: any) => (
      <label>
        {label}
        <input
          data-testid={id}
          placeholder={placeholder}
          onChange={(e) => {
            const v = (e.target as HTMLInputElement).value
            let isValid = true
            if (regex) {
              const re = new RegExp(regex)
              isValid = re.test(v)
            }
            onValidation?.(isValid, { id, value: v, change: true })
          }}
        />
      </label>
    ),
    Button: ({ children, ...rest }: any) => (
      <button {...rest} type="submit">
        {children}
      </button>
    ),
    Loader: () => <div data-testid="loader">loading...</div>
  }
})

// Stub external utils to avoid real imports
vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  getCookieByName: vi.fn()
}))

// Silence Alert component rendering
vi.mock("components/Alert", () => ({
  default: () => null
}))

describe("IntelsatLoginForm form behaviors", () => {
  const texts = loginTextsMock.data[0].fields

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("validates username (LM number, alphanumeric, email) and enables submit when password valid", () => {
    ;(getCookieByName as any).mockReturnValue("")

    render(<IntelsatLoginForm texts={texts as any} language="es" action_url="/login" />)

    const username = screen.getByTestId("username") as HTMLInputElement
    const password = screen.getByTestId("password") as HTMLInputElement
    const submit = screen.getByTestId("lmSubmit") as HTMLButtonElement

    // Initially enabled (isError=false until validations)
    expect(submit).not.toBeDisabled()

    // Invalid username + valid password -> disabled
    fireEvent.change(username, { target: { value: "abc@@" } })
    fireEvent.change(password, { target: { value: "Password1" } })
    expect(submit).toBeDisabled()

    // Valid LM number (11 digits)
    fireEvent.change(username, { target: { value: "12345678901" } })
    expect(submit).not.toBeDisabled()

    // Alphanumeric username
    fireEvent.change(username, { target: { value: "UserAlpha21" } })
    expect(submit).not.toBeDisabled()

    // Valid email
    fireEvent.change(username, { target: { value: "user@mail.com" } })
    expect(submit).not.toBeDisabled()
  })

  it("prefills username from ftnum cookie and treats it as valid", () => {
    ;(getCookieByName as any).mockImplementation((name: string) => (name === "ftnum" ? "12345678901" : ""))

    render(<IntelsatLoginForm texts={texts as any} language="es" action_url="/login" />)

    const password = screen.getByTestId("password") as HTMLInputElement
    const submit = screen.getByTestId("lmSubmit") as HTMLButtonElement

    fireEvent.change(password, { target: { value: "Password1" } })
    expect(submit).not.toBeDisabled()
  })

  it("shows Loader and submits form when window.retrieveLoginInfo is called", async () => {
    ;(getCookieByName as any).mockReturnValue("")

    const submitSpy = vi.spyOn(HTMLFormElement.prototype as any, "submit").mockImplementation(() => {})

    vi.useFakeTimers()
    render(<IntelsatLoginForm texts={texts as any} language="es" action_url="/login" />)

    // Call the bridge function
    act(() => {
      // @ts-ignore attach by component
      window.retrieveLoginInfo("user@mail.com", "Password1")
    })

    // Loader should be visible immediately
    expect(screen.getByTestId("loader")).toBeInTheDocument()

    // Advance timers to trigger submit
    await act(async () => {
      vi.advanceTimersByTime(250)
    })

    expect(submitSpy).toHaveBeenCalled()

    vi.useRealTimers()
    submitSpy.mockRestore()
  })

  it("redirects to enrollment URL and preserves params from loginUri", () => {
    ;(getCookieByName as any).mockReturnValue("")

    const originalLocation = window.location
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        href: "http://localhost/",
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn()
      },
      writable: true
    })

    const loginUri =
      "https://hydra.qa-lifemiles.net/oauth2/auth?client_id=abc&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb&state=xyz&code_challenge=cc&code_challenge_method=S256"

    render(<IntelsatLoginForm texts={texts as any} language="es" action_url="/login" loginUri={loginUri} />)

    // The enroll button wraps the create_account HTML. Use accessible name from inner text
    const enrollBtn = screen.getByRole("button", { name: /register here for free/i })
    fireEvent.click(enrollBtn)

    const rawUrl = "https://www.uat-lifemiles.net/creatucuenta/datos-personales"

    expect((window.location as Location & { href: string }).href).toContain(rawUrl)
    expect(window.location.href).toContain("client_id=abc")
    expect(window.location.href).toContain("redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb")
    expect(window.location.href).toContain("state=xyz")
    expect(window.location.href).toContain("code_challenge=cc")
    expect(window.location.href).toContain("code_challenge_method=S256")

    // restore
    Object.defineProperty(window, "location", { value: originalLocation, writable: true })
  })
})
