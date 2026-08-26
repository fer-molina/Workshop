import { vi } from "vitest"
import { codeErrorDescriptionMock } from "./codeErrorDescription"
vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  fetchApiService: vi.fn().mockImplementation(() => ({
    fetchApi: () => ({ response: codeErrorDescriptionMock, status: 200, success: true, unauthorized: false })
  })),
  replaceTexts: vi.fn().mockImplementation((text, replacements) => {
    let modifiedText = text
    for (const key in replacements) {
      const value = replacements[key]
      const regex = new RegExp(`<${key}>`, "g")
      modifiedText = modifiedText.replace(regex, value)
    }
  }),
  getCookieByName: vi.fn().mockImplementation(() => "es"),
  createCircuitBreaker: vi.fn().mockImplementation((options: { primaryFetch: () => Promise<any>; secondaryFetch: () => Promise<any> }) => {
    return async () => {
      const response = await options.primaryFetch()
      return { response: response, status: 200, success: true, unauthorized: false }
    }
  })
}))
