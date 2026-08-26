import { apiUrl, microsite } from "../constants"
import { fetchApiService, replaceTexts } from "@lm-tecnologias-interactivas-u/website-utils"
//Model
import type { LanguageCatalog } from "types/models/languageCatalog"
//Utils
import { getHourHash } from "src/utils/get-hash"

export async function fetchLanguageCatalogApi(language: string) {
  const languageCatalogUrl = replaceTexts(apiUrl?.strapi?.languageCatalog, { language: language || "es" })
  const { fetchApi: getLanguageCatalog } = fetchApiService<LanguageCatalog>(languageCatalogUrl, {
    initConfig: { cache: "no-cache" },
    responseConfig: { microsite }
  })
  return await getLanguageCatalog()
}
