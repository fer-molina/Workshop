import { microsite } from "src/constants"
import type { GeolocationModel } from "types/models/geolocation"
import type { GtmConfig } from "types/interfaces/errors/config"

interface Params {
  code?: number | string
  errorCode?: number | string
  description?: string
  microsite: string
  traceId?: string
}

interface FunctionParams {
  location: string
  error: Params
  gtmConfig: GtmConfig
  ipLocation?: any
  geolocation?: GeolocationModel
}

export async function generalErrorSpi({ location, error, gtmConfig, ipLocation, geolocation }: FunctionParams) {
  ipLocation = geolocation
  window?.dataLayer?.push({
    event: "errorFormSPI",
    microSite: microsite,
    site: gtmConfig.site,
    errorCode: error?.code ? error?.code : error?.errorCode,
    formName: gtmConfig.flow, //Valor estatico
    reason: error?.description,
    url: location,
    ipLocation: ipLocation?.ip_address,
    traceID: error?.traceId
  })
}
