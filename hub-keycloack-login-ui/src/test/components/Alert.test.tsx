import "../mocks/commonMocks.ts"
import "../mocks/errorModaltest.ts"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen as vitestScreen } from "@testing-library/react"
import { defaultGeneralError } from "../../types/models/generalError"
import Alert from "components/Alert/index.tsx"
import { type EndPointResponse } from "types/common.ts"

import { fetchLanguageCatalogApi } from "api/languageCatalog.ts"
import { fetchLoginTextApi } from "api/loginTexts.ts"

const language = "es"
let languageCatalog: EndPointResponse = {
    response: {},
    status: 500,
    success: false,
    unauthorized: false
  },
  viewTexts: EndPointResponse = {
    response: {},
    status: 500,
    success: false,
    unauthorized: false
  }
describe("ErrorModal", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    languageCatalog = await fetchLanguageCatalogApi(language)
    viewTexts = await fetchLoginTextApi(language, "lm-qa-test")
    render(<Alert {...defaultGeneralError} />)
  })

  it("Error Modal renders without crashing", () => {
    // Render the component
    const alertIcon = vitestScreen.getByTestId("alert-icon")
    expect(alertIcon).toBeInTheDocument()
    const alertTitle = vitestScreen.getByTestId("alert-title")
    expect(alertTitle).toBeInTheDocument()
    expect(alertTitle).toHaveTextContent(String(defaultGeneralError.title))

    const alertDescription = vitestScreen.getByTestId("alert-description")
    expect(alertDescription).toBeInTheDocument()
    const newDescriptionText = defaultGeneralError.description?.split("<br>") || []
    expect(alertDescription).toHaveTextContent(String(newDescriptionText[0]))
  })

  it("Check if the design is beign setted when send as a parameter", () => {
    const { container } = render(
      <Alert {...defaultGeneralError} design={{ background_color: "#fff3e0", icon_color: "#88431c", id: "", text_color: "#88431c" }} />
    )

    const style = container.querySelector("div")?.style

    expect(style?.getPropertyValue("--div__background_color")).toBe("#fff3e0")
    expect(style?.getPropertyValue("--div__text_color")).toBe("#88431c")
  })
})
