import { removeCookie, removeHydraCookie, setCookie, setHydraCookie } from "utils/cookies"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
  addCookie: vi.fn().mockImplementation((name: string, value: string, options: Record<string, unknown>) => {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    if (options) {
      if (options.path) {
        cookieString += `; path=${options.path}`
      }
    }
    document.cookie = cookieString
  }),
  deleteCookie: vi.fn().mockImplementation((name: string, options: Record<string, unknown>) => {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  })
}))

describe("cookies utils test", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("add cookie test", () => {
    setCookie("test", "value")
    expect(setCookie).toBeDefined()
    expect(document.cookie).toContain("test=value")
  })

  it("delete cookie test", () => {
    document.cookie = "test=value"
    removeCookie("test")
    expect(removeCookie).toBeDefined()
    expect(document.cookie).not.toContain("session=")
  })

  it("Add hydra  cookie test", () => {
    setHydraCookie("hydraTest", "value")
    expect(setHydraCookie).toBeDefined()
    expect(document.cookie).toContain("hydraTest=value")
  })

  it("Delete hydra cookie test", () => {
    setHydraCookie("hydraTest", "value")
    removeHydraCookie("hydraTest")
    expect(removeHydraCookie).toBeDefined()
    expect(document.cookie).not.toContain("hydraTest=value")
  })
})
