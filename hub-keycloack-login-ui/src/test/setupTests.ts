import { vi, afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { defaultGeneralError } from "types/models/generalError"
// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

globalThis.window.env = {
  hubKeycloackLogin: {
    butterToken: "60dc7ce557433d9165237bb161807cba88633bf3",
    hydraDomain: "localhost",
    imagesCms: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS",
    microsite: "hub-keycloak-login-ui",
    gtmKey: "GTM-NB3LXK7",
    adobetmUrl: "https://assets.adobedtm.com/6ac3e976c146/401fec196930/launch-5d1279b92922-development.min.js",
    apis: {
      strapi: {
        loginCMS: "https://cms-content.qa-lifemiles.net/api/cms/<language>/<partner>/mod-login/data.json",
        flagUrl: "https://cms-configs.qa-lifemiles.net/api/cms/cms/v1/website-config/flags.json",
        languageCatalog: "https://www.qa-lifemiles.net/cms/<language>/cms/v1/landing-page/AUTHLANGUAGE/landing.json",
        partnerStyles: "https://cms-content.uat-lifemiles.net/api/cms/<partner>/mod_partner_styles_lm/mod-partner-style/data.json",
        errorMessage: "https://www.qa-lifemiles.net/cms/<country>/<language>/cms/v1/error/<code>/error-description.entity.json",
        basicHeaderFooter: "https://www.qa-lifemiles.net/cms/es/cms/v1/landing-page/MOD-BASIC-HEADER-FOOTER/landing.json"
      },
      butter: {
        loginCMS: "https://api.buttercms.com/v2/pages/mod_login/?locale=<language>&auth_token=<butterToken>&fields.partner.code=<partner>",
        partnerStyles: "https://api.buttercms.com/v2/pages/mod_partner_styles/?locale=<language>&auth_token=<token>&fields.partner.code=<partner>",
        codeErrorDescription: "https://api.buttercms.com/v2/pages/*/error_list/?locale=<language>&preview=1&auth_token=<token>",
        basicHeaderFooter:
          "https://api.buttercms.com/v2/pages/mod_header_footer/mod_basic_header_footer/?auth_token=<token>&fields.partner.code=<partner>&locale=<language>"
      },
      services: {
        geolocation: "https://cms-configs.dev-lifemiles.net/api/cms/cms/v1/website-config/geolocation-mockup.json"
      }
    },
    codeErrors: {
      "intelsat-test": {
        10980: "10981",
        1098: "10981"
      }
    },
    cookieSettings: {
      path: "/",
      secure: false, // sameSite: "None", //["None", "Strict", "Lax"] if none it doesn need to put is the default value
      domain: "localhost",
      sameSite: "Lax"
    },
    formPartners: {
      "intelsat-test": "IN",
      default: "LM"
    },
    parameterKeycloak: {
      language: "ui_locales"
    },
    defaultPartner: "account-console",
    defaultErrorCode: "C999",
    callbackDomain: "https://www.qa-lifemiles.net",
    templatesConfig: {
      wlm: "lm-qa-test",
      intelsat: "intelsat-test"
    },
    loginConfigurations: {
      siftKey: "aedb1e3d52",
      codeSentDelayTime: 15000, // 15 sec
      channelType: {
        mbl: "LMAPP",
        wst: "LMWEB",
        wstav: "AVWEB",
        intelsat: "RRSSOTH"
      },
      deviceType: {
        mbl: "app",
        wst: "browser"
      },
      brandNames: {
        ["avianca-web"]: "avianca",
        ["av-mobile"]: "avianca-mobile",
        ["lm-qa"]: "Lifemiles",
        ["mobile"]: "lm-mobile",
        ["intelsat"]: "intelsat",
        default: "Others"
      }
    }
  }
}

// vi.mock("@lm-tecnologias-interactivas-u/website-utils", () => ({
//   fetchApiService: vi.fn().mockImplementation(() => ({
//     fetchApi: async () => ({ response: {}, status: 200, success: true, unauthorized: false })
//   })),
//   replaceTexts: vi.fn().mockImplementation((text, replacements) => {
//     let modifiedText = text
//     for (const key in replacements) {
//       const value = replacements[key]
//       const regex = new RegExp(`<${key}>`, "g")
//       modifiedText = modifiedText.replace(regex, value)
//     }
//   }),
//   createCircuitBreaker: vi.fn().mockImplementation((options: { primaryFetch: () => Promise<any>; secondaryFetch: () => Promise<any> }) => {
//     return () => {
//       new Promise(async (resolve) => {
//         return await options
//           .primaryFetch()
//           .then((resolve) => {
//             return { response: resolve, status: 200, success: true, unauthorized: false }
//           })
//           .catch(() =>
//             options.secondaryFetch().then((resolve) => {
//               return { response: resolve, status: 200, success: true, unauthorized: false }
//             })
//           )
//       })
//     }
//   })
// }))
