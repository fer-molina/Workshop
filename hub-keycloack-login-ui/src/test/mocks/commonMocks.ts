import { vi } from "vitest"
import { codeErrorDescriptionMock } from "./codeErrorDescription"
import { languageCatalogMock } from "./languageCatalog"
import { loginTextsMock } from "./loginTextsMock"
import { errorMessagesMock, errorMessagesMock2 } from "./errorMessagesMock"

vi.mock("@lm-tecnologias-interactivas-c/website-components", () => ({
  Input: vi.fn().mockReturnValue(vi.fn()),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Button: vi.fn().mockReturnValue(vi.fn()),
  BasicHeader: vi.fn().mockReturnValue(vi.fn()),
  BasicFooter: vi.fn().mockReturnValue(vi.fn()),
  IconResolver: vi.fn().mockReturnValue(vi.fn())
}))

vi.mock("../../api/codeErrorDescription.ts", () => ({
  fetchCodeErrorDescriptionApi: vi.fn().mockReturnValue({ response: codeErrorDescriptionMock, status: 200, success: true, unauthorized: false })
}))

vi.mock("../../api/errorMessages.ts", () => ({
  fetchErrorMessage: vi.fn().mockImplementation((country: string, language: string, errorCode: string | undefined) => {
    if (errorCode == undefined) {
      return {
        response: null
      }
    } else if (errorCode !== "A016") {
      return { response: errorMessagesMock, status: 200, unauthorized: false, error: true }
    } else {
      return { response: errorMessagesMock2, status: 200, unauthorized: false, error: true }
    }
  })
}))
vi.mock("../../api/languageCatalog.ts", () => ({
  fetchLanguageCatalogApi: vi.fn().mockReturnValue({ response: languageCatalogMock, status: 200, success: true, unauthorized: false })
}))

vi.mock("../../api/loginTexts.ts", () => ({
  fetchLoginTextApi: vi.fn().mockReturnValue({ response: loginTextsMock, status: 200, success: true, unauthorized: false })
}))
