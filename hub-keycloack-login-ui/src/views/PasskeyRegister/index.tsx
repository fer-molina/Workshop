import { useCallback, useState } from "react"
//Components
import PasskeyCeremony, { passkeyCeremonyStyles as styles } from "components/PasskeyCeremony"
//Types
import { PASSKEY_DEVICE_LABEL_MAX_LENGTH, type PasskeyRegisterProps } from "types/models/passkey"
//Utils
import { arrayBufferToBase64Url, base64UrlToUint8Array, classifyPasskeyFailure } from "utils/webauthn"

/**
 * Passkey registration (enrolamiento) ceremony (FR-3, UI portion).
 *
 * Unlike the authentication screen, this one does NOT start automatically: creating a
 * credential is a deliberate act, and the user first chooses a label for the device. The
 * attestation is posted back through the form Keycloak rendered in
 * `webauthn-register.ftl`, so Keycloak remains the only thing that stores credentials
 * (SECURITY-12).
 */

const COPY = {
  es: {
    title: "Registra tu Passkey",
    description: "Crea una Passkey en este dispositivo para ingresar sin contraseña.",
    labelTitle: "Nombre del dispositivo",
    labelHint: "Te ayudará a reconocerlo después. Por ejemplo: iPhone personal.",
    start: "Registrar Passkey",
    running: "Sigue las instrucciones de tu dispositivo…",
    cancel: "Cancelar",
    cancelled: "Registro cancelado. Puedes intentarlo cuando quieras.",
    timeout: "Tiempo agotado. Intenta registrar tu Passkey de nuevo.",
    duplicate: "Este dispositivo ya tiene una Passkey registrada para tu cuenta.",
    notSupported: "Este dispositivo no permite registrar una Passkey.",
    unknown: "No pudimos registrar tu Passkey. Intenta de nuevo."
  },
  en: {
    title: "Register your Passkey",
    description: "Create a Passkey on this device to sign in without a password.",
    labelTitle: "Device name",
    labelHint: "This helps you recognise it later. For example: personal iPhone.",
    start: "Register Passkey",
    running: "Follow the instructions on your device…",
    cancel: "Cancel",
    cancelled: "Registration cancelled. You can try again whenever you want.",
    timeout: "Timed out. Please try registering your Passkey again.",
    duplicate: "This device already has a Passkey registered for your account.",
    notSupported: "This device cannot register a Passkey.",
    unknown: "We could not register your Passkey. Please try again."
  }
}

function messagesFor(language?: string) {
  return language?.toLowerCase().startsWith("en") ? COPY.en : COPY.es
}

function PasskeyRegister(props: PasskeyRegisterProps) {
  const texts = messagesFor(props.language)
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [deviceLabel, setDeviceLabel] = useState<string>("")

  const submitAttestation = useCallback(
    (credential: PublicKeyCredential, label: string) => {
      const response = credential.response as AuthenticatorAttestationResponse
      const form = document.querySelector<HTMLFormElement>("#register")
      if (!form) return

      const setField = (id: string, value: string) => {
        const field = form.querySelector<HTMLInputElement>(`#${id}`)
        if (field) field.value = value
      }

      setField("publicKeyCredentialId", credential.id)
      setField("clientDataJSON", arrayBufferToBase64Url(response.clientDataJSON))
      setField("attestationObject", arrayBufferToBase64Url(response.attestationObject))
      setField("authenticatorLabel", label)

      if (typeof response.getTransports === "function") {
        setField("transports", response.getTransports().join(","))
      }

      form.submit()
    },
    []
  )

  const submitFailure = useCallback((reason: string) => {
    const form = document.querySelector<HTMLFormElement>("#register")
    const field = form?.querySelector<HTMLInputElement>("#error")
    if (!form || !field) return

    field.value = reason
    form.submit()
  }, [])

  const runCeremony = useCallback(async () => {
    setStatus("running")
    setStatusMessage(texts.running)

    // Trim and bound the label. This is a usability guard only; Unit 3 revalidates it
    // server-side, because a client-side limit is not a security control (SECURITY-05).
    const label = deviceLabel.trim().slice(0, PASSKEY_DEVICE_LABEL_MAX_LENGTH)

    try {
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlToUint8Array(props.challenge ?? ""),
        rp: { id: props.rpId || undefined, name: props.rpEntityName || "LifeMiles" },
        user: {
          id: base64UrlToUint8Array(props.userId ?? ""),
          name: props.username ?? "",
          displayName: props.username ?? ""
        },
        pubKeyCredParams: (props.signatureAlgorithms ?? [-7]).map((alg) => ({ type: "public-key" as const, alg })),
        timeout: props.createTimeout && props.createTimeout > 0 ? props.createTimeout * 1000 : undefined,
        attestation: (props.attestationConveyancePreference as AttestationConveyancePreference) || undefined,
        authenticatorSelection: {
          authenticatorAttachment: (props.authenticatorAttachment as AuthenticatorAttachment) || undefined,
          // Keycloak expresses the policy as the strings "Yes"/"No".
          requireResidentKey: props.requireResidentKey === "Yes",
          residentKey: props.requireResidentKey === "Yes" ? "required" : "preferred",
          userVerification: props.userVerification ?? "required"
        },
        excludeCredentials: (props.excludeCredentialIds ?? []).map((id) => ({
          id: base64UrlToUint8Array(id),
          type: "public-key" as const
        }))
      }

      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null

      if (!credential) {
        setStatus("error")
        setStatusMessage(texts.unknown)
        return
      }

      submitAttestation(credential, label)
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
          // InvalidStateError on create() means this authenticator is already enrolled.
          setStatusMessage(texts.duplicate)
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
  }, [deviceLabel, props, submitAttestation, texts])

  return (
    <PasskeyCeremony
      title={texts.title}
      description={texts.description}
      status={status}
      statusMessage={statusMessage}
      primaryLabel={texts.start}
      onPrimary={() => void runCeremony()}
      secondaryLabel={texts.cancel}
      onSecondary={() => submitFailure("webauthn-error-user-cancelled")}
    >
      <div className={styles.deviceLabel}>
        <label htmlFor="passkey-device-label">{texts.labelTitle}</label>
        <input
          id="passkey-device-label"
          data-testid="passkeyDeviceLabel"
          type="text"
          value={deviceLabel}
          maxLength={PASSKEY_DEVICE_LABEL_MAX_LENGTH}
          aria-describedby="passkey-device-label-hint"
          onChange={(event) => setDeviceLabel(event.target.value)}
        />
        <p id="passkey-device-label-hint" className={styles.deviceLabelHint}>
          {texts.labelHint}
        </p>
      </div>
    </PasskeyCeremony>
  )
}

export default PasskeyRegister
