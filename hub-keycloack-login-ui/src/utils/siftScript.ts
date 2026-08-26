import { getCookieByName } from "@lm-tecnologias-interactivas-u/website-utils"
import { loginConfigurations } from "src/constants"
import { setHydraCookie } from "utils/cookies"

export function addSiftScript() {
  const body = document.body
  const script = document.createElement("script")
  script.type = "text/javascript"
  script.innerHTML = `var _user_id = ''; var _session_id = '${getSessionID()}'; var _sift = window._sift = window._sift || []; _sift.push(['_setAccount', '${loginConfigurations?.siftKey}']); _sift.push(['_setUserId', _user_id]); _sift.push(['_setSessionId', _session_id]); _sift.push(['_trackPageview']); (function() { function ls() { var e = document.createElement('script'); e.src = 'https://cdn.sift.com/s.js'; document.body.appendChild(e); } if (window.attachEvent) { window.attachEvent('onload', ls); } else { window.addEventListener('load', ls, false); } })();`

  body.insertBefore(script, body.firstChild)
}

function getSessionID() {
  if (getCookieByName("sift-sessionID")) {
    return getCookieByName("sift-sessionID")
  } else {
    const date = new Date()
    const formattedDate = date.getDate() + (date.getMonth() + 1) + date.getFullYear() + Math.random()
    setHydraCookie("sift-sessionID", String(formattedDate))
    return formattedDate
  }
}
