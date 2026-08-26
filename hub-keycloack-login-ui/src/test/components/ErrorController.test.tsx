import "../mocks/commonMocks.ts"
import "../mocks/errorModaltest.ts"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ErrorController from "components/ErrorController/errorController.ts"
import { type EndPointResponse } from "types/common.ts"

import { fetchLanguageCatalogApi } from "api/languageCatalog.ts"
import { fetchLoginTextApi } from "api/loginTexts.ts"
import { defaultGeneralError, type GeneralError } from "types/models/generalError.ts"
import { fetchErrorMessage } from "api/errorMessages.ts"
import { waitFor } from "@testing-library/react"
import { errorMessagesMock2 } from "../mocks/errorMessagesMock.ts"

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
  },
  errorMessage: EndPointResponse = {
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
    errorMessage = await fetchErrorMessage("co", "es", "999")
  })

  it("Initializing ErrorController class", () => {
    new ErrorController({
      language,
      codeError: "999"
    })

    expect(ErrorController.codeError).toEqual("999")
    expect(ErrorController.language).toEqual(language)
  })

  it("Check if generalErrorInfo gets error text when code 999 or undefined", async () => {
    new ErrorController({
      language,
      codeError: "999"
    })

    const errorInfo = await ErrorController.getGeneralErrorInfo()

    expect(ErrorController.codeError).toEqual("999")
    expect(ErrorController.language).toEqual(language)
    expect(errorInfo.page).toBeTruthy()

    const errorInfoUndefined = await ErrorController.getGeneralErrorInfo()

    expect(errorInfoUndefined).toEqual(defaultGeneralError)
  })

  it("Test api call to get codeError", async () => {
    vi.spyOn(ErrorController, "getGeneralErrorInfo").mockImplementation(() => Promise.resolve(errorMessagesMock2))

    const generalInfo = await ErrorController.getGeneralErrorInfo()
    let response: GeneralError = {}
    if (errorMessage.response.error) {
      response = {
        ...errorMessage?.response?.error
      }
    }
    expect(response.page).toEqual(generalInfo.ispage)
  })

  it("Error controller displays ErrorModal component when page is true", async () => {
    errorMessage = await fetchErrorMessage("co", "es", "999")

    expect(errorMessage).toBeDefined()
    expect(errorMessage.response.page).toBeTruthy()
  })
  it("Error controller displays Alert component when page is false", async () => {
    languageCatalog = await fetchLanguageCatalogApi(language)
    viewTexts = await fetchLoginTextApi(language, "lm-qa-test")
    errorMessage = await fetchErrorMessage("co", "es", "A016")
    expect(errorMessage).toBeDefined()
    expect(errorMessage.response.page).toBeFalsy()
  })
})
