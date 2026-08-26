export interface LoginTextResponse {
  name: string
  slug: string
  fields: LoginFields
  status: string
  updated: string
  page_type: string
  published: string
  scheduled?: string
}

export interface AlertDesign {
  id: string
  background_color: string
  text_color: string
  icon_color: string
}

export interface Utm {
  source: string
  medium: string
  campaign: string
  canal: string
}

export interface LoginFields {
  alertdesign: AlertDesign
  back_icon: string
  button_label: string
  button_style: ButtonStyle2
  create_account: string
  email_place_holder: string
  error_code_text?: string
  error_icon_blocked?: string
  error_modal_info: ErrorModalInfo[]
  fields: InputFields[]
  forget_password?: string
  link_color: string
  modal_error_design: ErrorDesign
  partner: Partner
  password_hide_icon: string
  password_place_holder: string
  password_show_icon: string
  props_footer?: PropsFooter
  props_header?: PropsHeader
  providers?: Provider[]
  return_label: string
  separator?: string
  terms_and_conditions?: string
  title: string
  trace_id_text?: string
  utm?: Utm
  utm_config?: UtmConfig[]
  valid_error_codes?: ErrorModalInfo[]
  social_manager: SocialManagerInfo
  domain: string
}

export interface UtmConfig {
  client_id: string
  canal: string
  medium: string
  source: string
  campaign: string
}

export interface SocialManagerInfo {
  title: string
  description: string
  providers?: Provider[]
  terms_and_conditions?: string
  terms_and_conditions_mb?: string
}

export interface ErrorModalInfo {
  code: string
  description: string
  image: string
}

export interface ErrorDesign {
  buttonstyle: ButtonStyle
}

export interface Partner {
  code: string
  meta: Meta
  name: string
  status: boolean
  description: string
}

export interface Meta {
  id: number
}

export interface Provider {
  id: string
  logo: string
  logo_white: string
  button_style: ButtonStyle
  provider_name: string
}

export interface ButtonStyle {
  id: string
  meta: Meta2
  width: string
  height: string
  margin: string
  padding: string
  font_size: string
  textcolor: string
  bordercolor: string
  font_weight: string
  roundcorner: string
  backgroundcolor: string
  text_decoration: string
  textcolor_hover: string
  textcolor_active: string
  font_weight_hover: string
  border_color_hover: string
  border_color_active: string
  backgroundcolor_hover: string
  "text-decoration-color": string
  backgroundcolor_active: string
}

export interface Meta2 {
  id: number
}

export interface ButtonStyle2 {
  id: string
  meta: Meta3
  width: string
  height: string
  margin: string
  padding: string
  font_size: string
  textcolor: string
  bordercolor: string
  font_weight: string
  roundcorner: string
  backgroundcolor: string
  text_decoration: string
  textcolor_hover: string
  textcolor_active: string
  font_weight_hover: string
  border_color_hover: string
  border_color_active: string
  backgroundcolor_hover: string
  "text-decoration-color": string
  backgroundcolor_active: string
}

export interface Meta3 {
  id: number
}

export interface PropsHeader {
  languageicon: string
  logoav: string
  logolm: string
}

export interface PropsFooter {
  copytext: string
  logofooter: string
  staralliancelink: string
}

export interface InputFields {
  label: string
  id: string
  defaultvalue: string
  required: boolean
  disabled: boolean
  size: string
  format: string
  placeholder: string
  type: string
  requirederror: string
  regexerror: string
  icon_error: string
  readonly?: boolean
  helpertext?: string
  tooltip?: string
  tooltipimage?: string
  start_icon_color?: string
  start_icon_url?: string
  start_icon_image?: string
}
