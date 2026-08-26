//Constants
import { apiUrl, microsite } from "../constants"
//Utils
import { fetchApiService, replaceTexts } from "@lm-tecnologias-interactivas-u/website-utils"
//Types
import type { GeneralError } from "types/models/generalError"

export async function fetchErrorMessage(country: string, language: string, errorCode: string) {
  const endpoint = String(apiUrl?.strapi?.errorMessage || "")

  const formattedStrapiEndpoint = replaceTexts(endpoint, { language, country, code: errorCode })
  const { fetchApi: getGeneralErrorText } = fetchApiService<GeneralError>(formattedStrapiEndpoint, {
    initConfig: { cache: "no-cache" },
    responseConfig: { microsite }
  })

  return await getGeneralErrorText()
}
