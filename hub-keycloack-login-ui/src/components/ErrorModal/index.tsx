import React, { useEffect, useRef, useState } from "react"
import { Button, SuccessOrErrorComponent } from "@lm-tecnologias-interactivas-c/website-components"
//Api
import { fetchLanguageCatalogApi } from "api/languageCatalog"
import { fetchLoginTextApi } from "api/loginTexts"
//Components
import LoginLayout from "components/LoginLayout"
//Constants
import { formPartners, callbackDomain } from "../../constants"
//Store
import { useAppStore } from "stores/app"
//types
import { type LoginFields } from "types/models/loginTexts"
import { type EndPointResponse } from "types/common"
import { defaultGeneralError, type GeneralError } from "types/models/generalError"
//Utils
import { getCatalogLanguageByPartner } from "utils/common"
//Styles
import styles from "./main.module.css"
import { continueFunctionController, shouldInvertButtons, hasGeneralErrorImage } from "utils/errorModalUtils"

interface Props extends GeneralError {
  client_id?: string
  restartFlow?: string
  errorCode?: string
  traceId?: string
  code?: string
  showLanguageSection?: boolean
  hasContextualization?: boolean
}

export default function ErrorModal(props: Props) {
  //States
  const [languageCatalog, setLanguageCatalog] = useState<any>()
  const [loginTexts, setLoginTexts] = useState<LoginFields>()
  const [isIntelsat, setIsIntelsat] = useState(false)
  const [continueUrl, setContinueUrl] = useState("")
  const [renderContent, setRenderContent] = useState(false)
  // const [isButtonsInverted, setIsButtonsInverted] = useState(false)
  const [hasGeneralImage, setHasGeneralImage] = useState(false)

  //Store
  const language = useAppStore((state) => state.language)

  useEffect(() => {
    const { client_id } = props
    setIsIntelsat(client_id !== undefined && Object.keys(formPartners).includes(client_id))
  }, [])

  useEffect(() => {
    // const { code } = props
    const { client_id } = props
    setIsIntelsat(client_id !== undefined && Object.keys(formPartners).includes(client_id))

    void getLoginTexts()
    void getLanguageCatalog()
    setRenderContent(true)
    // const invertButtons = shouldInvertButtons(code || "")
    // setIsButtonsInverted(invertButtons)
  }, [])

  useEffect(() => {
    const { errorCode, buttonUrlContinue, restartFlow, client_id } = props
    if (renderContent) {
      const continueUrlFunc = continueFunctionController({
        errorCode: errorCode || "",
        buttonUrlContinue: String(buttonUrlContinue),
        restartFlow: String(restartFlow),
        isIntelsat,
        client_id: String(client_id)
      })
      setContinueUrl(continueUrlFunc)
    }
  }, [renderContent, isIntelsat])

  useEffect(() => {
    const { image } = props
    setHasGeneralImage(hasGeneralErrorImage(image || ""))
  }, [props.image])

  const prevLanguage = useRef(language)
  useEffect(() => {
    if (prevLanguage.current !== language) {
      void getLanguageCatalog()
      void getLoginTexts()
    }
    prevLanguage.current = language
  }, [language])

  async function getLanguageCatalog() {
    const { client_id } = props
    const languageCatalog: EndPointResponse = await fetchLanguageCatalogApi(language || "es")

    if (languageCatalog.success) {
      const catalogResponse = getCatalogLanguageByPartner(languageCatalog?.response, client_id as string)
      setLanguageCatalog(catalogResponse)
    }
  }

  async function getLoginTexts() {
    const { client_id } = props

    const loginTextsResponse: EndPointResponse = await fetchLoginTextApi(language || "es", client_id as string)
    if (loginTextsResponse?.success) {
      const loginResponse = loginTextsResponse?.response?.data ? loginTextsResponse?.response?.data[0]?.fields : {}
      setLoginTexts(loginResponse)
    }
  }

  // Estilos por defecto del botón filled
  // const defaultButtonStyles: React.CSSProperties = {
  const defaultFilledButtonStyles: React.CSSProperties = {
    width: "100%",
    height: "52px",
    padding: "0px 24px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "32px",
    gap: "8px",
    border: `1px solid ${loginTexts?.modal_error_design?.buttonstyle?.bordercolor || "white"}`,
    color: loginTexts?.modal_error_design?.buttonstyle?.textcolor || "white",
    backgroundColor: loginTexts?.modal_error_design?.buttonstyle?.backgroundcolor || "black",
    alignSelf: "stretch",
    fontSize: "20px",
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: "normal",
    letterSpacing: "0px",
    fontFamily: "RedHatDisplay",
    textAlign: "center"
  }

  // Estilos por defecto del botón outline
  const defaultOutlineButtonStyles: React.CSSProperties = {
    width: "100%",
    height: "52px",
    padding: "0px 24px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "32px",
    gap: "8px",
    border: "2px solid #1B1B1B",
    backgroundColor: "transparent",
    alignSelf: "stretch",
    fontSize: "20px",
    fontWeight: "700",
    fontStyle: "normal",
    lineHeight: "normal",
    letterSpacing: "0px",
    fontFamily: "RedHatDisplay",
    textAlign: "center",
    color: "#1B1B1B"
  }

  function handleCancelAction() {
    const { buttonUrlCancel, restartFlow } = props
    const urlRedirect = buttonUrlCancel !== "" ? `${callbackDomain}${buttonUrlCancel}` : restartFlow !== "" ? String(restartFlow) : callbackDomain
    isIntelsat ? window.location.reload() : (window.location.href = urlRedirect)
  }

  function handleContinueAction() {
    continueUrl == "reload" ? window.location.reload() : (window.location.href = continueUrl)
  }

  function render() {
    const { image, title, description, buttonTextContinue, buttonTextCancel, page, showLanguageSection, hasContextualization } = props
    const { errorCode, traceId } = props

    return loginTexts ? (
      <LoginLayout
        loginTexts={loginTexts}
        languageCatalog={languageCatalog || []}
        isErrorPage={page}
        showLanguageSection={showLanguageSection}
        hasContextualization={hasContextualization}
      >
        <div className={hasGeneralImage ? styles.successErrorComponentWrapper : ""}>
          <SuccessOrErrorComponent
            response={{
              icon: image ? image : "",
              subtitle: description ? description : "",
              title: title ? title : "",
              buttonTextContinue: String(buttonTextContinue),
              buttonTextCancel: String(buttonTextCancel),
              errorCode: {
                errorId: errorCode ? String(errorCode) : "",
                traceId: (traceId ? String(traceId) : undefined) as any
              }
            }}
            errorKey="errorId"
            texts={
              {
                errorCodeText: loginTexts?.error_code_text ? loginTexts?.error_code_text : "Error code:",
                ...(traceId && { traceIdText: loginTexts?.trace_id_text ? loginTexts?.trace_id_text : "ID:" })
              } as any
            }
            onCancelClick={handleCancelAction}
            onContinueClick={handleContinueAction}
          />
        </div>
      </LoginLayout>
    ) : null
  }

  return render()
}
