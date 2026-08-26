interface GeneralErrorTemplate {
  id: string
  svc: string
  code: string
  page: boolean
  image: string
  title: string
  description: string
  buttonUrlCancel: string
  buttonTextCancel: string
  buttonCancelClose: boolean
  buttonUrlContinue: string
  buttonTextContinue: string
}

interface GeneralErrorTemplates {
  es: GeneralErrorTemplate
  en: GeneralErrorTemplate
  fr: GeneralErrorTemplate
  pt: GeneralErrorTemplate
}

export const generalError: GeneralErrorTemplates = {
  es: {
    id: "C999",
    svc: "",
    code: "C999",
    page: true,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/MFA/mfa-error-icon.png",
    title: "Error inesperado",
    description: "Ocurrió un problema al procesar tu solicitud. Inténtalo nuevamente en unos minutos.",
    buttonUrlCancel: "",
    buttonTextCancel: "Reintentar",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  },
  en: {
    id: "C999",
    svc: "",
    code: "C999",
    page: true,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/error-page.png",
    title: "Unexpected error",
    description: "Something went wrong while processing your request. Please try again in a few minutes.",
    buttonUrlCancel: "",
    buttonTextCancel: "Retry",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  },
  fr: {
    id: "C999",
    svc: "",
    code: "C999",
    page: true,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/error-page.png",
    title: "Unexpected error",
    description: "French TBD | Something went wrong while processing your request. Please try again in a few minutes.",
    buttonUrlCancel: "",
    buttonTextCancel: "Retry",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  },
  pt: {
    id: "C999",
    svc: "",
    code: "C999",
    page: true,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/error-page.png",
    title: "Unexpected error",
    description: "Portuguese TBD | Something went wrong while processing your request. Please try again in a few minutes.",
    buttonUrlCancel: "",
    buttonTextCancel: "Retry",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  }
}

export const generalErrorAlert: GeneralErrorTemplates = {
  es: {
    id: "C999",
    svc: "",
    code: "C999",
    page: false,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/AVMODULES/AUTHENTICATION/alert-brown.png",
    title: "Error inesperado",
    description: "Ocurrió un problema al procesar tu solicitud. Inténtalo nuevamente en unos minutos.",
    buttonUrlCancel: "",
    buttonTextCancel: "Reintentar",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  },
  en: {
    id: "C999",
    svc: "",
    code: "C999",
    page: false,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/AVMODULES/AUTHENTICATION/alert-brown.png",
    title: "Unexpected error",
    description: "Something went wrong while processing your request. Please try again in a few minutes.",
    buttonUrlCancel: "",
    buttonTextCancel: "Retry",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  },
  fr: {
    id: "C999",
    svc: "",
    code: "C999",
    page: true,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/AVMODULES/AUTHENTICATION/alert-brown.png",
    title: "Unexpected error",
    description: "Alert French | Something went wrong while processing your request. Please try again in a few minutes.",
    buttonUrlCancel: "",
    buttonTextCancel: "Retry",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  },
  pt: {
    id: "C999",
    svc: "",
    code: "C999",
    page: true,
    image: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/AVMODULES/AUTHENTICATION/alert-brown.png",
    title: "Unexpected error",
    description: "Alert Portuguese TBD | Something went wrong while processing your request. Please try again in a few minutes.",
    buttonUrlCancel: "",
    buttonTextCancel: "Retry",
    buttonCancelClose: false,
    buttonUrlContinue: "",
    buttonTextContinue: ""
  }
}
