// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Is required for an unknown parameter
export type AnyValue = any

export interface EndPointResponse {
  response: AnyValue
  status: number
  success?: boolean
  unauthorized?: boolean
}

export interface KeycloakConfig {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  codeChallengeMethod: string
  login_hint: string
}
