import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchErrorMessage } from "api/errorMessages"
import { apiUrl } from "src/constants"
const { replaceTexts, fetchApiService } = await import("@lm-tecnologias-interactivas-u/website-utils")

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  replaceTexts: vi.fn().mockImplementation((tpl: string, o: any) => `fmt:${tpl}:${o.language}:${o.country}:${o.code}`),
  fetchApiService: vi.fn().mockImplementation((endpoint: string, options?: any) => {
    const fetchApi = vi
      .fn()
      .mockResolvedValue({ response: { endpoint, microsite: options?.responseConfig?.microsite }, status: 200, success: true, unauthorized: false })
    return { fetchApi }
  })
}))

describe("api/errorMessages fetchErrorMessage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("formats endpoint and includes microsite in service options", async () => {
    const country = "co",
      language = "es",
      code = "404"
    const res = await fetchErrorMessage(country, language, code)

    expect(replaceTexts).toHaveBeenCalledWith(String(apiUrl?.strapi?.errorMessage || ""), { language, country, code })
    expect(fetchApiService).toHaveBeenCalledWith(`fmt:${apiUrl?.strapi?.errorMessage}:${language}:${country}:${code}`, {
      responseConfig: { microsite: expect.any(String) }
    })

    expect(res.status).toBe(200)
  })
})
