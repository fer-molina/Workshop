import { cookieSettings, hydraDomain } from "../constants"
//Utils
import { addCookie, deleteCookie } from "@lm-tecnologias-interactivas-u/website-utils"

export function setCookie(name: string, value: string) {
  const options = JSON.parse(JSON.stringify(cookieSettings)) as Record<string, unknown>
  addCookie(name, value, options)
}

export function removeCookie(name: string) {
  const options = JSON.parse(JSON.stringify(cookieSettings)) as Record<string, unknown>
  deleteCookie(name, options)
}

export function removeHydraCookie(name: string) {
  const options = JSON.parse(JSON.stringify(cookieSettings)) as Record<string, unknown>
  options.domain = hydraDomain
  deleteCookie(name, options)
}

export function setHydraCookie(name: string, value: string) {
  const options = JSON.parse(JSON.stringify(cookieSettings)) as Record<string, unknown>
  options.domain = hydraDomain
  addCookie(name, value, options)
}
