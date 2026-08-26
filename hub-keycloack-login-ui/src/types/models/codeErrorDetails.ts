export interface CodeErrorDetails {
  data: Data
}

export interface Data {
  slug: string
  name: string
  published: null
  updated: Date
  scheduled: null
  status: string
  page_type: null
  fields: Fields
}

export interface Fields {
  error: Error[]
}

export interface Error {
  id: string
  code: string | undefined
  ispage: boolean
}
