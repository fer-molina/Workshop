import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PasskeyButton from "components/PasskeyButton"

/**
 * Accessibility coverage for NFR-4 (WCAG 2.1 AA). The point of these tests is that the
 * control is a real button: it has an accessible name, and it is operable with Enter and
 * Space, which the sibling `<a onClick>` options in `SocialManager` are not.
 */
describe("PasskeyButton", () => {
  const provider = {
    id: "passkey",
    logo: "https://cdn.example.test/passkey.svg",
    logo_white: "",
    provider_name: "Iniciar sesión con Passkey",
    button_style: {} as any
  }

  it("exposes a button role with the CMS label as its accessible name", () => {
    render(<PasskeyButton provider={provider} onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Iniciar sesión con Passkey" })).toBeInTheDocument()
  })

  it("falls back to a default label when the CMS entry has no name", () => {
    render(<PasskeyButton provider={{ ...provider, provider_name: "  " }} onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Iniciar sesión con Passkey" })).toBeInTheDocument()
  })

  it("hides the icon from assistive technology so the name is not announced twice", () => {
    render(<PasskeyButton provider={provider} onSelect={vi.fn()} />)

    const icon = screen.getByRole("button").querySelector("img")
    expect(icon).toHaveAttribute("alt", "")
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })

  it("associates the hint with the button through aria-describedby", () => {
    render(<PasskeyButton provider={provider} hint="Usa tu huella o rostro" onSelect={vi.fn()} />)

    const button = screen.getByRole("button")
    const describedBy = button.getAttribute("aria-describedby")

    expect(describedBy).toBeTruthy()
    expect(document.querySelector(`#${CSS.escape(describedBy as string)}`)).toHaveTextContent("Usa tu huella o rostro")
  })

  it("omits aria-describedby when there is no hint", () => {
    render(<PasskeyButton provider={provider} onSelect={vi.fn()} />)

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby")
  })

  it("is reachable by keyboard and activates with Enter", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<PasskeyButton provider={provider} onSelect={onSelect} />)

    await user.tab()

    expect(screen.getByRole("button")).toHaveFocus()

    await user.keyboard("{Enter}")

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("activates with Space", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<PasskeyButton provider={provider} onSelect={onSelect} />)

    await user.tab()
    await user.keyboard(" ")

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("activates on click", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<PasskeyButton provider={provider} onSelect={onSelect} />)

    await user.click(screen.getByRole("button"))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("does not fire when disabled", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<PasskeyButton provider={provider} disabled onSelect={onSelect} />)

    await user.click(screen.getByRole("button"))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("declares type=button so it cannot accidentally submit a surrounding form", () => {
    render(<PasskeyButton provider={provider} onSelect={vi.fn()} />)

    expect(screen.getByRole("button")).toHaveAttribute("type", "button")
  })
})
