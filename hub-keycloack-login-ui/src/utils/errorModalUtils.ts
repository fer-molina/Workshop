import { codeErrors, defaultPartner, callbackDomain } from "../constants"

/**
 * This function checks if is intelsat and responds the buttonUrl function or reload, else send the restar function provided by SPI
 * @param errorCode
 * @example: 10980
 *
 * @param buttonUrlContinue => Button url continue from CMS json generalError
 * @param restartFlow => Restart flow url sent from SPI
 * @param isIntelsat => Boolean that show if the wrkflow is intelsat or not
 *
 * @returns @param string with a resulting url callback function
 */

export interface Props {
  errorCode: string
  buttonUrlContinue: string
  restartFlow: string
  isIntelsat: boolean
  client_id: string
}

export function shouldInvertButtons(errorCode: string): boolean {
  const invertButtonErrors: any = codeErrors["inverse-button"]

  if (Array.isArray(invertButtonErrors)) {
    return invertButtonErrors.includes(errorCode)
  }

  return false
}

export function continueFunctionController(props: Props) {
  const { errorCode, isIntelsat, buttonUrlContinue, restartFlow, client_id } = props
  const target: any = codeErrors["button-callback"]
  let buttonCallbackError = false

  if (Array.isArray(target)) {
    if (isIntelsat) {
      buttonCallbackError = target.includes(errorCode)

      if (buttonCallbackError) {
        return buttonUrlContinue
      } else "reload"
    }
  }

  if (client_id == defaultPartner) {
    const nextUrl = buttonUrlContinue !== "" ? `${callbackDomain}${buttonUrlContinue}` : callbackDomain
    return nextUrl
  } else {
    return restartFlow
  }
}

export function hasGeneralErrorImage(image: string | undefined): boolean {
  const generalImages: any = codeErrors["generalErrorImages"]

  if (Array.isArray(generalImages)) {
    return generalImages.includes(image)
  }

  return false
}
