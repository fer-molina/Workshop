import { apiUrl } from "../constants"

export const getRequest = (params: object) => {
  return {
    url: String(apiUrl?.strapi?.flagUrl || ""),
    headers: {
      method: "GET",
      Authorization: "Bearer dasdsadasd"
    },
    body: JSON.stringify(params)
  }
}
