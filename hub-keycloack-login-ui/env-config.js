var hubKeycloackLoginConfig = {
  butterToken: "7b13e31f4e28966ab0e76cef6e7812110c08ddbf",
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
    },
    "button-callback": ["10980", "10981"],
    "inverse-button": ["999", "A016"],
    generalErrorImages: [
      "https://cdn.buttercms.com/0x4SMbXhTaWpm2Xls9sV",
      "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/error-generic-icon.svg"
    ]
  },
  cookieSettings: {
    path: "/",
    secure: false // sameSite: "None", //["None", "Strict", "Lax"] if none it doesn need to put is the default value
    // domain: "www.qa-lifemiles.net"
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
    intelsat: "intelsat"
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

if (typeof window.env !== "object" || window.env === null || Array.isArray(window.env)) {
  window.env = {}
}

window.env.hubKeycloackLogin = hubKeycloackLoginConfig
