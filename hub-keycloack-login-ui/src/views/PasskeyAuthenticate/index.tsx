import { useCallback, useEffect, useState } from "react"
//Components
import PasskeyCeremony, { type CeremonyStatus } from "components/PasskeyCeremony"
//Types
import type { PasskeyAuthenticateProps } from "types/models/passkey"
//Utils
import { arrayBufferToBase64Url, base64UrlToUint8Array, classifyPasskeyFailure } from "utils/webauthn"

/**
 * Passwordless authentication ceremony (FR-5, UI portion).
 *
 * Rendered inside Keycloak's `webauthn-authenticate.ftl`, which also renders the hidden
 * form this view fills in and submits. We never talk to a Keycloak API directly: the
 * assertion is posted back through Keycloak's own form so the flow stays server-driven and
 * the signature is validated server-side (SECURITY-08).
 */

const COPY = {
  es: {
    title: "Ingresa con tu Passkey",
    description: "Confirma tu identidad en este dispositivo con tu huella, rostro o PIN.",
    running: "Esperando la confirmación en tu dispositivo…",
    retry: "Volver a intentar",
    cancel: "Usar otro método",
    cancelled: "Cancelaste la verificación. Puedes intentarlo de nuevo o usar otro método.",
    timeout: "Se agotó el tiempo de espera. Intenta de nuevo.",
    noCredential: "Este dispositivo no tiene una Passkey registrada para tu cuenta.",
    notSupported: "Este dispositivo no puede usar Passkey. Usa otro método para ingresar.",
    unknown: "No pudimos verificar tu Passkey. Intenta de nuevo o usa otro método."
  },
  en: {
    title: "Sign in with your Passkey",
    description: "Confirm your identity on this device with your fingerprint, face or PIN.",
    running: "Waiting for confirmation on your device…",
    retry: "Try again",
    cancel: "Use another method",
    cancelled: "You cancelled the verification. You can try again or use another method.",
    timeout: "The request timed out. Please try again.",
    noCredential: "This device has no Passkey registered for your account.",
    notSupported: "This device cannot use Passkey. Please use another method to sign in.",
    unknown: "We could not verify your Passkey. Try again or use another method."
  }
}

function messagesFor(language?: string) {
  return language?.toLowerCase().startsWith("en") ? COPY.en : COPY.es
}

function PasskeyAuthenticate(props: PasskeyAuthenticateProps) {
  const texts = messagesFor(props.language)
  const [status, setStatus] = useState<CeremonyStatus>("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")

  /** Posts the assertion back through the form Keycloak rendered. */
  const submitAssertion = useCallback((credential: PublicKeyCredential) => {
    const response = credential.response as AuthenticatorAssertionResponse
    const form = document.querySelector<HTMLFormElement>("#webauth")
    if (!form) return

    const setField = (id: string, value: string) => {
      const field = form.querySelector<HTMLInputElement>(`#${id}`)
      if (field) field.value = value
    }

    setField("credentialId", credential.id)
    setField("clientDataJSON", arrayBufferToBase64Url(response.clientDataJSON))
    setField("authenticatorData", arrayBufferToBase64Url(response.authenticatorData))
    setField("signature", arrayBufferToBase64Url(response.signature))
    if (response.userHandle) {
      setField("userHandle", arrayBufferToBase64Url(response.userHandle))
    }

    form.submit()
  }, [])

  /**
   * Reports the failure to Keycloak so the flow can record it and render its own error
   * page, rather than leaving the user on a dead end.
   */
  const submitFailure = useCallback((reason: string) => {
    const form = document.querySelector<HTMLFormElement>("#webauth")
    const field = form?.querySelector<HTMLInputElement>("#error")
    if (!form || !field) return

    field.value = reason
    form.submit()
  }, [])

  const runCeremony = useCallback(async () => {
    setStatus("running")
    setStatusMessage(texts.running)

    try {
      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToUint8Array(props.challenge ?? ""),
        rpId: props.rpId || undefined,
        userVerification: props.userVerification ?? "required",
        // Keycloak sends 0 to mean "no timeout"; the WebAuthn API expects milliseconds.
        timeout: props.createTimeout && props.createTimeout > 0 ? props.createTimeout * 1000 : undefined,
        allowCredentials: (props.allowCredentials ?? []).map((id) => ({
          id: base64UrlToUint8Array(id),
          type: "public-key" as const
        }))
      }

      const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null

      if (!credential) {
        setStatus("error")
        setStatusMessage(texts.unknown)
        return
      }

      submitAssertion(credential)
    } catch (error) {
      const reason = classifyPasskeyFailure(error)
      setStatus("error")

      switch (reason) {
        case "cancelled": {
          setStatusMessage(texts.cancelled)
          break
        }
        case "timeout": {
          setStatusMessage(texts.timeout)
          break
        }
        case "no-credential": {
          setStatusMessage(texts.noCredential)
          break
        }
        case "not-supported": {
          setStatusMessage(texts.notSupported)
          break
        }
        default: {
          setStatusMessage(texts.unknown)
        }
      }
    }
  }, [props.allowCredentials, props.challenge, props.createTimeout, props.rpId, props.userVerification, submitAssertion, texts])

  useEffect(() => {
    void runCeremony()
  }, [])

  return (
    <PasskeyCeremony
      title={texts.title}
      description={texts.description}
      status={status}
      statusMessage={statusMessage}
      primaryLabel={texts.retry}
      onPrimary={() => void runCeremony()}
      secondaryLabel={texts.cancel}
      onSecondary={() => submitFailure("webauthn-error-user-cancelled")}
    />
  )
}

export default PasskeyAuthenticate
