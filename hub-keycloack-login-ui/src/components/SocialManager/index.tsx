import { useEffect, useState } from "react"
import { getCookieByName, getFlag } from "@lm-tecnologias-interactivas-u/website-utils"
import { LoginProps } from "components/Templates/LifemilesLoginForm"
import { LoginFields } from "types/models/loginTexts"
//Components
import PasskeyButton from "components/PasskeyButton"
//Constants
import { microsite } from "../../constants"
//Stores
import { useAppStore } from "stores/app"
import { useMicrositeConfigsStore } from "stores/partnerConfigs"
//Styles
import styles from "./main.module.css"
//Types
import {
  PASSKEY_FLAG_PREFIX,
  PASSKEY_PROVIDER_ID,
  WEBAUTHN_PASSWORDLESS_AUTHENTICATOR,
  type AuthenticationSelection
} from "types/models/passkey"
//Utils
import { getBrandName } from "utils/common"
import { getProviderBtnGA, setProviderDateLogin } from "utils/GA360/login"
import { setHydraCookie } from "utils/cookies"
import { isPasskeySupported } from "utils/webauthn"

interface SocialManagerProps extends LoginProps {
  setRenderSocial: (val: boolean) => void
  /** Forwarded by `login.ftl` from Keycloak's `auth.authenticationSelections`. */
  authenticationSelections?: AuthenticationSelection[]
}

