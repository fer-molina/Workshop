package com.lifemiles.passkey.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for renaming a Passkey (FR-9).
 *
 * <p>Validation is the authoritative one for this input (SECURITY-05). The client also bounds
 * the field, but a client-side limit is a usability affordance, never a control.</p>
 *
 * @param name new user-facing label for the credential
 */
public record RenamePasskeyRequest(
    @NotBlank(message = "must not be blank")
    @Size(max = 100, message = "must be at most 100 characters")
    /*
     * Rejects ASCII control characters, including CR and LF.
     *
     * This is not cosmetic: the label is written to the audit log, and a label containing a
     * newline would let a user forge additional log lines (log injection, and a way to
     * corrupt the audit trail that NFR-5 depends on). Rejecting the input is preferable to
     * sanitising it at each sink, because there is no way to forget to do it.
     */
    @Pattern(regexp = "^[^\\p{Cntrl}]+$", message = "must not contain control characters")
    String name
) {
}
