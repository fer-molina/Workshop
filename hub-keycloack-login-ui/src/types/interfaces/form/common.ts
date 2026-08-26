export interface ResponseElementsForm {
  id: string
  change?: boolean
  value: string
}

export interface FormValue {
  [key: string]: {
    value: string
    change: boolean
    valid: boolean
  }
}

export interface Values {
  value: string
  change?: boolean
  valid: boolean
}
