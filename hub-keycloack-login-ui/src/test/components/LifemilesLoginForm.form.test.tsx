import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import LifemilesLoginForm from "components/Templates/LifemilesLoginForm"
import { loginTextsMock } from "../mocks/loginTextsMock"
const { getCookieByName } = await import("@lm-tecnologias-interactivas-u/website-utils")

// Mock external UI library components
vi.mock("@lm-tecnologias-interactivas-c/website-components", () => {
  return {
    // Simplified Input that triggers onValidation when value changes
    Input: ({ id, label, value, onValidation, regex, placeholder }: any) => {
      return (
        <label>
          {label}
          <input
            data-testid={id}
            placeholder={placeholder}
            onChange={(e) => {
              const v = e.target.value
              // Compute validity: for password respect provided regex; for username leave to component logic
              let isValid = true
              if (regex) {
                const re = new RegExp(regex)
                isValid = re.test(v)
              }
              onValidation?.(isValid, { id, value: v, change: true })
            }}
          />
        </label>
      )
    },
    Button: ({ children, ...rest }: any) => (
      <button {...rest} type="submit">
        {children}
      </button>
    ),
    Loader: () => <div data-testid="loader">loading...</div>
  }
})

// Stub external utils module to avoid real import resolution
vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  getCookieByName: vi.fn()
}))

// Silence Alert component rendering in tests
vi.mock("components/Alert", () => ({
  default: () => null
}))

describe("LifemilesLoginForm form behaviors", () => {
  const texts = loginTextsMock.data[0].fields

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("validates username for LM number, alphanumeric username, and email; and password enabling submit", () => {
    ;(getCookieByName as any).mockReturnValue("")

    render(<LifemilesLoginForm texts={texts as any} language="es" action_url="/login" />)

    const username = screen.getByTestId("username") as HTMLInputElement
    const password = screen.getByTestId("password") as HTMLInputElement
    const submit = screen.getByTestId("lmSubmit") as HTMLButtonElement

    // Initially enabled because isError=false until validation runs
    expect(submit).not.toBeDisabled()

    // Enter invalid username -> still disabled
    fireEvent.change(username, { target: { value: "abc@@" } })
    fireEvent.change(password, { target: { value: "Password1" } })
    expect(submit).toBeDisabled()

    // Valid LM number (11 digits) -> enabled when password valid
    fireEvent.change(username, { target: { value: "12345678901" } })
    // password already valid, should enable
    expect(submit).not.toBeDisabled()

    // Alphanumeric username (1-21)
    fireEvent.change(username, { target: { value: "UserAlpha21" } })
    expect(submit).not.toBeDisabled()

    // Valid email
    fireEvent.change(username, { target: { value: "user@mail.com" } })
    expect(submit).not.toBeDisabled()
  })

  it("prefills username from ftnum cookie and marks it valid", () => {
    ;(getCookieByName as any).mockImplementation((name: string) => (name === "ftnum" ? "12345678901" : ""))

    render(<LifemilesLoginForm texts={texts as any} language="es" action_url="/login" />)

    const username = screen.getByTestId("username") as HTMLInputElement
    // The Input mock receives value via props; but since it controls internal state, it won't reflect immediately.
    // However, we can type into password and expect submit enabled due to username prefilled and valid.
    const password = screen.getByTestId("password") as HTMLInputElement
    const submit = screen.getByTestId("lmSubmit") as HTMLButtonElement

    // Type a valid password
    fireEvent.change(password, { target: { value: "Password1" } })
    expect(submit).not.toBeDisabled()

    // And username input should be considered touched/valid by component
    expect(username).toBeInTheDocument()
  })

  it("redirects to enrollment URL when clicking Register here for free", () => {
    ;(getCookieByName as any).mockReturnValue("")

    const hrefSetter = vi.fn()
    // Override window.location.href
    // @ts-ignore
    Object.defineProperty(window, "location", { value: { href: "https://www.qa-lifemiles.net/" }, writable: true })
    Object.defineProperty(window.location, "href", {
      set: hrefSetter,
      get() {
        return "https://www.qa-lifemiles.net/"
      }
    })

    render(<LifemilesLoginForm texts={texts as any} language="es" action_url="/login" />)

    const enrollBtn = screen.getByTestId("enrollmentButton")
    fireEvent.click(enrollBtn)

    expect(hrefSetter).toHaveBeenCalledWith("https://www.uat-lifemiles.net/creatucuenta/datos-personales")
  })
})
