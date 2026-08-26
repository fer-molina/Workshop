import { describe, it, expect, vi, beforeEach } from "vitest"

const utilsMock = {
  replaceTexts: vi.fn().mockImplementation((tpl: string, obj: any) => `fmt:${tpl}:${obj.language}:${obj.partner}`),
  fetchApiService: vi.fn().mockImplementation((endpoint: string) => {
    const fetchApi = vi.fn().mockResolvedValue({ response: { endpoint }, status: 200, success: true, unauthorized: false })
    return { fetchApi }
  }),
  createCircuitBreaker: vi.fn().mockImplementation((opts: any) => {
    return vi.fn().mockImplementation(async () => await opts.primaryFetch())
  })
}

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => utilsMock)

// helper to mock store with butter-active status
function mockStore(status: boolean) {
  vi.doMock("stores/partnerConfigs", () => ({
    useMicrositeConfigsStore: { getState: () => ({ configs: { flags: { config: [{ id: "butter-active", microsites: [{ status }] }] } } }) }
  }))
}

describe("api/basicHeaderFooter fetchBasicHeaderFooterData", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("uses circuit breaker with onlySecondary=false when butter-active=true", async () => {
    mockStore(true)
    const api = await import("api/basicHeaderFooter")
    const { fetchBasicHeaderFooterData } = api

    const res = await fetchBasicHeaderFooterData("es")
    expect(utilsMock.replaceTexts).toHaveBeenCalledTimes(2)
    // Circuit breaker called with onlySecondary false
    const { createCircuitBreaker } = await import("@lm-tecnologias-interactivas-u/website-utils")
    expect((createCircuitBreaker as any).mock.calls[0][0].onlySecondary).toBe(false)
    expect(res.status).toBe(200)
  })

  it("uses circuit breaker with onlySecondary=true when butter-active=false", async () => {
    vi.resetModules()
    mockStore(false)

    // adjust circuit breaker to verify secondary path
    utilsMock.createCircuitBreaker.mockImplementation((opts: any) => {
      return vi.fn().mockImplementation(async () => await opts.secondaryFetch())
    })

    const api = await import("api/basicHeaderFooter")
    const { fetchBasicHeaderFooterData } = api

    const res = await fetchBasicHeaderFooterData("es")
    const { createCircuitBreaker } = await import("@lm-tecnologias-interactivas-u/website-utils")
    expect((createCircuitBreaker as any).mock.calls[0][0].onlySecondary).toBe(true)
    expect(res.status).toBe(200)
  })
})
