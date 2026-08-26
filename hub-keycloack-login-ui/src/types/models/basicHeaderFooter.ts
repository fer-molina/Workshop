export interface BasicHeaderFooterData {
  data?: Data[]
}

interface Data {
  fields: BasicHeaderFooterFields
}

export interface Fields2 {
  body: Body[]
}

export interface Body {
  fields: BasicHeaderFooterFields
  type?: string
}

export interface BasicHeaderFooterFields {
  props_header: PropsHeader
  props_footer: PropsFooter
}

export interface PropsHeader {
  languageicon: string
  logoav: string
  logolm: string
  languages?: any[]
  logo?: string
}

export interface PropsFooter {
  copytext: string
  logofooter: string
  staralliancelink: string
  footer_logo?: string
}
