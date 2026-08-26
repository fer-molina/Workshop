import { gtmKey, adobetmUrl } from "../../constants"

export function addGtmScript(): void {
  try {
    const head = document.querySelector("head")
    if (!head || !gtmKey) return

    if (typeof window._gtmLoaded === "undefined") {
      window._gtmLoaded = false
    }

    if (document.querySelector("gtm-loader")) return

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" })

    const script = document.createElement("script")
    script.async = true
    script.id = "gtm-loader"
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(gtmKey)

    script.onload = () => {
      const ok = Boolean(window.google_tag_manager?.[gtmKey])
      window._gtmLoaded = ok || true
    }

    script.onerror = () => {
      window._gtmLoaded = false
    }

    head.insertBefore(script, head.firstChild)
  } catch {
    window._gtmLoaded = false
  }
}

export function addGtmNoScript(): void {
  try {
    const body = document.querySelectorAll("body")[0]

    const noscript = document.createElement("noscript")
    const iframe = document.createElement("iframe")
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmKey}`
    iframe.height = "0"
    iframe.width = "0"
    iframe.style = "display:none;visibility:hidden"
    noscript.appendChild(iframe)
    body.insertBefore(noscript, body.firstChild)
  } catch (error) {
    // err
  }
}

export function addadobetmUrlScript(): boolean {
  try {
    const adobeScript = document.createElement("script")
    adobeScript.src = adobetmUrl
    adobeScript.async = true
    document.head.appendChild(adobeScript)

    return true
  } catch (error) {
    //err

    return false
  }
}
