import type { ReactNode } from "react"
//Styles
import styles from "./main.module.css"

export type CeremonyStatus = "idle" | "running" | "error"

export interface PasskeyCeremonyProps {
  title: string
  description: string
  status: CeremonyStatus
  /** Human, non-technical status text. Never a raw DOMException message (SECURITY-09). */
  statusMessage?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  children?: ReactNode
}

/**
 * Shared chrome for both Passkey ceremony screens (registration and authentication).
 *
 * The accessibility behaviour lives here so both screens get it identically (NFR-4):
 * - the status region is always present and `aria-live="polite"`, so screen readers
 *   announce ceremony progress and failures without stealing focus
 * - `role="alert"` is added only for errors, which are the one case worth interrupting for
 * - the region is `aria-atomic` so the whole message is read, not just the changed words
 */
function PasskeyCeremony({
  title,
  description,
  status,
  statusMessage,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  children
}: PasskeyCeremonyProps) {
  const isError = status === "error"

  return (
    <section className={styles.ceremony} aria-labelledby="passkey-ceremony-title">
      <h1 id="passkey-ceremony-title" className={styles.title}>
        {title}
      </h1>
      <p className={styles.description}>{description}</p>

      {children}

      <p
        className={`${styles.status}${isError ? ` ${styles.statusError}` : ""}`}
        aria-live={isError ? "assertive" : "polite"}
        aria-atomic="true"
        role={isError ? "alert" : "status"}
        data-testid="passkeyCeremonyStatus"
      >
        {statusMessage ?? ""}
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryAction}
          data-testid="passkeyCeremonyPrimary"
          disabled={status === "running"}
          onClick={onPrimary}
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            className={styles.secondaryAction}
            data-testid="passkeyCeremonySecondary"
            disabled={status === "running"}
            onClick={onSecondary}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </section>
  )
}

export default PasskeyCeremony
export { styles as passkeyCeremonyStyles }
