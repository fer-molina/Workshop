import { getCookieByName } from "@lm-tecnologias-interactivas-u/website-utils"
import { setHydraCookie } from "utils/cookies"

export function getProviderBtnGA(site: string, login_method: string) {
  try {
    window.dataLayer = window.dataLayer || []

    window.dataLayer.push({
      event: "loginIniciate",
      user: {
        site,
        login_method
      }
    })
  } catch (error) {
    //err
  }
}

export function loginGA() {
  const raw = getCookieByName("provDtLogin")
  const data =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw)
          } catch {
            return {}
          }
        })()
      : raw || {}

  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(data.currentDate || "")
  const start = m ? new Date(+Number(m[1]), +Number(m[2]) - 1, +Number(m[3]), +Number(m[4]), +Number(m[5]), +Number(m[6])) : null
  const diffSec = start ? Math.max(0, Math.round((Date.now() - start.getTime()) / 1000)) : undefined

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: "loginSuccess",
    user: {
      site: data.site || "LM",
      login_method: data.provider || "lifemiles",
      login_auto: typeof data.autoLogin === "boolean" ? String(data.autoLogin) : data.autoLogin || "false",
      is2FA: typeof data.is2FA === "boolean" ? String(data.is2FA) : data.is2FA || "false",
      lifemilesId: undefined,
      email: undefined,
      first_name: undefined,
      last_name: undefined,
      mantenerSesion: "falso",
      timeStamp: diffSec !== undefined ? `${diffSec} Segundos` : undefined
    }
  })
}

export function setProviderDateLogin(site: string, provider: string, autoLogin: string | boolean, is2FA: boolean | string): void {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const currentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const cookieValue = {
    site,
    provider,
    currentDate,
    autoLogin,
    is2FA
  }

  setHydraCookie("provDtLogin", JSON.stringify(cookieValue))
}
