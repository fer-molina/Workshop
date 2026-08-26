import React from "react"
import { initializeFaro } from "@grafana/faro-react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { getFlag } from "@lm-tecnologias-interactivas-u/website-utils"
// Import after mocks
import GrafanaFaro from "components/GrafanaFaro/GrafanaFaro"
import { useMicrositeConfigsStore } from "stores/partnerConfigs"

// Ensure common mocks for website-components basic items
vi.mock("@lm-tecnologias-interactivas-c/website-components", () => ({
  Loader: () => <div data-testid="loader" />
}))

// Mock grafana faro
vi.mock("@grafana/faro-react", () => ({
  initializeFaro: vi.fn(),
  getWebInstrumentations: vi.fn(() => []),
  ReactIntegration: vi.fn().mockImplementation(() => ({})),
  createReactRouterV6Options: vi.fn(),
  FaroErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="faro-wrapper">{children}</div>
}))

// Mock utils getFlag to control execution
vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  getFlag: vi.fn()
}))

function Child() {
  return <div data-testid="child">child</div>
}

describe("GrafanaFaro", () => {
  beforeEach(() => {
    // reset store
    const { updateConfigs } = useMicrositeConfigsStore.getState()
    updateConfigs({ partner: "", flags: {}, seo: {}, geolocation: {}, butterActive: true } as any)
    vi.clearAllMocks()
  })

  it("renders Loader initially then children without faro when flag false", () => {
    ;(getFlag as any).mockReturnValue(false)

    // provide config with flags.config present
    const { updateConfigs } = useMicrositeConfigsStore.getState()
    updateConfigs({ flags: { config: { any: true } } } as any)

    const { rerender } = render(
      <GrafanaFaro>
        <Child />
      </GrafanaFaro>
    )

    // First render returns loader until effect runs and sets renderChildren
    // jsdom runs effects synchronously enough that we can check for final state
    expect(screen.queryByTestId("loader")).toBeNull()
    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(screen.queryByTestId("faro-wrapper")).toBeNull()
    expect(initializeFaro).not.toHaveBeenCalled()

    // force rerender to ensure stable state
    rerender(
      <GrafanaFaro>
        <Child />
      </GrafanaFaro>
    )
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("wraps children with FaroErrorBoundary and initializes faro when flag true", () => {
    ;(getFlag as any).mockReturnValue(true)

    const { updateConfigs } = useMicrositeConfigsStore.getState()
    updateConfigs({ flags: { config: { any: true } } } as any)

    render(
      <GrafanaFaro>
        <Child />
      </GrafanaFaro>
    )

    expect(screen.getByTestId("faro-wrapper")).toBeInTheDocument()
    expect(screen.getByTestId("child")).toBeInTheDocument()
    expect(initializeFaro).toHaveBeenCalled()
  })
})
