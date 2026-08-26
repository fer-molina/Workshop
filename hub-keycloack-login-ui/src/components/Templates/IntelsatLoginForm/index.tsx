import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { Alert, Button, IconResolver, Input, Loader } from "@lm-tecnologias-interactivas-c/website-components"
import { getFlag, getCookieByName } from "@lm-tecnologias-interactivas-u/website-utils"
import classNames from "classnames"
//APi
import { getLogin } from "request/login"
//Constants
import { loginConfigurations, microsite } from "src/constants"
//Components
import SocialButton from "components/SocialButton"
//Types
import type { AlertDesign, LoginFields } from "types/models/loginTexts"
import type { FormValue, ResponseElementsForm } from "types/interfaces/form/common"
import { initForm, type LoginForm } from "types/interfaces/form/login"
import { type AppProps } from "views/App/index.tsx"
import type { GeneralError } from "types/models/generalError.ts"
//stores
import { useAppStore } from "stores/app"
import { useMicrositeConfigsStore } from "stores/partnerConfigs"
//Utils
import { fieldsValid } from "utils/form"
import { getProviderBtnGA, setProviderDateLogin } from "utils/GA360/login"
import { setHydraCookie } from "utils/cookies"
import { addUtmToParams, buildEmptyForm, getBrandName } from "utils/common"
//Styles
import styles from "./main.module.css"

interface LoginProps extends AppProps {
  texts?: LoginFields | undefined
  client_id?: string
  providers?: Provider[]
  loginUri?: string
  action_url?: string
  setError?: (errorData: ErrorInfo | undefined) => void
  errorInfo?: ErrorInfo
  handlerBackIntelsat?: (val: boolean) => void
}

interface ErrorInfo extends GeneralError, AlertDesign {}
export interface Provider {
  alias: string
  displayName: string
  url: string
}

