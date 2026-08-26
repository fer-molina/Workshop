import { useEffect, useRef, useState } from "react"
import { Loader } from "@lm-tecnologias-interactivas-c/website-components"
import { getFlag, replaceTexts } from "@lm-tecnologias-interactivas-u/website-utils"
//Apis
import { fetchLoginTextApi } from "api/loginTexts"
import { fetchLanguageCatalogApi } from "api/languageCatalog"
import { fetchPartnerStyles } from "api/partnerStyles"
import { getFlagApi, getGeolocation } from "api/app"
//Configs
import { microsite, templatesConfig } from "../../constants"
//Constants
import LoginLayout from "components/LoginLayout"
//Components
import IntelsatLoginForm from "components/Templates/IntelsatLoginForm"
import LifemilesLoginForm, { type ErrorInfo, type Provider } from "components/Templates/LifemilesLoginForm"
import ErrorModal from "components/ErrorModal"
import ErrorController from "components/ErrorController/errorController.ts"
import SocialManager from "components/SocialManager"
//stores
import { useAppStore } from "stores/app"
import { useMicrositeConfigsStore } from "stores/partnerConfigs"
//Types
import type { AnyValue, EndPointResponse, KeycloakConfig } from "types/common"
import type { PartnerFonts, Fields } from "src/types/models/partnerStyles"
import type { LoginFields } from "types/models/loginTexts"
import type { LanguageItem } from "types/models/languageCatalog"
import type { GeolocationModel } from "types/models/geolocation"
import type { AuthenticationSelection } from "types/models/passkey"
//Utils
import { getCatalogLanguageByPartner, isMobile } from "utils/common"
import { addGtmScript, addGtmNoScript, addadobetmUrlScript } from "utils/GA360/googleTagManager"
import { addSiftScript } from "utils/siftScript"
import { setHydraCookie } from "utils/cookies"
import { generalErrorSpi } from "utils/ga"
import { getGtmConfig } from "utils/fetchConfig"
import { getLocalStorage, saveLocalStorage } from "utils/localStorage"

const LIFEMILES_USERNAME_STORAGE_KEY = "lifemiles-login-username"

interface FontObject {
  src: string
  "font-family": string
  "font-display"?: FontDisplay
  "font-style"?: string
  "font-weight"?: string
}

interface FontFaceInfo {
  rootFamilyName: string
  fontFamily: string
}

export interface AppProps {
  [key: string]: any
  client_id?: string
  providers?: Provider[]
  language?: string
  loginUri?: string
  action_url?: string
  errorCode?: string
  restartFlow?: string
  /**
   * Keycloak's `auth.authenticationSelections`, forwarded by `login.ftl`. Needed so the
   * Passkey option can post the right `authenticationExecution` (FR-1).
   */
  authenticationSelections?: AuthenticationSelection[]
  showSocialButtons?: boolean
  rememberMe?: boolean
  handlerBackLm?: (val: boolean) => void
  handlerBackIntelsat?: (val: boolean) => void
}

