import { describe, it, expect } from "vitest"
import { getRequest } from "request/flags"

describe("request/flags getRequest", () => {
  it("builds request object with url from constants, GET header, auth token and JSON body", () => {
    const params = {}

    const req = getRequest(params)

    expect(req.url).toBe(String(window.env?.hubKeycloackLogin?.apis?.strapi?.flagUrl || ""))
    expect(req.headers).toEqual({ method: "GET", Authorization: expect.any(String) })
    expect(req.body).toBe(JSON.stringify(params))
  })

  it("returns empty url string if constant missing", () => {
    window.env = { hubKeycloackLogin: { apis: { strapi: {} } } } as any

    const req = getRequest({})
    expect(req?.url).toBe("https://cms-configs.qa-lifemiles.net/api/cms/cms/v1/website-config/flags.json")
  })
})
