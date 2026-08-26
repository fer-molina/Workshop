import { apiUrl, butterToken, microsite } from "../constants"
import { createCircuitBreaker, fetchApiService, replaceTexts } from "@lm-tecnologias-interactivas-u/website-utils"
//types
import type { PartnerStylesResponse } from "types/models/partnerStyles"
//Utils
import { getHourHash } from "src/utils/get-hash"

export async function fetchPartnerStyles(language: string) {
  const partner = "LM"

  const butterActive = true

  const strapiEndpoint = String(apiUrl?.strapi?.partnerStyles || "")
  const butterEndpoint = String(apiUrl?.butter?.partnerStyles || "")

  const formmatedButterEndpoint = replaceTexts(butterEndpoint, { language, partner, token: butterToken })
  const formmatedStrapiEndpoint = replaceTexts(strapiEndpoint, { language, partner })

  const { fetchApi: fetchButterPartnerStyles } = fetchApiService<PartnerStylesResponse>(formmatedButterEndpoint, {
    initConfig: { cache: "no-cache" },
    responseConfig: { microsite }
  })
  const { fetchApi: fetchStrapiPartnerStyles } = fetchApiService<PartnerStylesResponse>(formmatedStrapiEndpoint, {
    initConfig: { cache: "no-cache" },
    responseConfig: { microsite }
  })

  const partnerStylesCircuitBreaker = createCircuitBreaker({
    primaryFetch: fetchButterPartnerStyles,
    secondaryFetch: fetchStrapiPartnerStyles,
    onlySecondary: !butterActive
  })

  return await partnerStylesCircuitBreaker()
}
