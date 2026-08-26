export interface LanguageItem {
  code: string
  value: string
}

export interface BrandConfig {
  items: LanguageItem[]
  partners: string[]
}

export interface LanguageCatalog {
  [brand: string]: BrandConfig
}
