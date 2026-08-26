import type { FlagData } from "./flag"
import type { GeolocationModel } from "./geolocation"
import type { SEOData } from "./seo"

export interface ConfigsData {
  flags?: FlagData
  partner?: string
  geolocation?: GeolocationModel
  seo?: SEOData
  butterActive?: boolean
}

export interface AkamaiConfig {
  statusApi: StatusApi
  errorMessage: ErrorMessage
}

interface ErrorMessage {
  en: Message
  es: Message
}

interface Message {
  code: string
  page: boolean
  image: string
  title: string
  description: string
  buttonUrlCancel: string
  buttonTextCancel: string
  buttonCancelClose: boolean
  buttonUrlContinue: string
  buttonTextContinue: string
}

interface StatusApi {
  error?: number[]
  header: Header
  success: number[]
  validate: number[]
  autorization: number[]
}

interface Header {
  key: string
  value: string
}
