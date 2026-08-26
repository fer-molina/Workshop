import React, { useEffect, useRef, useState, useLayoutEffect } from "react"
import classNames from "classnames"
import { BasicFooter, BasicHeader } from "@lm-tecnologias-interactivas-c/website-components"
//Api
import { fetchBasicHeaderFooterData } from "api/basicHeaderFooter"
//configs
import { parameterKeycloak } from "../../constants"
//stores
import { useAppStore } from "stores/app"
//Types
import type { LoginFields } from "types/models/loginTexts"
import type { LanguageItem } from "types/models/languageCatalog"
import type { PropsFooter, PropsHeader } from "types/models/basicHeaderFooter"
import type { EndPointResponse } from "types/common"
//Utils
import { setHydraCookie } from "utils/cookies"
//Styles
import styles from "./main.module.css"

export interface LoginLayoutProps {
  children: React.ReactNode
  loginTexts?: LoginFields
  showLanguageSection?: boolean
  languageCatalog: LanguageItem[]
  isErrorPage?: boolean
  hasContextualization?: boolean
}

export default function LoginLayout(props: LoginLayoutProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [renderHeader, setRenderHeader] = useState(false)
  const [renderFooter, setRenderFooter] = useState(false)
  const [propsHeader, setPropsHeader] = useState<PropsHeader>()
  const [propsFooter, setPropsFooter] = useState<PropsFooter>()
  //Store
  const language = useAppStore((state) => state.language)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    void getBasicHeaderFooterData()
  }, [])

  //defining footer height based on flag
  useLayoutEffect(() => {
    const { showLanguageSection } = props
    const footerHeight = showLanguageSection ? "73.4px" : "70.4px"
    document.documentElement.style.setProperty("--footer-height", footerHeight)
  }, [])

  async function getBasicHeaderFooterData() {
    const basicHeaderFooterResponse: EndPointResponse = await fetchBasicHeaderFooterData(language || "es")
    if (basicHeaderFooterResponse.success && basicHeaderFooterResponse?.response && "data" in basicHeaderFooterResponse.response) {
      setPropsHeader(basicHeaderFooterResponse?.response?.data?.fields?.props_header)
      setPropsFooter(basicHeaderFooterResponse?.response?.data?.fields?.props_footer)
      setRenderHeader(true)
      setRenderFooter(true)
    }
  }

  function changeLanguage(val: string) {
    //Cookie para idioma en website
    setHydraCookie("lng-stg", val)

    const url = new URL(window.location.href)
    url.searchParams.set(parameterKeycloak?.language, val)
    window.location.replace(url.toString())
  }

  function render() {
    const headerData = {
      languageicon: propsHeader?.languageicon || "",
      logolm: propsHeader?.logolm || "",
      logoav: propsHeader?.logoav || "",
      languages: props.languageCatalog || [],
      logo: propsHeader?.logo || ""
    }
    const footerData = {
      copytext: propsFooter?.copytext || "",
      logofooter: propsFooter?.logofooter || "",
      staralliancelink: propsFooter?.staralliancelink || "",
      footer_logo: propsFooter?.footer_logo || ""
    }

    return (
      <>
        <BasicHeader
          language={language || "es"}
          data={headerData}
          paddingContainer={styles.paddingContainer}
          onLanguageChange={changeLanguage}
          isSticky={true}
          showLanguageSection={props.showLanguageSection || false}
          showContextualization={props.hasContextualization}
        />

        <div
          className={classNames({
            [styles.mobileContainer]: !props.hasContextualization,
            [styles.mainContainer]: props.showLanguageSection && props.hasContextualization,
            [styles.mainContainerNoLang]: !props.showLanguageSection && props.hasContextualization
          })}
        >
          <div className={props.isErrorPage ? "" : isMobile ? styles.loginContainerMbl : styles.loginContainer}>{props.children}</div>
        </div>
        {renderFooter && (
          <div className={styles.footerContainer}>
            <div className={styles.paddingContainer}>
              <BasicFooter data={footerData} showContextualization={props.hasContextualization} />
            </div>
          </div>
        )}
      </>
    )
  }

  return render()
}
