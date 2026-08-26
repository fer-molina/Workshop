import { createCircuitBreaker, fetchApiService, replaceTexts } from "@lm-tecnologias-interactivas-u/website-utils"
//stores
// import { useAppStore } from "../stores/app"
//constants
import { apiUrl, butterToken, formPartners } from "../constants"
//stores
import { useMicrositeConfigsStore } from "stores/partnerConfigs"
//types
import type { LoginTextResponse } from "types/models/loginTexts"

export async function fetchLoginTextApi(language: string, clientId: string) {
  const partner = formPartners[clientId] || formPartners.default
  const configs = useMicrositeConfigsStore.getState().configs
  const butterActive = configs?.flags?.config?.find((item) => item.id === "butter-active")

  const butterEndpoint = String(apiUrl?.butter?.loginCMS || "")
  const strapiEndpoint = String(apiUrl?.strapi?.loginCMS || "")

  const formattedButterEndpoint = replaceTexts(butterEndpoint, {
    language: language || "es",
    partner: partner.toLocaleUpperCase(),
    butterToken: butterToken
  })
  const formattedStrapiEndpoint = replaceTexts(strapiEndpoint, {
    language: language || "es",
    partner: partner.toLocaleUpperCase()
  })

  const { fetchApi: fetchButterLoginTexts } = fetchApiService<LoginTextResponse>(formattedButterEndpoint, { initConfig: { cache: "no-cache" } })
  const { fetchApi: fetchStrapiLoginTexts } = fetchApiService<LoginTextResponse>(formattedStrapiEndpoint, {
    initConfig: { cache: "no-cache" }
  })
  const loginTextsCircuitBreaker = createCircuitBreaker({
    primaryFetch: fetchButterLoginTexts,
    secondaryFetch: fetchStrapiLoginTexts,
    onlySecondary: !butterActive?.microsites?.[0]?.status
  })

  return await loginTextsCircuitBreaker()
}
