import { createCircuitBreaker, fetchApiService, replaceTexts } from "@lm-tecnologias-interactivas-u/website-utils"
//constants
import { apiUrl, butterToken } from "../constants"
//stores
import { useMicrositeConfigsStore } from "stores/partnerConfigs"
//types
import type { BasicHeaderFooterData } from "types/models/basicHeaderFooter"

export async function fetchBasicHeaderFooterData(language: string) {
  const configs = useMicrositeConfigsStore.getState().configs
  const butterActive = configs?.flags?.config?.find((item) => item.id === "butter-active")
  const partner = "LM"

  const butterEndpoint = String(apiUrl.butter.basicHeaderFooter || "")
  const strapiEndpoint = String(apiUrl.strapi.basicHeaderFooter || "")

  const formattedButterEndpoint = replaceTexts(butterEndpoint, {
    language: language || "es",
    partner: partner.toLocaleUpperCase() || "LM",
    token: butterToken
  })
  const formattedStrapiEndpoint = replaceTexts(strapiEndpoint, {
    language: language || "es",
    partner: partner.toLocaleUpperCase() || "LM"
  })

  const { fetchApi: fetchButterOverviewTexts } = fetchApiService<BasicHeaderFooterData>(formattedButterEndpoint, {
    initConfig: { cache: "no-cache" }
  })
  const { fetchApi: fetchStrapiOverviewTexts } = fetchApiService<BasicHeaderFooterData>(formattedStrapiEndpoint, {
    initConfig: { cache: "no-cache" }
  })

  const basicHeaderFooterTextCircuitBreaker = createCircuitBreaker({
    primaryFetch: fetchButterOverviewTexts,
    secondaryFetch: fetchStrapiOverviewTexts,
    onlySecondary: !butterActive?.microsites?.[0]?.status
  })

  return await basicHeaderFooterTextCircuitBreaker()
}
