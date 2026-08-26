import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import LifemilesLoginForm, { type Provider as KCProvider } from "components/Templates/LifemilesLoginForm"
import { loginTextsMock } from "../mocks/loginTextsMock"

vi.mock("@lm-tecnologias-interactivas-c/website-components", () => ({
  Input: () => null,
  Button: ({ children }: any) => <button>{children}</button>,
  Loader: () => null
}))

// Stub external utils module to avoid import errors in component under test
vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  getCookieByName: vi.fn()
}))

vi.mock("components/Alert", () => ({
  default: () => null
}))

describe("LifemilesLoginForm social provider redirect", () => {
  it("sets window.location.href to provider url on click", () => {
    const texts = loginTextsMock.data[0].fields

    const originalLocation = window.location
    // Provide a writable mock for window.location to avoid jsdom navigation errors
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        href: "https://www.qa-lifemiles.net/",
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn()
      },
      writable: true
    })

    const providers: KCProvider[] = [{ alias: "google", displayName: "Google", url: "https://accounts.google.com/o/oauth2" }]

    render(<LifemilesLoginForm texts={texts as any} language={"es"} providers={providers} action_url="/login" />)

    const anchor = screen.getByTestId("googleButton")
    fireEvent.click(anchor)

    expect(window.location.href).toBe("https://accounts.google.com/o/oauth2")

    // Restore the original location to avoid leaking between tests
    Object.defineProperty(window, "location", { value: originalLocation, writable: true })
    cleanup()
  })
})
