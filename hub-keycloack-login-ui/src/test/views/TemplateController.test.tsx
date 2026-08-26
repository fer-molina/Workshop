import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import TemplateController from "views/TemplateController"

// Mock UI lib components used by the view (avoid bringing external UI)
vi.mock("@lm-tecnologias-interactivas-c/website-components", () => ({
  Loader: () => null
}))

// Mock external utils module to avoid import/require resolution issues
vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  replaceTexts: vi.fn((text: string) => text)
}))

// Mock internal modules that are imported but not used in current implementation
vi.mock("api/loginTexts", () => ({ fetchLoginTextApi: vi.fn() }))
vi.mock("api/partnerStyles", () => ({ fetchPartnerStyles: vi.fn() }))
vi.mock("api/app", () => ({ getFlagApi: vi.fn() }))
vi.mock("components/GrafanaFaro/GrafanaFaro", () => ({ default: () => null }))

describe("TemplateController view", () => {
  it("renders Hola mundo", () => {
    render(<TemplateController />)
    expect(screen.getByText(/hola mundo/i)).toBeInTheDocument()
  })
})
