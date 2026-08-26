import { useId } from "react"
//Styles
import styles from "./main.module.css"
//Types
import type { Provider } from "types/models/loginTexts"

export interface PasskeyButtonProps {
  /** CMS entry for the Passkey option (label, icon). See `docs/passkey-frontend-contract.md`. */
  provider?: Provider
  /** Optional short explanation rendered under the control and linked via aria-describedby. */
  hint?: string
  disabled?: boolean
  onSelect: () => void
}

/**
 * "Iniciar sesión con Passkey" control for the login-method selector (FR-1).
 *
 * Rendered as a native `<button type="button">` on purpose. The sibling options in
 * `SocialManager` are `<a>` elements with an `onClick` and no `href`, `role` or key
 * handling, which makes them unreachable by keyboard and gives them no accessible role —
 * failing WCAG 2.1 AA 2.1.1 and 4.1.2. NFR-4 applies to Passkey UI, so this control does
 * not replicate that pattern. The pre-existing gap on the other options is reported in the
 * unit summary rather than changed here, since it is outside this unit's scope.
 *
 * The caller decides whether to render this at all; capability detection (FR-2) and the
 * feature flag live in `SocialManager`.
 */
function PasskeyButton({ provider, hint, disabled = false, onSelect }: PasskeyButtonProps) {
  const hintId = useId()
  const label = provider?.provider_name?.trim() || "Iniciar sesión con Passkey"

  return (
    <>
      <button
        type="button"
        data-cy="passkeyButton"
        data-testid="passkeyButton"
        className={styles.passkeyButton}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onClick={onSelect}
      >
        {/* Decorative: the accessible name comes from the button text, so an empty alt
            prevents screen readers announcing the icon twice (WCAG 1.1.1). */}
        {provider?.logo && <img className={styles.passkeyIcon} src={provider.logo} alt="" aria-hidden="true" />}
        <span>{label}</span>
      </button>
      {hint && (
        <p id={hintId} className={styles.passkeyHint}>
          {hint}
        </p>
      )}
    </>
  )
}

export default PasskeyButton
