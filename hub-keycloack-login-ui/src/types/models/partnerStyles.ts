import type { AnyValue } from "@lm-tecnologias-interactivas-u/website-utils/types"

export interface PartnerStylesResponse {
  meta?: PartnerStylesCount
  data?: PartnerStylesModel[]
}

export interface PartnerStylesCount {
  next_page?: AnyValue
  previous_page?: AnyValue
  count?: number
}

export interface PartnerStylesModel {
  slug?: string
  name?: string
  published?: string
  updated?: string
  scheduled?: AnyValue
  status?: string
  page_type?: string
  fields?: Fields
}

export interface Fields {
  partner?: Partner
  basefontsurl?: string
  fonts?: Font[]
  menu?: Menu
  header?: Header
  content?: Content
  footer?: Footer
  buttons?: Buttons
  partnerfonts?: PartnerFonts
  backgrounds?: Backgrounds[]
  stylesbytags?: Stylesbytag[]
  hidenavigationclients?: Hidenavigationclient[]
}

export interface Hidenavigationclient {
  id: string
  description: string
}

export interface Backgrounds {
  path?: string
  backgroundcolor?: string
}

export interface Partner {
  meta?: Meta2
  code?: string
  name?: string
  description?: string
  status?: boolean
}

export interface Meta2 {
  id?: number
}

export interface Font {
  "font-family"?: string
  "font-display"?: string
  src?: string
  "font-weight"?: string
  "font-style"?: string
}

export interface Menu {
  "menu-background-color"?: string
  "menu-title-color"?: string
  "menu-subtitle-color"?: string
}

export interface Header {
  "header-background-color"?: string
  "header-title-color"?: string
  "header-subtitle-color"?: string
}

export interface Content {
  "content-background-color"?: string
  "content-title-color"?: string
  "content-description-color"?: string
}

export interface Footer {
  "footer-background-color"?: string
  "footer-title-color"?: string
  "footer-subtitle-color"?: string
}

export interface Buttons {
  "button-primary"?: string
  "button-secondary"?: string
  "button-success"?: string
  "button-danger"?: string
  "button-warning"?: string
  "button-info"?: string
}

export interface PartnerFonts {
  partner?: string
  primaryfont?: string
  secondaryfont?: string
  thirdfont?: string
}

export interface Stylesbytag {
  tagname: string
  tagstyle: string
}
