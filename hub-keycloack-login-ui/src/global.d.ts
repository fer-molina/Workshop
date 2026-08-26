import { AnyValue } from "types/common"
import type { CookieSettings, TemplatesConfig, ParameterKeycloak, FormPartners } from "types/models/envConfig"
import type { GeneralErrorWindow } from "types/models/generalError"
import type { PasskeyAuthenticateProps, PasskeyRegisterProps } from "types/models/passkey"
import { AppProps } from "views/App"

declare global {
  interface Window {
    renderLogin: (params: AppProps) => void
    renderLoginSuccess: (params: AppProps) => void
    renderGeneralError: (params: GeneralErrorWindow) => void
    renderPasskeyAuthenticate: (params: PasskeyAuthenticateProps) => void
    renderPasskeyRegister: (params: PasskeyRegisterProps) => void
    retrieveLoginInfo: (userName: string, mobilePassword: string) => void
    env: {
      hubKeycloackLogin: KeycloakLoginEnv
    }
    _gtmLoaded?: boolean
    dataLayer?: any[]
    google_tag_manager?: Record<string, unknown>
    ReactNativeWebView: {
      postMessage: (message: string) => void
    }
  }
  // const dataLayer: Record<string, unknown>[] = []
}

interface KeycloakLoginEnv {
  butterToken: string
  hydraDomain: string
  apis: AppEndpoints
  codeErrors: Record<string, Record<string, string>>
  cookieSettings: CookieSettings
  loginConfigurations: Record<string, AnyValue>
  imagesCms: string
  microsite: string
  templatesConfig: TemplatesConfig
  formPartners: FormPartners
  parameterKeycloak: ParameterKeycloak
  defaultPartner: string
  defaultErrorCode: string
  callbackDomain: string
  gtmKey: string
  adobetmUrl: string
}

interface AppEndpoints {
  strapi: StrapiEndpoints
  butter: ButterEndpoints
  services: ServiceEndpoints
}

interface ButterEndpoints {
  loginCMS: string
  partnerStyles: string
  codeErrorDescription?: string
  basicHeaderFooter: string
}

interface StrapiEndpoints extends ButterEndpoints {
  flagUrl: string
  loginCMS: string
  partnerStyles: string
  languageCatalog: string
  errorMessage: string
  basicHeaderFooter: string
}

interface ServiceEndpoints {
  geolocation: string
}
