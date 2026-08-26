import { describe, it, expect, vi, beforeEach } from "vitest"

function mockStore(butterStatus: boolean) {
  vi.doMock("stores/partnerConfigs", () => ({
    useMicrositeConfigsStore: {
      getState: () => ({
        configs: {
          flags: {
            config: [{ id: "butter-active", microsites: [{ status: butterStatus }] }]
          }
        }
      })
    }
  }))
}

const utils = {
  replaceTexts: vi.fn().mockImplementation((tpl: string, vars: any) => `fmt:${tpl}:${vars.language}:${vars.partner}`),
  fetchApiService: vi.fn().mockImplementation((endpoint: string) => {
    const fetchApi = vi.fn().mockResolvedValue({ response: { endpoint }, status: 200, success: true, unauthorized: false })
    return { fetchApi }
  }),
  createCircuitBreaker: vi.fn().mockImplementation((opts: any) => {
    return vi.fn().mockImplementation(async () => await (opts.onlySecondary ? opts.secondaryFetch() : opts.primaryFetch()))
  })
}

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => utils)

// Also provide constants.formPartners to resolve clientId
vi.mock("src/constants", async (orig) => {
  const actual = await (orig as any)()
  return {
    ...actual,
    formPartners: { default: "LM", "lm-qa-test": "LM" }
  }
})

describe("api/loginTexts fetchLoginTextApi", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("uses butter as primary when butter-active=true (onlySecondary=false)", async () => {
    mockStore(true)
    const api = await import("api/loginTexts")
    const { fetchLoginTextApi } = api
    const res = await fetchLoginTextApi("es", "lm-qa-test")

    expect(utils.replaceTexts).toHaveBeenCalledTimes(2)
    const { createCircuitBreaker } = await import("@lm-tecnologias-interactivas-u/website-utils")
    expect((createCircuitBreaker as any).mock.calls[0][0].onlySecondary).toBe(false)
    expect(res.status).toBe(200)
  })

  it("uses strapi only when butter-active=false (onlySecondary=true)", async () => {
    mockStore(false)

    // change circuit breaker to ensure secondary path is invoked
    utils.createCircuitBreaker.mockImplementation((opts: any) => vi.fn().mockImplementation(async () => await opts.secondaryFetch()))

    const api = await import("api/loginTexts")
    const { fetchLoginTextApi } = api
    const res = await fetchLoginTextApi("en", "lm-qa-test")

    const { createCircuitBreaker } = await import("@lm-tecnologias-interactivas-u/website-utils")
    expect((createCircuitBreaker as any).mock.calls[0][0].onlySecondary).toBe(true)
    expect(res.status).toBe(200)
  })
})
