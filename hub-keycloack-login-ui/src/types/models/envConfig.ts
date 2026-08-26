export interface CookieSettings {
  path: string
  secure: boolean
  sameSite: string
  expires?: Date
  domain: string
}

export interface TemplatesConfig {
  [key: string]: string
}

export interface FormPartners {
  [key: string]: string
}

export interface ParameterKeycloak {
  language: string
}
