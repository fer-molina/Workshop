import ReactDOM from "react-dom/client"
//Components
import { RootErrorBoundary } from "@lm-tecnologias-interactivas-c/website-components"
//Libraries
import "core-js/stable"
//Views
import App, { type AppProps } from "views/App"
import LoginSuccess, { type LoginSuccessProps } from "views/LoginSuccess"
import PasskeyAuthenticate from "views/PasskeyAuthenticate"
import PasskeyRegister from "views/PasskeyRegister"
import "./css/application-base.css"
//Types
import { type GeneralErrorWindow } from "types/models/generalError"
import { type PasskeyAuthenticateProps, type PasskeyRegisterProps } from "types/models/passkey"
window.dataLayer = window.dataLayer || []

window.renderLogin = (params: AppProps) => {
  const root = ReactDOM.createRoot(document.querySelector("#login") as Element)
  root.render(
    <RootErrorBoundary>
      <App {...params} />
    </RootErrorBoundary>
  )
}

window.renderLoginSuccess = (params: LoginSuccessProps) => {
  const root = ReactDOM.createRoot(document.querySelector("#success-login") as Element)
  root.render(
    <RootErrorBoundary>
      <LoginSuccess {...params} />
    </RootErrorBoundary>
  )
}

/**
 * Mount point for Keycloak's `webauthn-authenticate.ftl` (FR-5).
 * The template renders `<div id="passkey-authenticate">` plus the hidden form the view
 * fills in and submits.
 */
window.renderPasskeyAuthenticate = (params: PasskeyAuthenticateProps) => {
  const root = ReactDOM.createRoot(document.querySelector("#passkey-authenticate") as Element)
  root.render(
    <RootErrorBoundary>
      <PasskeyAuthenticate {...params} />
    </RootErrorBoundary>
  )
}

/**
 * Mount point for Keycloak's `webauthn-register.ftl` (FR-3).
 */
window.renderPasskeyRegister = (params: PasskeyRegisterProps) => {
  const root = ReactDOM.createRoot(document.querySelector("#passkey-register") as Element)
  root.render(
    <RootErrorBoundary>
      <PasskeyRegister {...params} />
    </RootErrorBoundary>
  )
}

window.renderGeneralError = (params: GeneralErrorWindow) => {
  const div = document.createElement("div")
  div.id = "generalError"
  document.body.appendChild(div)
  const root = ReactDOM.createRoot(document.querySelector("#generalError") as Element)
  root.render(
    <RootErrorBoundary>
      <App {...params} />
    </RootErrorBoundary>
  )
}
