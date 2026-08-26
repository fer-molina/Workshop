import { describe, it, expect, vi, beforeEach } from "vitest"
import { apiUrl, butterToken } from "src/constants"
import { fetchPartnerStyles } from "api/partnerStyles"
const { replaceTexts, fetchApiService, createCircuitBreaker } = await import("@lm-tecnologias-interactivas-u/website-utils")

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => {
  const replaceTexts = vi.fn().mockImplementation((tpl: string, vars: any) => `fmt:${tpl}:${vars.language}:${vars.partner}:${vars.token ?? "-"}`)
  const fetchApiService = vi.fn().mockImplementation((endpoint: string, options?: any) => {
    const fetchApi = vi
      .fn()
      .mockResolvedValue({ response: { endpoint, microsite: options?.responseConfig?.microsite }, status: 200, success: true, unauthorized: false })
    return { fetchApi }
  })
  const createCircuitBreaker = vi.fn().mockImplementation((opts: any) => vi.fn().mockImplementation(async () => await opts.primaryFetch()))
  return { replaceTexts, fetchApiService, createCircuitBreaker }
})

describe("api/partnerStyles fetchPartnerStyles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("formats endpoints, includes microsite, and uses primary fetch when onlySecondary=false", async () => {
    const lang = "es"

    const res = await fetchPartnerStyles(lang)

    // replaceTexts called for butter and strapi
    expect(replaceTexts).toHaveBeenCalledWith(String(apiUrl?.butter?.partnerStyles || ""), { language: lang, partner: "LM", token: butterToken })
    expect(replaceTexts).toHaveBeenCalledWith(String(apiUrl?.strapi?.partnerStyles || ""), { language: lang, partner: "LM" })

    // fetchApiService called with responseConfig.microsite
    expect(fetchApiService).toHaveBeenCalledWith(expect.stringContaining(String(apiUrl?.butter?.partnerStyles || "")), {
      responseConfig: { microsite: expect.any(String) }
    })
    expect(fetchApiService).toHaveBeenCalledWith(expect.stringContaining(String(apiUrl?.strapi?.partnerStyles || "")), {
      responseConfig: { microsite: expect.any(String) }
    })

    // Circuit breaker configured with onlySecondary=false (butterActive=true in code)
    expect((createCircuitBreaker as any).mock.calls[0][0].onlySecondary).toBe(false)

    // Returned result from primary path
    expect(res.status).toBe(200)
  })
})
