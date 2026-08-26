import { Loader } from "@lm-tecnologias-interactivas-c/website-components"
import { useEffect } from "react"
//Configs
import { defaultPartner } from "../../constants"
//Utils
import { loginGA } from "utils/GA360/login"

export interface LoginSuccessProps {
  [key: string]: any
  client_id?: string
  language?: string
  hasMfa?: string
  loginCredentials?: {
    user?: string
    pass?: string
  }
}

function LoginSuccess(props: LoginSuccessProps) {
  useEffect(() => {
    sessionStorage.removeItem("lifemiles-login-username")

    const { hasMfa, loginCredentials, client_id } = props

    if (hasMfa === "false" && client_id !== defaultPartner) {
      loginGA()
    }

    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ username: loginCredentials?.user, password: loginCredentials?.pass }))
    } catch (error) {
      // intentionally left blank -- optional error ignored by design
    }

    setTimeout(() => {
      document.querySelector("#btn-sumbit")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    }, 200)
  }, [])

  return (
    <>
      <Loader />
      <button style={{ display: "none" }} id="btn-sumbit" type="submit" value="confirm_activation" name="action" />
    </>
  )
}
export default LoginSuccess
