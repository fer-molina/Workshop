//Configs
import { defaultPartner, loginConfigurations } from "../constants"
//Types
import type { LanguageCatalog, LanguageItem } from "types/models/languageCatalog"
import type { LoginForm } from "types/interfaces/form/login"
import type { UtmConfig } from "types/models/loginTexts"

export function getCatalogLanguageByPartner(languages: LanguageCatalog, client_id: string): LanguageItem[] {
  let response: LanguageItem[] | [] = []

  Object.entries(languages).forEach(([key, value]) => {
    if (value?.partners?.includes(client_id) && response.length === 0) {
      response = value.items
    } else if (value?.partners?.includes(defaultPartner) && response.length === 0) {
      response = value.items
    }
  })

  return response
}

export function getBrandName(partner_id?: string, login_hint?: string) {
  const brandNames = loginConfigurations?.brandNames || {}

  if (login_hint === "mbl") {
    return brandNames.mobile
  }

  if (partner_id && brandNames[partner_id]) {
    return brandNames[partner_id]
  }

  return brandNames.default
}

export function buildEmptyForm(): LoginForm {
  return {
    username: {
      value: "",
      change: false,
      valid: false
    },
    password: {
      value: "",
      change: false,
      valid: false
    }
  }
}

export function isMobile(login_hint: string) {
  return login_hint === "mbl"
}

export function addUtmToParams(utm_config: UtmConfig, baseurl: string) {
  const queryParams = new URLSearchParams()

  let linkUrl = baseurl
  const utmSource = utm_config?.source
  const utmMedium = utm_config?.medium
  const utmCampaign = utm_config?.campaign
  const utmCanal = utm_config?.canal

  if (utmSource) queryParams.set("utm_source", utmSource)
  if (utmMedium) queryParams.set("utm_medium", utmMedium)
  if (utmCampaign) queryParams.set("utm_campaign", utmCampaign)
  if (utmCanal) queryParams.set("utm_canal", utmCanal)

  const queryString = queryParams.toString()
  linkUrl = queryString ? `${baseurl}?${queryString}` : baseurl
  return linkUrl
}

export function replaceWebviewUrl(domain: string, code: string, language: string) {
  const baseUrl = `${domain}/sso-flux-public/:code/:lng/:channel`
  let webviewUrl = baseUrl.replace(":code", code)
  webviewUrl = webviewUrl.replace(":lng", language || "es")
  webviewUrl = webviewUrl.replace(":channel", "mbl")
  return webviewUrl
}