export default function IntelsatLoginForm(props: LoginProps) {
  const STORAGE_KEY = "sms-otp-remaining-seconds"
  const LIFEMILES_USERNAME_STORAGE_KEY = "lifemiles-login-username"
  const location = window.location
  const keycloakConfig = useAppStore.getState().keycloakConfig
  const partnerId = keycloakConfig?.clientId
  const login_hint = keycloakConfig?.login_hint || getCookieByName("chn-stg") || "wst"
  const brandName = getBrandName(partnerId, login_hint)
  //Data States
  const [loginForm, setLoginForm] = useState<LoginForm | FormValue>(buildEmptyForm())
  const [updateRender, setUpdateRender] = useState<number>(0)
  const [headersData, setHeadersData] = useState("")
  //Logic States
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showHeader, setShowHeader] = useState(false)
  const [hasProviders, setHasProviders] = useState(false)
  const [skipSocialView, setSkipSocialView] = useState(true)
  //Store
  const setLoader = useAppStore((state) => state.setLoader)
  const flagsInfo = useMicrositeConfigsStore((state) => state.configs?.flags)
  //Refs
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const query = new URLSearchParams(decodeURIComponent(location.search))
    const usernameFromQuery = query.get("ftnum")
    const usernameFromSession = sessionStorage.getItem(LIFEMILES_USERNAME_STORAGE_KEY)
    const username = usernameFromQuery || usernameFromSession

    if (username) {
      const newForm = buildEmptyForm()

      newForm.username.change = true
      newForm.username.value = username
      newForm.username.valid = true

      setLoginForm(newForm)
      setUpdateRender((prev) => prev + 1)
    }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [props.errorCode])

  useEffect(() => {
    if (flagsInfo) {
      //validate param skipSocial from Enrollment | Reset password | Retrieve lm number
      const query = new URLSearchParams(decodeURIComponent(location.search))
      const skipSocialFromEnroll = query.get("skip_social") === "true"

      //validate flag as "skip-social-{client_id}"
      const prefixSocial = "skip-social-"
      const skipSocial = getFlag({
        id: "social-manager-view",
        micrositeName: microsite,
        functionality: `${prefixSocial}${props.client_id}`,
        flagJson: flagsInfo?.config || []
      })
      setSkipSocialView(skipSocial || skipSocialFromEnroll)
    }
  }, [flagsInfo])

  useEffect(() => {
    const { texts, providers } = props
    if (texts?.providers) {
      const hasProv = texts.providers.length > 0 && providers && providers.length > 0
      setHasProviders(Boolean(hasProv))
    }
  }, [props.texts, props.providers])

  /**
   * This function allows Applaudo Android App to communicate with website, just to make biometry to work.
   * @param {*} userName
   * @param {*} password
   */
  function retrieveLoginInfo(userName: string, mobilePassword: string) {
    setIsLoading(true)
    const newForm = loginForm as FormValue
    newForm["username"].change = true
    newForm["username"].value = userName
    newForm["username"].valid = true

    newForm["password"].change = true
    newForm["password"].value = mobilePassword
    newForm["password"].valid = true

    setLoginForm(newForm)

    setTimeout(() => {
      getProviderBtnGA(brandName, "lifemiles")
      setProviderDateLogin(brandName, "lifemiles", "false", "false")
      setHydraCookie("loginMethod", "lifemiles")

      setHeadersData(getLogin(true))

      setShowHeader(true)

      setTimeout(() => {
        document.querySelector("#kc-login")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      }, 100)
    }, 200)
  }

  window.retrieveLoginInfo = retrieveLoginInfo

  function decodeHtmlEntities(encodedStr: string): string {
    const txt = document.createElement("textarea")
    txt.innerHTML = encodedStr
    return txt.value
  }

  function handleRedirectEnrollment(baseUrl: string) {
    if (!baseUrl) return

    const { texts, loginUri } = props

    const url = new URL(baseUrl)

    if (loginUri) {
      const cleanLoginUri = loginUri.replace(/&amp;/g, "&")
      const loginUrl = new URL(cleanLoginUri)
      const params = loginUrl.searchParams

      const clientId = params.get("client_id")
      const partnerId = clientId
      const channel = loginConfigurations.channelType[clientId || "wst"]
      const redirectUri = params.get("redirect_uri")
      const state = params.get("state")
      const codeChallenge = params.get("code_challenge")
      const codeChallengeMethod = params.get("code_challenge_method")

      if (clientId) url.searchParams.set("client_id", clientId)
      if (partnerId) url.searchParams.set("partner_id", partnerId)
      if (channel) url.searchParams.set("channel", channel)
      if (redirectUri) url.searchParams.set("redirect_uri", redirectUri)
      if (state) url.searchParams.set("state", state)
      if (codeChallenge) url.searchParams.set("code_challenge", codeChallenge)
      if (codeChallengeMethod) url.searchParams.set("code_challenge_method", codeChallengeMethod)
    }

    if (texts?.utm?.source) url.searchParams.set("utm_source", texts.utm.source)
    if (texts?.utm?.medium) url.searchParams.set("utm_medium", texts.utm.medium)
    if (texts?.utm?.campaign) url.searchParams.set("utm_campaign", texts.utm.campaign)
    if (texts?.utm?.canal) url.searchParams.set("canal", texts.utm.canal)

    window.location.href = url.toString()
  }

  const ManualParseCreateAccount = ({ html }: { html: string }) => {
    const { texts, client_id } = props
    const regex = /<p[^>]*>(.*?)<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a><\/p>/
    const match = regex.exec(html)
    if (!match) return null

    const textBeforeLink = decodeHtmlEntities(match[1])
    let linkUrl = match[2]
    const linkText = decodeHtmlEntities(match[3])

    // checking if client_id has utm
    const utmConf = texts?.utm_config?.find((utm) => utm?.client_id === client_id)
    if (utmConf) {
      linkUrl = addUtmToParams(utmConf, match[2])
    }

    return (
      <div className={styles.buttonEnrollment}>
        <p>
          {textBeforeLink}
          <button
            data-cy="enrollmentButton"
            data-testid="enrollmentButton"
            type="button"
            onClick={() => handleRedirectEnrollment(linkUrl)}
            className={styles.linkButton}
          >
            {linkText}
          </button>
        </p>
      </div>
    )
  }

  function validateUsernameField(valid: boolean, response: ResponseElementsForm) {
    const { texts } = props

    const regex = texts?.fields[0]?.format.split("|") as string[]

    const lmNumber = new RegExp(regex[0])
    const isLmNumber = lmNumber.test(response.value)

    const onlyNumber = !Number.isNaN(Number(response.value))

    const user = new RegExp(regex[1])
    const isUser = user.test(response.value)

    const email = new RegExp(regex[2])
    const isEmail = email.test(response.value)

    let validate = valid

    if (onlyNumber && isLmNumber) {
      validate = true
    } else if (!onlyNumber && isUser) {
      validate = true
    } else if (isEmail) {
      validate = true
    } else {
      validate = false
    }

    const newForm = loginForm as FormValue
    newForm[response?.id].change = Boolean(response?.change)
    newForm[response?.id].value = response?.value
    newForm[response?.id].valid = validate

    setIsError(!fieldsValid(newForm, true))
    setLoginForm(newForm)
    setUpdateRender(updateRender + 1)
  }

  function validatePasswordField(valid: boolean, response: ResponseElementsForm) {
    const newForm = loginForm as FormValue
    newForm[response?.id].change = Boolean(response?.change)
    newForm[response?.id].value = response?.value
    newForm[response?.id].valid = valid

    setIsError(!fieldsValid(newForm, true))
    setLoginForm(newForm)
    setUpdateRender(updateRender + 1)
  }

  function sendToLogin() {
    const { texts } = props
    const dataForm: LoginFields = texts as LoginFields
    const newForm = loginForm as FormValue
    const validForm = fieldsValid(newForm, true)

    if (validForm) {
      sessionStorage.setItem(LIFEMILES_USERNAME_STORAGE_KEY, String(newForm.username.value))

      setLoader(true)
      getProviderBtnGA(brandName, "lifemiles")
      setProviderDateLogin(brandName, "lifemiles", "false", "false")
      setHydraCookie("loginMethod", "lifemiles")

      setHeadersData(getLogin())

      setShowHeader(true)

      setTimeout(() => {
        document.querySelector("#kc-login")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      }, 100)
    } else {
      // Mark empty required fields as changed and invalid so UI shows errors
      const usernameId = dataForm?.fields?.[0]?.id as keyof FormValue
      const passwordId = dataForm?.fields?.[1]?.id as keyof FormValue

      if (usernameId && newForm[usernameId]) {
        const isEmpty = !newForm[usernameId].value || String(newForm[usernameId].value).trim() === ""
        if (isEmpty) {
          newForm[usernameId].change = true
          newForm[usernameId].valid = false
        }
      }

      if (passwordId && newForm[passwordId]) {
        const isEmpty = !newForm[passwordId].value || String(newForm[passwordId].value).trim() === ""
        if (isEmpty) {
          newForm[passwordId].change = true
          newForm[passwordId].valid = false
        }
      }

      setIsError(!fieldsValid(newForm, true))
      setLoginForm(newForm)
      setUpdateRender(updateRender + 1)
    }
  }

  function handleEnterSubmit(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      sendToLogin()
    }
  }

  function handleBackClickIntelsat() {
    sessionStorage.removeItem("lifemiles-login-username")
    const { setError, handlerBackIntelsat } = props
    const propHandlerBack = handlerBackIntelsat
    const propSetError = setError
    setLoginForm(buildEmptyForm())
    setIsError(false)
    setShowHeader(false)
    setHeadersData("")
    setUpdateRender((prev) => prev + 1)
    if (propSetError) propSetError(undefined)
    if (propHandlerBack) propHandlerBack(true)
  }

  function render() {
    const { texts, action_url: actionUrl, errorInfo, rememberMe, handlerBackIntelsat, providers, showSocialButtons } = props

    const dataForm: LoginFields = texts as LoginFields
    return (
      <>
        {isLoading && <Loader />}
        <form
          id="kc-form-login"
          name="kc-form-login"
          ref={formRef}
          method="post"
          style={{ width: "100%", height: "auto" }}
          action={actionUrl}
          onKeyDown={handleEnterSubmit}
        >
          {!skipSocialView && (
            <div className={styles.backContainer}>
              <button
                data-cy={"app-back-btn"}
                data-testid={"app-back-btn"}
                type="button"
                className={styles.backIntelsat}
                onClick={handleBackClickIntelsat}
              >
                <IconResolver url={dataForm?.back_icon ?? ""} iconColor="#1B1B1B" width="16px" height="16px" />
                <span className={styles.backIntelsat_label}>{dataForm?.return_label || "Volver"}</span>
              </button>
            </div>
          )}
          <div className={classNames(styles.loginDivIntelsat, { [styles.errorDivIntelsat]: isError })}>
            <div className={styles.titleIntelsat} dangerouslySetInnerHTML={{ __html: dataForm?.title }} />
            {errorInfo && !errorInfo.page && (
              <Alert
                styles={styles.alertStyle}
                title={errorInfo?.title}
                description={errorInfo?.description}
                borderColor={"transparent"}
                icon={errorInfo?.image}
                titleColor={errorInfo?.text_color}
                background={errorInfo?.background_color}
                colorDescription={errorInfo?.text_color}
              />
            )}
            <Input
              tabIndex={1}
              data-cy={dataForm?.fields?.[0]?.id}
              data-testid={dataForm?.fields?.[0]?.id}
              id={dataForm?.fields?.[0]?.id}
              name={dataForm?.fields?.[0]?.id}
              value={loginForm?.username?.value}
              type={dataForm?.fields?.[0]?.type}
              label={dataForm?.fields?.[0]?.label}
              placeholder={dataForm?.fields?.[0]?.placeholder}
              autoComplete="webauthn"
              required={dataForm?.fields?.[0]?.required}
              requiredError={dataForm?.fields?.[0]?.requirederror}
              data-error={true}
              iconError={dataForm?.fields?.[0]?.icon_error}
              onValidation={validateUsernameField}
              errorCustome={loginForm?.username?.change && !loginForm?.username?.valid}
              errorcustomeMessage={loginForm?.username.value !== "" ? dataForm?.fields?.[0]?.requirederror : dataForm?.fields?.[0]?.regexerror}
              defaultValue={dataForm?.fields?.[0]?.defaultvalue}
              disabled={dataForm?.fields?.[0]?.disabled}
              readOnly={dataForm?.fields?.[0]?.readonly}
              helperText={dataForm?.fields?.[0]?.helpertext}
              tooltip={dataForm?.fields?.[0]?.tooltip}
              tooltipImg={dataForm?.fields?.[0]?.tooltipimage}
              startIconColor={dataForm?.fields?.[0]?.start_icon_color}
              startIconUrl={dataForm?.fields?.[0]?.start_icon_url}
            />
            <Input
              tabIndex={2}
              data-cy={dataForm?.fields?.[1]?.id}
              data-testid={dataForm?.fields?.[1]?.id}
              id={dataForm?.fields?.[1]?.id}
              name={dataForm?.fields?.[1]?.id}
              value={loginForm?.password?.value}
              type={dataForm?.fields?.[1]?.type}
              label={dataForm?.fields?.[1]?.label}
              placeholder={dataForm?.fields?.[1]?.placeholder}
              autoComplete="webauthn"
              iconEyes={{ hide: dataForm?.password_hide_icon, show: dataForm?.password_show_icon }}
              required={dataForm?.fields?.[1]?.required}
              requiredError={dataForm?.fields?.[1]?.requirederror}
              iconError={dataForm?.fields?.[1]?.icon_error}
              regex={dataForm?.fields?.[1]?.format}
              regexError={dataForm?.fields?.[1]?.regexerror}
              onValidation={validatePasswordField}
              errorCustome={loginForm?.password?.change && !loginForm?.password?.valid}
              errorcustomeMessage={loginForm?.password.value !== "" ? dataForm?.fields?.[1]?.requirederror : dataForm?.fields?.[1]?.regexerror}
              defaultValue={dataForm?.fields?.[1]?.defaultvalue}
              disabled={dataForm?.fields?.[1]?.disabled}
              readOnly={dataForm?.fields?.[1]?.readonly}
              helperText={dataForm?.fields?.[1]?.helpertext}
              tooltip={dataForm?.fields?.[1]?.tooltip}
              tooltipImg={dataForm?.fields?.[1]?.tooltipimage}
              startIconColor={dataForm?.fields?.[1]?.start_icon_color}
              startIconUrl={dataForm?.fields?.[1]?.start_icon_url}
            />
            {showHeader && <input type="hidden" name="login-headers" value={headersData} />}
            <input type="hidden" id="rememberMe" name="rememberMe" value={String(rememberMe)} />
            <button id="kc-login" name="login" style={{ display: "none" }} />
            <Button
              id="login-button"
              tabIndex={3}
              type="button"
              data-cy={"lmSubmit"}
              data-testid={"lmSubmit"}
              buttonStyles={{
                width: "auto",
                height: "52px",
                padding: "0  24px",
                borderRadius: "32px",
                fontSize: "20px",
                fontWeight: "700",
                border: `2px solid ${texts?.button_style?.bordercolor || "white"}`,
                color: texts?.button_style?.textcolor || "white",
                backgroundColor: texts?.button_style?.backgroundcolor || "transparent",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              wrapperClasses={styles.buttonLoginWrapperIntelsat}
              handleClick={sendToLogin}
            >
              {dataForm?.button_label}
            </Button>

            <ManualParseCreateAccount html={dataForm?.create_account ?? ""} />

            <div className={styles.termsAndConditionsIntelsat}>
              <p dangerouslySetInnerHTML={{ __html: dataForm?.terms_and_conditions ?? "" }} />
            </div>

            {showSocialButtons && hasProviders && (
              <>
                <div className={styles.loginBoxWrapperIntelsat}>
                  <div className={styles.loginBoxIntelsat}>
                    <span className={styles.loginTextIntelsat}>{dataForm?.separator}</span>
                  </div>
                </div>
                <SocialButton providers={providers} texts={texts} />
              </>
            )}
          </div>
        </form>
      </>
    )
  }

  return render()
}
