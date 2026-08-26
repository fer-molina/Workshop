import { getCookieByName } from "@lm-tecnologias-interactivas-u/website-utils"
//Configs
import { loginConfigurations } from "src/constants"
//Store
import { useMicrositeConfigsStore } from "stores/partnerConfigs"
import { useAppStore } from "stores/app"
//Utils
import { getDeviceInfo } from "utils/login"
import { getBrandName } from "utils/common"

export function getLogin(isBiometric?: boolean) {
  const geolication = useMicrositeConfigsStore.getState().configs?.geolocation
  const keycloakConfig = useAppStore.getState().keycloakConfig
  const partnerId = keycloakConfig?.clientId
  const language = useAppStore.getState().language
  const login_hint = keycloakConfig?.login_hint || getCookieByName("chn-stg") || "wst"
  const isAvianca = keycloakConfig?.clientId.includes("avianca") || keycloakConfig?.clientId.includes("av") || keycloakConfig?.clientId.includes("AV")
  const channel = keycloakConfig?.clientId == "intelsat" ? loginConfigurations?.channelType["intelsat"] : loginConfigurations?.channelType[login_hint]
  const content_language = `${language}-${geolication?.geolocation_data?.country_code_iso3166alpha2.toUpperCase()}`
  const deviceInfo = getDeviceInfo()
  const brandName = getBrandName(partnerId, login_hint)
  // const brandName = loginConfigurations?.brandNames[String(keycloakConfig?.clientId)] || "Lifemiles"

  const generalHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    ["X-LM-Channel"]: channel,
    ["X-LM-Se-Id"]: String(getCookieByName("sift-sessionID")),
    ["X-LM-Device-Type"]: loginConfigurations?.deviceType[login_hint],
    ["X-LM-Brand-Name"]: brandName,
    "X-LM-Os": getCookieByName("mbl-os") || deviceInfo?.os,
    "X-LM-Os-V": getCookieByName("mbl-osVersion") || deviceInfo?.osVersion,
    "X-LM-Dvc-Mfr": getCookieByName("mbl-deviceManufacturer") || deviceInfo?.deviceManufacturer,
    "X-LM-Dvc-Model": getCookieByName("mbl-deviceModel") || deviceInfo?.deviceModel,
    "X-LM-Dvc-Ui": getCookieByName("mbl-deviceUniqueId") || "",
    "X-LM-App-Name": getCookieByName("mbl-appName") || "",
    "X-LM-App-V": getCookieByName("mbl-appVersion") || "",
    "X-LM-App-Client-Lng": getCookieByName("mbl-appClientLanguage") || deviceInfo?.appClientLanguage,
    "X-LM-Usg": deviceInfo?.userAgent,
    "X-LM-Acc-Lng": deviceInfo?.appClientLanguage,
    "X-LM-Cn-Lng": content_language,
    "X-Biometric": isBiometric ? "true" : "false"
  }

  return JSON.stringify(generalHeaders)
}
