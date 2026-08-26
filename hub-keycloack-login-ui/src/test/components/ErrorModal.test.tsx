import "../mocks/commonMocks.ts"
import "../mocks/errorModaltest.ts"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen as vitestScreen, waitFor } from "@testing-library/react"
import ErrorModal from "../../../src/components/ErrorModal"
import { defaultGeneralError } from "../../types/models/generalError"
import { type EndPointResponse } from "types/common.ts"
import { fetchLanguageCatalogApi } from "api/languageCatalog.ts"
import { fetchLoginTextApi } from "api/loginTexts.ts"
import { loginTextsMock } from "../mocks/loginTextsMock.ts"
import LifemilesLoginForm from "components/Templates/LifemilesLoginForm/index.tsx"

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
    await act(async () => {
      languageCatalog = await fetchLanguageCatalogApi(language)
      viewTexts = await fetchLoginTextApi(language, "lm-qa-test")
      render(<ErrorModal {...defaultGeneralError} />)
    })
  })

  it("Error Modal renders without crashing", async () => {
    // Render the component
    await act(() => {
      render(<ErrorModal {...defaultGeneralError} />)
    })
  })

  it("Error controller displays default text and ErrorModal component when codeError doesnt exist", async () => {
    await act(() => {
      render(<ErrorModal {...defaultGeneralError} />)

      const image = vitestScreen.getByTestId("error-modal-image")
      expect(image).toBeInTheDocument()

      expect(image).toHaveAttribute("src", String(defaultGeneralError.image))

      // check if the title is the same as default
      const title = vitestScreen.getByTestId("error-modal-title")
      expect(title).toBeInTheDocument()

      expect(title).toHaveTextContent(String(defaultGeneralError.title))

      // check if the description is the same as default
      const description = vitestScreen.getByTestId("error-modal-description-0")
      expect(description).toBeInTheDocument()

      const newDescriptionText = defaultGeneralError.description?.split("<br>") || []
      expect(description).toHaveTextContent(String(newDescriptionText[0]))
    })
  })

  it("Api Call to language Catalog", async () => {
    render(<ErrorModal {...defaultGeneralError} />)
    expect(languageCatalog).toBeDefined()
    expect(languageCatalog.success).toBe(true)
    expect(languageCatalog.status).toBe(200)
    const loginProps = {
      texts: viewTexts.response // or provide a valid LoginFields object if available
    }
    render(<LifemilesLoginForm {...loginProps} />)
    await waitFor(() => {
      // vitestScreen.debug()
    })
  })

  it("Api Call to LoginTextsApi", async () => {
    render(<ErrorModal {...defaultGeneralError} />)
    expect(viewTexts).toBeDefined()
    expect(viewTexts.success).toBe(true)
    expect(viewTexts.status).toBe(200)
    expect(viewTexts.response).toEqual(loginTextsMock)

    await waitFor(() => {
      // vitestScreen.debug()
    })
  })
})
