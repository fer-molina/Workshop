import { apiUrl, microsite } from "../constants"
import { fetchApiService } from "@lm-tecnologias-interactivas-u/website-utils"
//Types
import type { FlagData } from "types/models/flag"
import type { GeolocationModel } from "types/models/geolocation"
//Utils
import { getHourHash } from "src/utils/get-hash"

const endpoint = String(apiUrl?.strapi?.flagUrl || "")

export const { fetchApi: getFlagApi } = fetchApiService<FlagData>(endpoint, { initConfig: { cache: "no-store" }, responseConfig: { microsite } })

export const { fetchApi: getGeolocation } = fetchApiService<GeolocationModel>(String(apiUrl?.services?.geolocation), {
  initConfig: { cache: "no-store" },
  responseConfig: { microsite }
})
