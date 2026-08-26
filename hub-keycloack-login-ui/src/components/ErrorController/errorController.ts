import { defaultGeneralError, type GeneralError, type GeneralErrorWindow } from "types/models/generalError"
import type { Error } from "types/models/codeErrorDetails"
import type { EndPointResponse } from "types/common"
import { fetchErrorMessage } from "api/errorMessages"
import type { LoginFields } from "types/models/loginTexts"
//Constants
import { codeErrors, defaultErrorCode } from "../../constants"
import { isEmptyObject } from "@lm-tecnologias-interactivas-u/website-utils"
import { generalError, generalErrorAlert } from "src/errorTemplates"

class ErrorController {
  static codeList: Error[] = []
  static generalErrorInfo: GeneralError = {}
  static codeError: string | undefined
  static language: string
  static clientId: string | undefined
  static traceId: string | undefined

  //
  constructor(props: GeneralErrorWindow) {
    ErrorController.language = props.language || "es"
    ErrorController.codeError = props.codeError
    ErrorController.clientId = props.client_id
    ErrorController.traceId = props.traceId
  }

  static getGeneralErrorTemplate(loginTexts: LoginFields | undefined = undefined) {
    const alertError = this.getLoginTextErrorInfo(loginTexts)
    const isPage = isEmptyObject(alertError)
    const template = isPage ? generalError : generalErrorAlert
    const nextError = {
      ...template[(this.language as keyof typeof template) || "es"],
      page: isPage,
      errorCode: ErrorController.codeError || "C999",
      traceId: ErrorController.traceId
    }
    return nextError
  }

  static getLoginTextErrorInfo(loginTexts: LoginFields | undefined) {
    const error = loginTexts?.error_modal_info?.find((item) => item.code === ErrorController.codeError)
    return error
  }

  static async getGeneralErrorInfo(loginTexts: LoginFields | undefined = undefined) {
    let error = this.codeError || defaultErrorCode
    let isPartnerErrCode = false

    if (this.clientId && codeErrors[this.clientId]) {
      const partnerErrors = codeErrors[this.clientId]

      if (partnerErrors[error]) {
        error = partnerErrors[error]
        isPartnerErrCode = true
      }
    }

    if (loginTexts?.valid_error_codes && loginTexts?.valid_error_codes?.length > 0) {
      const isValidCode = loginTexts?.valid_error_codes?.some((item) => item.code === ErrorController.codeError)
      if (!isValidCode) error = defaultErrorCode
    }
    const response: EndPointResponse = await fetchErrorMessage("co", this.language || "es", error)

    const alertError = this.getLoginTextErrorInfo(loginTexts)
    if (response?.response?.error) {
      const nextError = {
        ...response?.response?.error,
        page: isEmptyObject(alertError),
        errorCode: isPartnerErrCode ? ErrorController.codeError : error,
        traceId: ErrorController.traceId,
        image: alertError?.image || response?.response?.error?.image
      }
      return nextError
    } else {
      return this.getGeneralErrorTemplate(loginTexts)
    }
  }
}

export default ErrorController
