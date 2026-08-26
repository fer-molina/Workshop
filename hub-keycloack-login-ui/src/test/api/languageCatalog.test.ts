import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchLanguageCatalogApi } from "api/languageCatalog"
import { apiUrl } from "src/constants"
const { replaceTexts, fetchApiService } = await import("@lm-tecnologias-interactivas-u/website-utils")

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  replaceTexts: vi.fn().mockImplementation((tpl: string, obj: any) => `formatted:${tpl}:${obj.language}`),
  fetchApiService: vi.fn().mockImplementation((endpoint: string) => {
    const fetchApi = vi.fn().mockResolvedValue({ response: { lang: endpoint }, status: 200, success: true, unauthorized: false })
    return { fetchApi }
  })
}))

describe("api/languageCatalog fetchLanguageCatalogApi", () => {
  beforeEach(() => vi.clearAllMocks())

  it("formats URL with language and returns fetch result", async () => {
    const lang = "en"
    const result = await fetchLanguageCatalogApi(lang)

    expect(replaceTexts).toHaveBeenCalledWith(apiUrl?.strapi?.languageCatalog, { language: lang })
    expect(fetchApiService).toHaveBeenCalledWith(`formatted:${apiUrl?.strapi?.languageCatalog}:${lang}`, {
      responseConfig: { microsite: expect.any(String) }
    })
    expect(result.status).toBe(200)
  })
})
