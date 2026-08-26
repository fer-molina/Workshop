import { useAppStore } from "stores/app"
import { getCookieByName } from "@lm-tecnologias-interactivas-u/website-utils"

interface GtmConfig {
  flow: string
  ip?: string
  site: string
  subCategory?: string
}

interface AkamaiConfigResponse {
  AkamaiConfig?: any
  gtmConfig: GtmConfig
}

/**
 * Obtiene la configuración de Akamai y GTM para las peticiones
 * @param site - Sitio (ej: "LM")
 * @param subCategory - Subcategoría opcional (ej: "2FA")
 * @returns Objeto con AkamaiConfig y gtmConfig
 */

export function getAkamaiConfig(site: string, subCategory?: string): AkamaiConfigResponse {
  const gtmConfig = getGtmConfig(site, subCategory)
  const akamaiConfig = useAppStore.getState().configs?.akamaiConfig

  return {
    AkamaiConfig: akamaiConfig,
    ...gtmConfig
  }
}

/**
 * Obtiene la configuración de GTM
 * @param site - Sitio (ej: "LM")
 * @param subCategory - Subcategoría opcional (ej: "2FA")
 * @returns Objeto con gtmConfig
 */
export function getGtmConfig(site: string, subCategory?: string): { gtmConfig: GtmConfig } {
  const geolocation = useAppStore.getState().configs?.geolocation
  const ip = geolocation?.ip_address

  const gtmConfig: GtmConfig = {
    flow: "login-spi",
    ip,
    site
  }

  if (subCategory) {
    gtmConfig.subCategory = subCategory
  }

  return { gtmConfig }
}
