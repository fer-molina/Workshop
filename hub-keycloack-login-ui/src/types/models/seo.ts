export interface SEOData {
  seo?: SEO[]
}

export interface SEO {
  microFronEnd?: string
  views: View[]
}

export interface View {
  path: string
  title: string
  metas: Meta[]
}

export interface Meta {
  name?: Name
  content?: string
}

export enum Name {
  Description = "description",
  Keywords = "keywords"
}