function App(props: AppProps) {
  //Logic States
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [renderContent, setRenderContent] = useState(false)
  const [showLanguageSection, setShowLanguageSection] = useState(false)
  const [languageCatalog, setLanguageCatalog] = useState<LanguageItem[]>()
  const [showSocialManager, setShowSocialManager] = useState(false)
  const [showSocialButtons, setShowSocialButtons] = useState(true)
  const [resetFlow, setResetFlow] = useState(false)
  const [hasContextualization, setHasContextualization] = useState(true)
  //Data States
  const [loginTexts, setLoginTexts] = useState<LoginFields>()
  const [fontFacesInfo, setFontFacesInfo] = useState<FontFaceInfo[]>([])
  const [error, setError] = useState<ErrorInfo>()
  //Store
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const loader = useAppStore((state) => state.loader)
  const setLoader = useAppStore((state) => state.setLoader)
  const setKeycloakConfig = useAppStore((state) => state.setKeycloakConfig)
  const updateConfigs = useMicrositeConfigsStore((state) => state.updateConfigs)
  const geoInfo = useMicrositeConfigsStore((state) => state.configs?.geolocation)

  useEffect(() => {
    addGtmScript()
    addGtmNoScript()

    const adobetmInterval = setInterval(() => {
      if (window._gtmLoaded === true) {
        const ok = addadobetmUrlScript()
        if (ok) clearInterval(adobetmInterval)
      }
    }, 100)

    return () => clearInterval(adobetmInterval)
  }, [])

  useEffect(() => {
    //Seteo de Lenguaje
    setLanguage(props?.language || "es")
    setHydraCookie("lng-stg", props?.language || "es")

    void getPartnerStyles(props?.language || "es")
    void getLanguageCatalog(props?.language || "es")
    void getGeolicationApi()
    void getFlags()
  }, [])

  const prevLanguage = useRef(language)
  useEffect(() => {
    if (prevLanguage.current !== language && loginTexts) {
      void getPartnerStyles(language)
      void getLanguageCatalog(language)
      void getLoginTexts(language)
    }
    prevLanguage.current = language
  }, [language])

  const prevLoader = useRef(loader)
  useEffect(() => {
    if (prevLoader.current !== loader) {
      setIsLoading(loader)
    }
    prevLoader.current = loader
  }, [loader])

  useEffect(() => {
    if (loginTexts) {
      if (props.errorCode) {
        const generalErrorFunc = async () => {
          const { errorCode, client_id, traceId } = props
          setIsLoading(true)

          if (errorCode) {
            new ErrorController({ language, codeError: errorCode, client_id, traceId })
            return await ErrorController.getGeneralErrorInfo(loginTexts)
          }
        }

        generalErrorFunc()
          .then((errorController) => {
            const { gtmConfig } = getGtmConfig("LM")
            void generalErrorSpi({
              location: window.location.pathname,
              error: errorController as any,
              gtmConfig: gtmConfig as any,
              geolocation: geoInfo
            })
            setError({ ...errorController, ...loginTexts?.alertdesign })
            setIsLoading(false)
          })
          .catch(() => {
            throw new Error("Couldn't get Error Info")
          })

        setRenderContent(true)
      } else {
        setRenderContent(true)
      }
    }
  }, [props.errorCode, loginTexts])

  useEffect(() => {
    const handleBrowserBack = () => {
      if (!showSocialManager) {
        sessionStorage.removeItem(LIFEMILES_USERNAME_STORAGE_KEY)
        setError(undefined)
        handleResetForm(true)
      }
    }

    window.addEventListener("popstate", handleBrowserBack)

    return () => window.removeEventListener("popstate", handleBrowserBack)
  }, [showSocialManager])

  useEffect(() => {
    const { loginUri } = props
    if (loginUri) {
      const cleanLoginUri = loginUri.replace(/&amp;/g, "&")
      const urlObject = new URL(cleanLoginUri)
      const params = urlObject.searchParams
      const login_hint = params.get("login_hint")
      //saving login hint in local storage
      if (login_hint) {
        saveLocalStorage("channel", login_hint?.split(",")[0] || "wst")
      }

      const keycloakConfig = {
        login_hint: login_hint?.split(",")[0],
        clientId: params.get("client_id"),
        redirectUri: params.get("redirect_uri"),
        state: params.get("state"),
        codeChallenge: params.get("code_challenge"),
        codeChallengeMethod: params.get("code_challenge_method")
      }

      const channel = login_hint?.split(",")[0] !== "mbl" ? "wst" : login_hint?.split(",")[0]

      setHydraCookie("chn-stg", channel)
      setKeycloakConfig(keycloakConfig as KeycloakConfig)
    }
  }, [props?.loginUri])

  async function getGeolicationApi() {
    const geolocation = await getGeolocation()
    if (geolocation.success) {
      updateConfigs({ geolocation: geolocation.response as GeolocationModel })
    }
  }

  async function getFlags() {
    const flags: EndPointResponse = await getFlagApi()
    if (flags.success) {
      updateConfigs({ flags: flags.response })

      const showLng = getFlag({
        id: "basic-header-show-lng-section",
        micrositeName: microsite,
        functionality: "",
        flagJson: flags?.response?.config
      })
      setShowLanguageSection(Boolean(showLng))

      //validate prefix skip-social-{client_id} to show social manager
      const prefixSocial = "skip-social-"
      const skipSocial = getFlag({
        id: "social-manager-view",
        micrositeName: microsite,
        functionality: `${prefixSocial}${props.client_id}`,
        flagJson: flags?.response?.config
      })

      //validate param skipSocial from Enrollment | Reset password | Retrieve lm number
      const query = new URLSearchParams(decodeURIComponent(location.search))
      const skipSocialFromEnroll = query.get("skip_social") === "true"

      //validate prefix skip-social-{client_id} to show social buttons
      const prefixSocialBtn = "show-social-buttons-"
      const showSocialBtns = getFlag({
        id: "social-manager-view",
        micrositeName: microsite,
        functionality: `${prefixSocialBtn}${props.client_id}`,
        flagJson: flags?.response?.config
      })
      setShowSocialManager(!skipSocial && !skipSocialFromEnroll)
      setShowSocialButtons(showSocialBtns)

      const payload = {
        id: "multifactor-auth",
        micrositeName: microsite,
        functionality: "sift-js-downloading",
        flagJson: flags?.response?.config
      }
      const value = getFlag(payload)
      if (value) {
        addSiftScript()
      }
    }

    void getLoginTexts(props?.language || "es")
  }

  async function getLoginTexts(lang: string) {
    const { client_id } = props
    const loginTexts: EndPointResponse = await fetchLoginTextApi(lang || "es", client_id as string)
    if (loginTexts.success) {
      //texts successfully fetched
      const loginResponse = loginTexts?.response?.data ? loginTexts?.response?.data[0]?.fields : {}
      setLoginTexts(loginResponse)
    }
    setLoader(false)
  }

  async function getLanguageCatalog(lang: string) {
    const { client_id } = props

    const languageCatalog: EndPointResponse = await fetchLanguageCatalogApi(lang || "es")
    if (languageCatalog.success) {
      //texts successfully fetched
      //revisar como obtener el partner
      const catalogResponse: LanguageItem[] = getCatalogLanguageByPartner(languageCatalog?.response, client_id as string)
      setLanguageCatalog(catalogResponse)
    }
  }

  function backgroundByPathname(value: AnyValue) {
    for (const background of value) {
      if (background.path === location.pathname) {
        const root = document.querySelector("#root") as HTMLElement | null
        if (root) root.style.backgroundColor = background.backgroundcolor
      }
    }
  }

  function safeRegisterProperty(property: { name: string; syntax: string; inherits: boolean; initialValue: string }) {
    try {
      window?.CSS?.registerProperty(property)
    } catch (error) {
      // Si ya está registrada, ignoramos el error
      if (!(error instanceof DOMException && error.name === "InvalidModificationError")) {
        throw error
      }
    }
  }

  function stylesByTags(value: AnyValue) {
    for (const tagValue of value) {
      const tag = document.querySelector(`.${tagValue?.tagname}`) as HTMLElement

      if (tag) {
        const properties = tagValue?.tagstyle?.split(";")
        for (const property of properties) {
          const [key, value] = property.split(":")

          tag.style.setProperty(key, value)
        }
      }
    }
  }

  async function getPartnerStyles(lang: string) {
    const partnerStylesResponse = await fetchPartnerStyles(lang)
    if ("data" in partnerStylesResponse.response) {
      let fontBaseUrl = ""
      const partner = "LM" //obtener partner de endpoint
      let partnerFonts: PartnerFonts = {}
      const fieldsObj: Fields = partnerStylesResponse.response?.data?.[0]?.fields || {}

      const channel = getLocalStorage("channel")
      if (isMobile(String(channel))) {
        setHasContextualization(false)
      } else {
        const hasContext = fieldsObj?.hidenavigationclients?.findIndex((item) => item.id === props?.client_id)
        setHasContextualization(hasContext == -1)
      }

      // Se procesan basefontsurl y partnerfonts
      if ("basefontsurl" in fieldsObj && typeof fieldsObj.basefontsurl === "string") {
        fontBaseUrl = fieldsObj.basefontsurl
      }
      if ("partnerfonts" in fieldsObj) {
        partnerFonts = (fieldsObj.partnerfonts as PartnerFonts[]).find((partnerFont) => partnerFont.partner === partner) || ({} as PartnerFonts)
      }

      // Se procesan el resto de estilos
      for (const [fields, value] of Object.entries(fieldsObj)) {
        if (fields === "fonts") {
          if (typeof value === "string") continue

          const fontsPrefix = Object.keys(partnerFonts).filter((key) => !key.includes("partner"))

          // Filtrar los tipos de fuentes en base a los valores de los partnerFonts
          const filteredFonts = (value as FontObject[]).filter((font) =>
            fontsPrefix.some((prefix) => {
              const fontValue = partnerFonts[prefix as keyof PartnerFonts]

              return fontValue && font?.["font-family"]?.toLowerCase().includes(fontValue.toLowerCase())
            })
          )

          // Se procesan los tipos de fuentes
          for (const fonts of filteredFonts) {
            const fontTypeName = fonts?.["font-family"]?.toLocaleLowerCase()?.split("-")

            const formmatedName = fontTypeName.length > 1 ? fontTypeName[fontTypeName.length - 1] : ""

            const fontType = fontsPrefix.find((prefix) => {
              const fontValue = partnerFonts[prefix as keyof PartnerFonts]
              return fontValue && fonts?.["font-family"]?.toLowerCase().includes(fontValue.toLowerCase())
            })

            const rootFamilyName = `--font-${fontType || "landing"}${formmatedName ? "-" + formmatedName : ""}`

            const fontUrl = replaceTexts(fonts?.src, { baseUrl: fontBaseUrl })

            const fontFace = new FontFace(fonts?.["font-family"], `url(${fontUrl})`, {
              display: fonts?.["font-display"] || "swap",
              style: fonts?.["font-style"] || "normal",
              weight: fonts?.["font-weight"] || "400"
            })

            void fontFace.load().then((loadedFonts) => {
              document.fonts.add(loadedFonts)

              setFontFacesInfo((prev) => [...prev, { rootFamilyName, fontFamily: fonts?.["font-family"] }])
            })
          }
        }

        // Se procesan los estilos por tags
        if (fields === "stylesbytags") stylesByTags(value)

        if (typeof value === "object" && !fields.includes("partner") && window?.CSS) {
          if (fields.includes("fonts")) continue

          // Se procesan los colores
          for (const [cKey, color] of Object.entries(value)) {
            if (String(color)?.includes("#")) {
              safeRegisterProperty({
                name: `--${cKey}`,
                syntax: "<color>",
                inherits: true,
                initialValue: String(color)
              })
            }
          }

          // Se procesan los fondos
          if (typeof value === "object" && fields.includes("backgrounds")) backgroundByPathname(value)
        }
      }
    }
  }

  function handleResetForm(val: boolean) {
    setShowSocialManager(val)
    setResetFlow(true)
  }

  function renderForm() {
    return (
      <>
        {{
          [templatesConfig.wlm]: (
            <LifemilesLoginForm
              texts={loginTexts}
              {...props}
              isPage={error?.page}
              errorInfo={error}
              showSocialButtons={showSocialButtons}
              setError={(errorData?: ErrorInfo) => setError(errorData)}
              hasContextualization={hasContextualization}
              handlerBackLm={(val: boolean) => {
                handleResetForm(val)
              }}
            />
          ),
          [templatesConfig.intelsat]: (
            <IntelsatLoginForm
              texts={loginTexts}
              {...props}
              errorInfo={error}
              showSocialButtons={showSocialButtons}
              setError={(errorData?: ErrorInfo) => setError(errorData)}
              hasContextualization={hasContextualization}
              handlerBackIntelsat={(val: boolean) => {
                handleResetForm(val)
              }}
            />
          )
        }[props?.client_id || ""] || (
          <LifemilesLoginForm
            texts={loginTexts}
            {...props}
            errorInfo={error}
            hasContextualization={hasContextualization}
            showSocialButtons={showSocialButtons}
            setError={(errorData?: ErrorInfo) => setError(errorData)}
            handlerBackLm={(val: boolean) => {
              handleResetForm(val)
            }}
          />
        )}
      </>
    )
  }

  function renderLoginForm() {
    return showSocialManager ? (
      <SocialManager
        texts={loginTexts}
        {...props}
        hasContextualization={hasContextualization}
        isPage={error?.page}
        errorInfo={error}
        resetFlow={resetFlow}
        setError={(errorData?: ErrorInfo) => setError(errorData)}
        setRenderSocial={(val: boolean) => setShowSocialManager(val)} // FormComponent={() => renderForm()}
      />
    ) : (
      renderForm()
    )
  }

  return (
    <>
      {isLoading && <Loader />}
      {error && error?.page && (
        <ErrorModal
          {...error}
          /*errorCode={props.errorCode}*/ restartFlow={props.restartFlow}
          client_id={props.client_id}
          showLanguageSection={showLanguageSection}
          hasContextualization={hasContextualization}
        />
      )}
      {renderContent && !error?.page && (
        <LoginLayout
          showLanguageSection={showLanguageSection}
          loginTexts={loginTexts}
          languageCatalog={languageCatalog as LanguageItem[]}
          isErrorPage={error?.page}
          hasContextualization={hasContextualization}
        >
          {renderLoginForm()}
        </LoginLayout>
      )}
    </>
  )
}

export default App