export interface Provider {
  alias: string
  displayName: string
  url: string
}
function SocialManager(props: SocialManagerProps) {
  const { setRenderSocial, errorCode, resetFlow } = props
  const keycloakConfig = useAppStore.getState().keycloakConfig
  const partnerId = keycloakConfig?.clientId
  const login_hint = keycloakConfig?.login_hint || getCookieByName("chn-stg") || "wst"
  const brandName = getBrandName(partnerId, login_hint)
  const [termsHtml, setTermsHtml] = useState("")
  /**
   * `undefined` while detection is in flight. The Passkey option stays hidden until we
   * have a definite `true`, so a slow or hostile browser never shows an option it cannot
   * honour (FR-2).
   */
  const [isPasskeyCapable, setIsPasskeyCapable] = useState<boolean | undefined>(undefined)
  const flagsConfig = useMicrositeConfigsStore((state) => state.configs?.flags)

  /**
   * Keycloak execution that corresponds to the WebAuthn Passwordless authenticator.
   * Matched on `providerId` rather than `displayName`, which is localized and would break
   * as soon as the user switches language.
   */
  const webAuthnSelection = props.authenticationSelections?.find(
    (selection) => selection?.providerId === WEBAUTHN_PASSWORDLESS_AUTHENTICATOR
  )

  /**
   * Per-client kill switch, following the existing flag convention in `views/App`. Lets
   * Passkey be disabled without a deploy and guarantees the other methods are untouched
   * (FR-7, NFR-3).
   */
  const isPasskeyFlagEnabled = Boolean(
    getFlag({
      id: "social-manager-view",
      micrositeName: microsite,
      functionality: `${PASSKEY_FLAG_PREFIX}${props.client_id}`,
      flagJson: flagsConfig?.config
    })
  )

  /**
   * All four conditions must hold: the flag is on, the browser can do it, Keycloak is
   * actually offering the authenticator in this flow, and the CMS has copy for it.
   */
  const isPasskeyAvailable = isPasskeyFlagEnabled && isPasskeyCapable === true && Boolean(webAuthnSelection?.authExecId)

  useEffect(() => {
    let isActive = true

    void isPasskeySupported().then((supported) => {
      if (isActive) setIsPasskeyCapable(supported)
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (errorCode && !resetFlow) {
      const hasError = errorCode !== null && errorCode !== "" && errorCode !== undefined
      setRenderSocial(!hasError)
    }
  }, [errorCode, resetFlow])

  useEffect(() => {
    const { hasContextualization, language, texts } = props
    const dataForm: LoginFields = texts as LoginFields
    let termsValue = ""

    if (hasContextualization) {
      termsValue = dataForm?.social_manager?.terms_and_conditions || ""
      setTermsHtml(termsValue)
    } else {
      //redirect to public webview
      termsValue = dataForm?.social_manager?.terms_and_conditions_mb || ""
      termsValue = termsValue.replaceAll(":lng", language || "es")
      termsValue = termsValue.replaceAll(":channel", "mbl")
      setTermsHtml(termsValue)
    }
  }, [props.hasContextualization])

  /**
   * Function that gets if the providerID is email an then redirects to the LMForm. If it's not then redirects to the providerUrl
   * You see the provider only if its configured in both butterCMS and in keycloack.
   * @param providerID
   * @param providerUrl
   */
  function buttonRedirect(providerID: string, providerUrl: string = "") {
    const loginMethod = providerID === "email" ? "lifemiles" : providerID
    getProviderBtnGA(brandName, loginMethod)
    setProviderDateLogin(brandName, loginMethod, "false", "false")
    setHydraCookie("loginMethod", "socialLogin")
    if (providerID == "email") {
      window.history.pushState({ view: "lifemiles-login-form" }, "", window.location.href)
      setRenderSocial(false)
    } else {
      window.location.href = providerUrl
    }
  }

  /**
   * Hands control to Keycloak's WebAuthn Passwordless authenticator.
   *
   * Passkey is not a federated identity provider, so there is no URL to redirect to.
   * Selecting an ALTERNATIVE execution in a Keycloak browser flow is done by POSTing
   * `authenticationExecution` to the flow's action URL — the same mechanism Keycloak's own
   * `select-authenticator.ftl` uses. Keycloak then renders the ceremony screen.
   *
   * A POST is required, so this builds and submits a form rather than assigning
   * `window.location.href`.
   */
  function selectPasskey() {
    const actionUrl = props.action_url
    const authExecId = webAuthnSelection?.authExecId

    // Defensive: the button is only rendered when both are present, but never post a
    // half-built form (SECURITY-15, fail closed).
    if (!actionUrl || !authExecId) return

    getProviderBtnGA(brandName, PASSKEY_PROVIDER_ID)
    setProviderDateLogin(brandName, PASSKEY_PROVIDER_ID, "false", "false")
    setHydraCookie("loginMethod", PASSKEY_PROVIDER_ID)

    const form = document.createElement("form")
    form.method = "POST"
    form.action = actionUrl
    form.style.display = "none"

    const executionField = document.createElement("input")
    executionField.type = "hidden"
    executionField.name = "authenticationExecution"
    executionField.value = authExecId
    form.appendChild(executionField)

    document.body.appendChild(form)
    form.submit()
  }

  return render()

  function render() {
    const { texts, providers } = props
    const dataForm: LoginFields = texts as LoginFields
    return (
      <div className={styles.socialManager_wrapper}>
        <div className={styles.socialManager_head}>
          <div className={styles.title} dangerouslySetInnerHTML={{ __html: dataForm?.social_manager?.title ?? "" }} />
          <div className={styles.description} dangerouslySetInnerHTML={{ __html: dataForm?.social_manager?.description ?? "" }} />
        </div>
        <div className={styles.socialManagerButtons}>
          {dataForm?.social_manager?.providers?.map((item, key) => {
            const keycloackProvider = providers?.find((provider: Provider) => provider.alias === item?.id)

            /*
             * Passkey needs its own branch: its id is not a Keycloak IdP alias, so the
             * original `keycloackProvider || item.id == "email"` guard would always hide it.
             * Its visibility is driven by capability detection, the feature flag, and
             * whether Keycloak is offering the authenticator at all.
             */
            if (item?.id === PASSKEY_PROVIDER_ID) {
              return (
                isPasskeyAvailable && (
                  <PasskeyButton key={key} provider={item} onSelect={selectPasskey} />
                )
              )
            }

            return (
              (keycloackProvider || item.id == "email") && (
                <a
                  data-cy={`${item?.id}Button`}
                  data-testid={`${item?.id}Button`}
                  key={key}
                  className={styles.buttons}
                  onClick={() => buttonRedirect(item?.id, keycloackProvider?.url)}
                >
                  <div className={styles.socialManagerIcon}>
                    {item?.logo && <img className={styles.icon} src={item?.logo} alt={`${item?.id} icon`} />}
                    {item?.logo_white && <img className={styles.iconWhite} src={item?.logo_white} alt={`${item?.id} icon white`} />}
                    <span>{item?.provider_name}</span>
                  </div>
                </a>
              )
            )
          })}
        </div>
        <div className={styles.socialManager_footer} dangerouslySetInnerHTML={{ __html: termsHtml }} />
      </div>
    )
  }
}

export default SocialManager
