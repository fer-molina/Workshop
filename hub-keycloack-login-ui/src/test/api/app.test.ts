import { describe, it, expect, vi, beforeEach } from "vitest"
import { apiUrl } from "src/constants"
const { fetchApiService } = await import("@lm-tecnologias-interactivas-u/website-utils")

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  fetchApiService: vi.fn().mockImplementation((endpoint: string, options?: any) => {
    const fetchApi = vi
      .fn()
      .mockResolvedValue({ response: { endpoint, microsite: options?.responseConfig?.microsite }, status: 200, success: true, unauthorized: false })
    return { fetchApi }
  })
}))

describe("api/app getFlagApi", () => {
  beforeEach(() => vi.clearAllMocks())

  it("configures fetchApiService with flag endpoint and microsite, and returns result", async () => {
    const { getFlagApi } = await import("api/app")
    const res = await getFlagApi()

    expect(fetchApiService).toHaveBeenCalledWith(String(apiUrl?.strapi?.flagUrl || ""), { responseConfig: { microsite: expect.any(String) } })

    expect(res.status).toBe(200)
  })
})
